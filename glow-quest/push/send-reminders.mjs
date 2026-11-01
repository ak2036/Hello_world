// Hero Quest – sends due reminders as Web Push notifications.
// Runs from .github/workflows/hero-quest-reminders.yml every ~15 minutes.
//
// Env:
//   PUSH_CONFIG        JSON copied from the app (🔔 → "Create push setup code")
//   VAPID_PUBLIC_KEY   VAPID key pair (npx web-push generate-vapid-keys)
//   VAPID_PRIVATE_KEY
//   VAPID_SUBJECT      optional, e.g. mailto:you@example.com
//   STATE_FILE         optional, where "already sent today" is remembered (default .push-state/state.json)
//   DRY_RUN=1          print what would be sent instead of sending
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ctx = { Intl, Date, Math, Number, String };
ctx.globalThis = ctx;
vm.runInNewContext(fs.readFileSync(path.join(here, '..', 'reminders-core.js'), 'utf8'), ctx);
const { due, localParts } = ctx.HeroReminders;

const GRACE_MIN = 90; // GitHub's scheduler can run late; still send if we're up to 90 min past the set time
const stateFile = process.env.STATE_FILE || '.push-state/state.json';
const dry = process.env.DRY_RUN === '1';

if (!process.env.PUSH_CONFIG) { console.log('PUSH_CONFIG is not set – nothing to do.'); process.exit(0); }
const cfg = JSON.parse(process.env.PUSH_CONFIG);
let saved = { lastFired: {} };
try { saved = JSON.parse(fs.readFileSync(stateFile, 'utf8')); } catch { /* first run */ }

const parts = localParts(new Date(), cfg.tz);
const list = due({ ...cfg, lastFired: saved.lastFired || {}, done: {} }, parts, GRACE_MIN);
console.log(`[${cfg.tz}] ${parts.key} ${String(Math.floor(parts.mins / 60)).padStart(2, '0')}:${String(parts.mins % 60).padStart(2, '0')} – ${list.length} reminder(s) due`);

let webpush = null;
if (list.length && !dry) {
  webpush = (await import('web-push')).default;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:hero-quest@example.com', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
}
let failed = false;
for (const n of list) {
  if (dry) { console.log('DRY RUN would send:', JSON.stringify(n)); }
  else {
    try {
      await webpush.sendNotification(cfg.subscription, JSON.stringify(n), { TTL: 3600, urgency: 'high' });
      console.log('sent:', n.title);
    } catch (err) {
      failed = true;
      console.error(`failed: ${n.title} → ${err.statusCode || ''} ${err.body || err.message}`);
      if (err.statusCode === 404 || err.statusCode === 410) console.error('The subscription has expired. Open the app → 🔔 → "Create push setup code" and update the PUSH_CONFIG secret.');
      continue;
    }
  }
  saved.lastFired = { ...(saved.lastFired || {}), [n.id]: parts.key };
}
fs.mkdirSync(path.dirname(stateFile), { recursive: true });
fs.writeFileSync(stateFile, JSON.stringify(saved));
if (failed) process.exitCode = 1;
