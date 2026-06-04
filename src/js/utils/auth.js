const AUTH_SESSION_KEY = 'n8n_dashboard_supabase_session';
const AUTH_REMEMBER_KEY = 'n8n_dashboard_remember_login';

const RUNTIME_ENV = import.meta.env || window;
const SUPABASE_URL = (RUNTIME_ENV.VITE_SUPABASE_URL || window.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_ANON_KEY = RUNTIME_ENV.VITE_SUPABASE_ANON_KEY || window.VITE_SUPABASE_ANON_KEY || '';
const AUTH_USERNAME = RUNTIME_ENV.VITE_DASHBOARD_AUTH_USERNAME || window.VITE_DASHBOARD_AUTH_USERNAME || 'maximo';
const AUTH_EMAIL = RUNTIME_ENV.VITE_DASHBOARD_AUTH_EMAIL || window.VITE_DASHBOARD_AUTH_EMAIL || 'n8n-dashboard@maximo-seo.ai';

function storageForSession(session = null) {
  if (session?.remember) return localStorage;
  if (localStorage.getItem(AUTH_SESSION_KEY)) return localStorage;
  return sessionStorage;
}

function getStoredSession() {
  const raw = localStorage.getItem(AUTH_SESSION_KEY) || sessionStorage.getItem(AUTH_SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw);
    if (!session?.access_token || !session?.expires_at) return null;
    if (Date.now() >= session.expires_at - 30000) {
      logout();
      return null;
    }
    return session;
  } catch {
    logout();
    return null;
  }
}

function saveSession(payload, remember) {
  const expiresIn = Number(payload.expires_in || 3600) * 1000;
  const session = {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
    expires_at: Date.now() + expiresIn,
    user: payload.user,
    username: AUTH_USERNAME,
    remember,
  };
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  localStorage.removeItem(AUTH_SESSION_KEY);
  storageForSession(session).setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  localStorage.setItem(AUTH_REMEMBER_KEY, remember ? 'true' : 'false');
  return session;
}

async function supabasePasswordLogin(email, password) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase is not configured for this dashboard.');
  }

  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error_description || payload.msg || payload.message || 'Wrong username or password.');
  }
  return payload;
}

