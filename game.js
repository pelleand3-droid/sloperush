const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const overlayEl = document.getElementById('overlay');
const extraXpPopupEl = document.getElementById('extraXpPopup');
const accountBar = document.getElementById('accountBar');
const accountNameEl = document.getElementById('accountName');
const signOutButton = document.getElementById('signOutButton');
const leftButton = document.getElementById('leftButton');
const rightButton = document.getElementById('rightButton');
const jumpButton = document.getElementById('jumpButton');
const crouchButton = document.getElementById('crouchButton');
const boostButton = document.getElementById('boostButton');
const shardsEl = document.getElementById('shards');
const boostStatusEl = document.getElementById('boostStatus');
const worldLabelEl = document.getElementById('worldLabel');
const musicToggleButton = document.getElementById('musicToggle');
const launcherUpdateRequired = window.location.hash !== '#launcher=1.0.4';
const LATEST_LAUNCHER_URL = 'https://github.com/pelleand3-droid/sloperush/releases/download/v1.0.4/SlopeRush.exe';

const LANES = [-1, 0, 1];
const ACTION_DURATION = 0.9;
const MAP_CHANGE_SCORE = 500;
const SESSION_KEY = 'slope-rush-cloud-session';
const CHALLENGE_STORAGE_KEY = 'slope-rush-challenges-';
const CHALLENGE_XP_RESET_VERSION = 1;
const CHALLENGE_LEVEL_XP = 300;
const OBSTACLE_CLEAR_XP = 10;
const SCORE_XP_MILESTONE = 1000;
const SCORE_MILESTONE_XP = 100;
let leaderboardRequestId = 0;
const MUSIC_CHORDS = [
  [220, 261.63, 329.63, 392],
  [174.61, 220, 261.63, 349.23],
  [130.81, 164.81, 196, 261.63],
  [196, 246.94, 293.66, 392],
];
let musicEnabled = true;
let musicContext = null;
let musicGain = null;
let musicTimer = null;
let musicStep = 0;
let nextMusicNoteTime = 0;
const CHALLENGE_GROUPS = [
  [
    { id: 'score-250', title: 'Score 250 this run', metric: 'runScore', target: 250, unit: 'pts' },
    { id: 'score-400', title: 'Score 400 this run', metric: 'runScore', target: 400, unit: 'pts' },
    { id: 'score-600', title: 'Score 600 this run', metric: 'runScore', target: 600, unit: 'pts' },
  ],
  [
    { id: 'survive-20', title: 'Survive 20 sec', metric: 'runTime', target: 20, unit: 'sec' },
    { id: 'survive-35', title: 'Survive 35 sec', metric: 'runTime', target: 35, unit: 'sec' },
    { id: 'survive-50', title: 'Survive 50 sec', metric: 'runTime', target: 50, unit: 'sec' },
  ],
  [
    { id: 'fragments-5', title: 'Collect 5 fragments', metric: 'clears', target: 5, unit: 'fragments' },
    { id: 'fragments-10', title: 'Collect 10 fragments', metric: 'clears', target: 10, unit: 'fragments' },
    { id: 'fragments-15', title: 'Collect 15 fragments', metric: 'clears', target: 15, unit: 'fragments' },
  ],
  [
    { id: 'burst-4', title: 'Burst 4 times', metric: 'jumpClears', target: 4, unit: 'bursts' },
    { id: 'burst-7', title: 'Burst 7 times', metric: 'jumpClears', target: 7, unit: 'bursts' },
    { id: 'burst-10', title: 'Burst 10 times', metric: 'jumpClears', target: 10, unit: 'bursts' },
  ],
  [
    { id: 'close-call-3', title: 'Pass close to 3 hazards', metric: 'crouchClears', target: 3, unit: 'close calls' },
    { id: 'close-call-5', title: 'Pass close to 5 hazards', metric: 'crouchClears', target: 5, unit: 'close calls' },
    { id: 'close-call-8', title: 'Pass close to 8 hazards', metric: 'crouchClears', target: 8, unit: 'close calls' },
  ],
];
const RUNNER_SKINS = [
  { name: 'Neon Cyan', suit: '#27c9ed', glow: '#52edff', legs: '#17315c', trim: '#f5f8ff', hair: '#18233d' },
  { name: 'Laser Lime', suit: '#83ed4a', glow: '#c1ff6a', legs: '#245234', trim: '#f1ffd8', hair: '#16341f' },
  { name: 'Hot Magenta', suit: '#ed4fb5', glow: '#ff78da', legs: '#57254d', trim: '#ffe1f5', hair: '#35152d' },
  { name: 'Solar Gold', suit: '#ffb52e', glow: '#ffe36b', legs: '#654324', trim: '#fff2c7', hair: '#3c2712' },
  { name: 'Frostbite', suit: '#83d8ff', glow: '#c1f3ff', legs: '#31516f', trim: '#ffffff', hair: '#1b3046' },
  { name: 'Lava Red', suit: '#f34c45', glow: '#ff9a54', legs: '#5d2730', trim: '#ffe0c7', hair: '#38191f' },
  { name: 'Violet Vortex', suit: '#9a6bff', glow: '#d1a5ff', legs: '#3b2d6c', trim: '#f0e4ff', hair: '#21183f' },
  { name: 'Toxic Green', suit: '#37d69b', glow: '#72ffd0', legs: '#215b52', trim: '#d8fff0', hair: '#143a35' },
  { name: 'Ocean Blue', suit: '#3979ff', glow: '#75b9ff', legs: '#263c78', trim: '#deebff', hair: '#192447' },
  { name: 'Candy Pop', suit: '#ff6683', glow: '#ffabc5', legs: '#67334e', trim: '#fff0f4', hair: '#3e1e2e' },
];
const MAPS = [
  {
    id: 'classic',
    scenery: 'classic',
    sky: ['#172e63', '#0a1531', '#030711'],
    road: ['#17284a', '#1b3057'],
    edge: 'rgba(100, 220, 255, 0.75)',
    lane: 'rgba(150, 190, 255, 0.23)',
    glow: 'rgba(53, 110, 255, 0.3)',
  },
  {
    id: 'neon-city',
    scenery: 'city',
    sky: ['#20144b', '#11152f', '#080b1b'],
    road: ['#20264c', '#2a315e'],
    edge: '#ff54d8',
    lane: 'rgba(94, 231, 255, 0.3)',
    glow: 'rgba(255, 65, 213, 0.28)',
  },
  {
    id: 'frozen-mountain',
    scenery: 'mountain',
    sky: ['#a8e7ff', '#568bb4', '#16334f'],
    road: ['#577b91', '#668da3'],
    edge: '#bcf4ff',
    lane: 'rgba(222, 250, 255, 0.42)',
    glow: 'rgba(176, 236, 255, 0.4)',
  },
  {
    id: 'desert-canyon',
    scenery: 'desert',
    sky: ['#ffbd70', '#e87555', '#542b48'],
    road: ['#65404b', '#80505a'],
    edge: '#ffc16e',
    lane: 'rgba(255, 220, 166, 0.38)',
    glow: 'rgba(255, 176, 91, 0.42)',
  },
  {
    id: 'sky-bridge',
    scenery: 'bridge',
    sky: ['#78c9ee', '#416c9b', '#182844'],
    road: ['#354961', '#425971'],
    edge: '#ffd36e',
    lane: 'rgba(226, 238, 255, 0.38)',
    glow: 'rgba(255, 211, 110, 0.35)',
  },
  {
    id: 'space',
    scenery: 'space',
    sky: ['#101746', '#090d28', '#030611'],
    road: ['#171c40', '#222b58'],
    edge: '#8b76ff',
    lane: 'rgba(151, 155, 255, 0.32)',
    glow: 'rgba(102, 91, 255, 0.4)',
  },
];
const config = window.SLOPE_RUSH_SUPABASE || {};
const state = {
  started: false,
  score: 0,
  best: 0,
  username: null,
  userId: null,
  country: null,
  session: null,
  authMode: 'login',
  speed: 0.4,
  lane: 0,
  lastTimestamp: 0,
  spawnTimer: 0,
  elapsed: 0,
  jumpTimer: 0,
  crouchTimer: 0,
  runTime: 0,
  challengeData: null,
  levelUpMessage: '',
  challengeMessage: '',
  extraXpMessageId: 0,
  nextScoreXpMilestone: SCORE_XP_MILESTONE,
  currentMapIndex: 0,
  nextMapScore: MAP_CHANGE_SCORE,
};
const obstacles = [];
const challengeTrackerEl = document.getElementById('challengeTracker');
const stars = Array.from({ length: 70 }, () => ({
  x: Math.random(),
  y: Math.random(),
  size: Math.random() * 2 + 1,
  alpha: Math.random() * 0.7 + 0.2,
}));

function supabaseUrl() {
  return typeof config.url === 'string' ? config.url.replace(/\/+$/, '') : '';
}

function isConfigured() {
  return /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(supabaseUrl())
    && typeof config.anonKey === 'string'
    && config.anonKey.length > 20
    && !config.anonKey.includes('YOUR_');
}

function showAuth(mode = 'login', message = '') {
  state.authMode = mode;
  const registering = mode === 'register';
  const setupNotice = isConfigured()
    ? ''
    : '<p class="setup-notice">Online accounts are not connected yet. Follow <strong>SUPABASE-SETUP.md</strong>, then rebuild the game.</p>';
  overlayEl.innerHTML = `
    <form id="authForm" class="auth-card">
      <p class="eyebrow">Online player account</p>
      <h1>${registering ? 'Create account' : 'Sign in'}</h1>
      <p class="auth-description">Your display name, country, and scores appear on the public leaderboard. Passwords and email addresses do not.</p>
      ${registering ? `
        <label for="displayName">Display name</label>
        <input id="displayName" name="displayName" type="text" minlength="3" maxlength="20"
          pattern="[A-Za-z0-9_]+" autocomplete="nickname" required />
        <label for="country">Country code</label>
        <input id="country" name="country" type="text" minlength="2" maxlength="2"
          pattern="[A-Za-z]{2}" placeholder="US, GB, CA…" autocomplete="country" required />
      ` : ''}
      <label for="email">Email</label>
      <input id="email" name="email" type="email" maxlength="254" autocomplete="email" required />
      <label for="password">Password</label>
      <input id="password" name="password" type="password" minlength="8" maxlength="128"
        autocomplete="${registering ? 'new-password' : 'current-password'}" required />
      ${registering ? `
        <label for="confirmPassword">Confirm password</label>
        <input id="confirmPassword" name="confirmPassword" type="password" minlength="8" maxlength="128"
          autocomplete="new-password" required />
      ` : ''}
      <p id="authMessage" class="auth-message" role="alert"></p>
      <button class="start-button auth-submit" type="submit">${registering ? 'Create account' : 'Sign in'}</button>
      <button class="auth-switch" type="button" data-auth-mode="${registering ? 'login' : 'register'}">
        ${registering ? 'Already registered? Sign in' : 'New here? Create an account'}
      </button>
      <button class="auth-switch" type="button" data-show-leaderboard>View leaderboard</button>
      <p class="hint">Passwords are handled by Supabase Auth. Never share your password or project service-role key.</p>
      ${setupNotice}
    </form>
  `;
  overlayEl.classList.add('visible');
  overlayEl.querySelector('#authMessage').textContent = message;
  accountBar.hidden = true;
  const focusInput = overlayEl.querySelector(registering ? '#displayName' : '#email');
  if (focusInput) focusInput.focus();
}

