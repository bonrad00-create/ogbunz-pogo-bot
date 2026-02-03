import 'dotenv/config';
import cron from 'node-cron';
import { Client, GatewayIntentBits, AttachmentBuilder } from 'discord.js';
import Parser from 'rss-parser';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

import { renderEventCard, renderRaidCard } from './render.js';
import { pickImageFromItem, inferBossName } from './utils.js';
import counters from './counters.json' assert { type: 'json' };

// Environment variables loaded from .env file. These control which channels the
// bot posts to and which RSS feeds it watches. See README for details on
// populating these values.
const {
  DISCORD_TOKEN,
  EVENTS_CHANNEL_ID,
  RAID_CHANNEL_ID,
  EVENTS_RSS_URL,
  RAID_RSS_URL,
  POLL_CRON = '*/10 * * * *', // default: every 10 minutes
  STATE_FILE = './state.json'
} = process.env;

// Basic sanity check for required configuration. Exiting early helps
// highlight misconfiguration when deploying to a new environment.
if (!DISCORD_TOKEN || !EVENTS_CHANNEL_ID || !RAID_CHANNEL_ID || !EVENTS_RSS_URL || !RAID_RSS_URL) {
  console.error('Missing required environment variables. Please set DISCORD_TOKEN, EVENTS_CHANNEL_ID, RAID_CHANNEL_ID, EVENTS_RSS_URL and RAID_RSS_URL.');
  process.exit(1);
}

// Configure RSS parser with support for common media and content fields. Without
// customFields the media:content tags used by GO Hub would be ignored.
const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['content:encoded', 'contentEncoded']
    ]
  }
});

/**
 * Persist state across runs so the bot does not repost the same article on
 * restart. State is a JSON file with a simple map of GUID -> ISO timestamp.
 */
async function loadState() {
  if (!existsSync(STATE_FILE)) return { seen: {} };
  try {
    const text = await readFile(STATE_FILE, 'utf8');
    return JSON.parse(text);
  } catch (err) {
    console.error('Failed to load state:', err);
    return { seen: {} };
  }
}

async function saveState(state) {
  const dir = path.dirname(STATE_FILE);
  if (dir && dir !== '.' && !existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
  await writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

/**
 * Poll a RSS feed and post new items to the specified channel. The type
 * determines whether to render events or raid cards.
 *
 * @param {Object} params
 * @param {string} params.feedUrl RSS feed URL
 * @param {string} params.channelId Discord channel ID
 * @param {string} params.type Either 'events' or 'raids'
 */
async function postNewItems({ feedUrl, channelId, type }) {
  const state = await loadState();
  const feed = await parser.parseURL(feedUrl);
  const items = (feed.items || []).slice(0, 10).reverse();

  const channel = await client.channels.fetch(channelId);
  if (!channel) throw new Error(`Could not fetch channel ${channelId}`);

  for (const item of items) {
    const id = item.guid || item.id || item.link || `${item.title}-${item.pubDate}`;
    if (!id || state.seen[id]) continue;

    const title = item.title?.trim() || '(untitled)';
    const link = item.link;
    const imageUrl = pickImageFromItem(item);
    const published = item.isoDate || item.pubDate || '';

    let buffer;
    if (type === 'events') {
      buffer = await renderEventCard({
        title,
        published,
        source: 'Pokémon GO Hub',
        imageUrl
      });
    } else {
      const boss = inferBossName(title);
      const entry = (boss && counters[boss.toLowerCase()]) || {};
      // Provide default values when mapping is missing. Attackers and tanks are
      // arrays of strings. CP range optional.
      const attackers = entry.attackers || [];
      const tanks = entry.tanks || [];
      const cp = entry.cp || '';
      buffer = await renderRaidCard({
        title,
        boss,
        published,
        source: 'Pokémon GO Hub',
        imageUrl,
        attackers,
        tanks,
        cp
      });
    }

    const filename = type === 'events' ? 'event-card.png' : 'raid-card.png';
    const attachment = new AttachmentBuilder(buffer, { name: filename });

    const content = link ? `${title}\n${link}` : title;
    await channel.send({ content, files: [attachment] });

    state.seen[id] = new Date().toISOString();
    await saveState(state);
  }
}

// Create the Discord client and schedule the poll loop. The bot uses
// application commands only for posting; no message intents needed here.
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  await safeTick();
  cron.schedule(POLL_CRON, safeTick);
});

async function safeTick() {
  try {
    await postNewItems({ feedUrl: EVENTS_RSS_URL, channelId: EVENTS_CHANNEL_ID, type: 'events' });
  } catch (err) {
    console.error('Error posting events:', err);
  }
  try {
    await postNewItems({ feedUrl: RAID_RSS_URL, channelId: RAID_CHANNEL_ID, type: 'raids' });
  } catch (err) {
    console.error('Error posting raids:', err);
  }
}

client.login(DISCORD_TOKEN);

const http = require("http");

const port = process.env.PORT || 8080;
http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("ok");
}).listen(port, () => console.log("health server listening on", port));
