/**
 * At most one panel popup per day (app install / notifications, profile photo): the first prompt
 * whose timer fires takes the day's slot; the others wait for another day. The same prompt may
 * show again that day (e.g. after a reload, until "Agora não").
 */
const PROMPT_SLOT_KEY = "mc_prompt_day";

export function claimPromptSlot(name: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const [day, taken] = (localStorage.getItem(PROMPT_SLOT_KEY) ?? "").split("|");
    if (day === today && taken && taken !== name) return false;
    localStorage.setItem(PROMPT_SLOT_KEY, `${today}|${name}`);
  } catch {
    // No storage: show it.
  }
  return true;
}
