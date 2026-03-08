// ============================================================
//  ELLA EATS — FILTERS MODULE
//  Handles search, filter, sort, and active-filter display logic.
//  All functions operate on the global state object (AppState).
// ============================================================


// ── Search ────────────────────────────────────────────────────

/**
 * Handles live search input changes.
 * Matches against venue name, type tags, and cuisine tags.
 */
function onSearch() {
  AppState.query = document.getElementById('sInp').value.toLowerCase().trim();
  document.getElementById('sClear').style.display = AppState.query ? 'block' : 'none';
  updateActiveFiltersDisplay();
  render();
}

/** Clears the search input and re-renders. */
function clearSearch() {
  document.getElementById('sInp').value = '';
  AppState.query = '';
  document.getElementById('sClear').style.display = 'none';
  updateActiveFiltersDisplay();
  render();
}


// ── Minimum Score Slider ───────────────────────────────────────

/**
 * Handles changes to the minimum combined score slider.
 * Updates the displayed label and fill bar, then re-renders.
 */
function onMinScore() {
  const value = parseFloat(document.getElementById('minSl').value);
  AppState.minScore = value;
  document.getElementById('minVal').textContent = value > 0 ? '>= ' + value.toFixed(1) : 'Any';
  document.getElementById('minFill').style.width = (value / 10 * 100) + '%';
  updateActiveFiltersDisplay();
  render();
}


// ── Filter Button Helpers ──────────────────────────────────────

/**
 * Sets the active venue type filter (All / Restaurant / Cafe / Bar).
 * @param {HTMLElement} activeBtn - The clicked button element
 * @param {string} filterValue    - Filter key matching venue.type values
 */
function setTypeFilter(activeBtn, filterValue) {
  document.querySelectorAll('[data-f]').forEach(btn => btn.classList.remove('on'));
  activeBtn.classList.add('on');
  AppState.typeFilter = filterValue;
  updateActiveFiltersDisplay();
  render();
}

/**
 * Sets the active price range filter.
 * @param {HTMLElement} activeBtn - The clicked button element
 * @param {string} priceLevel     - Google price level constant
 */
function setPriceFilter(activeBtn, priceLevel) {
  document.querySelectorAll('[data-price]').forEach(btn => btn.classList.remove('on'));
  activeBtn.classList.add('on');
  AppState.priceFilter = priceLevel;
  updateActiveFiltersDisplay();
  render();
}

/**
 * Sets the active cuisine filter (populated from live TripAdvisor data).
 * @param {HTMLElement} activeBtn - The clicked button element
 * @param {string} cuisineName    - Cuisine name string
 */
function setCuisineFilter(activeBtn, cuisineName) {
  document.querySelectorAll('[data-cuisine]').forEach(btn => btn.classList.remove('on'));
  activeBtn.classList.add('on');
  AppState.cuisineFilter = cuisineName;
  updateActiveFiltersDisplay();
  render();
}

/**
 * Sets the active sort method (combined / google / trip / reviews).
 * @param {HTMLElement} activeBtn - The clicked button element
 * @param {string} sortKey        - Sort method key
 */
function setSortMethod(activeBtn, sortKey) {
  document.querySelectorAll('[data-s2]').forEach(btn => btn.classList.remove('on'));
  activeBtn.classList.add('on');
  AppState.sortBy = sortKey;
  render();
}


// ── Clear All ─────────────────────────────────────────────────

/** Resets all filters and search state to defaults, then re-renders. */
function clearAllFilters() {
  AppState.query        = '';
  AppState.minScore     = 0;
  AppState.typeFilter   = 'all';
  AppState.priceFilter  = 'all';
  AppState.cuisineFilter = 'all';

  document.getElementById('sInp').value = '';
  document.getElementById('sClear').style.display = 'none';
  document.getElementById('minSl').value = 0;
  document.getElementById('minVal').textContent = 'Any';
  document.getElementById('minFill').style.width = '0%';

  document.querySelectorAll('[data-f]').forEach(btn =>
    btn.classList.toggle('on', btn.dataset.f === 'all'));
  document.querySelectorAll('[data-price]').forEach(btn =>
    btn.classList.toggle('on', btn.dataset.price === 'all'));
  document.querySelectorAll('[data-cuisine]').forEach(btn =>
    btn.classList.toggle('on', btn.dataset.cuisine === 'all'));

  updateActiveFiltersDisplay();
  render();
}


// ── Active Filters Chips Display ──────────────────────────────

