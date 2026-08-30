import type { ExtensionContext } from "../types.js";
import { EXTENSION_ID } from "../constants.js";
import { formatStatusBar, type WidgetState, type WidgetRenderOptions } from "./formatter.js";
import { TrackStateWatcher, type WatcherOptions } from "./watcher.js";

export interface TuiWidgetOptions extends WatcherOptions {
  renderOptions?: WidgetRenderOptions;
}

/**
 * Controller managing the persistent TUI status widget in Pi Agent runtime
 */
export class TuiWidget {
  private readonly context: ExtensionContext;
  private readonly watcher: TrackStateWatcher;
  private readonly renderOptions?: WidgetRenderOptions;
  private readonly statusBarItemId: string;
  private currentState: WidgetState = { mode: "uninitialized" };
  private formattedText = "[Cooper: Uninitialized]";
  private alive = false;

  constructor(context: ExtensionContext, options?: TuiWidgetOptions) {
    this.context = context;
    this.renderOptions = options?.renderOptions;
    this.statusBarItemId = `${EXTENSION_ID}-status`;
    this.watcher = new TrackStateWatcher(context.workspacePath, options);
  }

  /**
   * Initializes the widget, registers the status bar item, and starts reactive watching
   */
  public async start(): Promise<void> {
    if (this.alive) {
      return;
    }

    this.alive = true;
    this.watcher.on("change", (state) => {
      this.handleStateChange(state);
    });

    const initialState = await this.watcher.start();
    this.handleStateChange(initialState);
  }

  /**
   * Forces an immediate state inspection and status bar refresh
   */
  public async refresh(): Promise<void> {
    const updatedState = await this.watcher.forceRefresh();
    this.handleStateChange(updatedState);
  }

  /**
   * Returns current formatted status text
   */
  public getFormattedText(): string {
    return this.formattedText;
  }

  /**
   * Returns the underlying widget state
   */
  public getState(): WidgetState {
    return this.currentState;
  }

  /**
   * Returns true if widget controller is actively running
   */
  public isAlive(): boolean {
    return this.alive;
  }

  /**
   * Stops the widget and releases resources
   */
  public dispose(): void {
    this.alive = false;
    this.watcher.dispose();
  }

  private handleStateChange(state: WidgetState): void {
    this.currentState = state;
    this.formattedText = formatStatusBar(state, this.renderOptions);

    if (typeof this.context.registerStatusBarItem === "function") {
      this.context.registerStatusBarItem({
        id: this.statusBarItemId,
        text: this.formattedText,
        tooltip: "Cooper Spec-Driven Development",
      });
    }
  }
}
