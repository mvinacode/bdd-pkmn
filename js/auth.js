import { getSupabaseClient } from './supabase-client.js';
import { USER_PREFS } from './config.js';
import { store } from './store.js';

export async function initAuth() {
  const client = getSupabaseClient();
  if (!client) { window.location.href = 'login.html'; return false; }

  let session;
  try {
    const { data } = await client.auth.getSession();
    session = data.session;
  } catch (e) {
    console.error('[Auth] getSession failed:', e);
    window.location.href = 'login.html';
    return false;
  }
  if (!session?.user) {
    window.location.href = 'login.html';
    return false;
  }

  store.ownerUuid = session.user.id;
  const prefs = USER_PREFS[session.user.id] || {};
  store.prefs = {
    genderFormsMode:            prefs.genderFormsMode || 'none',
    strictComplete:             prefs.strictComplete === true,
    requireAllFormsForComplete: prefs.requireAllFormsForComplete === true,
  };

  const emailEl = document.getElementById('user-email');
  if (emailEl) emailEl.textContent = session.user.email;

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await client.auth.signOut();
      window.location.href = 'login.html';
    });
  }

  return true;
}
