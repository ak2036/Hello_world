# Hello_world
Setting up git

## ⚡ Ankitha's Hero Quest

An Avengers-inspired, game-style tracker (dark HQ look, red & gold, hero ranks) in [`glow-quest/index.html`](glow-quest/index.html) — one self-contained file, no install.

- **🌙 Cycle** – log flow, mood & symptoms; predicts next period, fertile window and ovulation from past cycles.
- **💪 Sugar cut** – daily sugar-free check-in, streaks, a 30-day "Gauntlet" and a calendar.
- **💤 Sleep** – bedtime/wake time + energy rating, 7-night chart and good-sleep streaks.
- **🎬 Movies** – watch list, mark watched, rate with stars, and a "spin for tonight's mission" picker.
- **🎬 Story mode** – a comic-style intro on first launch (replay from ⚙️): the villain *Sugaros, the Snack Titan* threatens Earth and Nick Fury recruits Ankitha.
- **🦸 Avengers** – each tab has a mentor (Nick Fury, Doctor Strange, Hulk, Captain America, Spider-Man, Thor); every level-up recruits a new Avenger to her team, and XP drains Sugaros' boss HP bar. Character art is original emblem-style SVG fan art.
- **🔔 Reminders** – customisable push notifications from her Avengers (time, days, message, sender hero; sugar, sleep, cycle, period heads-up, bedtime, movie night, custom). Optional always-on push via GitHub Actions: see [`glow-quest/push/README.md`](glow-quest/push/README.md).
- **📄 Monthly report** – on the last day of each month (8 pm) Nick Fury sends a notification; tapping it builds a one-page PDF debrief on her phone (sugar calendar, sleep chart, cycle summary, movies, badges, new teammates) to open, save or share. Past months are under Badges → Mission Reports. Her data never leaves the phone.
- **🎮 Game layer** – XP, hero ranks (Rookie Recruit → Earth's Mightiest Hero), an evolving hero avatar, daily missions, a Mission Complete bonus and 15 hero badges.

**Use it:** turn on GitHub Pages and open `…/glow-quest/` on her phone → "Add to Home Screen" (needed for notifications, especially on iPhone). Opening `index.html` directly also works, with in-app reminders only.
Data is stored only in that browser (localStorage) — use ⚙️ → Export/Import for backups.
Predictions are estimates, not medical or contraception advice.
