const configuredApiUrl = import.meta.env.VITE_API_URL;

if (
  import.meta.env.PROD &&
  (!configuredApiUrl || /localhost|127\.0\.0\.1|\[::1\]/i.test(configuredApiUrl))
) {
  throw new Error("VITE_API_URL must be a deployed API URL in production");
}

export const API_URL = (configuredApiUrl || "http://localhost:5000/api").replace(
  /\/+$/,
  "",
);
export const BACKEND_ORIGIN = new URL(API_URL).origin;

export function backendUrl(path) {
  if (!path || /^(https?:|data:|blob:)/i.test(path)) return path;
  return `${BACKEND_ORIGIN}/${String(path).replace(/^\/+/, "")}`;
}
