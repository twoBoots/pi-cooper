import { describe, it, expect, vi } from "vitest";
import activate, { CooperExtension } from "../src/index.js";
import { COMMANDS } from "../src/constants.js";
import type { ExtensionContext } from "../src/types.js";

describe("Extension Entrypoint (activate)", () => {
  it("exports default activate function", () => {
    expect(typeof activate).toBe("function");
  });

  it("registers slash commands with the Pi runtime context and executes handlers", async () => {
    const registeredCommands = new Map<string, (...args: unknown[]) => Promise<unknown> | unknown>();
    const registeredStatusBar: unknown[] = [];

    const mockContext: ExtensionContext = {
      workspacePath: "/workspace/test",
      registerCommand: vi.fn((name, handler) => {
        registeredCommands.set(name, handler);
      }),
      registerStatusBarItem: vi.fn((item) => {
        registeredStatusBar.push(item);
      }),
    };

    const instance = activate(mockContext);

    expect(instance).toBeInstanceOf(CooperExtension);
    expect(mockContext.registerCommand).toHaveBeenCalledTimes(5);
    expect(registeredCommands.has(COMMANDS.STATUS)).toBe(true);
    expect(registeredCommands.has(COMMANDS.TRACKS)).toBe(true);
    expect(registeredCommands.has(COMMANDS.SWITCH)).toBe(true);
    expect(registeredCommands.has(COMMANDS.VALIDATE)).toBe(true);
    expect(registeredCommands.has(COMMANDS.CHECKPOINT)).toBe(true);
    expect(registeredStatusBar).toHaveLength(1);

    // Test handler execution
    const statusHandler = registeredCommands.get(COMMANDS.STATUS)!;
    const tracksHandler = registeredCommands.get(COMMANDS.TRACKS)!;
    const switchHandler = registeredCommands.get(COMMANDS.SWITCH)!;
    const validateHandler = registeredCommands.get(COMMANDS.VALIDATE)!;
    const checkpointHandler = registeredCommands.get(COMMANDS.CHECKPOINT)!;

    expect(await statusHandler()).toContain("Status");
    expect(await tracksHandler()).toContain("Tracks");
    expect(await switchHandler()).toContain("Switch");
    expect(await validateHandler()).toContain("Validate");
    expect(await checkpointHandler()).toContain("Checkpoint");
  });

  it("handles contexts without optional statusBar registration gracefully", () => {
    const mockContext: ExtensionContext = {
      workspacePath: "/workspace/test",
      registerCommand: vi.fn(),
    };

    expect(() => activate(mockContext)).not.toThrow();
  });

  it("does not re-register if initialize is called twice", () => {
    const mockContext: ExtensionContext = {
      workspacePath: "/workspace/test",
      registerCommand: vi.fn(),
      registerStatusBarItem: vi.fn(),
    };

    const instance = activate(mockContext);
    expect(mockContext.registerCommand).toHaveBeenCalledTimes(5);

    // Call initialize again
    instance.initialize();
    expect(mockContext.registerCommand).toHaveBeenCalledTimes(5);
  });
});
