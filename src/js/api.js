// ============================================================
//  ELLA EATS — API MODULE
//  Handles all external data fetching via Netlify serverless functions.
//
//  Google Places API calls are routed through /api/google-place
//  to protect the API key (stored in Netlify Environment Variables).
//
//  TripAdvisor API calls are also routed server-side via /api/tripadvisor
//  to keep the key out of the browser.
// ============================================================


/**
 * Fetches live Google Places data for all configured venues.
 * Calls the Netlify serverless function at /api/google-place.
 *
 * Uses Promise.allSettled so a single failed venue does not block the rest.
 *
 * @returns {Promise<{data: Object[], failed: string[]}>}
 *   data   — successfully fetched venue objects
 *   failed — names of venues that could not be fetched
 */
async function fetchGoogleData() {
  const results = await Promise.allSettled(
    CONFIG.VENUES.map(async venue => {
      const response = await fetch(`/api/google-place?placeId=${venue.placeId}`);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return { ...data, venueTypes: venue.type };
    })
  );

  const data   = [];
  const failed = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      data.push(result.value);
    } else {
      failed.push(CONFIG.VENUES[index].name);
    }
  });

  return { data, failed };
}


/**
 * Fetches TripAdvisor ratings for all venues in the Google dataset.
 *
 * NOTE ON API KEY EXPOSURE:
 * The TripAdvisor free plan explicitly requires browser-side (client-side) API calls.
 * Server-side calls return HTTP 403 on the free tier.
 * Therefore, the API key is intentionally stored in config.js and called directly
 * from the browser — this is the intended and documented usage for this plan.
 * See: https://tripadvisor-content-api.readme.io/reference/overview
 *
 * Uses Promise.allSettled — venues without a taLocationId or
 * that fail the API call return null (handled gracefully by scoring module).
 *
 * @param {Object[]} googleVenues - Venues from fetchGoogleData()
 * @returns {Promise<(Object|null)[]>} Array aligned with googleVenues; null = no TA data
 */
async function fetchTripAdvisorData(googleVenues) {
  if (!CONFIG.TRIPADVISOR_ENABLED) {
    return googleVenues.map(() => null);
  }

  // Build a lookup map: placeId → venue config
  const venueConfigMap = {};
  CONFIG.VENUES.forEach(venue => {
    venueConfigMap[venue.placeId] = venue;
  });

  const results = await Promise.allSettled(
    googleVenues.map(async googleVenue => {
      const venueConfig = venueConfigMap[googleVenue.placeId];
      if (!venueConfig?.taLocationId) return null;

      // Direct browser-side call — required by TripAdvisor free plan
      const url = `https://api.content.tripadvisor.com/api/v1/location/${venueConfig.taLocationId}/details`
        + `?key=${CONFIG.TRIPADVISOR_KEY}&language=en&currency=LKR`;

      const response = await fetch(url, {
        method: 'GET',
        headers: { accept: 'application/json' },
      });

      if (!response.ok) {
        console.warn(`TripAdvisor HTTP ${response.status} for ${googleVenue.name}`);
        return null;
      }

      const data = await response.json();

      if (data.error || !data.rating) {
        console.warn(`TripAdvisor: no rating returned for ${googleVenue.name}`);
        return null;
      }

      return {
        rating:      parseFloat(data.rating),
        reviewCount: parseInt(data.num_reviews) || 0,
        ranking:     data.ranking_data?.ranking_string || '',
        cuisine:     (data.cuisine || []).map(c => c.name),
        webUrl:      data.web_url || '',
        source:      'tripadvisor_api',
      };
    })
  );

  return results.map(result => result.status === 'fulfilled' ? result.value : null);
}
