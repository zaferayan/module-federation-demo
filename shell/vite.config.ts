import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { federation } from "@module-federation/vite";

export default defineConfig({
  plugins: [
    federation({
      name: "shell",
      remotes: {
        products: {
          type: "module",
          name: "products",
          entry: "http://localhost:3001/remoteEntry.js",
        },
      },
      shared: {
        react: { singleton: true, requiredVersion: "^18.2.0" },
        "react-dom": { singleton: true, requiredVersion: "^18.2.0" },
      },
    }),
    react(),
  ],
  server: {
    port: 3000,
    strictPort: true,
  },
  build: {
    target: "esnext",
  },
});