function showWelcome() {
  document.activeElement.blur();
  overlayEl.innerHTML = `
    <div class="overlay-content welcome-screen">
      <p class="eyebrow">Three lanes. No brakes.</p>
      <h1>Slope Rush</h1>
      ${challengePanelMarkup()}
      <button class="start-button" type="button">Start run</button>
      <button class="auth-switch" type="button" data-show-leaderboard>View leaderboard</button>
    </div>
  `;
  overlayEl.scrollTop = 0;
  overlayEl.querySelector('.overlay-content').scrollTop = 0;
  overlayEl.classList.add('visible');
  accountNameEl.textContent = state.username;
  accountBar.hidden = false;
  renderChallengeTracker();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function countryName(code) {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code;
  } catch (error) {
    return code;
  }
}

function storeSession(session) {
  state.session = session;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  state.session = null;
  state.username = null;
  state.userId = null;
  state.country = null;
  localStorage.removeItem(SESSION_KEY);
}

async function refreshSession() {
  if (!state.session || !state.session.refresh_token) {
    throw new Error('Your online sign-in has expired. Please sign in again.');
  }
  const response = await fetch(`${supabaseUrl()}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { apikey: config.anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: state.session.refresh_token }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.msg || result.message || 'Your sign-in expired. Please sign in again.');
  storeSession(result);
}

async function apiRequest(path, options = {}, needsSession = false) {
  if (!isConfigured()) throw new Error('Online accounts are not configured. Follow SUPABASE-SETUP.md and rebuild the game.');
  if (needsSession && !state.session) throw new Error('Please sign in to continue.');
  if (needsSession && state.session.expires_at && state.session.expires_at * 1000 < Date.now() + 30000) {
    await refreshSession();
  }

  const headers = new Headers(options.headers || {});
  headers.set('apikey', config.anonKey);
  headers.set('Accept', 'application/json');
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (needsSession) headers.set('Authorization', `Bearer ${state.session.access_token}`);

  let response = await fetch(`${supabaseUrl()}${path}`, { ...options, headers });
  if (response.status === 401 && needsSession) {
    await refreshSession();
    headers.set('Authorization', `Bearer ${state.session.access_token}`);
    response = await fetch(`${supabaseUrl()}${path}`, { ...options, headers });
  }

  const text = await response.text();
  let result = null;
  if (text) {
    try {
      result = JSON.parse(text);
    } catch (error) {
      throw new Error('The account service returned an unreadable response.');
    }
  }
  if (!response.ok) {
    const message = result && (result.msg || result.message || result.error_description || result.error);
    throw new Error(message || `Account service request failed (${response.status}).`);
  }
  return result;
}

async function setAuthenticated(session) {
  if (!session || !session.access_token || !session.user || !session.user.id) {
    throw new Error('The account service did not return a valid sign-in session.');
  }
  storeSession(session);
  const profileRows = await apiRequest(
    `/rest/v1/profiles?id=eq.${encodeURIComponent(session.user.id)}&select=display_name,country`,
    {},
    true,
  );
  if (!Array.isArray(profileRows) || !profileRows[0]) {
    clearSession();
    throw new Error('Your profile was not found. Check that you ran the Supabase setup SQL.');
  }
  const profile = profileRows[0];
  state.userId = session.user.id;
  state.username = profile.display_name;
  state.country = profile.country;
  loadChallengeData();
  const bestRows = await apiRequest(
    `/rest/v1/scores?user_id=eq.${encodeURIComponent(state.userId)}&select=score&order=score.desc&limit=1`,
    {},
    true,
  );
  state.best = bestRows.length ? Number(bestRows[0].score) : 0;
  bestEl.textContent = String(state.best);
  showWelcome();
}

function authErrorMessage(error) {
  const message = error && error.message ? error.message : 'The account request failed.';
  if (/invalid login credentials/i.test(message)) return 'Email or password is incorrect.';
  if (/email not confirmed/i.test(message)) return 'Please verify your email, then sign in.';
  if (/email rate limit|over_email_send_rate_limit|rate limit exceeded/i.test(message)) {
    return 'Supabase has temporarily limited signup emails (its built-in sender allows about 2 per hour). Stop retrying and wait at least an hour; check your inbox and spam folder. If you already registered, verify that email, then use Sign in. To allow more signup emails, configure custom SMTP in Supabase Authentication settings.';
  }
  if (/user already registered/i.test(message)) return 'That email already has an account. Please sign in.';
  if (/duplicate key|profiles_display_name_key/i.test(message)) return 'That display name is already taken.';
  if (/failed to fetch|networkerror|load failed/i.test(message)) {
    return 'Could not reach Supabase. Check your internet connection and project URL.';
  }
  return message;
}

async function handleAuthSubmit(event) {
  if (event.target.id !== 'authForm') return;
  event.preventDefault();
  const form = event.target;
  const button = form.querySelector('.auth-submit');
  const messageEl = form.querySelector('#authMessage');
  button.disabled = true;
  messageEl.textContent = 'Connecting securely…';

  try {
    if (!isConfigured()) {
      throw new Error('Add your Supabase project URL and anon key to supabase-config.js, run SUPABASE-SETUP.sql, then rebuild.');
    }
    const email = form.elements.email.value.trim().toLowerCase();
    const password = form.elements.password.value;

    if (state.authMode === 'register') {
      const displayName = form.elements.displayName.value.trim();
      const country = form.elements.country.value.trim().toUpperCase();
      if (!/^[A-Za-z0-9_]{3,20}$/.test(displayName)) {
        throw new Error('Display name must be 3–20 characters using letters, numbers, or underscores.');
      }
      if (!/^[A-Z]{2}$/.test(country)) {
        throw new Error('Enter your two-letter country code, such as US, GB, or CA.');
      }
      if (password !== form.elements.confirmPassword.value) {
        throw new Error('The passwords do not match.');
      }
      const signup = await apiRequest('/auth/v1/signup', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          data: { display_name: displayName, country },
        }),
      });
      const signupUser = signup && (signup.user || (signup.id ? signup : null));
      const signupSession = signup && (signup.session || (signup.access_token ? signup : null));
      if (!signupUser) {
        throw new Error('Account service did not create an account. Please try again.');
      }
      if (Array.isArray(signupUser.identities) && signupUser.identities.length === 0) {
        throw new Error('That email already has an account. Please sign in instead.');
      }
      if (signupSession && signupSession.access_token) {
        await setAuthenticated({ ...signupSession, user: signupSession.user || signupUser });
      } else {
        showAuth('login', 'Account created. Check your email to verify it, then sign in.');
      }
      return;
    }

    const session = await apiRequest('/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await setAuthenticated(session);
  } catch (error) {
    if (messageEl.isConnected) {
      messageEl.textContent = authErrorMessage(error);
      button.disabled = false;
    } else {
      showAuth(state.authMode, authErrorMessage(error));
    }
  }
}

async function signOut() {
  state.started = false;
  obstacles.length = 0;
  let warning = '';
  if (state.session && isConfigured()) {
    try {
      await apiRequest('/auth/v1/logout', { method: 'POST' }, true);
    } catch (error) {
      warning = `Signed out on this device, but the online session could not be revoked: ${authErrorMessage(error)}`;
    }
  }
  clearSession();
  state.challengeData = null;
  state.levelUpMessage = '';
  renderChallengeTracker();
  state.best = 0;
  bestEl.textContent = '0';
  showAuth('login', warning);
}

async function showLeaderboard() {
  state.started = false;
  overlayEl.innerHTML = `
    <div class="leaderboard-card">
      <p class="eyebrow">STARWELL signal records</p>
      <h1>Leaderboard</h1>
      <div class="leaderboard-tabs" role="group" aria-label="Leaderboard period">
        <button class="leaderboard-tab" type="button" data-leaderboard-period="hourly" aria-pressed="false">Last hour</button>
        <button class="leaderboard-tab" type="button" data-leaderboard-period="daily" aria-pressed="false">Daily</button>
        <button class="leaderboard-tab active" type="button" data-leaderboard-period="all-time" aria-pressed="true">All time</button>
      </div>
      <p class="leaderboard-status">Loading scores…</p>
      <div class="leaderboard-table-wrap">
        <table class="leaderboard-table">
          <thead><tr><th>#</th><th>Player</th><th>Country</th><th>Score</th></tr></thead>
          <tbody></tbody>
        </table>
      </div>
      <button class="auth-switch" type="button" data-back>Back</button>
    </div>
  `;
  overlayEl.classList.add('visible');
  await loadLeaderboard('all-time', ++leaderboardRequestId);
}

async function loadLeaderboard(period, requestId) {
  const body = overlayEl.querySelector('.leaderboard-table tbody');
  const status = overlayEl.querySelector('.leaderboard-status');
  if (!body || !status) return;
  status.textContent = 'Loading scores…';
  body.innerHTML = '';

  try {
    const rows = await apiRequest(
      `/rest/v1/${period === 'hourly' ? 'hourly_leaderboard' : period === 'daily' ? 'daily_leaderboard' : 'leaderboard'}?select=display_name,country,score&order=score.desc&limit=10`,
    );
    if (requestId !== leaderboardRequestId || !overlayEl.querySelector('.leaderboard-card')) return;
    if (rows.length) {
      body.innerHTML = rows.map((row, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(row.display_name)}</td>
          <td>${escapeHtml(countryName(row.country))}</td>
          <td>${Math.floor(Number(row.score))}</td>
        </tr>
      `).join('');
      status.textContent = period === 'hourly'
        ? 'Best score per player in the last hour. Names and countries are public.'
        : period === 'daily'
          ? 'Best score per player today (UTC). Names and countries are public.'
          : 'Best score per player. Names and countries are public.';
    } else {
      status.textContent = period === 'hourly'
        ? 'No scores submitted in the last hour yet. Finish a run to be the first on this board!'
        : period === 'daily'
          ? 'No scores submitted today yet. Finish a run to be the first on the daily board!'
          : 'No scores yet. Finish a run to be the first on the board!';
    }
  } catch (error) {
    if (requestId === leaderboardRequestId && overlayEl.querySelector('.leaderboard-card')) {
      status.textContent = authErrorMessage(error);
    }
  }
}

