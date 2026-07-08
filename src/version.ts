/** App version — injected by Vite define at build time. Falls back to 'dev' in local dev. */
export const APP_VERSION: string = __APP_VERSION__;

/** Cache name prefix used by the service worker. */
export const CACHE_NAME = `pulso-${APP_VERSION}`;
