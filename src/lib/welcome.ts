// The welcome screen only shows on first visit in a browser session (PRD:
// "Welcome screen"). sessionStorage, not a cookie, since there's no real
// login — it should come back after the tab closes, not persist forever.
const WELCOME_SEEN_KEY = "nestwell:welcomed";

export function hasSeenWelcome(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(WELCOME_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function markWelcomeSeen(): void {
  try {
    window.sessionStorage.setItem(WELCOME_SEEN_KEY, "1");
  } catch {
    // sessionStorage unavailable (private mode, etc.) — not seeing the
    // welcome screen again this session is a nice-to-have, not critical.
  }
}

export function clearWelcomeSeen(): void {
  try {
    window.sessionStorage.removeItem(WELCOME_SEEN_KEY);
  } catch {
    // Same as above.
  }
}
