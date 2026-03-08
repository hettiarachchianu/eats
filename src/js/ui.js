// ============================================================
//  ELLA EATS — UI MODULE
//  Handles all DOM rendering: venue cards, status indicators,
//  summary stats, photo modals, and collapsible panels.
// ============================================================


// ── Section Visibility ────────────────────────────────────────

/**
 * Shows one of the three main content sections (loading / error / venues)
 * and hides the other two.
 * @param {'loadSec'|'errSec'|'venSec'} sectionId
 */
function showSection(sectionId) {
  ['loadSec', 'errSec', 'venSec'].forEach(id => {
    document.getElementById(id).style.display = id === sectionId ? 'block' : 'none';
  });
}

/**
 * Displays a dismissible warning banner at the top of main content.
 * Used for partial failures (e.g. some venues could not be loaded).
 * @param {string} message - Warning text to display
 */
function showWarningBanner(message) {
  const banner = document.createElement('div');
  banner.style.cssText = 'padding:10px 14px;border-radius:6px;background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.25);color:#f59e0b;font-size:12px;margin-bottom:12px;font-family:monospace';
  banner.textContent = message;
  document.querySelector('main').prepend(banner);
}


// ── Status Indicators ─────────────────────────────────────────

/**
 * Updates the Google Maps status pill in the header.
 * @param {string} pillState - CSS data-s value ('loading'|'live'|'error')
 * @param {string} dotState  - CSS data-s value for dot colour
 * @param {string} text      - Status label text
 */
function setGoogleStatus(pillState, dotState, text) {
  const pill = document.getElementById('gPill');
  const dot  = document.getElementById('gDot');
  const label = document.getElementById('gTxt');
  if (pill)  pill.dataset.s  = pillState;
  if (dot)   dot.dataset.s   = dotState;
  if (label) label.textContent = text;
}

/**
 * Updates the TripAdvisor status pill in the header.
 * @param {string} pillState
 * @param {string} dotState
 * @param {string} text
 */
function setTripAdvisorStatus(pillState, dotState, text) {
  const pill  = document.getElementById('taPill');
  const dot   = document.getElementById('taDot');
  const label = document.getElementById('taTxt');
  if (pill)  pill.dataset.s  = pillState;
  if (dot)   dot.dataset.s   = dotState;
  if (label) label.textContent = text;
}

/**
 * Updates a source badge element (LIVE API / NOT CONNECTED / LOADING / ERROR).
 * @param {string} elementId - DOM id of the badge element
 * @param {'live'|'offline'|'error'|'loading'} type
 * @param {string} text      - Badge label text
 */
function setSourceBadge(elementId, type, text) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = text;
  const classMap = {
    live:    'b-live',
    offline: 'b-offline',
    error:   'b-error',
    loading: 'b-loading',
  };
  el.className = 'src-badge ' + (classMap[type] || 'b-loading');
}


// ── Summary Stats ─────────────────────────────────────────────

/**
 * Updates the top-level platform stats (average rating, total reviews).
 * Called once after both API calls complete.
 * @param {Object[]} venues - Full venue array
 */
function updatePlatformStats(venues) {
  const googleAvg = venues.reduce((sum, v) => sum + v.rating, 0) / venues.length;
  const googleRevTotal = venues.reduce((sum, v) => sum + v.reviewCount, 0);
  document.getElementById('gAvg').textContent = googleAvg.toFixed(2) + ' / 5';
  document.getElementById('gRev').textContent = googleRevTotal.toLocaleString();

  const taVenues = venues.filter(v => v.tripadvisor?.source === 'tripadvisor_api');
  if (taVenues.length) {
    const taAvg = taVenues.reduce((sum, v) => sum + v.tripadvisor.rating, 0) / taVenues.length;
    const taRevTotal = taVenues.reduce((sum, v) => sum + (v.tripadvisor.reviewCount || 0), 0);
    document.getElementById('taAvg').textContent = taAvg.toFixed(2) + ' / 5';
    document.getElementById('taRev').textContent = taRevTotal.toLocaleString();
    const taAvgNote = document.getElementById('taAvgNote');
    if (taAvgNote) taAvgNote.style.display = 'none';
  }

  document.getElementById('sumRow').style.display = 'grid';
}

