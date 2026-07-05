import { defineConfig } from "vite";
import { miaodaDevPlugin } from "miaoda-sc-plugin";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import path from "path";

const isGitHubPages = process.env.DEPLOY_TARGET === "github-pages";

// https://vite.dev/config/
export default defineConfig({
  base: isGitHubPages ? "/mediapipe-piano/" : "/",
  plugins: [
    react(),
    ...(isGitHubPages ? [] : [miaodaDevPlugin()]),
    svgr({
      svgrOptions: {
        icon: true,
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});