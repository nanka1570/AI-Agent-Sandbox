/**
 * Slugify utility for converting task titles to Git branch names
 */

/**
 * Simple Japanese to English transliteration map
 */
const transliterationMap: Record<string, string> = {
  // Hiragana
  'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
  'か': 'ka', 'が': 'ga', 'き': 'ki', 'ぎ': 'gi', 'く': 'ku', 'ぐ': 'gu',
  'け': 'ke', 'げ': 'ge', 'こ': 'ko', 'ご': 'go',
  'さ': 'sa', 'ざ': 'za', 'し': 'shi', 'じ': 'ji', 'す': 'su', 'ず': 'zu',
  'せ': 'se', 'ぜ': 'ze', 'そ': 'so', 'ぞ': 'zo',
  'た': 'ta', 'だ': 'da', 'ち': 'chi', 'ぢ': 'ji', 'つ': 'tsu', 'づ': 'zu',
  'て': 'te', 'で': 'de', 'と': 'to', 'ど': 'do',
  'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
  'は': 'ha', 'ば': 'ba', 'ぱ': 'pa', 'ひ': 'hi', 'び': 'bi', 'ぴ': 'pi',
  'ふ': 'hu', 'ぶ': 'bu', 'ぷ': 'pu', 'へ': 'he', 'べ': 'be', 'ぺ': 'pe',
  'ほ': 'ho', 'ぼ': 'bo', 'ぽ': 'po',
  'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
  'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
  'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
  'わ': 'wa', 'を': 'wo', 'ん': 'n',

  // Katakana (basic set)
  'ア': 'a', 'イ': 'i', 'ウ': 'u', 'エ': 'e', 'オ': 'o',
  'カ': 'ka', 'ガ': 'ga', 'キ': 'ki', 'ギ': 'gi', 'ク': 'ku', 'グ': 'gu',
  'ケ': 'ke', 'ゲ': 'ge', 'コ': 'ko', 'ゴ': 'go',
  'サ': 'sa', 'ザ': 'za', 'シ': 'shi', 'ジ': 'ji', 'ス': 'su', 'ズ': 'zu',
  'セ': 'se', 'ゼ': 'ze', 'ソ': 'so', 'ゾ': 'zo',
  'タ': 'ta', 'ダ': 'da', 'チ': 'chi', 'ヂ': 'ji', 'ツ': 'tsu', 'ヅ': 'zu',
  'テ': 'te', 'デ': 'de', 'ト': 'to', 'ド': 'do',
  'ナ': 'na', 'ニ': 'ni', 'ヌ': 'nu', 'ネ': 'ne', 'ノ': 'no',
  'ハ': 'ha', 'バ': 'ba', 'パ': 'pa', 'ヒ': 'hi', 'ビ': 'bi', 'ピ': 'pi',
  'フ': 'hu', 'ブ': 'bu', 'プ': 'pu', 'ヘ': 'he', 'ベ': 'be', 'ペ': 'pe',
  'ホ': 'ho', 'ボ': 'bo', 'ポ': 'po',
  'マ': 'ma', 'ミ': 'mi', 'ム': 'mu', 'メ': 'me', 'モ': 'mo',
  'ヤ': 'ya', 'ユ': 'yu', 'ヨ': 'yo',
  'ラ': 'ra', 'リ': 'ri', 'ル': 'ru', 'レ': 're', 'ロ': 'ro',
  'ワ': 'wa', 'ヲ': 'wo', 'ン': 'n'
};

/**
 * Convert Japanese characters to romanized equivalents
 */
function transliterateJapanese(text: string): string {
  return text.split('').map(char => transliterationMap[char] || char).join('');
}

/**
 * Convert task title to a Git branch-safe slug
 *
 * @param title - Task title to convert
 * @param maxLength - Maximum length of the resulting slug
 * @returns Git branch-safe slug
 */
export function slugify(title: string, maxLength = 30): string {
  if (!title || typeof title !== 'string') {
    return 'task';
  }

  let slug = title.trim();

  // Transliterate Japanese characters
  slug = transliterateJapanese(slug);

  // Convert to lowercase
  slug = slug.toLowerCase();

  // Replace spaces and common separators with hyphens
  slug = slug.replace(/[\s_+]+/g, '-');

  // Remove special characters, keeping only alphanumeric and hyphens
  slug = slug.replace(/[^a-z0-9-]/g, '');

  // Remove multiple consecutive hyphens
  slug = slug.replace(/-+/g, '-');

  // Remove leading/trailing hyphens
  slug = slug.replace(/^-+|-+$/g, '');

  // Ensure it doesn't start with a number or hyphen (Git branch requirements)
  if (/^[0-9-]/.test(slug)) {
    slug = 'task-' + slug;
  }

  // Truncate to max length if needed
  if (slug.length > maxLength) {
    slug = slug.substring(0, maxLength);
    // Remove trailing hyphen if truncation created one
    slug = slug.replace(/-+$/, '');
  }

  // Fallback to 'task' if slug is empty or too short
  if (slug.length < 2) {
    return 'task';
  }

  return slug;
}

/**
 * Generate a full branch name with task ID and slugified title
 *
 * @param taskId - Task ID
 * @param title - Task title
 * @returns Full branch name in format: feature/task-{id}-{slug}
 */
export function generateBranchName(taskId: number, title: string): string {
  const slug = slugify(title, 25); // Leave room for prefix and ID
  return `feature/task-${taskId}-${slug}`;
}

/**
 * Validate that a string is a valid Git branch name
 *
 * @param branchName - Branch name to validate
 * @returns true if valid, false otherwise
 */
export function isValidGitBranchName(branchName: string): boolean {
  if (!branchName || typeof branchName !== 'string') {
    return false;
  }

  // Basic Git branch name validation
  // - Cannot be empty
  // - Cannot start with a dot, dash, or slash
  // - Cannot end with a slash or dot
  // - Cannot contain certain characters
  // - Cannot contain consecutive dots
  // - Cannot be a single @

  if (branchName.length === 0) return false;
  if (branchName === '@') return false;
  if (/^[.\-/]/.test(branchName)) return false;
  if (/[/.]$/.test(branchName)) return false;
  if (/\.\./.test(branchName)) return false;
  if (/[@{~^:?*[\\\s]/.test(branchName)) return false;
  if (/\/{2,}/.test(branchName)) return false;

  return true;
}

/**
 * Sanitize branch name to make it Git-compatible
 *
 * @param branchName - Branch name to sanitize
 * @returns Sanitized branch name
 */
export function sanitizeBranchName(branchName: string): string {
  if (!branchName || typeof branchName !== 'string') {
    return 'feature/task';
  }

  let sanitized = branchName.trim();

  // Replace invalid characters with hyphens
  sanitized = sanitized.replace(/[@{~^:?*[\\\s]/g, '-');

  // Remove consecutive dots
  sanitized = sanitized.replace(/\.{2,}/g, '.');

  // Remove consecutive slashes
  sanitized = sanitized.replace(/\/{2,}/g, '/');

  // Remove consecutive hyphens
  sanitized = sanitized.replace(/-{2,}/g, '-');

  // Remove leading/trailing invalid characters
  sanitized = sanitized.replace(/^[.-/]+|[/.]+$/g, '');

  // Ensure it's not empty or invalid after sanitization
  if (!sanitized || sanitized === '-' || sanitized === '@' || !isValidGitBranchName(sanitized)) {
    return 'feature/task';
  }

  return sanitized;
}