/**
 * Track metadata structure (.cooper/active/<track_id>/metadata.json)
 */
export interface TrackMetadata {
  track_id: string;
  title: string;
  type: "feature" | "bugfix" | "chore" | "rfc";
  status: "new" | "in_progress" | "review" | "completed" | "archived";
  created_at: string;
  completed_at?: string;
}

/**
 * Workspace Cooper presence indicator
 */
export interface CooperProjectInfo {
  hasCooperDir: boolean;
  hasIndexMd: boolean;
  activeTrackId?: string;
}

/**
 * Type guard for TrackMetadata
 */
export function isTrackMetadata(obj: unknown): obj is TrackMetadata {
  if (!obj || typeof obj !== "object") {
    return false;
  }
  const candidate = obj as Record<string, unknown>;
  return (
    typeof candidate.track_id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.type === "string" &&
    typeof candidate.status === "string" &&
    typeof candidate.created_at === "string"
  );
}

/**
 * Type guard for CooperProjectInfo
 */
export function isCooperProject(info: CooperProjectInfo): boolean {
  return info.hasCooperDir === true && info.hasIndexMd === true;
}

/**
 * Minimal Pi ExtensionContext interface definition
 */
export interface ExtensionContext {
  registerCommand(name: string, handler: (...args: unknown[]) => Promise<unknown> | unknown): void;
  registerStatusBarItem?(item: { id: string; text: string; tooltip?: string }): void;
  on?(event: string, listener: (...args: unknown[]) => void): void;
  workspacePath?: string;
}
