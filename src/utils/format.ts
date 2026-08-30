import type { RegistryTrackEntry } from "./cooper-fs.js";

export interface ValidationIssue {
  file: string;
  line?: number;
  message: string;
}

/**
 * Renders an ASCII/ANSI progress bar: [=====>     ] 4/7 (57%)
 */
export function renderProgressBar(completed: number, total: number, barLength = 10): string {
  if (total <= 0) {
    const emptyBar = " ".repeat(barLength);
    return `[${emptyBar}] 0/0 (0%)`;
  }

  const ratio = Math.min(1, Math.max(0, completed / total));
  const percentage = Math.round(ratio * 100);
  const fillLength = Math.round(ratio * barLength);

  let bar = "";
  if (fillLength === barLength) {
    bar = "=".repeat(barLength);
  } else if (fillLength > 0) {
    bar = "=".repeat(fillLength - 1) + ">" + " ".repeat(barLength - fillLength);
  } else {
    bar = " ".repeat(barLength);
  }

  return `[${bar}] ${completed}/${total} (${percentage}%)`;
}

/**
 * Formats a status badge string with appropriate label
 */
export function formatStatusBadge(status: string): string {
  switch (status.toLowerCase()) {
    case "completed":
      return "✓ [Completed]";
    case "in_progress":
      return "⚡ [In Progress]";
    case "new":
      return "🌱 [New]";
    case "review":
      return "🔍 [Review]";
    case "archived":
      return "📦 [Archived]";
    default:
      return `[${status}]`;
  }
}

/**
 * Formats a list of registered tracks for terminal output
 */
export function formatTracksList(tracks: RegistryTrackEntry[]): string {
  if (!tracks || tracks.length === 0) {
    return "🛢️ Cooper Tracks: No registered tracks found in .cooper/tracks.md";
  }

  const lines: string[] = ["🛢️ Registered Cooper Tracks:", ""];

  for (const track of tracks) {
    const checkmark = track.completed ? "✓" : "•";
    const status = track.completed ? "[Completed]" : "[Active]";
    lines.push(`  ${checkmark} ${track.title} (${track.id}) ${status}`);
    if (track.worktree) {
      lines.push(`    Worktree: ${track.worktree}`);
    }
  }

  return lines.join("\n");
}

/**
 * Formats SDD spec validation report
 */
export function formatSpecValidationReport(valid: boolean, issues: ValidationIssue[]): string {
  if (valid && issues.length === 0) {
    return "✓ [Cooper SDD] Validation Passed: All capability specs, deltas, and links are valid.";
  }

  const lines: string[] = [
    `✗ [Cooper SDD] Validation Failed (${issues.length} issue${issues.length === 1 ? "" : "s"} found):`,
    "",
  ];

  for (const issue of issues) {
    const loc = issue.line ? `${issue.file}:${issue.line}` : issue.file;
    lines.push(`  - ${loc}: ${issue.message}`);
  }

  return lines.join("\n");
}
