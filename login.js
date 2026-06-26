/* ═══════════════════════════════════════════════
   MediCare HMS – login.js
   ═══════════════════════════════════════════════ */

// ── If already logged in, skip login page ──
if (localStorage.getItem('isLoggedIn') === 'true') {
  window.location.href = 'index.html';
}

// ── Credentials ──
const VALID_USER = 'siva';
const VALID_PASS = 'siva@2006';

// ── DOM References ──
const loginForm = document.getElementById('loginForm');
const loginUser = document.getElementById('loginUser');
const loginPass = document.getElementById('loginPass');
const errorMsg  = document.getElementById('errorMsg');
const btnLogin  = document.querySelector('.btn-login');
const togglePass = document.getElementById('togglePass');
const eyeIcon    = document.getElementById('eyeIcon');

// ── Password Visibility Toggle ──
togglePass.addEventListener('click', () => {
  const isPassword = loginPass.type === 'password';
  loginPass.type = isPassword ? 'text' : 'password';
  eyeIcon.className = isPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
});

// ── Login Form Submit ──
loginForm.addEventListener('submit', e => {
  e.preventDefault();

  const user = loginUser.value.trim();
  const pass = loginPass.value.trim();

  // Clear previous error state
  errorMsg.classList.add('hidden');
  loginUser.classList.remove('input-error');
  loginPass.classList.remove('input-error');

  // Brief loading animation on button
  btnLogin.classList.add('loading');
  btnLogin.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> &nbsp;Verifying…';

  // Small delay for UX feel, then validate
  setTimeout(() => {
    if (user === VALID_USER && pass === VALID_PASS) {
      // ✅ Correct — save session and redirect
      localStorage.setItem('isLoggedIn', 'true');
      window.location.href = 'index.html';
    } else {
      // ❌ Wrong credentials
      errorMsg.classList.remove('hidden');
      loginUser.classList.add('input-error');
      loginPass.classList.add('input-error');
      loginPass.value = '';

      // Reset button
      btnLogin.classList.remove('loading');
      btnLogin.innerHTML = 'Login &nbsp;<i class="fa-solid fa-arrow-right-to-bracket"></i>';

      // Focus username for retry
      loginUser.focus();
    }
  }, 600);
});

// ── Clear error highlight on input ──
[loginUser, loginPass].forEach(input => {
  input.addEventListener('input', () => {
    input.classList.remove('input-error');
    errorMsg.classList.add('hidden');
  });
});
