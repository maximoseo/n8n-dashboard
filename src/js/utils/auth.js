const AUTH_KEY = 'n8n_dashboard_auth';
const AUTH_PASS = 'Maximo2026!';

export function isAuthenticated() {
  return sessionStorage.getItem(AUTH_KEY) === 'true' || localStorage.getItem(AUTH_KEY) === 'true';
}

export function authenticate(password, remember = false) {
  if (password === AUTH_PASS) {
    sessionStorage.setItem(AUTH_KEY, 'true');
    if (remember) {
      localStorage.setItem(AUTH_KEY, 'true');
    }
    return true;
  }
  return false;
}

export function logout() {
  sessionStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(AUTH_KEY);
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
  authDiv.innerHTML = `
    <div class="auth-modal">
      <h2>🔒 n8n Dashboard</h2>
      <p>Enter password to access</p>
      <input type="password" id="authPassword" placeholder="Password" class="auth-input">
      <label class="remember-label" style="display:flex;align-items:center;gap:8px;margin:12px 0;cursor:pointer;font-size:14px;color:var(--text-secondary,#aaa);">
        <input type="checkbox" id="rememberMe" checked>
        Remember me on this computer
      </label>
      <button id="authSubmit" class="auth-btn">Unlock</button>
      <p id="authError" class="auth-error" style="display:none;">Wrong password</p>
    </div>
  `;
  
  document.body.prepend(authDiv);
  container.style.filter = 'blur(10px)';
  container.style.pointerEvents = 'none';
  
  const handleAuth = () => {
    const pass = document.getElementById('authPassword').value;
    const remember = document.getElementById('rememberMe').checked;
    if (authenticate(pass, remember)) {
      authDiv.remove();
      container.style.filter = '';
      container.style.pointerEvents = '';
      if (onSuccess) onSuccess();
    } else {
      document.getElementById('authError').style.display = 'block';
    }
  };
  
  document.getElementById('authSubmit').addEventListener('click', handleAuth);
  
  document.getElementById('authPassword').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAuth();
  });
}
