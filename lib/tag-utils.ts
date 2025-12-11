/**
 * Formats a tag name for display:
 * - Converts plural to singular
 * - Removes hyphens and replaces with spaces
 * - Capitalizes each word (Title Case)
 */
export function formatTagName(tagName: string): string {
  if (!tagName) return tagName;

  // Remove hyphens and replace with spaces
  let formatted = tagName.replace(/-/g, ' ');

  // Convert plural to singular
  // Handle common plural endings
  if (formatted.endsWith('ies')) {
    formatted = formatted.slice(0, -3) + 'y';
  } else if (formatted.endsWith('es') && formatted.length > 3) {
    // Check if it's a word that ends in 'es' (like 'grants' -> 'grant')
    const beforeEs = formatted.slice(0, -2);
    // Common patterns: grants, artists, etc.
    if (beforeEs.endsWith('t') || beforeEs.endsWith('s')) {
      formatted = beforeEs;
    } else if (beforeEs.endsWith('ch') || beforeEs.endsWith('sh') || beforeEs.endsWith('x') || beforeEs.endsWith('z')) {
      formatted = beforeEs;
    } else {
      // For words like 'boxes', 'buses' - just remove 'es'
      formatted = beforeEs;
    }
  } else if (formatted.endsWith('s') && formatted.length > 1) {
    // Remove trailing 's' for most plurals
    // But keep words that end in 's' naturally (like 'glass', 'class')
    const beforeS = formatted.slice(0, -1);
    // Common exceptions - words that shouldn't lose the 's'
    const exceptions = ['glass', 'class', 'mass', 'pass', 'grass', 'brass'];
    if (!exceptions.includes(formatted.toLowerCase())) {
      formatted = beforeS;
    }
  }

  // Capitalize each word (Title Case)
  formatted = formatted
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return formatted;
}

