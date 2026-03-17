import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { federation } from "@module-federation/vite";

export default defineConfig({
  plugins: [
    federation({
      name: "products",
      filename: "remoteEntry.js",
      exposes: {
        "./ProductList": "./src/components/ProductList.tsx",
      },
      shared: {
        react: { singleton: true, requiredVersion: "^18.2.0" },
        "react-dom": { singleton: true, requiredVersion: "^18.2.0" },
      },
    }),
    react(),
  ],
  server: {
    port: 3001,
    strictPort: true,
    cors: true,
  },
  build: {
    target: "esnext",
  },
});
