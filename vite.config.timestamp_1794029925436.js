// vite.config.ts
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import mdx from "@mdx-js/rollup";
import viteReact from "@vitejs/plugin-react";
var vite_config_default = defineConfig({
  plugins: [
    mdx({ providerImportSource: "@mdx-js/react" }),
    TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tanstackStart(),
    viteReact()
  ]
});
export {
  vite_config_default as default
};
