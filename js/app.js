import { CONFIG, getPokemonImageUrl, isSupabaseConfigured } from './config.js';
import { initAuth } from './auth.js';
import { store } from './store.js';
import { debounce } from './domain/constants.js';
import { loadCatchesMap, setCatchesCallbacks } from './application/catches.js';
import { renderGrid, updateCardAfterCatch, setCardCallbacks } from './presentation/card.js';
import { openModal, closeModal, setModalCallbacks } from './presentation/modal.js?v=171';
import { bindDrawerEvents, openDrawerWithPokemon, setDrawerCallbacks } from './presentation/drawer.js';
import { populateTypeFilters } from './presentation/filters.js';
import { fetchPokemon, fetchCardIcons, getSupabaseClient } from './supabase-client.js';

// Wiring callbacks (évite les dépendances circulaires entre modules de présentation)
setCardCallbacks({ openModal });
setModalCallbacks({ updateCardAfterCatch, openDrawerWithPokemon });
setDrawerCallbacks({ openModal, updateCardAfterCatch });
setCatchesCallbacks({ onCardRefresh: updateCardAfterCatch });

// Expose pour populate.js (outil de seed console-only)
window.getSupabaseClient    = getSupabaseClient;
window.getPokemonImageUrl   = getPokemonImageUrl;
window.isSupabaseConfigured = isSupabaseConfigured;

// ── DOM ──────────────────────────────────────────────────────

const $ = id => document.getElementById(id);

const els = {
  loader:      $('loader'),
  emptyState:  $('empty-state'),
  setupState:  $('setup-state'),
  search:      $('search'),
  genFilters:  $('gen-filters'),
  typeFilters: $('type-filters'),
  sort:        $('sort'),
  resetBtn:    $('reset-filters'),
  headerCount: $('header-count'),
  modalOverlay:$('modal-overlay'),
  modalClose:  $('modal-close'),
};

// ── Chargement Pokémon ────────────────────────────────────────

async function loadPokemon(append = false) {
  if (store.loading) return;
  store.loading = true;
  if (!append) { store.from = 0; store.allLoaded = false; }
  els.loader.hidden = false;

  try {
    let capturedNums = [];
    if (store.statusFilter === 'caught') capturedNums = Object.keys(store.catchByNumber).map(Number);
    else if (store.statusFilter === 'seen') capturedNums = [...store.seenSet].filter(n => !store.catchByNumber[n]);

    const { data, count, error } = await fetchPokemon({
      from:            store.from,
      to:              store.from + CONFIG.PAGE_SIZE - 1,
      search:          store.search,
      gen:             store.gen !== 'all' ? store.gen : null,
      type:            store.type !== 'all' ? store.type : null,
      sortBy:          store.sortBy,
      capturedOnly:    store.statusFilter !== 'all',
      capturedNumbers: capturedNums,
    });

    if (error?.message === 'Supabase non configuré') {
      els.setupState.hidden = false;
      els.loader.hidden = true;
      return;
    }
    if (error) { console.error('[App]', error.message); els.loader.hidden = true; return; }

    store.total     = count;
    store.from     += data.length;
    store.allLoaded = store.from >= count;
    if (append) store.pokemon.push(...data); else store.pokemon = data;

    const numbers       = data.map(p => p.number);
    const cachedIconMap = Object.fromEntries(numbers.filter(n => store.iconCache[n]).map(n => [n, store.iconCache[n]]));
    renderGrid(data, append, cachedIconMap);
    els.headerCount.textContent = count;
    els.loader.hidden = store.allLoaded;

    if (!store.allLoaded) {
      requestAnimationFrame(() => {
        const rect = els.loader.getBoundingClientRect();
        if (rect.top < window.innerHeight + 200 && !store.loading) loadPokemon(true);
      });
    }

    fetchCardIcons(numbers).then(iconRows => {
      const iconMap = {};
      for (const row of iconRows) {
        if (!iconMap[row.pokemon_number]) iconMap[row.pokemon_number] = {};
        const isShiny = row.variant_type === 'shiny' || row.variant_type === 'shiny_male' || row.variant_type === 'shiny_female';
        const ikey = isShiny ? 'shiny' : 'normal';
        if (!iconMap[row.pokemon_number][ikey]) iconMap[row.pokemon_number][ikey] = row.image_url;
      }
      const needsUpdate = numbers.filter(n => iconMap[n] && !cachedIconMap[n]);
      Object.assign(store.iconCache, iconMap);
      needsUpdate.forEach(n => updateCardAfterCatch(n));
    }).catch(() => {});

  } catch (err) {
    console.error('[loadPokemon]', err);
    els.loader.hidden = true;
  } finally {
    store.loading = false;
  }
}

function resetAndReload() {
  store.from = 0; store.total = 0; store.allLoaded = false; store.pokemon = [];
  els.emptyState.hidden = true;
  els.setupState.hidden = true;
  loadPokemon(false);
}

// ── Scroll infini ─────────────────────────────────────────────

const observer = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting && !store.loading && !store.allLoaded) loadPokemon(true);
}, { rootMargin: '200px' });

observer.observe(els.loader);

// ── Événements filtres ────────────────────────────────────────

els.search.addEventListener('input', debounce(e => {
  store.search = e.target.value.replace(/[<>'"]/g, '').trim();
  resetAndReload();
}, CONFIG.SEARCH_DEBOUNCE));

els.genFilters.addEventListener('click', e => {
  const btn = e.target.closest('.chip');
  if (!btn) return;
  els.genFilters.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  store.gen = btn.dataset.gen;
  resetAndReload();
});

els.typeFilters.addEventListener('click', e => {
  const btn = e.target.closest('.chip');
  if (!btn) return;
  els.typeFilters.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  store.type = btn.dataset.type;
  resetAndReload();
});

els.sort.addEventListener('change', e => { store.sortBy = e.target.value; resetAndReload(); });

els.resetBtn.addEventListener('click', () => {
  store.search = ''; store.gen = 'all'; store.type = 'all'; store.sortBy = 'number';
  els.search.value = ''; els.sort.value = 'number';
  els.genFilters.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  els.genFilters.querySelector('[data-gen="all"]').classList.add('active');
  els.typeFilters.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  els.typeFilters.querySelector('[data-type="all"]').classList.add('active');
  resetAndReload();
});

// Filtre statut collection — dispatché depuis presentation/drawer.js
document.addEventListener('status-filter-click', e => {
  const { status } = e.detail;
  if (store.statusFilter === status) {
    store.statusFilter = 'all';
    document.querySelectorAll(`[data-status="${status}"]`).forEach(b => b.classList.remove('active'));
  } else {
    store.statusFilter = status;
    document.querySelectorAll('[data-status]').forEach(b => b.classList.remove('active'));
    document.querySelectorAll(`[data-status="${status}"]`).forEach(b => b.classList.add('active'));
  }
  resetAndReload();
});

// ── Événements modal ──────────────────────────────────────────

els.modalClose.addEventListener('click', closeModal);
els.modalOverlay.addEventListener('click', e => { if (e.target === els.modalOverlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !els.modalOverlay.hidden) closeModal(); });

// ── Init ──────────────────────────────────────────────────────

async function init() {
  bindDrawerEvents();
  try {
    await Promise.all([loadCatchesMap(), populateTypeFilters()]);
  } catch (err) {
    console.error('[init]', err);
  }
  loadPokemon(false);
}

initAuth().then(ok => { if (ok) init(); });
