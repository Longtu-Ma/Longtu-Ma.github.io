(() => {
  const MANUAL_KEY = "LONGTU-MANUAL-THEME";
  const STATUS_KEY = "REDEFINE-THEME-STATUS";
  const CONTROL_ID = "manual-theme-selector";

  const readStatus = () => {
    try {
      return JSON.parse(localStorage.getItem(STATUS_KEY) || "{}") || {};
    } catch (_) {
      return {};
    }
  };

  const currentMode = () =>
    document.documentElement.classList.contains("dark") ? "dark" : "light";

  const savedMode = () => {
    const value = localStorage.getItem(MANUAL_KEY);
    return value === "dark" ? "dark" : "light";
  };

  const saveThemeStatus = (mode) => {
    const status = {
      isExpandPageWidth: false,
      isDark: mode === "dark",
      fontSizeLevel: 0,
      isOpenPageAside: true,
      ...readStatus(),
      isDark: mode === "dark"
    };
    localStorage.setItem(STATUS_KEY, JSON.stringify(status));
  };

  const updateButtons = (mode) => {
    const control = document.getElementById(CONTROL_ID);
    if (!control) return;
    control.querySelectorAll("button[data-theme-mode]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.themeMode === mode));
    });
  };

  const applyMode = (mode) => {
    const isDark = mode === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.classList.toggle("light", !isDark);
    if (document.body) {
      document.body.classList.toggle("dark-mode", isDark);
      document.body.classList.toggle("light-mode", !isDark);
    }
    // The theme's banner uses utility classes for this, but setting the
    // display state explicitly keeps it in sync with the manual selector.
    document.querySelectorAll(".home-banner-background img").forEach((image, index) => {
      const visible = isDark ? index === 1 : index === 0;
      image.style.setProperty("display", visible ? "block" : "none", "important");
    });
    saveThemeStatus(mode);
    updateButtons(mode);
  };

  const setMode = (mode) => {
    const normalized = mode === "dark" ? "dark" : "light";
    localStorage.setItem(MANUAL_KEY, normalized);
    applyMode(normalized);
  };

  // Seed the theme's own status before its preloader runs, preventing a flash
  // of the system-selected mode on a fresh page load.
  if (!localStorage.getItem(MANUAL_KEY)) localStorage.setItem(MANUAL_KEY, "light");
  saveThemeStatus(savedMode());
  applyMode(savedMode());

  const bindThemeToggle = () => {
    const toggle = document.querySelector(".tool-dark-light-toggle");
    if (!toggle || toggle.dataset.manualThemeBound === "true") return;
    toggle.dataset.manualThemeBound = "true";
    toggle.addEventListener("click", () => {
      window.setTimeout(() => setMode(currentMode()), 0);
    });
  };

  const installControl = () => {
    if (!document.body) return;
    bindThemeToggle();
    applyMode(savedMode());
    if (document.getElementById(CONTROL_ID)) {
      updateButtons(savedMode());
      return;
    }
    const anchor = document.querySelector(".side-tools-container") || document.body;
    const control = document.createElement("div");
    control.id = CONTROL_ID;
    control.className = "manual-theme-selector";
    control.setAttribute("role", "group");
    control.setAttribute("aria-label", "选择网站主题");
    control.innerHTML = `
      <button type="button" data-theme-mode="light" aria-label="切换到浅色模式">浅色</button>
      <button type="button" data-theme-mode="dark" aria-label="切换到深色模式">深色</button>`;
    control.querySelectorAll("button[data-theme-mode]").forEach((button) => {
      button.addEventListener("click", () => setMode(button.dataset.themeMode));
    });
    anchor.appendChild(control);
    updateButtons(savedMode());
  };

  document.addEventListener("DOMContentLoaded", installControl);
  window.setTimeout(installControl, 800);

  // Redefine listens to OS theme changes. Re-apply the user's explicit choice
  // after that listener runs so the operating system cannot override it.
  const media = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  if (media) {
    const restoreManualMode = () => window.setTimeout(() => setMode(savedMode()), 0);
    if (media.addEventListener) media.addEventListener("change", restoreManualMode);
    else if (media.addListener) media.addListener(restoreManualMode);
  }
})();
