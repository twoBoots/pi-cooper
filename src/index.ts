import { EXTENSION_ID, COMMANDS } from "./constants.js";
import type { ExtensionContext } from "./types.js";
import { handleStatusCommand } from "./commands/status.js";
import { handleTracksCommand } from "./commands/tracks.js";
import { handleSwitchCommand } from "./commands/switch.js";
import { handleValidateCommand } from "./commands/validate.js";
import { handleCheckpointCommand } from "./commands/checkpoint.js";
import { SpecDeltaInterceptor } from "./lifecycle/spec-interceptor.js";
import { GitNotesManager } from "./lifecycle/git-notes.js";
import { PhaseGatekeeper } from "./lifecycle/phase-gatekeeper.js";
import { handlePreCommitHook, handlePreToolHook } from "./lifecycle/hooks.js";

/**
 * Main Cooper Extension instance running in the Pi agent runtime
 */
export class CooperExtension {
  private readonly context: ExtensionContext;
  private readonly interceptor: SpecDeltaInterceptor;
  private readonly gitNotesManager: GitNotesManager;
  private readonly phaseGatekeeper: PhaseGatekeeper;
  private isInitialized = false;

  constructor(context: ExtensionContext) {
    this.context = context;
    this.interceptor = new SpecDeltaInterceptor({
      workspacePath: context.workspacePath,
    });
    this.gitNotesManager = new GitNotesManager({
      workspacePath: context.workspacePath,
    });
    this.phaseGatekeeper = new PhaseGatekeeper({
      workspacePath: context.workspacePath,
    });
  }

  /**
   * Initializes extension components, registers commands, and sets up lifecycle hooks
   */
  public initialize(): void {
    if (this.isInitialized) {
      return;
    }

    this.registerSlashCommands();
    this.registerStatusBar();
    this.registerLifecycleHooks();
    this.isInitialized = true;
  }

  /**
   * Disposes active listeners and resources
   */
  public dispose(): void {
    this.isInitialized = false;
  }

  public getInterceptor(): SpecDeltaInterceptor {
    return this.interceptor;
  }

  public getGitNotesManager(): GitNotesManager {
    return this.gitNotesManager;
  }

  public getPhaseGatekeeper(): PhaseGatekeeper {
    return this.phaseGatekeeper;
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

  private registerLifecycleHooks(): void {
    if (typeof this.context.on === "function") {
      this.context.on("tool:beforeExecute", async (event: unknown) => {
        const payload = event as { toolName?: string; toolArgs?: Record<string, unknown> } | undefined;
        if (payload?.toolName) {
          return handlePreToolHook({
            toolName: payload.toolName,
            toolArgs: payload.toolArgs,
            workspacePath: this.context.workspacePath,
          });
        }
        return { allowed: true };
      });

      this.context.on("git:preCommit", async (event: unknown) => {
        const payload = event as { stagedFiles?: string[]; bypass?: boolean } | undefined;
        return handlePreCommitHook({
          workspacePath: this.context.workspacePath,
          stagedFiles: payload?.stagedFiles,
          bypass: payload?.bypass,
        });
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
export * from "./lifecycle/spec-interceptor.js";
export * from "./lifecycle/git-notes.js";
export * from "./lifecycle/plan-watcher.js";
export * from "./lifecycle/phase-gatekeeper.js";
export * from "./lifecycle/hooks.js";
