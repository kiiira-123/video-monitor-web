import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages: set VITE_BASE=/repo-name/ when deploying to project pages
const base = process.env.VITE_BASE?.trim() || "/";

export default defineConfig({
  plugins: [react()],
  base,
});
