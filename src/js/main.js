// ============================================================
//  ELLA EATS — MAIN ENTRY POINT
//  Initialises the application on DOMContentLoaded.
//  Orchestrates the API fetch sequence and wires up the UI.
//
//  Module load order (defined in index.html):
//    1. config.js   — CONFIG constant (venues, weights, settings)
//    2. scoring.js  — Bayesian scoring functions
//    3. api.js      — API fetch functions
//    4. filters.js  — Filter/search/sort logic + AppState mutation
//    5. ui.js       — DOM rendering functions
//    6. main.js     — This file (entry point)
// ============================================================


// ── Application State ─────────────────────────────────────────
// Central state object shared across all modules.
// Modules read from and write to AppState; never hold their own state.

const AppState = {
  venues:        [],                           // Merged venue array (set after API fetch)
  googleWeight:  CONFIG.DEFAULT_GOOGLE_WEIGHT, // Composite score weight for Google
  taWeight:      CONFIG.DEFAULT_TRIP_WEIGHT,   // Composite score weight for TripAdvisor
  sortBy:        'combined',                   // Active sort method
  typeFilter:    'all',                        // Active venue type filter
  priceFilter:   'all',                        // Active price level filter
  cuisineFilter: 'all',                        // Active cuisine filter
  query:         '',                           // Active search query string
  minScore:      0,                            // Active minimum combined score filter
  globalAvg:     4.0,                          // Bayesian prior (updated after data load)
  threshold:     50,                           // Bayesian threshold (updated after data load)
};


// ── Application Initialisation ────────────────────────────────

/**
 * Main entry point. Runs on DOMContentLoaded.
 * Fetches Google and TripAdvisor data, merges and scores venues,
 * then triggers the initial render.
 */
async function init() {
  updateFormulaDisplay();
  setGoogleStatus('loading', 'loading', 'Connecting...');
  setTripAdvisorStatus('loading', 'loading', 'Connecting...');

  try {
    // Step 1: Fetch Google Places data for all venues
    setGoogleStatus('loading', 'loading', 'Fetching venues...');
    const { data: googleData, failed } = await fetchGoogleData();

    if (!googleData.length) throw new Error('NO_DATA');

    setGoogleStatus('live', 'live', `Live — ${googleData.length} venues`);
    setSourceBadge('gBadge', 'live', 'LIVE API');

    // Step 2: Fetch TripAdvisor ratings aligned with Google venues
    setTripAdvisorStatus('loading', 'loading', 'Fetching ratings...');
    const taData = await fetchTripAdvisorData(googleData);
    const taLiveCount = taData.filter(t => t?.source === 'tripadvisor_api').length;

    // Step 3: Merge datasets and calculate composite scores
    const merged = mergeAndScore(googleData, taData);
    AppState.venues        = merged;
    AppState.globalAvg     = merged[0]?._meta?.globalAvg || 4.0;
    AppState.threshold     = merged[0]?._meta?.threshold  || 50;
    AppState.priceFilter   = AppState.priceFilter   || 'all';
    AppState.cuisineFilter = AppState.cuisineFilter || 'all';

    // Step 4: Render UI
    showSection('venSec');
    populateCuisineFilters(AppState.venues);
    render();
    updatePlatformStats(AppState.venues);

    // Step 5: Update TripAdvisor connection status
    if (taLiveCount > 0) {
      setTripAdvisorStatus('live', 'live', `Live — ${taLiveCount} venues`);
      setSourceBadge('taBadge', 'live', 'LIVE API');
      document.getElementById('taNoteBar').style.display = 'none';
    } else {
      setTripAdvisorStatus('offline', 'offline', 'Not connected');
      setSourceBadge('taBadge', 'offline', 'NOT CONNECTED');
      document.getElementById('taAvgNote').textContent = 'Not connected';
    }

    // Step 6: Stamp last-updated timestamp
    const now     = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById('updated').textContent = `Data updated: ${dateStr} ${timeStr}`;

    // Step 7: Warn about any venues that failed to load
    if (failed.length) {
      showWarningBanner(`Could not load: ${failed.join(', ')}. Check API key restrictions.`);
    }

  } catch (error) {
    console.error('Ella Eats init error:', error);

    if (error.message === 'NO_DATA' || error.message === 'NO_KEY') {
      setGoogleStatus('error', 'error', 'Failed');
      showSection('errSec');
    } else {
      setGoogleStatus('error', 'error', 'Error: ' + error.message);
      setTripAdvisorStatus('offline', 'offline', 'Not connected');
      showSection('errSec');
    }
  }
}

document.addEventListener('DOMContentLoaded', init);
