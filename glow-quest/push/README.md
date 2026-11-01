# 📡 Hero Quest: alerts when the app is closed

Hero Quest's built-in reminders work while the app is open or in the background.
Phones pause web apps that are fully closed, so for alerts that **always** arrive,
this folder has a small sender that runs on GitHub Actions every 15 minutes.
Actions minutes are free for public repos.

Expect alerts within about 15–30 minutes of the set time. GitHub's scheduler
isn't to-the-minute.

## One-time setup (about 10 minutes)

1. **Host the app over HTTPS.** Turn on GitHub Pages: repo → Settings → Pages →
   deploy from your branch. Then open `https://<user>.github.io/<repo>/glow-quest/`.
   - **iPhone (iOS 16.4+):** Share → *Add to Home Screen*, then open Hero Quest from the home screen.
     iPhones only allow web push for apps added to the home screen.
   - **Android:** Chrome menu → *Install app* (optional but recommended).
2. **Make a VAPID key pair** on any computer with Node.js:
   ```sh
   npx web-push generate-vapid-keys
   ```
3. **Add repository secrets** (repo → Settings → Secrets and variables → Actions → *Secrets*):
   - `VAPID_PUBLIC_KEY`: the public key
   - `VAPID_PRIVATE_KEY`: the private key (keep this one secret!)
   - `VAPID_SUBJECT` (optional): `mailto:your@email`
4. **On her phone**, open Hero Quest → 🔔 → *Alerts when the app is fully closed* →
   paste the **public** key → **Create push setup code**. The code is copied to the clipboard.
5. Add that code as another secret named **`PUSH_CONFIG`**.
6. Add a repository **variable** (same page → *Variables* tab): `HERO_PUSH_ENABLED` = `true`.
7. Test it: Actions tab → *Hero Quest reminders* → *Run workflow*.

## Good to know

- **After changing reminders** in the app (times, messages, days), tap *Create push setup code*
  again and update the `PUSH_CONFIG` secret. The sender only knows what that secret says.
- **Monthly report:** on the last day of each month the sender pushes the "Mission Report is ready" alert. Tapping it opens the app, which builds the PDF on the phone (her data is never uploaded). If your `PUSH_CONFIG` was created before this feature existed, create it again so it includes the report reminder.
- The sender can't see her logs, so "skip if already logged" only applies to in-app alerts.
  Server alerts always arrive.
- The "period incoming" alert uses the prediction saved in the code. It rolls forward by the average cycle,
  but refreshing the code once in a while keeps it accurate.
- GitHub pauses scheduled workflows after 60 days with no commits. Re-enable it from the Actions tab if that happens.
- To turn it off, set `HERO_PUSH_ENABLED` to `false` (or delete it).
- Try it locally without sending anything:
  `DRY_RUN=1 PUSH_CONFIG='<code>' node glow-quest/push/send-reminders.mjs`
