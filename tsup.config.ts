import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/mcp/index.ts"],
    outDir: "dist/mcp",
    format: ["cjs", "esm"],
    dts: true,
    sourcemap: true,
    clean: true,
    outExtension: ({ format }) => ({
      js: format === "esm" ? ".js" : ".cjs",
    }),
  },
  {
    entry: ["src/shared/index.ts"],
    outDir: "dist/shared",
    format: ["cjs", "esm"],
    dts: true,
    sourcemap: true,
    clean: true,
    outExtension: ({ format }) => ({
      js: format === "esm" ? ".js" : ".cjs",
    }),
  },
  {
    entry: ["src/examples/mcp.ts"],
    outDir: "dist/examples",
    format: ["esm"],
    dts: true,
    clean: true,
  },
]);
