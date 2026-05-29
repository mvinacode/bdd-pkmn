/**
 * AUTH.JS — Gestion de la session Supabase Auth
 * À charger après supabase-client.js sur toutes les pages protégées.
 */

async function initAuth() {
  const client = getSupabaseClient();
  if (!client) { window.location.href = 'login.html'; return false; }

  const { data: { session } } = await client.auth.getSession();
  if (!session?.user) {
    window.location.href = 'login.html';
    return false;
  }

  window._ownerUuid = session.user.id;
  const prefs = (typeof USER_PREFS !== 'undefined' && USER_PREFS[session.user.id]) || {};
  window._genderFormsMode = prefs.genderFormsMode || 'none';
  if (prefs.allFormsAnim) document.body.dataset.allFormsAnim = prefs.allFormsAnim;

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
