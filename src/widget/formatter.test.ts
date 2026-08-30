import { describe, it, expect } from "vitest";
import { formatStatusBar, type WidgetState, type WidgetRenderOptions } from "./formatter.js";

describe("TUI Status Widget Formatter", () => {
  describe("formatStatusBar", () => {
    it("formats uninitialized state correctly", () => {
      const state: WidgetState = { mode: "uninitialized" };
      const output = formatStatusBar(state);
      expect(output).toBe("[Cooper: Uninitialized]");
    });

    it("formats idle state with available tracks count", () => {
      const state: WidgetState = {
        mode: "idle",
        availableTracksCount: 3,
      };
      const output = formatStatusBar(state);
      expect(output).toBe("[Cooper: Idle (3 tracks available)]");
    });

    it("formats idle state with 0 available tracks", () => {
      const state: WidgetState = {
        mode: "idle",
        availableTracksCount: 0,
      };
      const output = formatStatusBar(state);
      expect(output).toBe("[Cooper: Idle (0 tracks available)]");
    });

    it("formats active track with valid specs in standard ANSI mode", () => {
      const state: WidgetState = {
        mode: "active",
        trackId: "track-tui-widget",
        currentPhaseIndex: 1,
        totalPhases: 3,
        completedTasks: 4,
        totalTasks: 10,
        specValid: true,
      };
      const options: WidgetRenderOptions = { isTTY: true, columns: 100, useColor: true };
      const output = formatStatusBar(state, options);

      expect(output).toContain("[Cooper: track-tui-widget]");
      expect(output).toContain("[Phase: 1/3]");
      expect(output).toContain("[Tasks: 4/10]");
      expect(output).toContain("\x1b[32mValid\x1b[0m");
    });

    it("formats active track with invalid specs in ANSI mode", () => {
      const state: WidgetState = {
        mode: "active",
        trackId: "track-auth",
        currentPhaseIndex: 2,
        totalPhases: 4,
        completedTasks: 1,
        totalTasks: 5,
        specValid: false,
      };
      const options: WidgetRenderOptions = { isTTY: true, columns: 100, useColor: true };
      const output = formatStatusBar(state, options);

      expect(output).toContain("[Cooper: track-auth]");
      expect(output).toContain("[Phase: 2/4]");
      expect(output).toContain("[Tasks: 1/5]");
      expect(output).toContain("\x1b[31m⚠️ Invalid\x1b[0m");
    });

    it("formats active track in compact mode when terminal columns < 80", () => {
      const state: WidgetState = {
        mode: "active",
        trackId: "track-tui-widget",
        currentPhaseIndex: 1,
        totalPhases: 3,
        completedTasks: 4,
        totalTasks: 10,
        specValid: true,
      };
      const options: WidgetRenderOptions = { isTTY: true, columns: 70, useColor: false };
      const output = formatStatusBar(state, options);

      expect(output).toBe("[Cooper: track-tui-widget] [4/10] [Specs: Valid]");
    });

    it("strips ANSI color escapes when useColor is false or non-TTY", () => {
      const state: WidgetState = {
        mode: "active",
        trackId: "track-tui-widget",
        currentPhaseIndex: 1,
        totalPhases: 3,
        completedTasks: 4,
        totalTasks: 10,
        specValid: true,
      };
      const options: WidgetRenderOptions = { isTTY: false, columns: 120, useColor: false };
      const output = formatStatusBar(state, options);

      expect(output).toBe("[Cooper: track-tui-widget] [Phase: 1/3] [Tasks: 4/10] [Specs: Valid]");
      expect(output).not.toContain("\x1b[");
    });
  });
});
