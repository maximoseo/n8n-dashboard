const AUTH_KEY = 'n8n_dashboard_auth';
const AUTH_PASS = 'maximo2026';

export function isAuthenticated() {
  return sessionStorage.getItem(AUTH_KEY) === 'true';
}

export function authenticate(password) {
  if (password === AUTH_PASS) {
    sessionStorage.setItem(AUTH_KEY, 'true');
    return true;
  }
  return false;
}

export function logout() {
  sessionStorage.removeItem(AUTH_KEY);
}

export function showAuthGate() {
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
      <button id="authSubmit" class="auth-btn">Unlock</button>
      <p id="authError" class="auth-error" style="display:none;">Wrong password</p>
    </div>
  `;
  
  document.body.prepend(authDiv);
  container.style.filter = 'blur(10px)';
  container.style.pointerEvents = 'none';
  
  document.getElementById('authSubmit').addEventListener('click', () => {
    const pass = document.getElementById('authPassword').value;
    if (authenticate(pass)) {
      authDiv.remove();
      container.style.filter = '';
      container.style.pointerEvents = '';
    } else {
      document.getElementById('authError').style.display = 'block';
    }
  });
  
  document.getElementById('authPassword').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('authSubmit').click();
  });
}
