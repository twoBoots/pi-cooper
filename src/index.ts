import { EXTENSION_ID, EXTENSION_NAME, COMMANDS } from "./constants.js";
import type { ExtensionContext } from "./types.js";

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
      return `[${EXTENSION_NAME}] Status: Active`;
    });

    this.context.registerCommand(COMMANDS.TRACKS, async () => {
      return `[${EXTENSION_NAME}] Tracks: Loaded`;
    });

    this.context.registerCommand(COMMANDS.SWITCH, async () => {
      return `[${EXTENSION_NAME}] Switch: Ready`;
    });

    this.context.registerCommand(COMMANDS.VALIDATE, async () => {
      return `[${EXTENSION_NAME}] Validate: Ready`;
    });

    this.context.registerCommand(COMMANDS.CHECKPOINT, async () => {
      return `[${EXTENSION_NAME}] Checkpoint: Ready`;
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