function showRunComplete(score, status = '') {
  document.activeElement.blur();
  overlayEl.innerHTML = `
    <div class="overlay-content run-complete">
      <p class="eyebrow">Run over</p>
      <h1>CRASH!</h1>
      <p>You scored <strong>${score}</strong></p>
      ${challengePanelMarkup()}
      <p class="hint">${escapeHtml(status)}</p>
      <button class="start-button" type="button">Try again</button>
      <button class="auth-switch" type="button" data-show-leaderboard>View leaderboard</button>
      <p class="hint">Or press Space to restart</p>
    </div>
  `;
  overlayEl.scrollTop = 0;
  overlayEl.querySelector('.overlay-content').scrollTop = 0;
  overlayEl.classList.add('visible');
}

function showLauncherUpdateRequired() {
  overlayEl.innerHTML = `
    <section class="auth-card launcher-update-card">
      <p class="eyebrow">Launcher update required</p>
      <h1>Update to keep playing</h1>
      <p class="auth-description">STARWELL needs the Slope Rush v1.0.4 launcher to play. The updated launcher installs future game and launcher updates automatically.</p>
      <a class="start-button launcher-update-link" href="${LATEST_LAUNCHER_URL}">Download launcher v1.0.4</a>
      <p class="hint">After it finishes downloading, open SlopeRush.exe to start the game.</p>
    </section>
  `;
  document.querySelector('.touch-controls').hidden = true;
  musicToggleButton.hidden = true;
  overlayEl.classList.add('visible');
}

function localChallengeDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function dailyChallenges() {
  const [year, month, day] = localChallengeDate().split('-').map(Number);
  const dayNumber = Math.floor(Date.UTC(year, month - 1, day) / 86400000);
  const setIndex = dayNumber + state.challengeData.challengeSetIndex;
  return [0, 1, 2].map((offset) => {
    const groupIndex = (setIndex * 3 + offset) % CHALLENGE_GROUPS.length;
    const group = CHALLENGE_GROUPS[groupIndex];
    const variantIndex = setIndex % group.length;
    return group[variantIndex];
  });
}

function challengeStorageKey() {
  return `${CHALLENGE_STORAGE_KEY}${encodeURIComponent(state.userId)}`;
}

function playerLevel() {
  return Math.floor(state.challengeData.xp / CHALLENGE_LEVEL_XP) + 1;
}

function skinForLevel(level) {
  if (level <= RUNNER_SKINS.length) return RUNNER_SKINS[level - 1];
  const hue = Math.round(((level - RUNNER_SKINS.length - 1) * 137.508 + 28) % 360);
  return {
    name: `Prismatic ${level}`,
    suit: `hsl(${hue} 88% 58%)`,
    glow: `hsl(${hue} 100% 76%)`,
    legs: `hsl(${hue} 48% 26%)`,
    trim: '#f5f8ff',
    hair: '#18233d',
  };
}

function equippedSkin() {
  return skinForLevel(state.challengeData ? state.challengeData.equippedSkinLevel : 1);
}

function loadChallengeData() {
  const saved = JSON.parse(localStorage.getItem(challengeStorageKey()) || 'null');
  const resetXp = !saved || saved.xpResetVersion !== CHALLENGE_XP_RESET_VERSION;
  const date = localChallengeDate();
  const sameDay = saved && saved.date === date;
  const savedProgress = sameDay && saved.progress && typeof saved.progress === 'object'
    ? saved.progress
    : {};
  state.challengeData = {
    date,
    challengeSetIndex: sameDay && Number.isInteger(saved.challengeSetIndex) && saved.challengeSetIndex >= 0
      ? saved.challengeSetIndex
      : 0,
    progress: Object.fromEntries(Object.entries(savedProgress)
      .filter(([, value]) => Number.isFinite(value) && value >= 0)),
    completed: sameDay && Array.isArray(saved.completed) ? saved.completed : [],
    xp: !resetXp && Number.isFinite(saved.xp) && saved.xp >= 0 ? Math.floor(saved.xp) : 0,
    xpResetVersion: CHALLENGE_XP_RESET_VERSION,
    equippedSkinLevel: saved && Number.isInteger(saved.equippedSkinLevel) && saved.equippedSkinLevel > 0
      ? saved.equippedSkinLevel
      : 1,
  };
  state.challengeData.equippedSkinLevel = Math.min(state.challengeData.equippedSkinLevel, playerLevel());
  saveChallengeData();
}

function ensureChallengeDate() {
  const date = localChallengeDate();
  if (!state.challengeData || state.challengeData.date === date) return false;
  state.challengeData.date = date;
  state.challengeData.challengeSetIndex = 0;
  state.challengeData.progress = {};
  state.challengeData.completed = [];
  saveChallengeData();
  return true;
}

function saveChallengeData() {
  if (!state.challengeData || !state.userId) return;
  localStorage.setItem(challengeStorageKey(), JSON.stringify(state.challengeData));
}

function challengePanelMarkup() {
  if (!state.challengeData) return '';
  ensureChallengeDate();
  const challenges = dailyChallenges();
  const completedCount = challenges.filter((challenge) => state.challengeData.completed.includes(challenge.id)).length;
  const level = playerLevel();
  const levelProgress = state.challengeData.xp % CHALLENGE_LEVEL_XP;
  const skin = equippedSkin();
  const nextSkin = skinForLevel(level + 1);
  const items = challenges.map((challenge) => {
    const progress = Math.min(challenge.target, state.challengeData.progress[challenge.id] || 0);
    const complete = state.challengeData.completed.includes(challenge.id);
    return `
      <li class="challenge-item${complete ? ' complete' : ''}">
        <div class="challenge-item-heading">
          <span>${escapeHtml(challenge.title)}${complete ? ' · DONE' : ''}</span>
          <span>${progress}/${challenge.target} ${challenge.unit}</span>
        </div>
        <progress value="${progress}" max="${challenge.target}" aria-label="${escapeHtml(challenge.title)} progress"></progress>
      </li>
    `;
  }).join('');
  return `
    <section class="challenge-card" aria-label="Challenges">
      <div class="challenge-summary">
        <strong>Challenges</strong>
        <span>${completedCount}/3 complete</span>
      </div>
      <ul class="challenge-list">${items}</ul>
      <p class="challenge-xp">Level ${level} · ${levelProgress}/${CHALLENGE_LEVEL_XP} XP to next level</p>
      <details class="skin-reward">
        <summary>
          <span class="skin-summary-name"><span class="skin-swatch" style="--skin-color:${skin.suit};--skin-glow:${skin.glow}"></span> ${escapeHtml(skin.name)}</span>
          <span>Next: ${escapeHtml(nextSkin.name)} · Lv ${level + 1}</span>
        </summary>
        <div class="skin-equipped">
          <label for="skinSelect">Choose a ship color</label>
          <select id="skinSelect" aria-label="Choose an unlocked ship color">
            ${Array.from({ length: level }, (_, index) => {
              const skinLevel = index + 1;
              const unlocked = skinForLevel(skinLevel);
              return `<option value="${skinLevel}"${skinLevel === state.challengeData.equippedSkinLevel ? ' selected' : ''}>Lv ${skinLevel} · ${escapeHtml(unlocked.name)}</option>`;
            }).join('')}
          </select>
        </div>
      </details>
      ${state.challengeMessage ? `<p class="challenge-level-up">${escapeHtml(state.challengeMessage)}</p>` : ''}
      ${state.levelUpMessage ? `<p class="challenge-level-up">${escapeHtml(state.levelUpMessage)}</p>` : ''}
    </section>
  `;
}

function renderChallengeTracker() {
  if (!state.userId || !state.challengeData) {
    challengeTrackerEl.hidden = true;
    return;
  }
  ensureChallengeDate();
  const challenges = dailyChallenges();
  const completedCount = challenges.filter((challenge) => state.challengeData.completed.includes(challenge.id)).length;
  const level = playerLevel();
  const items = challenges.map((challenge) => {
    const progress = Math.min(challenge.target, state.challengeData.progress[challenge.id] || 0);
    return `<span class="challenge-tracker-item">${escapeHtml(challenge.title)} <b>${progress}/${challenge.target}</b></span>`;
  }).join('');
  challengeTrackerEl.innerHTML = `
    <div class="challenge-tracker-heading"><strong>Challenges ${completedCount}/3</strong><span>Level ${level}</span></div>
    ${items}
    ${state.challengeMessage ? `<strong class="challenge-level-up">${escapeHtml(state.challengeMessage)}</strong>` : ''}
    ${state.levelUpMessage ? `<strong class="challenge-level-up">${escapeHtml(state.levelUpMessage)}</strong>` : ''}
  `;
  challengeTrackerEl.hidden = false;
}

function updateLevelUpMessage(previousLevel) {
  const nextLevel = playerLevel();
  if (nextLevel <= previousLevel) return;
  const reward = skinForLevel(nextLevel);
  state.levelUpMessage = `Level ${nextLevel} unlocked: ${reward.name}!`;
  const message = state.levelUpMessage;
  window.setTimeout(() => {
    if (state.levelUpMessage !== message) return;
    state.levelUpMessage = '';
    renderChallengeTracker();
  }, 5000);
}

function awardExtraXp(amount) {
  const previousLevel = playerLevel();
  state.challengeData.xp += amount;
  const canvasRect = canvas.getBoundingClientRect();
  const shellRect = canvas.parentElement.getBoundingClientRect();
  const playerX = canvasRect.left + (lanePosition(state.lane, 0.08) / canvas.width) * canvasRect.width;
  const playerHeadY = canvasRect.top + ((canvas.height - 76 - 72) / canvas.height) * canvasRect.height;
  extraXpPopupEl.style.left = `${playerX - shellRect.left}px`;
  extraXpPopupEl.style.top = `${playerHeadY - shellRect.top}px`;
  extraXpPopupEl.textContent = `+${amount.toLocaleString()} XP`;
  extraXpPopupEl.hidden = false;
  extraXpPopupEl.classList.remove('visible');
  void extraXpPopupEl.offsetWidth;
  extraXpPopupEl.classList.add('visible');
  const messageId = ++state.extraXpMessageId;
  window.setTimeout(() => {
    if (state.extraXpMessageId !== messageId) return;
    extraXpPopupEl.classList.remove('visible');
    extraXpPopupEl.hidden = true;
  }, 2500);
  updateLevelUpMessage(previousLevel);
  saveChallengeData();
  renderChallengeTracker();
}

