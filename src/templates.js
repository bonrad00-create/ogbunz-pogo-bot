// Utility functions for HTML templates. These are kept simple to avoid pulling
// in additional libraries for templating. See buildEventHTML and buildRaidHTML
// for usage.

function esc(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Format a timestamp into a human-readable date. If no date is provided
// returns an empty string.
function niceDate(date) {
  if (!date) return '';
  const dt = new Date(date);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

// Compose background image style. If no image is available return empty so the
// gradient background alone is visible.
function bgStyle(imageUrl) {
  if (!imageUrl) return '';
  return `background-image: linear-gradient(180deg, rgba(22,0,40,.15), rgba(10,0,20,.82)), url('${esc(imageUrl)}');`;
}

// Common base CSS for both cards. Defines fonts, sizing, gradients and basic
// panel styling.
const baseCSS = `
  html, body {
    margin: 0;
    background: #0b0612;
    font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
  }
  .card {
    width: 1200px;
    height: 675px;
    border-radius: 28px;
    overflow: hidden;
    position: relative;
    color: #fff;
    background: radial-gradient(circle at 20% 10%, #5a1aa8 0%, #240a4d 40%, #0b0612 100%);
  }
  .bg {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    filter: saturate(1.05);
  }
  .overlay {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 30% 20%, rgba(255,255,255,.08), transparent 45%);
  }
  .topbar {
    position: absolute;
    top: 34px;
    left: 42px;
    right: 42px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .brand {
    display: inline-flex;
    gap: 10px;
    align-items: center;
    font-weight: 800;
    letter-spacing: .4px;
  }
  .pill {
    border: 1px solid rgba(255,255,255,.18);
    background: rgba(0,0,0,.28);
    padding: 10px 14px;
    border-radius: 999px;
    font-size: 14px;
    color: rgba(255,255,255,.9);
    text-transform: uppercase;
    letter-spacing: .5px;
  }
  .content {
    position: absolute;
    left: 42px;
    right: 42px;
    bottom: 42px;
  }
  .title {
    font-size: 64px;
    line-height: 1.02;
    font-weight: 900;
    margin: 0 0 14px 0;
    text-shadow: 0 12px 30px rgba(0,0,0,.55);
  }
  .metaRow {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }
  .tag {
    font-weight: 800;
    padding: 10px 14px;
    border-radius: 14px;
    background: rgba(255,255,255,.10);
    border: 1px solid rgba(255,255,255,.16);
    font-size: 14px;
    letter-spacing: .5px;
    text-transform: uppercase;
  }
  .sub {
    font-size: 18px;
    opacity: .92;
  }
  .divider {
    height: 1px;
    margin: 18px 0;
    background: linear-gradient(90deg, rgba(255,255,255,.0), rgba(255,255,255,.22), rgba(255,255,255,.0));
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-top: 16px;
  }
  .panel {
    background: rgba(0,0,0,.30);
    border: 1px solid rgba(255,255,255,.14);
    border-radius: 20px;
    padding: 18px;
    min-height: 92px;
  }
  .panelTitle {
    font-size: 14px;
    font-weight: 900;
    letter-spacing: .6px;
    opacity: .85;
    margin-bottom: 10px;
    text-transform: uppercase;
  }
  .bullet {
    font-size: 18px;
    font-weight: 800;
    opacity: .95;
    margin: 6px 0;
  }
`;

/**
 * Build HTML for an event card. Includes title, source, date and two panels of
 * guidance. This card is generic and can be used for any post in the events
 * feed.
 */
export function buildEventHTML({ title, published, source, imageUrl }) {
  const date = niceDate(published);
  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>${baseCSS}</style>
</head>
<body>
  <div class="card">
    <div class="bg" style="${bgStyle(imageUrl)}"></div>
    <div class="overlay"></div>

    <div class="topbar">
      <div class="brand">
        <div style="width:14px;height:14px;border-radius:4px;background:#ff4fd8;box-shadow:0 0 0 6px rgba(255,79,216,.15);"></div>
        OG BUNZ • POKÉMON GO
      </div>
      <div class="pill">Events</div>
    </div>

    <div class="content">
      <h1 class="title">${esc(title)}</h1>

      <div class="metaRow">
        <div class="tag">${esc(source || 'Source')}</div>
        ${date ? `<div class="sub">📅 ${esc(date)}</div>` : `<div class="sub">📅 New update</div>`}
      </div>

      <div class="divider"></div>

      <div class="grid">
        <div class="panel">
          <div class="panelTitle">What to do</div>
          <div class="bullet">• Check the post details</div>
          <div class="bullet">• Coordinate in chat</div>
        </div>
        <div class="panel">
          <div class="panelTitle">Reminder</div>
          <div class="bullet">• Times may vary by timezone</div>
          <div class="bullet">• Watch for updates</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Build HTML for a raid card. Includes boss name, top attackers and tanks, cp
 * range, and a small reference to the original article. If no boss name
 * inferred, displays the provided title instead.
 */
export function buildRaidHTML({ title, boss, published, source, imageUrl, attackers = [], tanks = [], cp = '' }) {
  const date = niceDate(published);
  const displayTitle = boss || title;
  // Build attackers and tanks lists into bullet HTML. Only show if array has entries.
  const attackerList = attackers.slice(0, 4).map(a => `• ${esc(a)}`).join('<br>') || '• See full guide';
  const tankList = tanks.slice(0, 4).map(t => `• ${esc(t)}`).join('<br>') || '• See full guide';
  const cpLine = cp ? `<div class="sub" style="margin-top:6px;">100% IV CP: ${esc(cp)}</div>` : '';
  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>${baseCSS}</style>
</head>
<body>
  <div class="card">
    <div class="bg" style="${bgStyle(imageUrl)}"></div>
    <div class="overlay"></div>

    <div class="topbar">
      <div class="brand">
        <div style="width:14px;height:14px;border-radius:4px;background:#35d6ff;box-shadow:0 0 0 6px rgba(53,214,255,.15);"></div>
        OG BUNZ • POKÉMON GO
      </div>
      <div class="pill">Raid Counters</div>
    </div>

    <div class="content">
      <h1 class="title">${esc(displayTitle)}</h1>
      <div class="metaRow">
        <div class="tag">${esc(source || 'Source')}</div>
        ${date ? `<div class="sub">🗓 ${esc(date)}</div>` : `<div class="sub">🗓 Updated</div>`}
      </div>
      ${cpLine}
      <div class="divider"></div>
      <div class="grid">
        <div class="panel">
          <div class="panelTitle">Top Attackers</div>
          <div class="bullet">${attackerList}</div>
        </div>
        <div class="panel">
          <div class="panelTitle">Top Tanks</div>
          <div class="bullet">${tankList}</div>
        </div>
      </div>
      <div class="divider"></div>
      <div class="sub" style="opacity:.85;">${esc(title)}</div>
    </div>
  </div>
</body>
</html>
`;
}