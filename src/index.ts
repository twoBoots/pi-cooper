import { EXTENSION_ID, COMMANDS } from "./constants.js";
import type { ExtensionContext } from "./types.js";
import { handleStatusCommand } from "./commands/status.js";
import { handleTracksCommand } from "./commands/tracks.js";
import { handleSwitchCommand } from "./commands/switch.js";
import { handleValidateCommand } from "./commands/validate.js";
import { handleCheckpointCommand } from "./commands/checkpoint.js";

/**
 * Main Cooper Extension instance running in the Pi agent runtime
 */
export class CooperExtension {
  private readonly context: ExtensionContext;
  private isInitialized = false;

  constructor(context: ExtensionContext) {
    this.context = context;
  }

  /**
   * Initializes extension components, registers commands, and sets up status bar widgets
   */
  public initialize(): void {
    if (this.isInitialized) {
      return;
    }

    this.registerSlashCommands();
    this.registerStatusBar();
    this.isInitialized = true;
  }

  private registerSlashCommands(): void {
    this.context.registerCommand(COMMANDS.STATUS, async () => {
      return handleStatusCommand(this.context.workspacePath);
    });

    this.context.registerCommand(COMMANDS.TRACKS, async () => {
      return handleTracksCommand(this.context.workspacePath);
    });

    this.context.registerCommand(COMMANDS.SWITCH, async (...args: unknown[]) => {
      const trackId = typeof args[0] === "string" ? args[0] : undefined;
      return handleSwitchCommand(trackId, this.context);
    });

    this.context.registerCommand(COMMANDS.VALIDATE, async () => {
      return handleValidateCommand(this.context.workspacePath);
    });

    this.context.registerCommand(COMMANDS.CHECKPOINT, async () => {
      return handleCheckpointCommand(this.context.workspacePath);
    });
  }

  private registerStatusBar(): void {
    if (typeof this.context.registerStatusBarItem === "function") {
      this.context.registerStatusBarItem({
        id: `${EXTENSION_ID}-status`,
        text: "[Cooper: Idle]",
        tooltip: "Cooper Spec-Driven Development",
      });
    }
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
