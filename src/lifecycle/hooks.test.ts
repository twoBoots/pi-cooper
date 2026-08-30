import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { handlePreCommitHook, handlePreToolHook } from "./hooks.js";

describe("Lifecycle Hooks (Pre-Commit & Pre-Tool)", () => {
  let tmpDir: string;
  let cooperDir: string;
  let activeTrackDir: string;
  let specDeltasDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cooper-hooks-test-"));
    cooperDir = path.join(tmpDir, ".cooper");
    await fs.mkdir(cooperDir, { recursive: true });
    await fs.writeFile(path.join(cooperDir, "index.md"), "# Project Context");

    const specsDir = path.join(cooperDir, "specs", "sample-cap");
    await fs.mkdir(specsDir, { recursive: true });
    await fs.writeFile(
      path.join(specsDir, "spec.md"),
      "# Capability Spec: sample-cap\n\n### Requirement: Core\n#### Scenario: Base\n- GIVEN a\n- WHEN b\n- THEN c\n"
    );

    activeTrackDir = path.join(cooperDir, "active", "track-sample");
    specDeltasDir = path.join(activeTrackDir, "spec-deltas", "sample-cap");
    await fs.mkdir(specDeltasDir, { recursive: true });
  });

  afterEach(async () => {
    delete process.env.COOPER_BYPASS_SPEC_CHECK;
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe("handlePreCommitHook", () => {
    it("should succeed when spec deltas are valid", async () => {
      await fs.writeFile(
        path.join(specDeltasDir, "spec.md"),
        "# Spec Delta: sample-cap\n\n### Requirement: Core\n#### Scenario: Work\n- GIVEN active track\n- WHEN commit executed\n- THEN pass\n"
      );

      const result = await handlePreCommitHook({
        workspacePath: tmpDir,
        trackId: "track-sample",
        stagedFiles: ["src/sample-cap/index.ts"],
      });

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.message).toContain("Spec validation passed");
    });

    it("should fail and block commit when spec deltas are missing or invalid", async () => {
      await fs.writeFile(
        path.join(specDeltasDir, "spec.md"),
        "# Spec Delta: sample-cap\n\n### Requirement: Core\n#### Scenario: Bad\n- invalid step\n"
      );

      const result = await handlePreCommitHook({
        workspacePath: tmpDir,
        trackId: "track-sample",
        stagedFiles: ["src/sample-cap/index.ts"],
      });

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.message).toContain("Commit blocked");
      expect(result.message).toContain("GIVEN, WHEN, THEN");
    });

    it("should allow commit with warning when bypass is requested", async () => {
      const result = await handlePreCommitHook({
        workspacePath: tmpDir,
        trackId: "track-sample",
        stagedFiles: ["src/sample-cap/index.ts"],
        bypass: true,
      });

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.message).toContain("Bypass active");
    });
  });

  describe("handlePreToolHook", () => {
    it("should allow non-code tool calls (e.g. view_file, list_dir)", async () => {
      const result = await handlePreToolHook({
        toolName: "view_file",
        toolArgs: { AbsolutePath: "/tmp/foo" },
        workspacePath: tmpDir,
      });

      expect(result.allowed).toBe(true);
    });

    it("should intercept and validate file write operations when active track is set", async () => {
      await fs.writeFile(
        path.join(specDeltasDir, "spec.md"),
        "# Spec Delta: sample-cap\n\n### Requirement: Core\n#### Scenario: Work\n- GIVEN active track\n- WHEN file written\n- THEN succeed\n"
      );

      const result = await handlePreToolHook({
        toolName: "write_to_file",
        toolArgs: { TargetFile: path.join(tmpDir, "src", "sample-cap", "file.ts") },
        workspacePath: tmpDir,
        trackId: "track-sample",
      });

      expect(result.allowed).toBe(true);
    });
  });
});
