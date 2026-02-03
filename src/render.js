import { chromium } from 'playwright';
import { buildEventHTML, buildRaidHTML } from './templates.js';

/**
 * Render an event card as a PNG. This wraps the generic HTML renderer with
 * specific card layouts for events.
 *
 * @param {Object} data Event data for the template
 * @returns {Promise<Buffer>} PNG buffer
 */
export async function renderEventCard(data) {
  return renderHTMLToPNG(buildEventHTML(data));
}

/**
 * Render a raid card as a PNG. Raid cards include counters and CP range.
 *
 * @param {Object} data Raid data for the template
 * @returns {Promise<Buffer>} PNG buffer
 */
export async function renderRaidCard(data) {
  return renderHTMLToPNG(buildRaidHTML(data));
}

/**
 * Given an HTML string, launch a headless browser and capture a screenshot of
 * the rendered content. The viewport size defines the card dimensions.
 *
 * @param {string} html HTML markup for the card
 * @returns {Promise<Buffer>} PNG buffer
 */
async function renderHTMLToPNG(html) {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 675 } });
    await page.setContent(html, { waitUntil: 'load' });
    // Give remote images a moment to load before capturing the screenshot
    await page.waitForTimeout(300);
    const buffer = await page.screenshot({ type: 'png' });
    return buffer;
  } finally {
    await browser.close();
  }
}