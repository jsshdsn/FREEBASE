import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  // build: {
  //   target: "esnext",
  // },
  define: {
    global: {},
  },
  plugins: [react()],
});