function updateChallengeMetric(metric, value, additive = false) {
  const dateChanged = ensureChallengeDate();
  const previousLevel = playerLevel();
  let changed = false;
  for (const challenge of dailyChallenges()) {
    if (challenge.metric !== metric) continue;
    const current = state.challengeData.progress[challenge.id] || 0;
    const next = Math.min(challenge.target, additive ? current + value : Math.max(current, value));
    if (next <= current) continue;
    state.challengeData.progress[challenge.id] = next;
    changed = true;
    if (next >= challenge.target && !state.challengeData.completed.includes(challenge.id)) {
      state.challengeData.completed.push(challenge.id);
      state.challengeData.xp += 10;
    }
  }
  const challenges = dailyChallenges();
  if (challenges.every((challenge) => state.challengeData.completed.includes(challenge.id))) {
    state.challengeData.challengeSetIndex += 1;
    state.challengeData.progress = {};
    state.challengeData.completed = [];
    state.challengeMessage = 'All challenges complete! New ones unlocked.';
    const message = state.challengeMessage;
    window.setTimeout(() => {
      if (state.challengeMessage !== message) return;
      state.challengeMessage = '';
      renderChallengeTracker();
    }, 5000);
  }
  if (!changed) {
    if (dateChanged) renderChallengeTracker();
    return;
  }
  updateLevelUpMessage(previousLevel);
  saveChallengeData();
  renderChallengeTracker();
}

function updateRunChallenges() {
  updateChallengeMetric('runScore', Math.floor(state.score));
  updateChallengeMetric('runTime', Math.floor(state.runTime));
}

function recordObstacleClear(action) {
  updateChallengeMetric('clears', 1, true);
  if (action === 'jump') updateChallengeMetric('jumpClears', 1, true);
  if (action === 'crouch') updateChallengeMetric('crouchClears', 1, true);
}

async function submitScore(score) {
  if (!state.userId) return;
  await apiRequest('/rest/v1/scores', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ user_id: state.userId, score }),
  }, true);
  if (score > state.best) {
    state.best = score;
    bestEl.textContent = String(score);
  }
}

function startGame() {
  if (!state.username || !state.session) {
    showAuth();
    return;
  }
  if (musicEnabled) startMusic();
  state.started = true;
  state.score = 0;
  state.speed = 0.45;
  state.lane = 0;
  state.elapsed = 0;
  state.spawnTimer = 0.6;
  state.jumpTimer = 0;
  state.crouchTimer = 0;
  state.runTime = 0;
  state.nextScoreXpMilestone = SCORE_XP_MILESTONE;
  state.currentMapIndex = 0;
  state.nextMapScore = MAP_CHANGE_SCORE;
  state.extraXpMessageId += 1;
  extraXpPopupEl.classList.remove('visible');
  extraXpPopupEl.hidden = true;
  obstacles.length = 0;
  scoreEl.textContent = '0';
  renderChallengeTracker();
  overlayEl.classList.remove('visible');
}

function endGame() {
  state.started = false;
  updateRunChallenges();
  const finalScore = Math.floor(state.score);
  showRunComplete(finalScore, 'Submitting score…');
  submitScore(finalScore).then(
    () => {
      if (!state.started) showRunComplete(finalScore, 'Score synced to the online leaderboard.');
    },
    (error) => {
      if (!state.started) showRunComplete(finalScore, `Score could not sync: ${authErrorMessage(error)}`);
    },
  );
}

function movePlayer(direction) {
  if (!state.started) return;
  state.lane = Math.max(-1, Math.min(1, state.lane + direction));
}

function jump() {
  if (!state.started || state.jumpTimer > 0) return;
  state.jumpTimer = ACTION_DURATION;
  state.crouchTimer = 0;
}

function crouch() {
  if (!state.started) return;
  state.crouchTimer = ACTION_DURATION;
  state.jumpTimer = 0;
}

function handleKeyDown(event) {
  if (event.target.closest('input, textarea, [contenteditable="true"]')) return;
  if (event.code === 'Space') {
    event.preventDefault();
    if (state.started) jump();
    else if (state.username) startGame();
    return;
  }
  if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(event.code)) {
    event.preventDefault();
    if (event.repeat) return;
    movePlayer(event.code === 'ArrowLeft' || event.code === 'KeyA' ? -1 : 1);
    return;
  }
  if (['ArrowUp', 'KeyW'].includes(event.code)) {
    event.preventDefault();
    if (!event.repeat) jump();
    return;
  }
  if (['ArrowDown', 'KeyS'].includes(event.code)) {
    event.preventDefault();
    if (!event.repeat) crouch();
  }
}

function spawnRow() {
  if (state.score > 750 && Math.random() < 0.22) {
    obstacles.push({
      lane: 0,
      z: 1,
      type: 'roadblock',
    });
    return;
  }

  const available = [...LANES];
  const blockedCount = Math.random() < Math.min(0.55, 0.38 + state.score * 0.00003) ? 2 : 1;
  const blocked = [];
  for (let i = 0; i < blockedCount; i += 1) {
    const index = Math.floor(Math.random() * available.length);
    blocked.push(available.splice(index, 1)[0]);
  }
  for (const lane of blocked) {
    const type = Math.random() < 0.25
      ? 'block'
      : ['spikes', 'gate', 'barrier'][Math.floor(Math.random() * 3)];
    obstacles.push({
      lane,
      z: 1,
      type,
    });
  }
}

function update(delta) {
  if (!state.started) return;
  const seconds = delta / 1000;
  state.elapsed += seconds;
  state.runTime += seconds;
  state.jumpTimer = Math.max(0, state.jumpTimer - seconds);
  state.crouchTimer = Math.max(0, state.crouchTimer - seconds);
  state.score += seconds * (12 + state.speed * 8);
  scoreEl.textContent = String(Math.floor(state.score));
  while (state.score >= state.nextScoreXpMilestone) {
    awardExtraXp(SCORE_MILESTONE_XP);
    state.nextScoreXpMilestone += SCORE_XP_MILESTONE;
  }
  while (state.score >= state.nextMapScore) {
    const nextMaps = Array.from({ length: MAPS.length - 1 }, (_, index) => index + 1)
      .filter((index) => index !== state.currentMapIndex);
    state.currentMapIndex = nextMaps[Math.floor(Math.random() * nextMaps.length)];
    state.nextMapScore += MAP_CHANGE_SCORE;
  }
  updateRunChallenges();
  state.speed = Math.min(1.05, 0.45 + state.score * 0.00095);
  state.spawnTimer -= seconds;

  if (state.spawnTimer <= 0) {
    spawnRow();
    state.spawnTimer = Math.max(0.6, 0.95 - state.score * 0.0003) + Math.random() * 0.08;
  }

  for (let i = obstacles.length - 1; i >= 0; i -= 1) {
    const obstacle = obstacles[i];
    obstacle.z -= seconds * state.speed;
    const blocksCurrentLane = obstacle.type === 'roadblock' || obstacle.lane === state.lane;
    if (!obstacle.checked && obstacle.z <= 0.09 && obstacle.z > -0.04 && blocksCurrentLane) {
      obstacle.checked = true;
      const cleared = obstacle.type === 'roadblock'
        ? state.jumpTimer > 0 || state.crouchTimer > 0
        : obstacle.type === 'spikes' || obstacle.type === 'barrier'
          ? state.jumpTimer > 0
          : obstacle.type === 'gate'
            ? state.crouchTimer > 0
            : false;
      if (!cleared) {
        endGame();
        return;
      }
      recordObstacleClear(obstacle.type === 'gate' || (obstacle.type === 'roadblock' && state.crouchTimer > 0)
        ? 'crouch'
        : 'jump');
      awardExtraXp(OBSTACLE_CLEAR_XP);
    }
    if (obstacle.z <= 0) obstacles.splice(i, 1);
  }
}

function roadWidth(depth) {
  return 90 + (1 - depth) * 600;
}

function lanePosition(lane, depth) {
  return canvas.width / 2 + lane * roadWidth(depth) / 3;
}

function roadY(depth) {
  return 165 + (1 - depth) * (canvas.height - 210);
}

