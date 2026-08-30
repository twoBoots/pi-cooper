import { describe, it, expect } from "vitest";
import {
  renderProgressBar,
  formatStatusBadge,
  formatTracksList,
  formatSpecValidationReport,
} from "./format.js";

describe("Terminal Formatting Utilities", () => {
  describe("renderProgressBar", () => {
    it("renders empty progress bar for 0 total tasks", () => {
      expect(renderProgressBar(0, 0)).toBe("[          ] 0/0 (0%)");
    });

    it("renders partial progress bar accurately", () => {
      const bar = renderProgressBar(4, 8, 10);
      expect(bar).toBe("[====>     ] 4/8 (50%)");
    });

    it("renders complete progress bar when all tasks completed", () => {
      const bar = renderProgressBar(5, 5, 10);
      expect(bar).toBe("[==========] 5/5 (100%)");
    });
  });

  describe("formatStatusBadge", () => {
    it("formats known statuses with distinct labels", () => {
      expect(formatStatusBadge("completed")).toContain("Completed");
      expect(formatStatusBadge("in_progress")).toContain("In Progress");
      expect(formatStatusBadge("new")).toContain("New");
      expect(formatStatusBadge("review")).toContain("Review");
      expect(formatStatusBadge("unknown")).toContain("unknown");
    });
  });

  describe("formatTracksList", () => {
    it("formats list of registry tracks nicely", () => {
      const tracks = [
        {
          id: "track-1",
          title: "Track 1",
          completed: true,
          worktree: ".worktrees/track-1",
          link: ".cooper/archive/track-1/index.md",
        },
        {
          id: "track-2",
          title: "Track 2",
          completed: false,
          worktree: ".worktrees/track-2",
          link: ".cooper/active/track-2/index.md",
        },
      ];

      const output = formatTracksList(tracks);
      expect(output).toContain("Track 1");
      expect(output).toContain("Track 2");
      expect(output).toContain("track-1");
      expect(output).toContain("track-2");
    });

    it("handles empty tracks list", () => {
      const output = formatTracksList([]);
      expect(output).toContain("No registered tracks found");
    });
  });

  describe("formatSpecValidationReport", () => {
    it("formats clean validation report when valid", () => {
      const report = formatSpecValidationReport(true, []);
      expect(report).toContain("Validation Passed");
    });

    it("formats validation report with error list when issues exist", () => {
      const report = formatSpecValidationReport(false, [
        { file: "specs/test.md", line: 12, message: "Invalid GIVEN/WHEN/THEN format" },
      ]);
      expect(report).toContain("Validation Failed");
      expect(report).toContain("specs/test.md:12");
      expect(report).toContain("Invalid GIVEN/WHEN/THEN format");
    });
  });
});
