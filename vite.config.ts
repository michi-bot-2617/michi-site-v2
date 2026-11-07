import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import mdx from "@mdx-js/rollup";
import viteReact from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    mdx({ providerImportSource: "@mdx-js/react" }),
    TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
    tanstackStart(),
    viteReact(),
  ],
});