function drawBackground() {
  const map = MAPS[state.currentMapIndex];
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, map.sky[0]);
  sky.addColorStop(0.5, map.sky[1]);
  sky.addColorStop(1, map.sky[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (map.scenery === 'city') {
    const buildings = [
      [0, 102, 70, 154], [76, 78, 62, 178], [145, 118, 54, 138],
      [205, 64, 77, 192], [288, 104, 60, 152], [555, 82, 72, 174],
      [635, 112, 55, 144], [698, 68, 80, 188], [786, 98, 68, 158],
    ];
    buildings.forEach(([x, y, width, height], index) => {
      ctx.fillStyle = index % 2 ? '#17183c' : '#121530';
      ctx.fillRect(x, y, width, height);
      ctx.fillStyle = index % 2 ? 'rgba(255, 77, 211, 0.68)' : 'rgba(82, 224, 255, 0.7)';
      for (let wx = x + 10; wx < x + width - 5; wx += 18) {
        for (let wy = y + 13; wy < y + height - 8; wy += 22) {
          ctx.fillRect(wx, wy, 5, 8);
        }
      }
    });
  } else if (map.scenery === 'mountain') {
    ctx.fillStyle = '#628aa5';
    ctx.beginPath();
    ctx.moveTo(0, 200);
    ctx.lineTo(120, 68);
    ctx.lineTo(230, 200);
    ctx.lineTo(340, 82);
    ctx.lineTo(470, 200);
    ctx.lineTo(620, 58);
    ctx.lineTo(790, 200);
    ctx.lineTo(900, 95);
    ctx.lineTo(900, 255);
    ctx.lineTo(0, 255);
    ctx.fill();
    ctx.fillStyle = 'rgba(237, 252, 255, 0.82)';
    [[120, 68, 42], [340, 82, 38], [620, 58, 48], [900, 95, 29]].forEach(([x, y, width]) => {
      ctx.beginPath();
      ctx.moveTo(x - width, y + width);
      ctx.lineTo(x, y);
      ctx.lineTo(x + width, y + width);
      ctx.closePath();
      ctx.fill();
    });
    for (const [x, y, scale] of [[42, 190, 0.9], [270, 183, 0.72], [540, 193, 0.82], [850, 185, 0.9]]) {
      ctx.fillStyle = '#244d5b';
      ctx.beginPath();
      ctx.moveTo(x, y - 42 * scale);
      ctx.lineTo(x - 24 * scale, y);
      ctx.lineTo(x + 24 * scale, y);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(x - 4 * scale, y - 4 * scale, 8 * scale, 12 * scale);
    }
  } else if (map.scenery === 'desert') {
    ctx.fillStyle = '#a64e4a';
    ctx.beginPath();
    ctx.moveTo(0, 118);
    ctx.lineTo(93, 162);
    ctx.lineTo(160, 126);
    ctx.lineTo(245, 196);
    ctx.lineTo(310, 143);
    ctx.lineTo(370, 180);
    ctx.lineTo(0, 260);
    ctx.fill();
    ctx.fillStyle = '#c9684f';
    ctx.beginPath();
    ctx.moveTo(900, 100);
    ctx.lineTo(810, 150);
    ctx.lineTo(742, 120);
    ctx.lineTo(665, 194);
    ctx.lineTo(600, 150);
    ctx.lineTo(545, 188);
    ctx.lineTo(900, 260);
    ctx.fill();
    ctx.fillStyle = '#ffe1a0';
    ctx.shadowColor = '#ff9b50';
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.arc(450, 122, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    for (const x of [70, 180, 730, 830]) {
      ctx.fillStyle = '#47805d';
      ctx.fillRect(x - 4, 192, 8, 24);
      ctx.fillRect(x - 12, 197, 8, 14);
      ctx.fillRect(x + 4, 188, 8, 16);
    }
  } else if (map.scenery === 'bridge') {
    ctx.fillStyle = 'rgba(31, 48, 73, 0.92)';
    ctx.fillRect(0, 176, 900, 17);
    ctx.fillRect(0, 202, 900, 8);
    ctx.strokeStyle = '#d6a960';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(45, 205);
    ctx.lineTo(45, 78);
    ctx.quadraticCurveTo(450, -5, 855, 78);
    ctx.lineTo(855, 205);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(45, 112);
    ctx.lineTo(855, 112);
    ctx.moveTo(45, 148);
    ctx.lineTo(855, 148);
    ctx.stroke();
    for (const x of [120, 210, 300, 390, 510, 600, 690, 780]) {
      ctx.beginPath();
      ctx.moveTo(x, 90 + Math.abs(450 - x) * 0.18);
      ctx.lineTo(x, 176);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(20, 34, 57, 0.7)';
    ctx.beginPath();
    ctx.moveTo(0, 230);
    ctx.lineTo(125, 195);
    ctx.lineTo(205, 230);
    ctx.lineTo(300, 198);
    ctx.lineTo(385, 230);
    ctx.lineTo(485, 196);
    ctx.lineTo(590, 230);
    ctx.lineTo(700, 194);
    ctx.lineTo(800, 230);
    ctx.lineTo(900, 198);
    ctx.lineTo(900, 290);
    ctx.lineTo(0, 290);
    ctx.fill();
  } else if (map.scenery === 'space') {
    for (const star of stars) {
      ctx.fillStyle = `rgba(255,255,255,${star.alpha})`;
      ctx.fillRect(star.x * canvas.width, star.y * 250, star.size, star.size);
    }
    ctx.fillStyle = '#d7c8ff';
    ctx.shadowColor = '#9277ff';
    ctx.shadowBlur = 32;
    ctx.beginPath();
    ctx.arc(120, 115, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(107, 86, 196, 0.75)';
    ctx.beginPath();
    ctx.ellipse(120, 115, 62, 13, -0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(160, 174, 255, 0.75)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.ellipse(760, 142, 70, 25, -0.24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#7785cf';
    ctx.fillRect(720, 128, 80, 28);
    ctx.fillStyle = '#8edfff';
    ctx.fillRect(735, 133, 12, 8);
    ctx.fillRect(773, 133, 12, 8);
  } else {
    for (const star of stars) {
      ctx.fillStyle = `rgba(255,255,255,${star.alpha})`;
      ctx.fillRect(star.x * canvas.width, star.y * 250, star.size, star.size);
    }
  }

  const glow = ctx.createRadialGradient(canvas.width / 2, 175, 5, canvas.width / 2, 175, 250);
  glow.addColorStop(0, map.glow);
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, 400);
}

function drawRoadsideScenery() {
  const scenery = MAPS[state.currentMapIndex].scenery;
  if (!['city', 'mountain', 'desert'].includes(scenery)) return;

  const objects = [];
  for (const side of [-1, 1]) {
    for (let i = 0; i < 8; i += 1) {
      const depth = 1 - ((i / 8 + state.elapsed * 0.12) % 1);
      objects.push({ depth, side, index: i });
    }
  }
  objects.sort((a, b) => b.depth - a.depth);

  for (const { depth, side, index } of objects) {
    const distanceScale = 1 - depth;
    const scale = 0.2 + distanceScale * 0.8;
    const roadEdge = roadWidth(depth) / 2;
    const baseY = roadY(depth);
    const offset = 12 + scale * 20;
    const x = canvas.width / 2 + side * (roadEdge + offset);

    if (scenery === 'city') {
      const width = (42 + (index % 3) * 13) * scale;
      const height = (108 + (index % 4) * 26) * scale;
      const left = side < 0 ? x - width : x;
      const top = baseY - height;
      const front = ['#31394d', '#3d4353', '#454454', '#344451'][index % 4];
      const sideFace = ['#222b3c', '#292e40', '#302e3d', '#273642'][index % 4];

      ctx.fillStyle = sideFace;
      ctx.beginPath();
      if (side < 0) {
        ctx.moveTo(left, top + 5 * scale);
        ctx.lineTo(left + width * 0.16, top);
        ctx.lineTo(left + width * 0.16, baseY);
        ctx.lineTo(left, baseY);
      } else {
        ctx.moveTo(left + width, top + 5 * scale);
        ctx.lineTo(left + width * 0.84, top);
        ctx.lineTo(left + width * 0.84, baseY);
        ctx.lineTo(left + width, baseY);
      }
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = front;
      ctx.fillRect(left + width * 0.16, top, width * 0.68, height);
      ctx.fillStyle = 'rgba(255, 215, 132, 0.72)';
      const windowWidth = Math.max(1.5, 4 * scale);
      const windowHeight = Math.max(2, 7 * scale);
      for (let row = 0; row < 5; row += 1) {
        for (let column = 0; column < 2; column += 1) {
          ctx.fillRect(
            left + width * (0.28 + column * 0.3),
            top + height * (0.14 + row * 0.16),
            windowWidth,
            windowHeight,
          );
        }
      }
      ctx.fillStyle = 'rgba(200, 220, 239, 0.34)';
      ctx.fillRect(left + width * 0.12, top, width * 0.76, Math.max(1, 2 * scale));
    } else {
      const treeHeight = (72 + (index % 3) * 16) * scale;
      const treeWidth = treeHeight * 0.52;
      const treeX = side < 0 ? x - treeWidth / 2 : x + treeWidth / 2;

      if (scenery === 'mountain') {
        ctx.fillStyle = index % 2 ? '#294f50' : '#355b55';
        ctx.fillRect(treeX - 2 * scale, baseY - treeHeight * 0.18, 4 * scale, treeHeight * 0.2);
        for (let tier = 0; tier < 3; tier += 1) {
          const tierY = baseY - treeHeight + tier * treeHeight * 0.24;
          const tierWidth = treeWidth * (0.42 + tier * 0.2);
          ctx.beginPath();
          ctx.moveTo(treeX, tierY);
          ctx.lineTo(treeX - tierWidth, tierY + treeHeight * 0.38);
          ctx.lineTo(treeX + tierWidth, tierY + treeHeight * 0.38);
          ctx.closePath();
          ctx.fill();
        }
      } else {
        const rockWidth = (60 + (index % 3) * 18) * scale;
        const rockHeight = (48 + (index % 4) * 14) * scale;
        ctx.fillStyle = index % 2 ? '#95514c' : '#ad5c4d';
        ctx.beginPath();
        ctx.moveTo(x, baseY);
        ctx.lineTo(x - side * rockWidth * 0.45, baseY - rockHeight * 0.72);
        ctx.lineTo(x - side * rockWidth * 0.16, baseY - rockHeight);
        ctx.lineTo(x + side * rockWidth * 0.3, baseY - rockHeight * 0.55);
        ctx.lineTo(x + side * rockWidth * 0.48, baseY);
        ctx.closePath();
        ctx.fill();
      }
    }
  }
}

function drawRoad() {
  const map = MAPS[state.currentMapIndex];
  const horizon = 165;
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2 - 45, horizon);
  ctx.lineTo(canvas.width / 2 + 45, horizon);
  ctx.lineTo(canvas.width / 2 + 345, canvas.height);
  ctx.lineTo(canvas.width / 2 - 345, canvas.height);
  ctx.closePath();
  ctx.fillStyle = '#101a30';
  ctx.fill();

  for (let i = 0; i < 18; i += 1) {
    const near = i / 18;
    const far = (i + 1) / 18;
    const yNear = roadY(near);
    const yFar = roadY(far);
    const wNear = roadWidth(near);
    const wFar = roadWidth(far);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - wNear / 2, yNear);
    ctx.lineTo(canvas.width / 2 + wNear / 2, yNear);
    ctx.lineTo(canvas.width / 2 + wFar / 2, yFar);
    ctx.lineTo(canvas.width / 2 - wFar / 2, yFar);
    ctx.closePath();
    ctx.fillStyle = i % 2 ? map.road[0] : map.road[1];
    ctx.fill();
  }

  if (map.scenery === 'bridge') {
    ctx.strokeStyle = '#d6a960';
    ctx.lineWidth = 7;
    ctx.beginPath();
    for (const side of [-1, 1]) {
      ctx.moveTo(canvas.width / 2 + side * (roadWidth(1) / 2 - 8), roadY(1));
      ctx.lineTo(canvas.width / 2 + side * (roadWidth(0) / 2 - 8), roadY(0));
    }
    ctx.stroke();
    ctx.lineWidth = 3;
    for (let i = 1; i < 9; i += 1) {
      const depth = i / 9;
      const y = roadY(depth);
      const halfWidth = roadWidth(depth) / 2 - 8;
      ctx.beginPath();
      for (const side of [-1, 1]) {
        const x = canvas.width / 2 + side * halfWidth;
        ctx.moveTo(x, y - 16 * (1 - depth));
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  ctx.strokeStyle = map.edge;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2 - 45, horizon);
  ctx.lineTo(canvas.width / 2 - 345, canvas.height);
  ctx.moveTo(canvas.width / 2 + 45, horizon);
  ctx.lineTo(canvas.width / 2 + 345, canvas.height);
  ctx.stroke();

  for (const laneLine of [-1 / 6, 1 / 6]) {
    ctx.strokeStyle = map.lane;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 + laneLine * roadWidth(1), horizon);
    ctx.lineTo(canvas.width / 2 + laneLine * roadWidth(0), canvas.height);
    ctx.stroke();
  }
}

function drawObstacle(obstacle) {
  if (obstacle.z <= 0) return;
  const depth = Math.min(1, obstacle.z);
  const x = obstacle.type === 'roadblock' ? canvas.width / 2 : lanePosition(obstacle.lane, depth);
  const y = roadY(depth);
  const size = 18 + (1 - depth) * 76;
  const width = size * 0.88;
  const height = size * 0.72;

  ctx.save();
  ctx.shadowBlur = 20;
  ctx.shadowColor = obstacle.type === 'spikes' ? '#ff385b' : '#ff8a3d';
  if (obstacle.type === 'roadblock') {
    const roadblockWidth = roadWidth(depth) * 0.94;
    const beamHeight = Math.max(8, size * 0.2);
    const beamY = y - height * 0.55;
    ctx.fillStyle = 'rgba(255, 107, 74, 0.22)';
    ctx.fillRect(x - roadblockWidth / 2, beamY - beamHeight, roadblockWidth, beamHeight * 3);
    ctx.fillStyle = '#ff6b4a';
    ctx.fillRect(x - roadblockWidth / 2, beamY, roadblockWidth, beamHeight);
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(x - roadblockWidth / 2, beamY, roadblockWidth, Math.max(2, beamHeight * 0.2));
    ctx.fillStyle = '#ffbd4a';
    ctx.fillRect(x - roadblockWidth / 2, y - height * 0.18, Math.max(3, size * 0.08), height * 0.18);
    ctx.fillRect(x + roadblockWidth / 2 - Math.max(3, size * 0.08), y - height * 0.18, Math.max(3, size * 0.08), height * 0.18);
  } else if (obstacle.type === 'spikes') {
    ctx.fillStyle = '#ff385b';
    ctx.beginPath();
    ctx.moveTo(x - width / 2, y);
    ctx.lineTo(x - width / 4, y - height);
    ctx.lineTo(x, y);
    ctx.lineTo(x + width / 4, y - height);
    ctx.lineTo(x + width / 2, y);
    ctx.closePath();
    ctx.fill();
  } else if (obstacle.type === 'barrier') {
    const postWidth = Math.max(4, size * 0.1);
    const beamHeight = Math.max(5, size * 0.12);
    const beamY = y - height * 0.34;
    ctx.fillStyle = '#ff6b4a';
    ctx.fillRect(x - width / 2, beamY, width, beamHeight);
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(x - width / 2, beamY, postWidth, height * 0.34);
    ctx.fillRect(x + width / 2 - postWidth, beamY, postWidth, height * 0.34);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(x - width / 2 + postWidth, beamY + 2, width - postWidth * 2, Math.max(2, beamHeight * 0.2));
  } else if (obstacle.type === 'gate') {
    const postWidth = Math.max(4, size * 0.12);
    const barY = y - height * 0.48;
    ctx.fillStyle = '#ffbd4a';
    ctx.fillRect(x - width / 2, barY, postWidth, height * 0.48);
    ctx.fillRect(x + width / 2 - postWidth, barY, postWidth, height * 0.48);
    ctx.fillRect(x - width / 2, barY - postWidth, width, postWidth);
    ctx.fillStyle = 'rgba(255, 132, 48, 0.3)';
    ctx.fillRect(x - width / 2 + postWidth, barY, width - postWidth * 2, height * 0.48);
  } else {
    ctx.fillStyle = '#ff6b4a';
    ctx.fillRect(x - width / 2, y - height, width, height);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fillRect(x - width / 2 + size * 0.12, y - height + size * 0.1, width * 0.18, height * 0.65);
  }
  ctx.restore();
}

function drawPlayer() {
  const skin = equippedSkin();
  const x = lanePosition(state.lane, 0.08);
  const groundY = canvas.height - 76;
  const jumpProgress = state.jumpTimer > 0 ? 1 - state.jumpTimer / ACTION_DURATION : 0;
  const jumpHeight = state.jumpTimer > 0 ? Math.sin(jumpProgress * Math.PI) * 72 : 0;
  const crouching = state.crouchTimer > 0;
  const y = groundY - jumpHeight;
  const stride = Math.sin(state.runTime * 15);

  ctx.fillStyle = `rgba(3, 7, 17, ${0.34 - Math.min(jumpHeight / 250, 0.2)})`;
  ctx.beginPath();
  ctx.ellipse(x, groundY + 4, 23 - jumpHeight * 0.08, 7 - jumpHeight * 0.015, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(x, y);
  if (crouching) ctx.scale(1.12, 0.68);

  const leftLegSwing = stride * 8;
  const rightLegSwing = -stride * 8;
  const hipY = crouching ? -15 : -22;
  const kneeY = crouching ? -7 : -12;
  const leftKneeX = crouching ? -13 : -6 + leftLegSwing;
  const rightKneeX = crouching ? 13 : 6 + rightLegSwing;
  const leftFootX = crouching ? -20 : -8 + leftLegSwing * 1.7;
  const rightFootX = crouching ? 20 : 8 + rightLegSwing * 1.7;

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = skin.legs;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-5, hipY);
  ctx.lineTo(leftKneeX, kneeY);
  ctx.lineTo(leftFootX, -1);
  ctx.moveTo(5, hipY);
  ctx.lineTo(rightKneeX, kneeY);
  ctx.lineTo(rightFootX, -1);
  ctx.stroke();

  ctx.strokeStyle = skin.trim;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(leftFootX - 2, -1);
  ctx.lineTo(leftFootX + 4, -1);
  ctx.moveTo(rightFootX - 2, -1);
  ctx.lineTo(rightFootX + 4, -1);
  ctx.stroke();

  const armSwing = stride * 7;
  ctx.strokeStyle = skin.trim;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-8, -40);
  ctx.lineTo(-14 - armSwing, -30);
  ctx.lineTo(-10 - armSwing, -23);
  ctx.moveTo(8, -40);
  ctx.lineTo(14 + armSwing, -30);
  ctx.lineTo(10 + armSwing, -23);
  ctx.stroke();

  ctx.shadowColor = skin.glow;
  ctx.shadowBlur = 14;
  ctx.fillStyle = skin.suit;
  ctx.beginPath();
  ctx.moveTo(-9, -43);
  ctx.quadraticCurveTo(0, -48, 9, -43);
  ctx.lineTo(7, hipY);
  ctx.lineTo(-7, hipY);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = skin.trim;
  ctx.beginPath();
  ctx.arc(0, -53, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = skin.hair;
  ctx.beginPath();
  ctx.arc(0, -56, 8, Math.PI, Math.PI * 2);
  ctx.lineTo(7, -52);
  ctx.quadraticCurveTo(0, -57, -7, -52);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function draw() {
  drawBackground();
  drawRoadsideScenery();
  drawRoad();
  for (const obstacle of obstacles) drawObstacle(obstacle);
  drawPlayer();
}

function gameLoop(timestamp) {
  const delta = state.lastTimestamp ? Math.min(timestamp - state.lastTimestamp, 50) : 16;
  state.lastTimestamp = timestamp;
  update(delta);
  draw();
  requestAnimationFrame(gameLoop);
}

overlayEl.addEventListener('click', (event) => {
  const leaderboardTab = event.target.closest('[data-leaderboard-period]');
  if (leaderboardTab) {
    const period = leaderboardTab.dataset.leaderboardPeriod;
    for (const tab of overlayEl.querySelectorAll('[data-leaderboard-period]')) {
      const selected = tab === leaderboardTab;
      tab.classList.toggle('active', selected);
      tab.setAttribute('aria-pressed', String(selected));
    }
    loadLeaderboard(period, ++leaderboardRequestId);
    return;
  }
  if (event.target.closest('.start-button:not(.auth-submit)')) {
    startGame();
    return;
  }
  const modeButton = event.target.closest('[data-auth-mode]');
  if (modeButton) {
    showAuth(modeButton.dataset.authMode);
    return;
  }
  if (event.target.closest('[data-show-leaderboard]')) {
    showLeaderboard();
    return;
  }
  if (event.target.closest('[data-back]')) {
    if (state.username) showWelcome();
    else showAuth();
  }
});
overlayEl.addEventListener('change', (event) => {
  if (!event.target.matches('#skinSelect') || !state.challengeData) return;
  const level = Number(event.target.value);
  if (!Number.isInteger(level) || level < 1 || level > playerLevel()) return;
  state.challengeData.equippedSkinLevel = level;
  saveChallengeData();
  const skin = skinForLevel(level);
  for (const swatch of overlayEl.querySelectorAll('.skin-swatch')) {
    swatch.style.setProperty('--skin-color', skin.suit);
    swatch.style.setProperty('--skin-glow', skin.glow);
  }
  const summaryName = overlayEl.querySelector('.skin-summary-name');
  if (summaryName) summaryName.innerHTML = `<span class="skin-swatch" style="--skin-color:${skin.suit};--skin-glow:${skin.glow}"></span> ${escapeHtml(skin.name)}`;
});
overlayEl.addEventListener('submit', handleAuthSubmit);
signOutButton.addEventListener('click', signOut);
document.addEventListener('keydown', handleKeyDown);
musicToggleButton.addEventListener('click', () => {
  musicEnabled = !musicEnabled;
  updateMusicToggle();
  if (musicEnabled) startMusic();
  else stopMusic();
});

function updateMusicToggle() {
  musicToggleButton.textContent = musicEnabled ? '♫' : '♪';
  musicToggleButton.setAttribute('aria-pressed', String(musicEnabled));
  musicToggleButton.setAttribute('aria-label', `Turn music ${musicEnabled ? 'off' : 'on'}`);
  musicToggleButton.title = `Music ${musicEnabled ? 'on' : 'off'}`;
}

function playMusicNote(frequency, startTime, duration, volume, type) {
  const oscillator = musicContext.createOscillator();
  const noteGain = musicContext.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  noteGain.gain.setValueAtTime(0.0001, startTime);
  noteGain.gain.exponentialRampToValueAtTime(volume, startTime + 0.025);
  noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  oscillator.connect(noteGain);
  noteGain.connect(musicGain);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

function scheduleMusic() {
  const secondsPerStep = 60 / 108 / 2;
  while (nextMusicNoteTime < musicContext.currentTime + 0.12) {
    const chordIndex = Math.floor(musicStep / 8) % MUSIC_CHORDS.length;
    const chord = MUSIC_CHORDS[chordIndex];
    const noteIndex = musicStep % 4;
    playMusicNote(chord[noteIndex] * 2, nextMusicNoteTime, 0.2, 0.08, 'triangle');
    if (musicStep % 4 === 0) {
      playMusicNote(chord[0] / 2, nextMusicNoteTime, 0.38, 0.14, 'sine');
    }
    if (musicStep % 8 === 0) {
      for (const frequency of chord) {
        playMusicNote(frequency, nextMusicNoteTime, 1.8, 0.012, 'sine');
      }
    }
    nextMusicNoteTime += secondsPerStep;
    musicStep = (musicStep + 1) % (MUSIC_CHORDS.length * 8);
  }
}

async function startMusic() {
  if (!musicEnabled) return;
  try {
    if (!musicContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) throw new Error('Web Audio is not supported in this browser.');
      musicContext = new AudioContextClass();
      musicGain = musicContext.createGain();
      musicGain.gain.value = 0;
      musicGain.connect(musicContext.destination);
    }
    await musicContext.resume();
    if (!musicEnabled) return;
    musicGain.gain.cancelScheduledValues(musicContext.currentTime);
    musicGain.gain.setTargetAtTime(0.45, musicContext.currentTime, 0.2);
    if (musicTimer === null) {
      musicStep = 0;
      nextMusicNoteTime = musicContext.currentTime;
      scheduleMusic();
      musicTimer = window.setInterval(scheduleMusic, 25);
    }
    musicToggleButton.title = 'Background music is on';
  } catch (error) {
    musicEnabled = false;
    updateMusicToggle();
    musicToggleButton.title = 'Background music could not be started';
    console.error('Background music could not be started:', error);
  }
}

function stopMusic() {
  if (musicTimer !== null) {
    window.clearInterval(musicTimer);
    musicTimer = null;
  }
  if (musicContext && musicGain) {
    musicGain.gain.cancelScheduledValues(musicContext.currentTime);
    musicGain.gain.setTargetAtTime(0, musicContext.currentTime, 0.04);
  }
  musicToggleButton.title = 'Background music is off';
}

async function initialize() {
  if (launcherUpdateRequired) {
    showLauncherUpdateRequired();
    return;
  }
  if (!isConfigured()) {
    showAuth();
    return;
  }
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) {
      showAuth();
      return;
    }
    state.session = JSON.parse(stored);
    if (!state.session || !state.session.access_token) {
      clearSession();
      showAuth();
      return;
    }
    if (state.session.expires_at && state.session.expires_at * 1000 < Date.now() + 30000) {
      await refreshSession();
    }
    const user = await apiRequest('/auth/v1/user', {}, true);
    await setAuthenticated({ ...state.session, user });
  } catch (error) {
    clearSession();
    showAuth('login', `Please sign in again. ${authErrorMessage(error)}`);
  }
}

const flightInput = { x: 0, y: 0 };
const flightKeys = new Set();
const hazards = [];
const fragments = [];
const spaceDust = Array.from({ length: 150 }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  size: Math.random() * 1.7 + 0.3,
  depth: Math.random() * 0.65 + 0.15,
  alpha: Math.random() * 0.55 + 0.12,
}));
const STARWELL_CENTER = { x: canvas.width / 2, y: canvas.height / 2 + 20 };
const FLIGHT_BOUNDS = { left: 36, right: canvas.width - 36, top: 54, bottom: canvas.height - 44 };

function showWelcome() {
  document.activeElement.blur();
  overlayEl.innerHTML = `
    <div class="overlay-content welcome-screen">
      <p class="eyebrow">A signal from the edge of space</p>
      <h1>STAR<span>WELL</span></h1>
      <p class="welcome-copy">Drift through a dying star system. Keep your momentum, harvest fragments, and don't let the void pull you under.</p>
      ${challengePanelMarkup()}
      <button class="start-button" type="button">Enter the drift</button>
      <button class="auth-switch" type="button" data-show-leaderboard>View signal records</button>
    </div>
  `;
  overlayEl.scrollTop = 0;
  overlayEl.querySelector('.overlay-content').scrollTop = 0;
  overlayEl.classList.add('visible');
  accountNameEl.textContent = state.username;
  accountBar.hidden = false;
  renderChallengeTracker();
}

function showRunComplete(score, status = '') {
  document.activeElement.blur();
  overlayEl.innerHTML = `
    <div class="overlay-content run-complete">
      <p class="eyebrow">Signal lost · fragments recovered ${state.shards || 0}</p>
      <h1>LOST IN THE WELL</h1>
      <p>You transmitted <strong>${score}</strong> signal</p>
      ${challengePanelMarkup()}
      <p class="hint">${escapeHtml(status)}</p>
      <button class="start-button" type="button">Drift again</button>
      <button class="auth-switch" type="button" data-show-leaderboard>View signal records</button>
      <p class="hint">Steer with WASD or arrows · Space to burst</p>
    </div>
  `;
  overlayEl.scrollTop = 0;
  overlayEl.querySelector('.overlay-content').scrollTop = 0;
  overlayEl.classList.add('visible');
}

function updateRunChallenges() {
  if (!state.challengeData) return;
  updateChallengeMetric('runScore', Math.floor(state.score));
  updateChallengeMetric('runTime', Math.floor(state.runTime));
}

function recordObstacleClear(action) {
  if (!state.challengeData) return;
  if (action === 'fragment') updateChallengeMetric('clears', 1, true);
  if (action === 'burst') updateChallengeMetric('jumpClears', 1, true);
  if (action === 'close-call') updateChallengeMetric('crouchClears', 1, true);
}

function startGame() {
  if (!state.username || !state.session) {
    showAuth();
    return;
  }
  if (musicEnabled) startMusic();
  Object.assign(state, {
    started: true,
    score: 0,
    elapsed: 0,
    runTime: 0,
    shards: 0,
    x: STARWELL_CENTER.x,
    y: STARWELL_CENTER.y + 165,
    vx: 28,
    vy: -12,
    boostCooldown: 0,
    boostTimer: 0,
    spawnTimer: 1.1,
    fragmentTimer: 0.8,
    nextScoreXpMilestone: SCORE_XP_MILESTONE,
    lastTimestamp: performance.now(),
  });
  flightInput.x = 0;
  flightInput.y = 0;
  flightKeys.clear();
  hazards.length = 0;
  fragments.length = 0;
  scoreEl.textContent = '0';
  bestEl.textContent = String(state.best);
  shardsEl.textContent = '0';
  boostStatusEl.textContent = 'BURST READY';
  renderChallengeTracker();
  overlayEl.classList.remove('visible');
}

function endGame() {
  if (!state.started) return;
  state.started = false;
  updateRunChallenges();
  const finalScore = Math.floor(state.score);
  showRunComplete(finalScore, 'Transmitting signal record…');
  submitScore(finalScore).then(
    () => {
      if (!state.started) showRunComplete(finalScore, 'Signal record synced to the online board.');
    },
    (error) => {
      if (!state.started) showRunComplete(finalScore, `Signal record could not sync: ${authErrorMessage(error)}`);
    },
  );
}

function movePlayer(direction) {
  if (!state.started) return;
  state.vx += direction * 105;
}

function jump() {
  if (!state.started) return;
  state.vy -= 85;
}

function crouch() {
  if (!state.started) return;
  state.vy += 85;
}

function fireBoost() {
  if (!state.started || state.boostCooldown > 0) return;
  let dx = flightInput.x;
  let dy = flightInput.y;
  if (!dx && !dy) {
    const speed = Math.hypot(state.vx, state.vy);
    dx = speed > 30 ? state.vx / speed : 0;
    dy = speed > 30 ? state.vy / speed : -1;
  } else {
    const magnitude = Math.hypot(dx, dy) || 1;
    dx /= magnitude;
    dy /= magnitude;
  }
  state.vx += dx * 390;
  state.vy += dy * 390;
  state.boostCooldown = 2.4;
  state.boostTimer = 0.2;
  recordObstacleClear('burst');
}

function handleKeyDown(event) {
  if (event.target.closest('input, textarea, [contenteditable="true"]')) return;
  const key = event.code;
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(key)) event.preventDefault();
  if (event.repeat && key === 'Space') return;
  if (key === 'Space') {
    if (state.started) fireBoost();
    else if (state.username) startGame();
    return;
  }
  const directions = {
    ArrowLeft: [-1, 0], KeyA: [-1, 0],
    ArrowRight: [1, 0], KeyD: [1, 0],
    ArrowUp: [0, -1], KeyW: [0, -1],
    ArrowDown: [0, 1], KeyS: [0, 1],
  };
  if (directions[key]) flightKeys.add(key);
  refreshFlightInput();
}

