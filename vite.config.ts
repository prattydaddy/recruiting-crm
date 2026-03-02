import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { devApiPlugin } from "./dev-api";

export default defineConfig({
  plugins: [react(), tailwindcss(), devApiPlugin()],
});
