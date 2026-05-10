/**
 * Parses the combo guide markdown into structured data.
 * Each ## section becomes one ComboData entry.
 */
export interface ComboData {
  title: string;
  description: string;
  inputsWithMoveNames: string;
  inputsWithKeybinds: string; // raw keybind string, e.g. "E → Quick Slot → Shift + LMB"
  keybindSteps: string[];     // split into individual steps
}

export function parseCombos(markdown: string): ComboData[] {
  // Split on level-2 headers (##), keep non-empty sections
  const rawSections = markdown.split(/^## /m).filter((s) => s.trim());

  return rawSections.map((section) => {
    const lines = section.split('\n');
    // Title is the first line; strip surrounding **
    const title = lines[0].replace(/\*\*/g, '').trim();

    // Split on level-3 headers (###) within this section
    const subSections = section.split(/^### /m);

    let description = '';
    let inputsWithMoveNames = '';
    let inputsWithKeybinds = '';

    for (const sub of subSections) {
      const lower = sub.toLowerCase();
      const body = sub.replace(/^[^\n]+\n/, '').trim(); // strip the heading line

      if (lower.startsWith('description')) {
        description = body;
      } else if (lower.startsWith('inputs w/ move names')) {
        inputsWithMoveNames = body;
      } else if (lower.startsWith('inputs w/ keybinds')) {
        inputsWithKeybinds = body;
      }
    }

    // Strip markdown bold (**...**) from the keybind string and split by →
    const cleanKeybinds = inputsWithKeybinds.replace(/\*\*/g, '').trim();
    const keybindSteps = cleanKeybinds
      .split('→')
      .map((s) => s.trim())
      .filter(Boolean);

    return { title, description, inputsWithMoveNames, inputsWithKeybinds, keybindSteps };
  });
}
