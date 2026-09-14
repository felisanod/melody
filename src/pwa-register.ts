const APP_WORKER_PATH = "/sw.js";

function shouldDisableAppWorker() {
  const { hostname, search } = window.location;
  return (
    !import.meta.env.PROD ||
    window.self !== window.top ||
    hostname.startsWith("id-preview--") ||
    hostname.startsWith("preview--") ||
    hostname === "lovableproject.com" ||
    hostname.endsWith(".lovableproject.com") ||
    hostname === "lovableproject-dev.com" ||
    hostname.endsWith(".lovableproject-dev.com") ||
    hostname === "beta.lovable.dev" ||
    hostname.endsWith(".beta.lovable.dev") ||
    new URLSearchParams(search).get("sw") === "off"
  );
}

async function unregisterAppWorkers() {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    registrations
      .filter((registration) => new URL(registration.active?.scriptURL ?? APP_WORKER_PATH, location.origin).pathname === APP_WORKER_PATH)
      .map((registration) => registration.unregister()),
  );
}

export async function registerPwa() {
  if (!("serviceWorker" in navigator)) return;
  if (shouldDisableAppWorker()) {
    await unregisterAppWorkers();
    return;
  }
  await navigator.serviceWorker.register(APP_WORKER_PATH, { scope: "/" });
}