/**
 * Updates the summary bar beneath the filter panel (top rated, average, etc.)
 * @param {Object[]} filteredVenues - Currently visible venues after filtering
 * @param {Object[]} allVenues      - Full venue list (for denominator count)
 */
function updateSummaryBar(filteredVenues, allVenues) {
  if (!filteredVenues.length) return;
  const topVenue = [...filteredVenues].sort((a, b) => b.combinedScore - a.combinedScore)[0];
  const avgScore = filteredVenues.reduce((sum, v) => sum + v.combinedScore, 0) / filteredVenues.length;
  const totalReviews = filteredVenues.reduce(
    (sum, v) => sum + v.reviewCount + (v.tripadvisor?.reviewCount || 0), 0
  );
  document.getElementById('sTop').textContent  = topVenue.name;
  document.getElementById('sAvg').textContent  = avgScore.toFixed(1) + ' / 10';
  document.getElementById('sRev').textContent  = totalReviews.toLocaleString() + '+';
  document.getElementById('sShow').textContent = filteredVenues.length + ' / ' + allVenues.length;
}


// ── Formula Display ───────────────────────────────────────────

/** Updates the formula display in the methodology panel. */
function updateFormulaDisplay() {
  const el = document.getElementById('formulaTxt');
  if (!el) return;
  el.textContent = `Score = (Google_Adjusted × ${CONFIG.DEFAULT_GOOGLE_WEIGHT.toFixed(2)}) + (TA_Adjusted × ${CONFIG.DEFAULT_TRIP_WEIGHT.toFixed(2)})  [/10]`;
}


// ── Panel Toggle ──────────────────────────────────────────────

/**
 * Toggles a collapsible panel open/closed.
 * @param {string} panelKey - Key used to find elements: {panelKey}Body and {panelKey}Btn
 */
function togglePanel(panelKey) {
  const body = document.getElementById(panelKey + 'Body');
  const btn  = document.getElementById(panelKey + 'Btn');
  if (!body) return;
  const isClosed = body.classList.toggle('closed');
  if (btn) btn.textContent = isClosed ? '+' : '-';
}


// ── Photo Modal ───────────────────────────────────────────────

/** @param {string} modalId - DOM id of the photo modal */
function openPhotoModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

/** @param {string} modalId - DOM id of the photo modal */
function closePhotoModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

// Close any open photo modal on Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.photo-modal').forEach(m => { m.style.display = 'none'; });
    document.body.style.overflow = '';
  }
});


// ── Collapsible Calculation Panel ─────────────────────────────

/**
 * Toggles the Bayesian calculation breakdown panel within a venue card.
 * @param {string} panelId - DOM id of the calc panel
 */
function toggleCalcPanel(panelId) {
  const panel = document.getElementById(panelId);
  const icon  = document.getElementById('icon-' + panelId);
  if (!panel) return;
  const isOpen = panel.style.display !== 'none';
  panel.style.display = isOpen ? 'none' : 'block';
  if (icon) icon.textContent = isOpen ? '▶' : '▼';
}


// ── Card Rendering Helpers ────────────────────────────────────

/**
 * Renders a rating bar HTML string.
 * @param {number} percentage - Fill proportion (0–1)
 * @param {string} colour     - CSS colour value for fill
 * @returns {string} HTML string
 */
function ratingBar(percentage, colour) {
  return `<div class="btrack"><div class="bfill" style="width:${Math.min(percentage * 100, 100)}%;background:${colour}"></div></div>`;
}

/**
 * Renders a circular SVG score ring.
 * @param {number} score - Score out of 10
 * @returns {string} SVG HTML string
 */
