import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  if (
    mode === "production" &&
    (!env.VITE_API_URL ||
      !env.VITE_API_URL.startsWith("https://") ||
      /localhost|127\.0\.0\.1|\[::1\]/i.test(env.VITE_API_URL))
  ) {
    throw new Error(
      "VITE_API_URL must be a non-local HTTPS API URL for production builds",
    );
  }

  return {
    plugins: [react()],
    server: {
      historyApiFallback: true,
    },
  };
});
