import { describe, it, expect } from "vitest";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import { handleTracksCommand } from "./tracks.js";

describe("handleTracksCommand (/cooper:tracks)", () => {
  it("informs user when not in a Cooper repository", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "non-cooper-"));
    try {
      const output = await handleTracksCommand(tmpDir);
      expect(output).toContain("Not in a Cooper SDD workspace");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("renders tracks list when tracks.md exists", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cooper-tracks-cmd-"));
    try {
      const cooperDir = path.join(tmpDir, ".cooper");
      await fs.mkdir(cooperDir, { recursive: true });
      await fs.writeFile(path.join(cooperDir, "index.md"), "# Index");
      const tracksContent = `# Tracks Registry
- [x] **Track: Core Scaffold** (\`track-scaffold\`)
  - Worktree: \`.worktrees/track-scaffold\`
- [ ] **Track: Slash Commands** (\`track-slash-commands\`)
  - Worktree: \`.worktrees/track-slash-commands\`
`;
      await fs.writeFile(path.join(cooperDir, "tracks.md"), tracksContent);

      const output = await handleTracksCommand(tmpDir);
      expect(output).toContain("Core Scaffold");
      expect(output).toContain("track-slash-commands");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
