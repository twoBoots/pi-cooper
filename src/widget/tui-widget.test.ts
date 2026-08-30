import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { TuiWidget } from "./tui-widget.js";
import type { ExtensionContext } from "../types.js";

describe("TUI Widget Component Controller", () => {
  let tmpDir: string;
  let cooperDir: string;
  let activeDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cooper-tui-widget-test-"));
    cooperDir = path.join(tmpDir, ".cooper");
    activeDir = path.join(cooperDir, "active", "track-widget");
    await fs.mkdir(path.join(activeDir, "spec-deltas", "widget"), { recursive: true });

    await fs.writeFile(path.join(cooperDir, "index.md"), "# Cooper Root\n");
    await fs.writeFile(
      path.join(cooperDir, "tracks.md"),
      `# Tracks\n- [ ] **Track: Widget** (\`track-widget\`)\n  - Worktree: \`.worktrees/track-widget\`\n`
    );
    await fs.writeFile(
      path.join(activeDir, "metadata.json"),
      JSON.stringify({
        track_id: "track-widget",
        title: "Widget Track",
        type: "feature",
        status: "in_progress",
        created_at: "2026-08-30",
      })
    );
    await fs.writeFile(
      path.join(activeDir, "plan.md"),
      `# Plan\n\n## Phase 1: Core\n- [ ] Task: Build Widget\n`
    );
    await fs.writeFile(
      path.join(activeDir, "spec-deltas", "widget", "spec.md"),
      `# Spec Delta\n\n### Requirement: Widget\n#### Scenario: Render\n- GIVEN widget\n- WHEN active\n- THEN display\n`
    );
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("registers status bar item on context during initialization", async () => {
    const registeredItems: Array<{ id: string; text: string; tooltip?: string }> = [];
    const mockContext: ExtensionContext = {
      registerCommand: vi.fn(),
      registerStatusBarItem: vi.fn((item) => registeredItems.push(item)),
      workspacePath: tmpDir,
    };

    const widget = new TuiWidget(mockContext, { debounceMs: 10 });
    await widget.start();

    expect(mockContext.registerStatusBarItem).toHaveBeenCalled();
    expect(widget.getFormattedText()).toContain("[Cooper: track-widget]");

    widget.dispose();
  });

  it("updates status bar text when plan progress changes", async () => {
    const registered: { item?: { id: string; text: string; tooltip?: string } } = {};
    const mockContext: ExtensionContext = {
      registerCommand: vi.fn(),
      registerStatusBarItem: vi.fn((item) => {
        registered.item = item;
      }),
      workspacePath: tmpDir,
    };

    const widget = new TuiWidget(mockContext, { debounceMs: 10 });
    await widget.start();

    expect(registered.item?.text).toContain("[Tasks: 0/1]");

    // Update plan
    await fs.writeFile(
      path.join(activeDir, "plan.md"),
      `# Plan\n\n## Phase 1: Core\n- [x] Task: Build Widget\n`
    );

    await widget.refresh();
    expect(widget.getFormattedText()).toContain("[Tasks: 1/1]");

    widget.dispose();
  });

  it("disposes cleanly without errors", async () => {
    const mockContext: ExtensionContext = {
      registerCommand: vi.fn(),
      registerStatusBarItem: vi.fn(),
      workspacePath: tmpDir,
    };

    const widget = new TuiWidget(mockContext, { debounceMs: 10 });
    await widget.start();
    widget.dispose();

    expect(widget.isAlive()).toBe(false);
  });
});
