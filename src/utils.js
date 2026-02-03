/**
 * Extract a usable image URL from a RSS item. Many feeds expose media
 * information via different fields; this helper tries a few common ones
 * including media:content, media:thumbnail and images embedded in the HTML
 * content itself.
 *
 * @param {Object} item RSS item parsed by rss-parser
 * @returns {string|null} URL of the first discovered image or null if none
 */
export function pickImageFromItem(item) {
  // Try <media:content>
  const mc = item?.mediaContent;
  if (Array.isArray(mc) && mc[0]?.$?.url) return mc[0].$?.url;
  // Try <media:thumbnail>
  const mt = item?.mediaThumbnail;
  if (Array.isArray(mt) && mt[0]?.$?.url) return mt[0].$?.url;
  // Search for <img src="..."> inside content or summary
  const html = item?.contentEncoded || item?.content || item?.summary || '';
  const match = String(html).match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match?.[1]) return match[1];
  return null;
}

/**
 * Attempt to infer a raid boss name from a post title. Removes common suffixes
 * like "Raid Guide" or "Raid Counters Guide". If the remaining string is
 * longer than 30 characters assume it is not a simple boss name and return
 * null.
 *
 * @param {string} title The post title
 * @returns {string|null} Normalised boss name or null
 */
export function inferBossName(title) {
  if (!title) return null;
  let t = title;
  // Remove Pokémon GO prefix if present
  t = t.replace(/(?:Pokémon\s*GO\s*)?/i, '');
  // Remove common raid guide suffixes
  t = t.replace(/Raid Counters Guide/i, '')
       .replace(/Raid Guide/i, '')
       .replace(/Counters Guide/i, '')
       .replace(/Guide/i, '');
  t = t.trim();
  // If too long, don't treat it as a simple boss name
  if (!t || t.length > 30) return null;
  return t;
}