function scoreRing(score) {
  const percentage = Math.min(score / 10, 1);
  const radius     = 28;
  const circumference = 2 * Math.PI * radius;
  const dashLength    = percentage * circumference;
  const colour        = `hsl(${Math.round(percentage * 120)},70%,55%)`;

  return `<svg width="80" height="80" viewBox="0 0 72 72">
    <circle cx="36" cy="36" r="${radius}" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="5"/>
    <circle cx="36" cy="36" r="${radius}" fill="none" stroke="${colour}" stroke-width="5"
      stroke-dasharray="${dashLength} ${circumference - dashLength}"
      stroke-dashoffset="${circumference / 4}" stroke-linecap="round"/>
    <text x="36" y="40" text-anchor="middle" font-size="13" font-weight="700"
      fill="${colour}" font-family="monospace">${score.toFixed(1)}</text>
  </svg>`;
}

/**
 * Renders the TripAdvisor row within a venue card's score breakdown.
 * Shows live data if connected, or an offline message if not.
 * @param {Object} venue - Merged venue object
 * @returns {string} HTML string
 */
function renderTripAdvisorRow(venue) {
  const taData   = venue.tripadvisor;
  const taWeight = venue.tripWeight;
  const threshold = venue._meta?.threshold || 50;

  if (taData?.source === 'tripadvisor_api') {
    return `<div class="brow">
      <div class="blabel">
        <span class="sdot" style="background:#34e0a1"></span>TripAdvisor
        <span class="stag st-live">LIVE API</span>
      </div>
      <div class="bright">
        <span class="bscore" style="color:#34e0a1">${taData.rating.toFixed(1)}</span>
        ${ratingBar(taData.rating / CONFIG.RATING_MAX, '#34e0a1')}
        <span class="rcount">${taData.reviewCount.toLocaleString()} reviews</span>
        <span class="contrib">confidence ${(taData.reviewCount / (taData.reviewCount + threshold) * 100).toFixed(0)}% → x${taWeight.toFixed(2)}</span>
      </div>
    </div>`;
  }

  const offlineReason = !CONFIG.TRIPADVISOR_ENABLED
    ? 'TRIPADVISOR_ENABLED is false in config.js'
    : 'TA_API_KEY not in Netlify Environment Variables';

  return `<div class="brow dim">
    <div class="blabel">
      <span class="sdot" style="background:var(--t3)"></span>TripAdvisor
      <span class="stag st-offline">NOT CONNECTED</span>
    </div>
    <div class="bright"><span class="offline-msg">No data — ${offlineReason}</span></div>
  </div>`;
}

/**
 * Returns a price tag HTML span for a given Google price level constant.
 * @param {string} level - e.g. 'PRICE_LEVEL_MODERATE'
 * @returns {string} HTML string (empty string if level is unrecognised)
 */
function priceTag(level) {
  const priceMap = {
    'PRICE_LEVEL_FREE':            { symbol: 'Free',  colour: '#22c55e' },
    'PRICE_LEVEL_INEXPENSIVE':     { symbol: '£',     colour: '#22c55e' },
    'PRICE_LEVEL_MODERATE':        { symbol: '££',    colour: '#f59e0b' },
    'PRICE_LEVEL_EXPENSIVE':       { symbol: '£££',   colour: '#ef4444' },
    'PRICE_LEVEL_VERY_EXPENSIVE':  { symbol: '££££',  colour: '#dc2626' },
  };
  const entry = priceMap[level];
  if (!entry) return '';
  return `<span class="price-tag" style="color:${entry.colour};border-color:${entry.colour}20;background:${entry.colour}10">${entry.symbol}</span>`;
}

/**
 * Builds a proxied Google Places photo URL via the Netlify function.
 * @param {string|null} photoName - Google photo reference name
 * @returns {string|null} URL or null if no photo available
 */
function buildPhotoUrl(photoName) {
  if (!photoName) return null;
  return `/api/google-place-photo?name=${encodeURIComponent(photoName)}`;
}


// ── Venue Card ────────────────────────────────────────────────

/**
 * Renders a complete venue card HTML string.
 * Includes photo, score ring, rating breakdown rows, Bayesian
 * calculation panel, and external links.
 *
 * @param {Object} venue - Merged venue object with all scoring data
 * @param {number} rank  - 0-based global rank (used for animation delay and label)
 * @returns {string} HTML string for the venue card article element
 */