function handleKeyUp(event) {
  flightKeys.delete(event.code);
  refreshFlightInput();
}

function refreshFlightInput() {
  refreshTouchInput();
}

function spawnHazard() {
  const edge = Math.floor(Math.random() * 4);
  const position = edge === 0 ? { x: Math.random() * canvas.width, y: 22 }
    : edge === 1 ? { x: canvas.width - 22, y: Math.random() * canvas.height }
      : edge === 2 ? { x: Math.random() * canvas.width, y: canvas.height - 22 }
        : { x: 22, y: Math.random() * canvas.height };
  const angle = Math.atan2(STARWELL_CENTER.y - position.y, STARWELL_CENTER.x - position.x)
    + (Math.random() - 0.5) * 0.8;
  const speed = 42 + Math.random() * 42 + Math.min(state.runTime, 50) * 0.9;
  hazards.push({
    x: position.x,
    y: position.y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: 11 + Math.random() * 13,
    rotation: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 1.6,
    closeCall: false,
  });
}

function spawnFragment() {
  const angle = Math.random() * Math.PI * 2;
  const radius = 105 + Math.random() * 180;
  fragments.push({
    x: STARWELL_CENTER.x + Math.cos(angle) * radius,
    y: STARWELL_CENTER.y + Math.sin(angle) * radius * 0.72,
    phase: Math.random() * Math.PI * 2,
    radius: 7,
  });
}

