/**
 * Extension identifier constants
 */
export const EXTENSION_ID = "pi-cooper";
export const EXTENSION_NAME = "Cooper SDD";

/**
 * Slash command definitions
 */
export const COMMANDS = {
  STATUS: "/cooper:status",
  TRACKS: "/cooper:tracks",
  SWITCH: "/cooper:switch",
  VALIDATE: "/cooper:validate",
  CHECKPOINT: "/cooper:checkpoint",
} as const;

export type CommandKey = keyof typeof COMMANDS;
export type CommandName = (typeof COMMANDS)[CommandKey];
