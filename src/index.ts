import { COMMANDS } from "./constants.js";
import type { ExtensionContext } from "./types.js";
import { handleStatusCommand } from "./commands/status.js";
import { handleTracksCommand } from "./commands/tracks.js";
import { handleSwitchCommand } from "./commands/switch.js";
import { handleValidateCommand } from "./commands/validate.js";
import { handleCheckpointCommand } from "./commands/checkpoint.js";
import { TuiWidget } from "./widget/tui-widget.js";

/**
 * Main Cooper Extension instance running in the Pi agent runtime
 */
export class CooperExtension {
  private readonly context: ExtensionContext;
  private readonly tuiWidget: TuiWidget;
  private isInitialized = false;

  constructor(context: ExtensionContext) {
    this.context = context;
    this.tuiWidget = new TuiWidget(context);
  }

  /**
   * Initializes extension components, registers commands, and sets up status bar widgets
   */
  public initialize(): void {
    if (this.isInitialized) {
      return;
    }

    this.registerSlashCommands();
    void this.tuiWidget.start();
    this.isInitialized = true;
  }

  /**
   * Returns the active TUI widget controller
   */
  public getTuiWidget(): TuiWidget {
    return this.tuiWidget;
  }

  /**
   * Disposes extension resources and stops background watchers
   */
  public dispose(): void {
    this.tuiWidget.dispose();
  }

  private registerSlashCommands(): void {
    this.context.registerCommand(COMMANDS.STATUS, async () => {
      const result = await handleStatusCommand(this.context.workspacePath);
      void this.tuiWidget.refresh();
      return result;
    });

    this.context.registerCommand(COMMANDS.TRACKS, async () => {
      return handleTracksCommand(this.context.workspacePath);
    });

    this.context.registerCommand(COMMANDS.SWITCH, async (...args: unknown[]) => {
      const trackId = typeof args[0] === "string" ? args[0] : undefined;
      const result = await handleSwitchCommand(trackId, this.context);
      void this.tuiWidget.refresh();
      return result;
    });

    this.context.registerCommand(COMMANDS.VALIDATE, async () => {
      const result = await handleValidateCommand(this.context.workspacePath);
      void this.tuiWidget.refresh();
      return result;
    });

    this.context.registerCommand(COMMANDS.CHECKPOINT, async () => {
      const result = await handleCheckpointCommand(this.context.workspacePath);
      void this.tuiWidget.refresh();
      return result;
    });
  }
}

/**
 * Extension activation entrypoint conforming to Pi Agent Core extension standard
 */
export default function activate(context: ExtensionContext): CooperExtension {
  const extension = new CooperExtension(context);
  extension.initialize();
  return extension;
}

export * from "./types.js";
export * from "./constants.js";
export * from "./utils/cooper-fs.js";
export * from "./utils/format.js";
export * from "./utils/worktree.js";
export * from "./commands/status.js";
export * from "./commands/tracks.js";
export * from "./commands/switch.js";
export * from "./commands/validate.js";
export * from "./commands/checkpoint.js";
export * from "./widget/formatter.js";
export * from "./widget/state.js";
export * from "./widget/watcher.js";
export * from "./widget/tui-widget.js";
