import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  target: "node20",
  external: ["@earendil-works/pi-agent-core"],
  treeshake: true,
  splitting: false,
});