async function writeAuditEvent(event) {
  const session = getStoredSession();
  if (!session || !SUPABASE_URL || !SUPABASE_ANON_KEY) return;

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/dashboard_auth_audit`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        username: session.username,
        event,
        user_agent: navigator.userAgent,
      }),
    });
  } catch (error) {
    console.warn('Auth audit write skipped:', error.message);
  }
}

export function isAuthenticated() {
  return Boolean(getStoredSession());
}

export async function authenticate(username, password, remember = false) {
  const cleanUsername = String(username || '').trim().toLowerCase();
  const cleanPassword = String(password || '');
  const expectedUsername = String(AUTH_USERNAME).trim().toLowerCase();

  if (!cleanUsername || !cleanPassword) {
    throw new Error('Please enter both username and password.');
  }

  if (cleanUsername !== expectedUsername && cleanUsername !== AUTH_EMAIL.toLowerCase()) {
    throw new Error('Wrong username or password.');
  }

  const payload = await supabasePasswordLogin(AUTH_EMAIL, cleanPassword);
  saveSession(payload, remember);
  writeAuditEvent('login_success');
  return true;
}

export function logout() {
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  localStorage.removeItem(AUTH_SESSION_KEY);
}

function setBusy(button, busy) {
  button.disabled = busy;
  button.classList.toggle('is-loading', busy);
  button.querySelector('.auth-btn-label').textContent = busy ? 'Signing in…' : 'Sign in securely';
}

function focusFirstInput() {
  requestAnimationFrame(() => document.getElementById('authUsername')?.focus());
}

export function showAuthGate(onSuccess) {
  if (isAuthenticated()) {
    if (onSuccess) onSuccess();
    return;
  }
  
  const container = document.querySelector('.container');
  if (!container) return;
  
  const authDiv = document.createElement('div');
  authDiv.id = 'authOverlay';
  authDiv.className = 'auth-overlay';
  const rememberDefault = localStorage.getItem(AUTH_REMEMBER_KEY) !== 'false';
  authDiv.innerHTML = `
    <section class="auth-shell" aria-labelledby="authTitle">
      <div class="auth-brand-card" aria-hidden="true">
        <div class="auth-brand-icon">⚡</div>
        <p class="auth-kicker">MaximoSEO Secure Access</p>
        <h2>n8n Dashboard</h2>
        <p>Database-backed login with Supabase Auth. No shared browser password.</p>
        <ul class="auth-proof-list">
          <li>Username + password verification</li>
          <li>Session expires automatically</li>
          <li>Login audit table in Supabase</li>
        </ul>
      </div>
      <form class="auth-modal" id="authForm" autocomplete="on">
        <div class="auth-mobile-logo">⚡</div>
        <p class="auth-kicker">Secure dashboard login</p>
        <h1 id="authTitle">Sign in to n8n Dashboard</h1>
        <p class="auth-subtitle">Enter the dashboard username and password from Supabase.</p>

        <label class="auth-field" for="authUsername">
          <span>Username</span>
          <input type="text" id="authUsername" name="username" placeholder="maximo" inputmode="email" autocomplete="username" class="auth-input" required>
        </label>

        <label class="auth-field" for="authPassword">
          <span>Password</span>
          <div class="auth-password-row">
            <input type="password" id="authPassword" name="password" placeholder="Enter password" autocomplete="current-password" class="auth-input" required>
            <button type="button" class="auth-show-password" id="togglePassword" aria-label="Show password">Show</button>
          </div>
        </label>

        <label class="remember-label">
          <input type="checkbox" id="rememberMe" ${rememberDefault ? 'checked' : ''}>
          <span>Remember this device</span>
        </label>

        <button id="authSubmit" class="auth-btn" type="submit">
          <span class="auth-btn-label">Sign in securely</span>
        </button>
        <p id="authError" class="auth-error" role="alert" aria-live="polite" hidden></p>
        <p class="auth-confirmation-copy">Need access or a password reset? Ask Tomer to confirm the username and password words.</p>
      </form>
    </section>
  `;
  
  document.body.prepend(authDiv);
  container.classList.add('auth-blurred');
  document.body.classList.add('auth-open');
  focusFirstInput();
  
  const form = document.getElementById('authForm');
  const error = document.getElementById('authError');
  const submit = document.getElementById('authSubmit');
  const passwordInput = document.getElementById('authPassword');
  const togglePassword = document.getElementById('togglePassword');

  togglePassword.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    togglePassword.textContent = isPassword ? 'Hide' : 'Show';
    togglePassword.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    error.hidden = true;
    error.textContent = '';
    setBusy(submit, true);

    try {
      const username = document.getElementById('authUsername').value;
      const pass = passwordInput.value;
      const remember = document.getElementById('rememberMe').checked;
      await authenticate(username, pass, remember);
      authDiv.remove();
      container.classList.remove('auth-blurred');
      document.body.classList.remove('auth-open');
      if (onSuccess) onSuccess();
    } catch (authError) {
      error.textContent = authError.message || 'Wrong username or password.';
      error.hidden = false;
      passwordInput.select();
    } finally {
      setBusy(submit, false);
    }
  });
}

export function renderAuthSessionControls() {
  const headerActions = document.querySelector('.header-actions');
  if (!headerActions || document.getElementById('authSessionChip')) return;
  const session = getStoredSession();
  if (!session) return;

  const chip = document.createElement('button');
  chip.id = 'authSessionChip';
  chip.className = 'auth-session-chip';
  chip.type = 'button';
  chip.title = 'Sign out of the dashboard';
  chip.innerHTML = `<span>👤 ${session.username}</span><strong>Logout</strong>`;
  chip.addEventListener('click', () => {
    writeAuditEvent('logout');
    logout();
    window.location.reload();
  });
  headerActions.prepend(chip);
}
