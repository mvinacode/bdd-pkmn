import { getSupabaseClient } from './supabase-client.js';
import { USER_PREFS } from './config.js';

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

  window._ownerUuid = session.user.id;
  const prefs = USER_PREFS[session.user.id] || {};
  window._genderFormsMode = prefs.genderFormsMode || 'none';
  window._strictComplete = prefs.strictComplete === true;
  window._requireAllFormsForComplete = prefs.requireAllFormsForComplete === true;

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