function update(delta) {
  if (!state.started) return;
  const seconds = delta / 1000;
  state.elapsed += seconds;
  state.runTime += seconds;
  state.boostCooldown = Math.max(0, state.boostCooldown - seconds);
  state.boostTimer = Math.max(0, state.boostTimer - seconds);

  const inputMagnitude = Math.hypot(flightInput.x, flightInput.y) || 1;
  state.vx += (flightInput.x / inputMagnitude) * 430 * seconds;
  state.vy += (flightInput.y / inputMagnitude) * 430 * seconds;

  const dx = STARWELL_CENTER.x - state.x;
  const dy = STARWELL_CENTER.y - state.y;
  const distanceSquared = Math.max(2500, dx * dx + dy * dy);
  const gravity = 145000 / distanceSquared;
  state.vx += (dx / Math.sqrt(distanceSquared)) * gravity * seconds;
  state.vy += (dy / Math.sqrt(distanceSquared)) * gravity * seconds;
  const drag = Math.pow(0.985, seconds * 60);
  state.vx *= drag;
  state.vy *= drag;
  const maxSpeed = 390;
  const speed = Math.hypot(state.vx, state.vy);
  if (speed > maxSpeed) {
    state.vx = (state.vx / speed) * maxSpeed;
    state.vy = (state.vy / speed) * maxSpeed;
  }
  state.x += state.vx * seconds;
  state.y += state.vy * seconds;
  state.score += seconds * 10;

  if (Math.hypot(state.x - STARWELL_CENTER.x, state.y - STARWELL_CENTER.y) < 31) {
    endGame();
    return;
  }
  if (state.x < FLIGHT_BOUNDS.left || state.x > FLIGHT_BOUNDS.right
    || state.y < FLIGHT_BOUNDS.top || state.y > FLIGHT_BOUNDS.bottom) {
    endGame();
    return;
  }

  while (state.score >= state.nextScoreXpMilestone) {
    awardExtraXp(SCORE_MILESTONE_XP);
    state.nextScoreXpMilestone += SCORE_XP_MILESTONE;
  }
  scoreEl.textContent = String(Math.floor(state.score));
  boostStatusEl.textContent = state.boostCooldown > 0
    ? `BURST ${state.boostCooldown.toFixed(1)}`
    : 'BURST READY';
  updateRunChallenges();

  state.spawnTimer -= seconds;
  state.fragmentTimer -= seconds;
  if (state.spawnTimer <= 0) {
    spawnHazard();
    state.spawnTimer = Math.max(0.62, 1.7 - state.runTime * 0.012) + Math.random() * 0.35;
  }
  if (state.fragmentTimer <= 0) {
    spawnFragment();
    state.fragmentTimer = 1.3 + Math.random() * 0.8;
  }

  for (let i = hazards.length - 1; i >= 0; i -= 1) {
    const hazard = hazards[i];
    hazard.x += hazard.vx * seconds;
    hazard.y += hazard.vy * seconds;
    hazard.rotation += hazard.spin * seconds;
    const hazardDistance = Math.hypot(state.x - hazard.x, state.y - hazard.y);
    if (hazardDistance < hazard.radius + 12) {
      endGame();
      return;
    }
    if (!hazard.closeCall && hazardDistance < hazard.radius + 37) {
      hazard.closeCall = true;
      recordObstacleClear('close-call');
    }
    if (hazard.x < -40 || hazard.x > canvas.width + 40 || hazard.y < -40 || hazard.y > canvas.height + 40) {
      hazards.splice(i, 1);
    }
  }

  for (let i = fragments.length - 1; i >= 0; i -= 1) {
    const fragment = fragments[i];
    fragment.phase += seconds * 2;
    fragment.x += Math.sin(fragment.phase * 0.7) * seconds * 8;
    fragment.y += Math.cos(fragment.phase) * seconds * 7;
    if (Math.hypot(state.x - fragment.x, state.y - fragment.y) < 23) {
      fragments.splice(i, 1);
      state.shards += 1;
      state.score += 75;
      scoreEl.textContent = String(Math.floor(state.score));
      shardsEl.textContent = String(state.shards);
      recordObstacleClear('fragment');
      awardExtraXp(OBSTACLE_CLEAR_XP);
    }
  }
}

