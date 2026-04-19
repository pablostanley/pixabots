import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.tsx"],
  format: ["esm", "cjs"],
  dts: true,
  splitting: false,
  clean: true,
  sourcemap: true,
  external: ["react", "react-dom"],
});
