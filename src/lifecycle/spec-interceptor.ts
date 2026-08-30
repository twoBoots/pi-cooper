import * as path from "node:path";
import * as fs from "node:fs/promises";
import { findCooperRoot } from "../utils/cooper-fs.js";
import type { ValidationIssue } from "../utils/format.js";

export interface SpecDeltaValidationOptions {
  trackId?: string;
  modifiedFiles?: string[];
  bypass?: boolean;
}

export interface SpecDeltaValidationResult {
  allowed: boolean;
  issues: ValidationIssue[];
  bypassUsed?: boolean;
}

export interface SpecDeltaInterceptorOptions {
  workspacePath?: string;
}

/**
 * Validates spec deltas before commits or tool operations
 */
export class SpecDeltaInterceptor {
  private readonly workspacePath?: string;

  constructor(options: SpecDeltaInterceptorOptions = {}) {
    this.workspacePath = options.workspacePath;
  }

  /**
   * Validates spec deltas for the given track or workspace
   */
  public async validateTrackChanges(
    options: SpecDeltaValidationOptions = {}
  ): Promise<SpecDeltaValidationResult> {
    const isBypassEnabled =
      options.bypass === true || process.env.COOPER_BYPASS_SPEC_CHECK === "1";

    if (isBypassEnabled) {
      return {
        allowed: true,
        issues: [],
        bypassUsed: true,
      };
    }

    const currentDir = this.workspacePath ?? process.cwd();
    const cooperRoot = await findCooperRoot(currentDir);

    if (!cooperRoot) {
      return {
        allowed: false,
        issues: [
          {
            file: ".cooper",
            message: "Not inside a valid Cooper workspace (no .cooper/ directory found)",
          },
        ],
        bypassUsed: false,
      };
    }

    const issues: ValidationIssue[] = [];
    const trackId = options.trackId;

    if (trackId) {
      const trackDeltasDir = path.join(cooperRoot, ".cooper", "active", trackId, "spec-deltas");
      const foundDeltas = await this.auditDeltasDirectory(trackDeltasDir, cooperRoot, issues);

      if (foundDeltas === 0) {
        issues.push({
          file: `.cooper/active/${trackId}/spec-deltas`,
          message: `No valid spec deltas found for active track '${trackId}' in .cooper/active/${trackId}/spec-deltas/`,
        });
      }
    } else {
      const activeDir = path.join(cooperRoot, ".cooper", "active");
      try {
        const activeEntries = await fs.readdir(activeDir, { withFileTypes: true });
        let totalDeltas = 0;
        for (const entry of activeEntries) {
          if (entry.isDirectory()) {
            const trackDeltasDir = path.join(activeDir, entry.name, "spec-deltas");
            const count = await this.auditDeltasDirectory(trackDeltasDir, cooperRoot, issues);
            totalDeltas += count;
          }
        }
        if (totalDeltas === 0 && activeEntries.length > 0) {
          issues.push({
            file: ".cooper/active",
            message: "No valid spec deltas found across active tracks",
          });
        }
      } catch {
        // active dir may not exist
      }
    }

    return {
      allowed: issues.length === 0,
      issues,
      bypassUsed: false,
    };
  }

  private async auditDeltasDirectory(
    baseDir: string,
    cooperRoot: string,
    issues: ValidationIssue[]
  ): Promise<number> {
    let deltaCount = 0;
    try {
      const entries = await fs.readdir(baseDir, { withFileTypes: true, recursive: true });
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith(".md")) {
          deltaCount++;
          const fullPath = path.join(entry.parentPath ?? baseDir, entry.name);
          const relPath = path.relative(cooperRoot, fullPath);
          await this.auditSpecDeltaFile(fullPath, relPath, issues);
        }
      }
    } catch {
      // directory does not exist
    }
    return deltaCount;
  }

  private async auditSpecDeltaFile(
    filePath: string,
    relPath: string,
    issues: ValidationIssue[]
  ): Promise<void> {
    try {
      const content = await fs.readFile(filePath, "utf8");
      const lines = content.split("\n");
      let inScenario = false;

      for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i]!;
        const lineNum = i + 1;

        // If line is an added line in diff (+ ...) or removed bullet (- - ...)
        let line = rawLine.trim();
        if (line.startsWith("+ ")) {
          line = line.slice(2).trim();
        } else if (line.startsWith("- - ")) {
          line = line.slice(2).trim();
        }

        if (line.includes("Scenario:")) {
          inScenario = true;
          continue;
        }

        if (line.startsWith("### ") || line.startsWith("## ") || line.startsWith("---")) {
          inScenario = false;
        }

        if (inScenario && line.startsWith("- ")) {
          const step = line.slice(2).trim();
          const validKeyword = /^(GIVEN|WHEN|THEN|AND)\b/i.test(step);
          if (!validKeyword) {
            issues.push({
              file: relPath,
              line: lineNum,
              message: "Scenario step must start with GIVEN, WHEN, THEN, or AND",
            });
          }
        }
      }
    } catch (err) {
      issues.push({
        file: relPath,
        message: `Failed to read spec delta file: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }
}