/** Builds and shows the active filter chip bar when any filter is active. */
function updateActiveFiltersDisplay() {
  const filterBar   = document.getElementById('af');
  const tagsContainer = document.getElementById('afTags');

  const activeChips = [];
  if (AppState.query) activeChips.push(`"${AppState.query}"`);
  if (AppState.minScore > 0) activeChips.push(`Min score >= ${AppState.minScore.toFixed(1)}`);
  if (AppState.typeFilter !== 'all') activeChips.push(AppState.typeFilter);
  if (AppState.priceFilter && AppState.priceFilter !== 'all') {
    const priceLabels = {
      'PRICE_LEVEL_INEXPENSIVE': '£ Budget',
      'PRICE_LEVEL_MODERATE':    '££ Moderate',
      'PRICE_LEVEL_EXPENSIVE':   '£££ Expensive',
    };
    activeChips.push(priceLabels[AppState.priceFilter] || AppState.priceFilter);
  }
  if (AppState.cuisineFilter && AppState.cuisineFilter !== 'all') {
    activeChips.push(AppState.cuisineFilter);
  }

  filterBar.style.display = activeChips.length ? 'flex' : 'none';
  tagsContainer.innerHTML = activeChips
    .map(chip => `<span class="fchip">${chip}</span>`)
    .join('');
}


// ── Cuisine Filter Population ─────────────────────────────────

/**
 * Dynamically populates cuisine filter buttons from live TripAdvisor data.
 * Called once after both APIs have responded successfully.
 *
 * @param {Object[]} venues - Merged venue array with TripAdvisor data attached
 */
function populateCuisineFilters(venues) {
  const container = document.getElementById('cuisineFilters');
  if (!container) return;

  const uniqueCuisines = new Set();
  venues.forEach(venue =>
    (venue.tripadvisor?.cuisine || []).forEach(c => uniqueCuisines.add(c))
  );

  if (uniqueCuisines.size === 0) return;

  // Keep existing "All" button, append one button per cuisine
  const allButton = container.querySelector('[data-cuisine="all"]');
  container.innerHTML = '';
  if (allButton) container.appendChild(allButton);

  [...uniqueCuisines].sort().forEach(cuisineName => {
    const btn = document.createElement('button');
    btn.className      = 'fpill';
    btn.dataset.cuisine = cuisineName;
    btn.textContent    = cuisineName;
    btn.onclick        = () => setCuisineFilter(btn, cuisineName);
    container.appendChild(btn);
  });
}


// ── Apply Filters & Sort ──────────────────────────────────────

/**
 * Applies current AppState filters to the full venue list and returns
 * a filtered + sorted array for rendering.
 *
 * Ranking is always computed from the FULL (unfiltered) venue list so
 * that rank numbers stay consistent regardless of active filters.
 *
 * @param {Object[]} venues - Full venue array
 * @returns {{ filtered: Object[], rankMap: Object }} Filtered venues + rank lookup
 */
function applyFiltersAndSort(venues) {
  // Build global rank map from the complete sorted venue list
  const allSorted = [...venues].sort((a, b) => {
    if (AppState.sortBy === 'combined') return b.combinedScore - a.combinedScore;
    if (AppState.sortBy === 'google')   return b.rating - a.rating;
    if (AppState.sortBy === 'trip')     return (b.tripadvisor?.rating || 0) - (a.tripadvisor?.rating || 0);
    if (AppState.sortBy === 'reviews')
      return (b.reviewCount + (b.tripadvisor?.reviewCount || 0))
           - (a.reviewCount + (a.tripadvisor?.reviewCount || 0));
    return 0;
  });

  const rankMap = {};
  allSorted.forEach((venue, index) => { rankMap[venue.placeId] = index; });

  // Apply filters
  const filtered = venues.filter(venue => {
    if (AppState.query) {
      const searchText = [
        venue.name,
        ...(venue.venueTypes || []),
        ...(venue.tripadvisor?.cuisine || []),
      ].join(' ').toLowerCase();
      if (!searchText.includes(AppState.query)) return false;
    }
    if (AppState.typeFilter !== 'all' && !(venue.venueTypes || []).includes(AppState.typeFilter)) return false;
    if (AppState.priceFilter && AppState.priceFilter !== 'all' && venue.priceLevel !== AppState.priceFilter) return false;
    if (AppState.cuisineFilter && AppState.cuisineFilter !== 'all' &&
        !(venue.tripadvisor?.cuisine || []).includes(AppState.cuisineFilter)) return false;
    if (AppState.minScore > 0 && venue.combinedScore < AppState.minScore) return false;
    return true;
  });

  // Sort filtered results by global rank order
  filtered.sort((a, b) => rankMap[a.placeId] - rankMap[b.placeId]);

  return { filtered, rankMap };
}
