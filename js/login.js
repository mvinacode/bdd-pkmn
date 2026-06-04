import { getSupabaseClient } from './supabase-client.js';

(async () => {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data } = await client.auth.getSession();
      if (data.session?.user) { window.location.href = 'index.html'; return; }
    } catch (_) {}
  }

  let mode = 'login';

  function setMode(m) {
    mode = m;
    document.getElementById('tab-login').classList.toggle('active', m === 'login');
    document.getElementById('tab-signup').classList.toggle('active', m === 'signup');
    document.getElementById('auth-submit').textContent = m === 'login' ? 'Se connecter' : "S'inscrire";
    document.getElementById('auth-password').autocomplete = m === 'login' ? 'current-password' : 'new-password';
    document.getElementById('auth-error').hidden   = true;
    document.getElementById('auth-success').hidden = true;
  }

  document.getElementById('tab-login').addEventListener('click', () => setMode('login'));
  document.getElementById('tab-signup').addEventListener('click', () => setMode('signup'));

  document.getElementById('auth-form').addEventListener('submit', async e => {
    e.preventDefault();
    const email    = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const btn      = document.getElementById('auth-submit');
    const errEl    = document.getElementById('auth-error');
    const okEl     = document.getElementById('auth-success');

    btn.disabled = true;
    errEl.hidden = true;
    okEl.hidden  = true;

    if (mode === 'login') {
      btn.textContent = 'Connexion…';
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) {
        errEl.textContent = error.message === 'Invalid login credentials'
          ? 'Email ou mot de passe incorrect.'
          : error.message;
        errEl.hidden    = false;
        btn.disabled    = false;
        btn.textContent = 'Se connecter';
      } else {
        window.location.href = 'index.html';
      }
    } else {
      btn.textContent = "Inscription…";
      const { data, error } = await client.auth.signUp({ email, password });
      if (error) {
        errEl.textContent = error.message;
        errEl.hidden    = false;
        btn.disabled    = false;
        btn.textContent = "S'inscrire";
      } else if (data.session) {
        window.location.href = 'index.html';
      } else {
        okEl.textContent = 'Compte créé ! Vérifie ton email pour confirmer ton inscription, puis connecte-toi.';
        okEl.hidden     = false;
        btn.disabled    = false;
        btn.textContent = "S'inscrire";
        setMode('login');
      }
    }
  });
})();
