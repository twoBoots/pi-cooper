import { findCooperRoot, readTracksRegistry } from "../utils/cooper-fs.js";
import { formatTracksList } from "../utils/format.js";

/**
 * Executes /cooper:tracks in-process in <5ms
 */
export async function handleTracksCommand(workspacePath?: string): Promise<string> {
  const currentDir = workspacePath ?? process.cwd();
  const cooperRoot = await findCooperRoot(currentDir);

  if (!cooperRoot) {
    return "⚠️ [Cooper SDD] Not in a Cooper SDD workspace (no .cooper/ directory found).\nRun 'cooper init' to initialize Cooper in this project.";
  }

  const tracks = await readTracksRegistry(cooperRoot);
  return formatTracksList(tracks);
}
