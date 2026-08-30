import { describe, it, expect } from "vitest";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import { handleValidateCommand } from "./validate.js";

describe("handleValidateCommand (/cooper:validate)", () => {
  it("informs user when not in a Cooper repository", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "non-cooper-"));
    try {
      const output = await handleValidateCommand(tmpDir);
      expect(output).toContain("Not in a Cooper SDD workspace");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("validates correct living specs and deltas", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cooper-val-valid-"));
    try {
      const specDir = path.join(tmpDir, ".cooper", "specs", "auth");
      await fs.mkdir(specDir, { recursive: true });
      await fs.writeFile(path.join(tmpDir, ".cooper", "index.md"), "# Index");

      const validSpec = `# Capability Spec: auth
## Overview
Auth capability.

## Requirements
### Requirement: User Login
User can login.

#### Scenario: Valid login
- GIVEN valid user
- WHEN login attempted
- THEN token returned
`;
      await fs.writeFile(path.join(specDir, "spec.md"), validSpec);

      const output = await handleValidateCommand(tmpDir);
      expect(output).toContain("Validation Passed");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("detects invalid scenarios missing keywords", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cooper-val-invalid-"));
    try {
      const specDir = path.join(tmpDir, ".cooper", "specs", "auth");
      await fs.mkdir(specDir, { recursive: true });
      await fs.writeFile(path.join(tmpDir, ".cooper", "index.md"), "# Index");

      const invalidSpec = `# Capability Spec: auth
## Requirements
### Requirement: User Login
#### Scenario: Bad scenario
- Just a bullet point without keyword
`;
      await fs.writeFile(path.join(specDir, "spec.md"), invalidSpec);

      const output = await handleValidateCommand(tmpDir);
      expect(output).toContain("Validation Failed");
      expect(output).toContain("Scenario step must start with GIVEN, WHEN, THEN, or AND");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
