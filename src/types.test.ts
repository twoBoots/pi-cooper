import { describe, it, expect } from "vitest";
import {
  EXTENSION_ID,
  EXTENSION_NAME,
  COMMANDS,
} from "./constants.js";
import {
  isTrackMetadata,
  isCooperProject,
} from "./types.js";

describe("Extension Constants", () => {
  it("exports correct extension identifiers", () => {
    expect(EXTENSION_ID).toBe("pi-cooper");
    expect(EXTENSION_NAME).toBe("Cooper SDD");
  });

  it("exports registered slash commands", () => {
    expect(COMMANDS.STATUS).toBe("/cooper:status");
    expect(COMMANDS.TRACKS).toBe("/cooper:tracks");
    expect(COMMANDS.SWITCH).toBe("/cooper:switch");
    expect(COMMANDS.VALIDATE).toBe("/cooper:validate");
    expect(COMMANDS.CHECKPOINT).toBe("/cooper:checkpoint");
  });
});

describe("Domain Type Guards", () => {
  it("validates track metadata objects", () => {
    const validMeta = {
      track_id: "track-test",
      title: "Test Track",
      type: "feature",
      status: "new",
      created_at: "2026-08-30T00:00:00Z",
    };
    expect(isTrackMetadata(validMeta)).toBe(true);

    expect(isTrackMetadata(null)).toBe(false);
    expect(isTrackMetadata({})).toBe(false);
    expect(isTrackMetadata({ track_id: "test" })).toBe(false);
  });

  it("validates Cooper project directory markers", () => {
    expect(isCooperProject({ hasCooperDir: true, hasIndexMd: true })).toBe(true);
    expect(isCooperProject({ hasCooperDir: false, hasIndexMd: true })).toBe(false);
    expect(isCooperProject({ hasCooperDir: true, hasIndexMd: false })).toBe(false);
  });
});
