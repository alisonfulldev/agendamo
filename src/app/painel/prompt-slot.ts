/**
 * One panel popup per visit (app install / notifications, profile photo): the first prompt whose
 * timer fires takes the slot for the rest of the browser session, the others wait for another visit.
 */
const PROMPT_SLOT_KEY = "mc_prompt_shown";

export function claimPromptSlot(name: string): boolean {
  try {
    const taken = sessionStorage.getItem(PROMPT_SLOT_KEY);
    if (taken && taken !== name) return false;
    sessionStorage.setItem(PROMPT_SLOT_KEY, name);
  } catch {
    // No sessionStorage: show it.
  }
  return true;
}
