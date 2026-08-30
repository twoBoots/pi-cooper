import * as path from "node:path";
import * as fs from "node:fs/promises";
import { findCooperRoot } from "../utils/cooper-fs.js";
import { formatSpecValidationReport, type ValidationIssue } from "../utils/format.js";

/**
 * Executes /cooper:validate in-process in <5ms
 */
export async function handleValidateCommand(workspacePath?: string): Promise<string> {
  const currentDir = workspacePath ?? process.cwd();
  const cooperRoot = await findCooperRoot(currentDir);

  if (!cooperRoot) {
    return "⚠️ [Cooper SDD] Not in a Cooper SDD workspace (no .cooper/ directory found).\nRun 'cooper init' to initialize Cooper in this project.";
  }

  const issues: ValidationIssue[] = [];
  const specsDir = path.join(cooperRoot, ".cooper", "specs");

  await validateSpecDirectory(specsDir, cooperRoot, issues);

  const activeDir = path.join(cooperRoot, ".cooper", "active");
  try {
    const activeEntries = await fs.readdir(activeDir, { withFileTypes: true });
    for (const entry of activeEntries) {
      if (entry.isDirectory()) {
        const deltasDir = path.join(activeDir, entry.name, "spec-deltas");
        await validateSpecDirectory(deltasDir, cooperRoot, issues);
      }
    }
  } catch {
    // active dir may not exist or be empty
  }

  const isValid = issues.length === 0;
  return formatSpecValidationReport(isValid, issues);
}

async function validateSpecDirectory(
  baseDir: string,
  cooperRoot: string,
  issues: ValidationIssue[]
): Promise<void> {
  try {
    const entries = await fs.readdir(baseDir, { withFileTypes: true, recursive: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".md")) {
        const fullPath = path.join(entry.parentPath ?? baseDir, entry.name);
        const relPath = path.relative(cooperRoot, fullPath);
        await auditSpecFile(fullPath, relPath, issues);
      }
    }
  } catch {
    // directory may not exist
  }
}

async function auditSpecFile(
  filePath: string,
  relPath: string,
  issues: ValidationIssue[]
): Promise<void> {
  try {
    const content = await fs.readFile(filePath, "utf8");
    const lines = content.split("\n");

    let inScenario = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const lineNum = i + 1;

      if (line.includes("Scenario:")) {
        inScenario = true;
        continue;
      }

      if (line.startsWith("### ") || line.startsWith("## ") || line.startsWith("---")) {
        inScenario = false;
      }

      if (inScenario && line.trim().startsWith("- ")) {
        const step = line.replace(/^\s*-\s*/, "");
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
      message: `Failed to read spec file: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}
