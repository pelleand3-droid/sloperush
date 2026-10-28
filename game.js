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
const musicToggleButton = document.getElementById('musicToggle');
const launcherUpdateRequired = window.location.hash !== '#launcher=1.0.4';
const LATEST_LAUNCHER_URL = 'https://github.com/pelleand3-droid/sloperush/releases/download/v1.0.4/SlopeRush.exe';

const LANES = [-1, 0, 1];
const ACTION_DURATION = 0.9;
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
    { id: 'clear-10', title: 'Clear 10 obstacles', metric: 'clears', target: 10, unit: 'clears' },
    { id: 'clear-18', title: 'Clear 18 obstacles', metric: 'clears', target: 18, unit: 'clears' },
    { id: 'clear-25', title: 'Clear 25 obstacles', metric: 'clears', target: 25, unit: 'clears' },
  ],
  [
    { id: 'jump-4', title: 'Jump over 4 obstacles', metric: 'jumpClears', target: 4, unit: 'jumps' },
    { id: 'jump-7', title: 'Jump over 7 obstacles', metric: 'jumpClears', target: 7, unit: 'jumps' },
    { id: 'jump-10', title: 'Jump over 10 obstacles', metric: 'jumpClears', target: 10, unit: 'jumps' },
  ],
  [
    { id: 'crouch-3', title: 'Crouch under 3 obstacles', metric: 'crouchClears', target: 3, unit: 'obstacles' },
    { id: 'crouch-5', title: 'Crouch under 5 obstacles', metric: 'crouchClears', target: 5, unit: 'obstacles' },
    { id: 'crouch-8', title: 'Crouch under 8 obstacles', metric: 'crouchClears', target: 8, unit: 'obstacles' },
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
  speed: 0.38,
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
      <p class="eyebrow">Online top scores</p>
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
      <p class="auth-description">This game was opened with an old launcher or in a browser. Install Slope Rush v1.0.4 to keep playing. The updated launcher will install future game and launcher updates automatically.</p>
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
          <label for="skinSelect">Choose an unlocked skin</label>
          <select id="skinSelect" aria-label="Choose an unlocked runner skin">
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
  state.speed = 0.38;
  state.lane = 0;
  state.elapsed = 0;
  state.spawnTimer = 0.8;
  state.jumpTimer = 0;
  state.crouchTimer = 0;
  state.runTime = 0;
  state.nextScoreXpMilestone = SCORE_XP_MILESTONE;
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
  if (state.score > 1000 && Math.random() < 0.14) {
    obstacles.push({
      lane: 0,
      z: 1,
      type: 'roadblock',
    });
    return;
  }

  const available = [...LANES];
  const blockedCount = Math.random() < 0.58 ? 2 : 1;
  const blocked = [];
  for (let i = 0; i < blockedCount; i += 1) {
    const index = Math.floor(Math.random() * available.length);
    blocked.push(available.splice(index, 1)[0]);
  }
  const types = ['block', 'spikes', 'gate', 'barrier'];
  for (const lane of blocked) {
    obstacles.push({
      lane,
      z: 1,
      type: types[Math.floor(Math.random() * types.length)],
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
  updateRunChallenges();
  state.speed = Math.min(1.3, 0.38 + state.score * 0.0015);
  state.spawnTimer -= seconds;

  if (state.spawnTimer <= 0) {
    spawnRow();
    state.spawnTimer = Math.max(0.58, 1.08 - state.score * 0.0006) + Math.random() * 0.1;
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
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, '#172e63');
  sky.addColorStop(0.5, '#0a1531');
  sky.addColorStop(1, '#030711');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const star of stars) {
    ctx.fillStyle = `rgba(255,255,255,${star.alpha})`;
    ctx.fillRect(star.x * canvas.width, star.y * 250, star.size, star.size);
  }

  const glow = ctx.createRadialGradient(canvas.width / 2, 175, 5, canvas.width / 2, 175, 250);
  glow.addColorStop(0, 'rgba(53, 110, 255, 0.3)');
  glow.addColorStop(1, 'rgba(53, 110, 255, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, 400);
}

function drawRoad() {
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
    ctx.fillStyle = i % 2 ? '#17284a' : '#1b3057';
    ctx.fill();
  }

  ctx.strokeStyle = 'rgba(100, 220, 255, 0.75)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2 - 45, horizon);
  ctx.lineTo(canvas.width / 2 - 345, canvas.height);
  ctx.moveTo(canvas.width / 2 + 45, horizon);
  ctx.lineTo(canvas.width / 2 + 345, canvas.height);
  ctx.stroke();

  for (const laneLine of [-1 / 6, 1 / 6]) {
    ctx.strokeStyle = 'rgba(150, 190, 255, 0.23)';
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
leftButton.addEventListener('click', () => movePlayer(-1));
rightButton.addEventListener('click', () => movePlayer(1));
jumpButton.addEventListener('click', jump);
crouchButton.addEventListener('click', crouch);
signOutButton.addEventListener('click', signOut);
document.addEventListener('keydown', handleKeyDown);
musicToggleButton.addEventListener('click', () => {
  musicEnabled = !musicEnabled;
  updateMusicToggle();
  if (musicEnabled) startMusic();
  else stopMusic();
});

function updateMusicToggle() {
  musicToggleButton.textContent = `♫ Music: ${musicEnabled ? 'On' : 'Off'}`;
  musicToggleButton.setAttribute('aria-pressed', String(musicEnabled));
  musicToggleButton.setAttribute('aria-label', `Turn music ${musicEnabled ? 'off' : 'on'}`);
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

bestEl.textContent = '0';
requestAnimationFrame(gameLoop);
initialize();
