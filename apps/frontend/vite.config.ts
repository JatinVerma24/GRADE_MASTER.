import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/GRADE_MASTER./",
  server: {
    port: 5173,
    host: true,
  },
});
