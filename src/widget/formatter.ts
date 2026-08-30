/**
 * State of the Cooper TUI status widget
 */
export interface WidgetState {
  mode: "active" | "idle" | "uninitialized";
  trackId?: string;
  trackTitle?: string;
  currentPhaseIndex?: number;
  totalPhases?: number;
  completedTasks?: number;
  totalTasks?: number;
  specValid?: boolean;
  specIssues?: string[];
  availableTracksCount?: number;
}

/**
 * Options for rendering the status widget string
 */
export interface WidgetRenderOptions {
  isTTY?: boolean;
  columns?: number;
  useColor?: boolean;
}

const ANSI_GREEN = "\x1b[32m";
const ANSI_RED = "\x1b[31m";
const ANSI_RESET = "\x1b[0m";

/**
 * Formats the current Cooper SDD state into a terminal status bar string
 */
export function formatStatusBar(state: WidgetState, options?: WidgetRenderOptions): string {
  const isTTY = options?.isTTY ?? true;
  const useColor = options?.useColor ?? (isTTY && options?.isTTY !== false);
  const columns = options?.columns ?? 80;

  if (state.mode === "uninitialized") {
    return "[Cooper: Uninitialized]";
  }

  if (state.mode === "idle") {
    const count = state.availableTracksCount ?? 0;
    return `[Cooper: Idle (${count} tracks available)]`;
  }

  const trackId = state.trackId ?? "unknown";
  const completed = state.completedTasks ?? 0;
  const total = state.totalTasks ?? 0;
  const phaseIdx = state.currentPhaseIndex ?? 1;
  const totalPhases = state.totalPhases ?? 1;
  const isValid = state.specValid ?? true;

  const specLabel = isValid ? "Valid" : "⚠️ Invalid";
  const specColored = useColor
    ? `${isValid ? ANSI_GREEN : ANSI_RED}${specLabel}${ANSI_RESET}`
    : specLabel;

  if (columns < 80) {
    return `[Cooper: ${trackId}] [${completed}/${total}] [Specs: ${specColored}]`;
  }

  return `[Cooper: ${trackId}] [Phase: ${phaseIdx}/${totalPhases}] [Tasks: ${completed}/${total}] [Specs: ${specColored}]`;
}
