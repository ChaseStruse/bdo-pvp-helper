import fs from 'fs';
import path from 'path';

// class_guides lives at the project root, one level above frontend-next/
const GUIDES_ROOT = path.join(process.cwd(), '..', 'class_guides');

/**
 * Reads a markdown guide file relative to the class_guides/ directory.
 * e.g. getGuideContent('ninja/awakening/ninja_awakening_combos_pvp.md')
 *
 * Returns null if the file doesn't exist.
 */
export function getGuideContent(relativePath: string): string | null {
  const filePath = path.join(GUIDES_ROOT, relativePath);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}
