import { describe, it, expect, vi } from "vitest";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import activate, { CooperExtension } from "./index.js";
import { COMMANDS } from "./constants.js";
import type { ExtensionContext } from "./types.js";

describe("Extension Entrypoint (activate)", () => {
  it("exports default activate function", () => {
    expect(typeof activate).toBe("function");
  });

  it("registers slash commands with the Pi runtime context and executes handlers", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cooper-index-test-"));
    try {
      const cooperDir = path.join(tmpDir, ".cooper");
      await fs.mkdir(cooperDir, { recursive: true });
      await fs.writeFile(path.join(cooperDir, "index.md"), "# Index");

      const registeredCommands = new Map<string, (...args: unknown[]) => Promise<unknown> | unknown>();
      const registeredStatusBar: unknown[] = [];

      const mockContext: ExtensionContext = {
        workspacePath: tmpDir,
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
      expect(await switchHandler("test-track")).toContain("test-track");
      expect(await validateHandler()).toContain("Validation");
      expect(await checkpointHandler()).toContain("checkpoint");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
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
