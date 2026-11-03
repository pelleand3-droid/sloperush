# BREAKWAVE

BREAKWAVE is a colorful paddle-and-ball arcade game. Keep the ball in play,
break through each block wall, and catch falling power-ups. The public game is
published at https://pelleand3-droid.github.io/sloperush/.

## How to play

Move the paddle with the **left and right arrow keys**, **A / D**, or your
mouse. Press **Space** or click the playfield to launch a ball. Catch falling
**↔** power-ups to widen your paddle and **+** power-ups to earn an extra ball.
Use **Shift** or **Pulse** for a temporary wide-paddle boost. Clear a wall to
advance to the next round; each round adds tougher blocks.

On touch screens, hold the on-screen arrows to move, then tap **Launch** to
serve and **Pulse** for the special ability. The game keeps existing online
accounts, personal bests, leaderboards, daily challenges, and XP rewards.

## XP and music

Breaking blocks, catching power-ups, completing challenges, and reaching each
1,000-point score milestone award XP. XP and unlocked paddle colors are stored
on each player's device. Use the music icon in the top bar to toggle the
synthesized soundtrack; playback begins after the first player interaction.

## Publishing updates

The GitHub Pages workflow deploys the game files whenever changes are pushed to
the `main` branch. The Windows launcher downloads the latest files into a local
game folder when it starts, then opens that local copy in an Edge app window.
Players need an internet connection to get updates. If an update cannot be
downloaded, the launcher starts the last saved version when one is available.

The workflow publishes only `index.html`, `game.js`, `style.css`, and
`supabase-config.js`. Never put a Supabase service-role key or other secret in
these public game files.

The launcher checks the latest GitHub release at startup and replaces its own
executable when a newer `SlopeRush.exe` is available. It verifies the download
against GitHub's SHA-256 asset digest before installing it. Game-file updates
continue to come from GitHub Pages, so normal game changes do not need a new
launcher release.

Game startup requires the `v1.0.4` launcher. Older launchers and direct browser
visits show a mandatory update message with a download link instead of starting
the game. Users with an older launcher must download `v1.0.4` once. After that,
launcher and game-file updates are installed automatically on the next start,
provided the launcher is in a folder the user can write to and an internet
connection is available.

The leaderboard includes Last hour (rolling 60-minute window), Daily (midnight
UTC reset), and All time tabs. After updating an existing Supabase project, run
`SUPABASE-DAILY-LEADERBOARD.sql` once in its SQL Editor to enable the recent
boards.