function drawBackground() {
  const background = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  background.addColorStop(0, '#11191d');
  background.addColorStop(0.48, '#090e15');
  background.addColorStop(1, '#140d17');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const nebula = ctx.createRadialGradient(620, 150, 8, 620, 150, 420);
  nebula.addColorStop(0, 'rgba(80, 120, 108, 0.16)');
  nebula.addColorStop(0.5, 'rgba(96, 52, 86, 0.08)');
  nebula.addColorStop(1, 'rgba(8, 12, 18, 0)');
  ctx.fillStyle = nebula;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const star of spaceDust) {
    const drift = state.started ? state.vx * star.depth * 0.025 : 0;
    star.x -= drift;
    if (star.x < 0) star.x += canvas.width;
    if (star.x > canvas.width) star.x -= canvas.width;
    ctx.globalAlpha = star.alpha * (0.8 + Math.sin(state.elapsed * 1.5 + star.x) * 0.2);
    ctx.fillStyle = star.size > 1.5 ? '#d9f8e9' : '#92a0ad';
    ctx.fillRect(star.x, star.y, star.size, star.size);
  }
  ctx.globalAlpha = 1;

  const centerGlow = ctx.createRadialGradient(STARWELL_CENTER.x, STARWELL_CENTER.y, 30, STARWELL_CENTER.x, STARWELL_CENTER.y, 310);
  centerGlow.addColorStop(0, 'rgba(5, 6, 9, 0)');
  centerGlow.addColorStop(0.65, 'rgba(149, 98, 109, 0.05)');
  centerGlow.addColorStop(1, 'rgba(5, 6, 9, 0)');
  ctx.fillStyle = centerGlow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(174, 218, 198, 0.08)';
  ctx.setLineDash([2, 10]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(STARWELL_CENTER.x, STARWELL_CENTER.y, 125, 68, -0.2, 0, Math.PI * 2);
  ctx.ellipse(STARWELL_CENTER.x, STARWELL_CENTER.y, 210, 115, -0.2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = 'rgba(196, 224, 218, 0.15)';
  ctx.lineWidth = 1;
  ctx.strokeRect(FLIGHT_BOUNDS.left, FLIGHT_BOUNDS.top, FLIGHT_BOUNDS.right - FLIGHT_BOUNDS.left, FLIGHT_BOUNDS.bottom - FLIGHT_BOUNDS.top);
}

function drawStarwell() {
  const pulse = Math.sin(state.elapsed * 2) * 2;
  ctx.save();
  ctx.translate(STARWELL_CENTER.x, STARWELL_CENTER.y);
  ctx.rotate(state.elapsed * 0.12);
  ctx.strokeStyle = 'rgba(228, 149, 160, 0.34)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 54 + pulse, 20 + pulse * 0.3, -0.16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(167, 245, 208, 0.19)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 72, 25, 0.28, 0, Math.PI * 2);
  ctx.stroke();
  const coreGlow = ctx.createRadialGradient(0, 0, 4, 0, 0, 57);
  coreGlow.addColorStop(0, 'rgba(0, 0, 0, 1)');
  coreGlow.addColorStop(0.5, 'rgba(7, 8, 12, 0.98)');
  coreGlow.addColorStop(0.67, 'rgba(194, 117, 132, 0.55)');
  coreGlow.addColorStop(1, 'rgba(194, 117, 132, 0)');
  ctx.fillStyle = coreGlow;
  ctx.beginPath();
  ctx.arc(0, 0, 57, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#020305';
  ctx.beginPath();
  ctx.arc(0, 0, 22 + pulse * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHazard(hazard) {
  ctx.save();
  ctx.translate(hazard.x, hazard.y);
  ctx.rotate(hazard.rotation);
  ctx.shadowColor = 'rgba(229, 147, 153, 0.33)';
  ctx.shadowBlur = 12;
  ctx.fillStyle = '#4b4247';
  ctx.strokeStyle = '#bd8b8d';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  for (let i = 0; i < 9; i += 1) {
    const angle = (i / 9) * Math.PI * 2;
    const uneven = hazard.radius * (0.76 + ((i * 17) % 5) * 0.06);
    const x = Math.cos(angle) * uneven;
    const y = Math.sin(angle) * uneven;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(222, 194, 184, 0.35)';
  ctx.beginPath();
  ctx.moveTo(-hazard.radius * 0.35, -hazard.radius * 0.15);
  ctx.lineTo(hazard.radius * 0.1, hazard.radius * 0.08);
  ctx.lineTo(hazard.radius * 0.32, hazard.radius * 0.42);
  ctx.stroke();
  ctx.restore();
}

function drawFragment(fragment) {
  const flicker = 0.7 + Math.sin(fragment.phase * 3) * 0.2;
  ctx.save();
  ctx.translate(fragment.x, fragment.y);
  ctx.rotate(fragment.phase * 0.5);
  ctx.globalAlpha = flicker;
  ctx.shadowColor = '#a7f5d0';
  ctx.shadowBlur = 18;
  ctx.fillStyle = '#c9ffe3';
  ctx.beginPath();
  ctx.moveTo(0, -fragment.radius);
  ctx.lineTo(fragment.radius * 0.72, 0);
  ctx.lineTo(0, fragment.radius);
  ctx.lineTo(-fragment.radius * 0.72, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPlayer() {
  const skin = equippedSkin();
  const angle = Math.atan2(state.vy, state.vx);
  const boostGlow = state.boostTimer > 0;
  ctx.save();
  ctx.translate(state.x, state.y);
  ctx.rotate(angle);
  ctx.strokeStyle = boostGlow ? '#d9ffe9' : skin.glow;
  ctx.lineWidth = boostGlow ? 3 : 1.5;
  ctx.shadowColor = boostGlow ? '#d9ffe9' : skin.glow;
  ctx.shadowBlur = boostGlow ? 24 : 12;
  ctx.fillStyle = skin.suit;
  ctx.beginPath();
  ctx.moveTo(17, 0);
  ctx.lineTo(-10, -9);
  ctx.lineTo(-5, 0);
  ctx.lineTo(-10, 9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (boostGlow) {
    ctx.fillStyle = '#f9fff9';
    ctx.beginPath();
    ctx.moveTo(-8, -4);
    ctx.lineTo(-25 - Math.random() * 12, 0);
    ctx.lineTo(-8, 4);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function draw() {
  drawBackground();
  drawStarwell();
  for (const fragment of fragments) drawFragment(fragment);
  for (const hazard of hazards) drawHazard(hazard);
  drawPlayer();
}

function gameLoop(timestamp) {
  const delta = state.lastTimestamp ? Math.min(timestamp - state.lastTimestamp, 50) : 16;
  state.lastTimestamp = timestamp;
  update(delta);
  draw();
  requestAnimationFrame(gameLoop);
}

function bindFlightButton(button, x, y) {
  if (!button) return;
  const press = (event) => {
    event.preventDefault();
    flightKeys.add(`touch-${x}-${y}`);
    refreshTouchInput();
    button.classList.add('pressed');
    if (button.setPointerCapture && event.pointerId !== undefined) button.setPointerCapture(event.pointerId);
  };
  const release = (event) => {
    if (event) event.preventDefault();
    flightKeys.delete(`touch-${x}-${y}`);
    refreshTouchInput();
    button.classList.remove('pressed');
  };
  button.addEventListener('pointerdown', press);
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
}

function refreshTouchInput() {
  const left = flightKeys.has('touch--1-0');
  const right = flightKeys.has('touch-1-0');
  const up = flightKeys.has('touch-0--1');
  const down = flightKeys.has('touch-0-1');
  flightInput.x = Number(right || flightKeys.has('ArrowRight') || flightKeys.has('KeyD'))
    - Number(left || flightKeys.has('ArrowLeft') || flightKeys.has('KeyA'));
  flightInput.y = Number(down || flightKeys.has('ArrowDown') || flightKeys.has('KeyS'))
    - Number(up || flightKeys.has('ArrowUp') || flightKeys.has('KeyW'));
}

document.addEventListener('keyup', handleKeyUp);
bindFlightButton(leftButton, -1, 0);
bindFlightButton(rightButton, 1, 0);
bindFlightButton(jumpButton, 0, -1);
bindFlightButton(crouchButton, 0, 1);
boostButton.addEventListener('click', fireBoost);

bestEl.textContent = '0';
requestAnimationFrame(gameLoop);
initialize();
