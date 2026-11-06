# Slope Rush Arcade

The original Slope Rush endless runner is restored as the main web game at
https://pelleand3-droid.github.io/sloperush/. The Windows launcher is also a
small game library: choose a game, download or update it, and launch it from
its own installed folder.

## Original Slope Rush controls

Use **Left / Right** or **A / D** to switch lanes, **Up** or **W** to jump, and
**Down** or **S** to crouch. On touch screens, use the on-screen controls.
Avoid hazards and try to beat your best score.

## Adding games to the launcher

The launcher reads its list from `games.json`. Each entry has a unique ID, a
display name, a short description, a `baseUrl`, and a list of relative files.
The files must include `index.html`; each game is downloaded into its own
folder under `%LOCALAPPDATA%\SlopeRush\games`.

To add a game:

1. Put its static web files in a folder under `games/` (for example,
   `games/my-game/`).
2. Add a catalog entry with that folder's published URL and every required
   file path.
3. Add the folder and `games.json` to the Pages deployment, then publish the
   site. The current workflow already deploys the complete `games/` folder.

The launcher includes **STARFIGHTER**, a self-contained space shooter in
`games/starfighter/`, and **ONLY UP**, a 3D climbing game in `games/only-up/`,
alongside the original Slope Rush and BREAKWAVE. ONLY UP has a circular
obstacle route, jumping, midair mantling, sprint stamina, and a smooth
third-person camera that follows behind the player. A/D movement is swapped;
arrows are unchanged. Move the mouse over the game to look around. Its Three.js
dependency is bundled locally for offline play, and its license is included
in the game files. Prop tops, support slabs, and the mantle runway all have
matching collision surfaces.

The launcher only downloads games hosted under this project's HTTPS GitHub
Pages address. Keep game files self-contained or list every required asset in
the catalog. The catalog is cached locally so previously listed games remain
visible while offline; installing or updating still requires an internet
connection.

## Publishing

GitHub Pages deploys the main game, `games.json`, and every game folder when
changes are pushed to `main`. Never put a Supabase service-role key or other
secret in public game files.

The launcher checks the latest GitHub release for `SlopeRush.exe` at startup.
The launcher code is currently version `1.0.5`; publish it as a new release
with the updated executable so existing launcher users receive the game
library. Normal game updates do not need a new launcher release.
