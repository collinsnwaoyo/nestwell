// Home's numbers count up and its chart draws in once per browser session,
// not on every visit. A tiny inline script (INTRO_SCRIPT, in the root layout's
// <head>) flags the first visit on <html> before first paint, so CSS can hide
// the final values until they animate instead of flashing them first.
const INTRO_PLAYED_KEY = "nestwell:home-intro";

export const INTRO_SCRIPT = `try{if(!sessionStorage.getItem("${INTRO_PLAYED_KEY}"))document.documentElement.dataset.intro="1"}catch(e){}`;

export function shouldPlayIntro(): boolean {
  return typeof document !== "undefined" && document.documentElement.dataset.intro === "1";
}

export function markIntroPlayed(): void {
  delete document.documentElement.dataset.intro;
  try {
    window.sessionStorage.setItem(INTRO_PLAYED_KEY, "1");
  } catch {
    // sessionStorage unavailable: the intro may replay, which is harmless.
  }
}
