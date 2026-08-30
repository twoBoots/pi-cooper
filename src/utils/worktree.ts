import * as path from "node:path";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import type { ExtensionContext } from "../types.js";

export interface ResolvedWorktree {
  trackId: string;
  path: string;
  exists: boolean;
}

export interface WorkspaceSwitchResult {
  success: boolean;
  previousPath: string;
  currentPath: string;
  error?: string;
}

export interface TrustSyncOptions {
  trustFilePath?: string;
}

export interface TrustSyncResult {
  added: boolean;
  trustedPaths: string[];
  trustFilePath: string;
}

/**
 * Resolves the filesystem path for a track worktree (.worktrees/<trackId>)
 */
export async function resolveWorktreePath(
  rootDir: string,
  trackId: string
): Promise<ResolvedWorktree> {
  const cleanTrackId = trackId.trim();
  const worktreePath = path.resolve(rootDir, ".worktrees", cleanTrackId);

  let exists = false;
  try {
    const stat = await fs.stat(worktreePath);
    exists = stat.isDirectory();
  } catch {
    exists = false;
  }

  return {
    trackId: cleanTrackId,
    path: worktreePath,
    exists,
  };
}

/**
 * Lists all existing worktree directories under .worktrees/
 */
export async function listWorktrees(rootDir: string): Promise<ResolvedWorktree[]> {
  const worktreesDir = path.resolve(rootDir, ".worktrees");
  const result: ResolvedWorktree[] = [];

  try {
    const entries = await fs.readdir(worktreesDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        result.push({
          trackId: entry.name,
          path: path.join(worktreesDir, entry.name),
          exists: true,
        });
      }
    }
  } catch {
    // .worktrees directory might not exist yet
  }

  return result;
}

/**
 * Changes process working directory and updates ExtensionContext
 */
export async function switchWorkspace(
  targetPath: string,
  context?: ExtensionContext
): Promise<WorkspaceSwitchResult> {
  const previousPath = process.cwd();
  const resolvedTarget = path.resolve(targetPath);

  try {
    const stat = await fs.stat(resolvedTarget);
    if (!stat.isDirectory()) {
      return {
        success: false,
        previousPath,
        currentPath: previousPath,
        error: `Target path is not a directory: ${resolvedTarget}`,
      };
    }

    const realTarget = await fs.realpath(resolvedTarget);
    process.chdir(realTarget);

    if (context) {
      context.workspacePath = realTarget;
    }

    return {
      success: true,
      previousPath,
      currentPath: realTarget,
    };
  } catch (err) {
    return {
      success: false,
      previousPath,
      currentPath: previousPath,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Idempotently registers a worktree path in Pi's trust registry (~/.pi/agent/trust.json)
 */
export async function syncTrustRegistry(
  targetPath: string,
  options?: TrustSyncOptions
): Promise<TrustSyncResult> {
  const defaultTrustPath = path.join(os.homedir(), ".pi", "agent", "trust.json");
  const trustFile = options?.trustFilePath ?? defaultTrustPath;
  const resolvedTarget = path.resolve(targetPath);

  let trustData: { trustedPaths?: string[]; [key: string]: unknown } = {
    trustedPaths: [],
  };

  try {
    const content = await fs.readFile(trustFile, "utf8");
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === "object") {
      trustData = parsed;
    }
  } catch {
    // File doesn't exist or is invalid, use default structure
  }

  const existingPaths = Array.isArray(trustData.trustedPaths)
    ? [...trustData.trustedPaths]
    : [];

  let added = false;
  if (!existingPaths.includes(resolvedTarget)) {
    existingPaths.push(resolvedTarget);
    trustData.trustedPaths = existingPaths;
    added = true;

    await fs.mkdir(path.dirname(trustFile), { recursive: true });
    await fs.writeFile(trustFile, JSON.stringify(trustData, null, 2), "utf8");
  }

  return {
    added,
    trustedPaths: existingPaths,
    trustFilePath: trustFile,
  };
}
