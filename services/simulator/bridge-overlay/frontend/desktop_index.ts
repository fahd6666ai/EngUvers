// EngUvers embeds the web build only (no Tauri desktop shell) — same
// no-op as the OSS default. Kept so `@pro/desktop_index` resolves; this
// is unreachable unless VITE_DESKTOP is also set, which we never do.
export const mountProDesktop = () => {};
