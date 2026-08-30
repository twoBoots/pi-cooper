import { EventEmitter } from "node:events";
import * as path from "node:path";
import * as fs from "node:fs";
import type { WidgetState } from "./formatter.js";
import { extractWidgetState } from "./state.js";
import { findCooperRoot } from "../utils/cooper-fs.js";

export interface WatcherOptions {
  debounceMs?: number;
}

/**
 * Reactive file watcher that monitors Cooper workspace files and emits updated WidgetState
 */
export class TrackStateWatcher extends EventEmitter {
  private readonly workspacePath?: string;
  private readonly debounceMs: number;
  private watchers: fs.FSWatcher[] = [];
  private debounceTimer: NodeJS.Timeout | null = null;
  private currentState: WidgetState | null = null;
  private isRunning = false;

  constructor(workspacePath?: string, options?: WatcherOptions) {
    super();
    this.workspacePath = workspacePath;
    this.debounceMs = options?.debounceMs ?? 50;
  }

  /**
   * Starts monitoring .cooper/active and .cooper/tracks.md
   */
  public async start(): Promise<WidgetState> {
    if (this.isRunning) {
      return this.getCurrentState();
    }

    this.isRunning = true;
    const cooperRoot = await findCooperRoot(this.workspacePath ?? process.cwd());

    if (cooperRoot) {
      const activeDir = path.join(cooperRoot, ".cooper", "active");
      const tracksMd = path.join(cooperRoot, ".cooper", "tracks.md");

      this.watchPath(activeDir);
      this.watchPath(tracksMd);
    }

    return this.forceRefresh();
  }

  /**
   * Returns current evaluated state
   */
  public async getCurrentState(): Promise<WidgetState> {
    if (!this.currentState) {
      this.currentState = await extractWidgetState(this.workspacePath);
    }
    return this.currentState;
  }

  /**
   * Immediately re-evaluates workspace state and emits a change event
   */
  public async forceRefresh(): Promise<WidgetState> {
    this.currentState = await extractWidgetState(this.workspacePath);
    this.emit("change", this.currentState);
    return this.currentState;
  }

  /**
   * Checks whether the watcher is active
   */
  public isWatching(): boolean {
    return this.isRunning;
  }

  /**
   * Stops watching and cleans up resources
   */
  public dispose(): void {
    this.isRunning = false;
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    for (const watcher of this.watchers) {
      try {
        watcher.close();
      } catch {
        // ignore close errors
      }
    }
    this.watchers = [];
    this.removeAllListeners();
  }

  private watchPath(targetPath: string): void {
    try {
      if (!fs.existsSync(targetPath)) {
        return;
      }
      const watcher = fs.watch(targetPath, { recursive: true }, () => {
        this.scheduleDebouncedRefresh();
      });
      this.watchers.push(watcher);
    } catch {
      // fs.watch may fail if directory does not exist yet or platform unsupported
    }
  }

  private scheduleDebouncedRefresh(): void {
    if (!this.isRunning) {
      return;
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(async () => {
      this.debounceTimer = null;
      if (this.isRunning) {
        await this.forceRefresh();
      }
    }, this.debounceMs);
  }
}