function renderVenueCard(venue, rank) {
  const taData     = venue.tripadvisor;
  const isLiveTa   = taData?.source === 'tripadvisor_api';
  const combined   = venue.combinedScore;
  const googleWeight = venue.googleWeight;
  const taWeight   = venue.tripWeight;
  const globalAvg  = venue._meta?.globalAvg || 4.74;
  const threshold  = venue._meta?.threshold  || 50;

  const typeTags  = (venue.venueTypes || []).map(t => `<span class="vtag">${t}</span>`).join('');
  const cuisTags  = isLiveTa
    ? (taData.cuisine || []).slice(0, 3).map(c => `<span class="vtag vtag-dim">${c}</span>`).join('')
    : '';
  const openTag   = venue.isOpen === null ? ''
    : venue.isOpen ? '<span class="open-y">Open</span>' : '<span class="open-n">Closed</span>';
  const pTag      = priceTag(venue.priceLevel);
  const imgUrl    = buildPhotoUrl(venue.photoName);

  // Bayesian intermediate values for the calculation breakdown
  const googleConf    = venue.reviewCount / (venue.reviewCount + threshold);
  const googleAdjusted = bayesianAdjust(venue.rating, venue.reviewCount, globalAvg, threshold);
  const taConf        = isLiveTa ? taData.reviewCount / (taData.reviewCount + threshold) : null;
  const taAdjusted    = isLiveTa ? bayesianAdjust(taData.rating, taData.reviewCount, globalAvg, threshold) : null;

  const calcPanelId = `calc-${rank}`;
  const photoPanelId = `photo-${rank}`;

  const googleContrib = (googleAdjusted * googleWeight).toFixed(3);
  const taContrib     = taAdjusted !== null ? (taAdjusted * taWeight).toFixed(3) : null;

  const taOfflineWarning = !isLiveTa
    ? `<div class="ta-warn">TripAdvisor not connected — score is Google-only</div>`
    : '';

  return `<article class="vcard" style="animation-delay:${rank * 0.06}s">
    <div class="vrank">Rank #${rank + 1}</div>
    <div class="vcard-main">

      ${imgUrl ? `
      <div class="vphoto-panel" onclick="openPhotoModal('${photoPanelId}')" title="Click to enlarge">
        <img src="${imgUrl}" alt="${venue.name}" loading="lazy" onerror="this.parentElement.style.display='none'"/>
        <div class="vphoto-zoom"> </div>
      </div>` : ''}

      <div class="vcard-content">
        <div class="vhead">
          <div class="vhead-l">
            <div class="vname">${venue.name}</div>
            <div class="vtags">${typeTags}${openTag}${pTag}</div>
            <div class="vaddr">${venue.address}</div>
            ${taData?.ranking ? `<div class="vrank-ta">${taData.ranking}</div>` : ''}
            <div class="vtags">${cuisTags}</div>
          </div>
          <div class="vring">${scoreRing(combined)}<div class="ring-lbl">Combined</div></div>
        </div>

        ${taOfflineWarning}

        <div class="bdown">
          <div class="bdown-ttl">Score Breakdown</div>

          <!-- Google Maps row -->
          <div class="brow">
            <div class="blabel">
              <span class="sdot" style="background:#4285f4"></span>Google Maps
              <span class="stag st-live">LIVE API</span>
            </div>
            <div class="bright">
              <span class="bscore" style="color:#4285f4">${venue.rating.toFixed(1)}</span>
              ${ratingBar(venue.rating / CONFIG.RATING_MAX, '#4285f4')}
              <span class="rcount">${venue.reviewCount.toLocaleString()} reviews</span>
              <span class="conf-pill" style="background:rgba(66,133,244,.1);color:#4285f4">
                ${(googleConf * 100).toFixed(0)}% confidence
              </span>
            </div>
          </div>

          <!-- TripAdvisor row -->
          ${renderTripAdvisorRow(venue)}

          <!-- Bayesian Calculation Panel (collapsible) -->
          <div class="calc-toggle" onclick="toggleCalcPanel('${calcPanelId}')">
            <span class="calc-toggle-icon" id="icon-${calcPanelId}">▶</span>
            <span>Show Bayesian Calculation</span>
            <span class="calc-toggle-hint">— how this score was calculated</span>
          </div>

          <div class="calc-panel" id="${calcPanelId}" style="display:none">

            <div class="calc-section-title">① Global Reference Values</div>
            <div class="calc-grid">
              <div class="calc-item">
                <div class="calc-label">Global Average</div>
                <div class="calc-val">${globalAvg.toFixed(3)}</div>
                <div class="calc-desc">Mean of all venue ratings across both platforms</div>
              </div>
              <div class="calc-item">
                <div class="calc-label">Threshold</div>
                <div class="calc-val">${threshold}</div>
                <div class="calc-desc">Median TripAdvisor review count — 50% confidence point</div>
              </div>
            </div>

            <div class="calc-section-title">② Bayesian Confidence Adjustment</div>
            <div class="calc-grid">
              <div class="calc-item">
                <div class="calc-label" style="color:#4285f4">Google Maps</div>
                <div class="calc-formula-line">
                  confidence = ${venue.reviewCount} ÷ (${venue.reviewCount} + ${threshold}) = <strong>${(googleConf * 100).toFixed(1)}%</strong>
                </div>
                <div class="calc-formula-line">
                  adjusted = (${googleConf.toFixed(3)} × ${venue.rating.toFixed(1)}) + (${(1 - googleConf).toFixed(3)} × ${globalAvg.toFixed(3)})
                </div>
                <div class="calc-formula-line">
                  = ${(googleConf * venue.rating).toFixed(3)} + ${((1 - googleConf) * globalAvg).toFixed(3)} = <strong style="color:#4285f4">${googleAdjusted.toFixed(3)}</strong>
                </div>
                <div class="calc-verdict ${googleConf > 0.8 ? 'verdict-high' : googleConf > 0.5 ? 'verdict-mid' : 'verdict-low'}">
                  ${googleConf > 0.8 ? '✓ High confidence — rating is reliable' : '~ Moderate confidence — partial adjustment applied'}
                </div>
              </div>

              ${taAdjusted !== null ? `
              <div class="calc-item">
                <div class="calc-label" style="color:#34e0a1">TripAdvisor</div>
                <div class="calc-formula-line">
                  confidence = ${taData.reviewCount} ÷ (${taData.reviewCount} + ${threshold}) = <strong>${(taConf * 100).toFixed(1)}%</strong>
                </div>
                <div class="calc-formula-line">
                  adjusted = (${taConf.toFixed(3)} × ${taData.rating.toFixed(1)}) + (${(1 - taConf).toFixed(3)} × ${globalAvg.toFixed(3)})
                </div>
                <div class="calc-formula-line">
                  = ${(taConf * taData.rating).toFixed(3)} + ${((1 - taConf) * globalAvg).toFixed(3)} = <strong style="color:#34e0a1">${taAdjusted.toFixed(3)}</strong>
                </div>
                <div class="calc-verdict ${taConf > 0.8 ? 'verdict-high' : taConf > 0.5 ? 'verdict-mid' : 'verdict-low'}">
                  ${taConf > 0.8 ? '✓ High confidence — rating is reliable'
                    : taConf > 0.5 ? '~ Moderate confidence — partial adjustment applied'
                    : '↓ Low confidence — rating pulled toward average'}
                </div>
              </div>` : `
              <div class="calc-item">
                <div class="calc-label" style="color:var(--t3)">TripAdvisor</div>
                <div class="calc-formula-line" style="color:var(--t3)">Not connected — excluded from calculation</div>
              </div>`}
            </div>

            <div class="calc-section-title">③ Weighted Composite Score</div>
            <div class="calc-final">
              <div class="calc-formula-line">
                Score = (Google_adj × weight) + (TA_adj × weight)
              </div>
              <div class="calc-formula-line">
                = (${googleAdjusted.toFixed(3)} × ${googleWeight.toFixed(2)})
                ${taContrib !== null ? `+ (${taAdjusted.toFixed(3)} × ${taWeight.toFixed(2)})` : '[TA not connected]'}
              </div>
              <div class="calc-formula-line">
                = ${googleContrib} ${taContrib !== null ? `+ ${taContrib}` : ''}
                = ${taContrib !== null ? (parseFloat(googleContrib) + parseFloat(taContrib)).toFixed(3) : googleContrib} out of 5.0
              </div>
              <div class="calc-formula-line">
                Normalised to /10: ÷ 5.0 × 10 =
                <strong style="color:var(--accent);font-size:15px">${combined.toFixed(2)} / 10</strong>
              </div>
            </div>

          </div><!-- /calc-panel -->

          <!-- Final score summary row -->
          <div class="eq-row">
            <span class="eq-lbl">Final Score</span>
            <span class="eq-txt">
              Google(${venue.rating.toFixed(1)}→${googleAdjusted.toFixed(2)}) × ${googleWeight.toFixed(2)}
              ${taAdjusted !== null ? `+ TA(${taData.rating.toFixed(1)}→${taAdjusted.toFixed(2)}) × ${taWeight.toFixed(2)}` : ''}
              = <strong style="color:var(--accent)">${combined.toFixed(1)} / 10</strong>
            </span>
          </div>
        </div><!-- /bdown -->
      </div><!-- /vcard-content -->
    </div><!-- /vcard-main -->

    <div class="vfoot">
      <div class="dpills">
        <span class="dpill dp-live">Google: Live API</span>
        <span class="dpill ${isLiveTa ? 'dp-live' : 'dp-off'}">
          ${isLiveTa ? 'TripAdvisor: Live API' : 'TripAdvisor: Not connected'}
        </span>
      </div>
      <div class="elinks">
        ${venue.googleUrl ? `<a href="${venue.googleUrl}" target="_blank" class="elink">Google Maps</a>` : ''}
        ${isLiveTa && taData.webUrl ? `<a href="${taData.webUrl}" target="_blank" class="elink elink-ta">TripAdvisor</a>` : ''}
      </div>
    </div>

    ${imgUrl ? `
    <div class="photo-modal" id="${photoPanelId}" onclick="closePhotoModal('${photoPanelId}')">
      <div class="photo-modal-inner" onclick="event.stopPropagation()">
        <button class="photo-close" onclick="closePhotoModal('${photoPanelId}')">&times;</button>
        <img src="${imgUrl}" alt="${venue.name}"/>
        <div class="photo-caption">${venue.name} — Photo via Google Places</div>
      </div>
    </div>` : ''}

  </article>`;
}


// ── Main Render ───────────────────────────────────────────────

/**
 * Main render function. Applies current filters, recalculates scores,
 * and injects venue cards into the DOM grid.
 * Called whenever any filter, sort, or search state changes.
 */
function render() {
  if (!AppState.venues.length) return;

  // Recalculate composite scores using current state (weights may have changed)
  const globalAvg = AppState.globalAvg;
  const threshold  = AppState.threshold;

  AppState.venues.forEach(venue => {
    venue.combinedScore = calculateCompositeScore(
      venue.rating,
      venue.tripadvisor?.rating ?? null,
      AppState.googleWeight,
      AppState.taWeight,
      venue.reviewCount || 0,
      venue.tripadvisor?.reviewCount || 0,
      globalAvg,
      threshold
    );
    venue._meta = { globalAvg, threshold };
  });

  const { filtered, rankMap } = applyFiltersAndSort(AppState.venues);

  document.getElementById('noRes').style.display = filtered.length ? 'none' : 'flex';
  document.getElementById('vGrid').innerHTML = filtered
    .map(venue => renderVenueCard(venue, rankMap[venue.placeId]))
    .join('');

  updateSummaryBar(filtered, AppState.venues);
}
