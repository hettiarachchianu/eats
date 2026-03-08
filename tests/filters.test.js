// ============================================================
//  ELLA EATS — UNIT TESTS: Filters Module
//  Tests search, type, price, cuisine, and minimum score filtering.
//
//  Run with:  node tests/filters.test.js
// ============================================================

const assert = require('assert');

// ── Sample test data ──────────────────────────────────────────

const MOCK_VENUES = [
  {
    placeId:      'place_001',
    name:         'Cafe Eden',
    rating:       4.5,
    reviewCount:  320,
    combinedScore: 9.1,
    venueTypes:   ['cafe', 'restaurant'],
    priceLevel:   'PRICE_LEVEL_MODERATE',
    tripadvisor:  { rating: 4.0, reviewCount: 85, cuisine: ['Sri Lankan', 'Vegetarian Friendly'], source: 'tripadvisor_api' },
  },
  {
    placeId:      'place_002',
    name:         'Matey Hut Ella',
    rating:       4.2,
    reviewCount:  150,
    combinedScore: 8.4,
    venueTypes:   ['restaurant'],
    priceLevel:   'PRICE_LEVEL_INEXPENSIVE',
    tripadvisor:  { rating: 4.5, reviewCount: 200, cuisine: ['Asian', 'Sri Lankan'], source: 'tripadvisor_api' },
  },
  {
    placeId:      'place_003',
    name:         'The White Rabbit',
    rating:       3.8,
    reviewCount:  60,
    combinedScore: 7.2,
    venueTypes:   ['cafe', 'bar'],
    priceLevel:   'PRICE_LEVEL_EXPENSIVE',
    tripadvisor:  null,
  },
];

// ── Inline filter logic for isolated testing ──────────────────

function applyFilters(venues, state) {
  return venues.filter(venue => {
    if (state.query) {
      const searchText = [
        venue.name,
        ...(venue.venueTypes || []),
        ...(venue.tripadvisor?.cuisine || []),
      ].join(' ').toLowerCase();
      if (!searchText.includes(state.query)) return false;
    }
    if (state.typeFilter !== 'all' && !(venue.venueTypes || []).includes(state.typeFilter)) return false;
    if (state.priceFilter && state.priceFilter !== 'all' && venue.priceLevel !== state.priceFilter) return false;
    if (state.cuisineFilter && state.cuisineFilter !== 'all' &&
        !(venue.tripadvisor?.cuisine || []).includes(state.cuisineFilter)) return false;
    if (state.minScore > 0 && venue.combinedScore < state.minScore) return false;
    return true;
  });
}

// ── Test helpers ──────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`  ✓  ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ✗  ${description}`);
    console.error(`     ${err.message}`);
    failed++;
  }
}

const defaultState = {
  query: '', typeFilter: 'all', priceFilter: 'all',
  cuisineFilter: 'all', minScore: 0,
};


// ── Tests: Search ─────────────────────────────────────────────

console.log('\nSearch filter');

test('returns all venues when query is empty', () => {
  const result = applyFilters(MOCK_VENUES, defaultState);
  assert.strictEqual(result.length, 3);
});

test('matches venue by name (case-insensitive)', () => {
  const result = applyFilters(MOCK_VENUES, { ...defaultState, query: 'cafe eden' });
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].name, 'Cafe Eden');
});

test('matches venue by type tag', () => {
  const result = applyFilters(MOCK_VENUES, { ...defaultState, query: 'bar' });
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].name, 'The White Rabbit');
});

test('matches venue by cuisine from TripAdvisor', () => {
  const result = applyFilters(MOCK_VENUES, { ...defaultState, query: 'asian' });
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].name, 'Matey Hut Ella');
});

test('returns empty array when no match', () => {
  const result = applyFilters(MOCK_VENUES, { ...defaultState, query: 'nonexistent xyz' });
  assert.strictEqual(result.length, 0);
});


// ── Tests: Type Filter ────────────────────────────────────────

console.log('\nType filter');

test('"all" returns all venues', () => {
  const result = applyFilters(MOCK_VENUES, { ...defaultState, typeFilter: 'all' });
  assert.strictEqual(result.length, 3);
});

test('"cafe" returns only venues with cafe type', () => {
  const result = applyFilters(MOCK_VENUES, { ...defaultState, typeFilter: 'cafe' });
  assert(result.every(v => v.venueTypes.includes('cafe')));
  assert.strictEqual(result.length, 2);
});

test('"restaurant" returns only restaurant-type venues', () => {
  const result = applyFilters(MOCK_VENUES, { ...defaultState, typeFilter: 'restaurant' });
  assert.strictEqual(result.length, 2);
});


// ── Tests: Price Filter ───────────────────────────────────────

console.log('\nPrice filter');

test('inexpensive filter returns only budget venues', () => {
  const result = applyFilters(MOCK_VENUES, { ...defaultState, priceFilter: 'PRICE_LEVEL_INEXPENSIVE' });
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].name, 'Matey Hut Ella');
});

test('expensive filter returns only expensive venues', () => {
  const result = applyFilters(MOCK_VENUES, { ...defaultState, priceFilter: 'PRICE_LEVEL_EXPENSIVE' });
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].name, 'The White Rabbit');
});


// ── Tests: Cuisine Filter ─────────────────────────────────────

console.log('\nCuisine filter');

test('Sri Lankan cuisine filter returns two venues', () => {
  const result = applyFilters(MOCK_VENUES, { ...defaultState, cuisineFilter: 'Sri Lankan' });
  assert.strictEqual(result.length, 2);
});

test('Vegetarian Friendly filter returns one venue', () => {
  const result = applyFilters(MOCK_VENUES, { ...defaultState, cuisineFilter: 'Vegetarian Friendly' });
  assert.strictEqual(result.length, 1);
});

test('cuisine filter does not match venues with no TripAdvisor data', () => {
  const result = applyFilters(MOCK_VENUES, { ...defaultState, cuisineFilter: 'Asian' });
  assert(result.every(v => v.tripadvisor !== null));
});


// ── Tests: Minimum Score ──────────────────────────────────────

console.log('\nMinimum score filter');

test('minScore 0 returns all venues', () => {
  const result = applyFilters(MOCK_VENUES, { ...defaultState, minScore: 0 });
  assert.strictEqual(result.length, 3);
});

test('minScore 8.5 filters out venues below threshold', () => {
  const result = applyFilters(MOCK_VENUES, { ...defaultState, minScore: 8.5 });
  assert(result.every(v => v.combinedScore >= 8.5));
  assert.strictEqual(result.length, 1);
});

test('minScore 10 returns empty (no perfect venue)', () => {
  const result = applyFilters(MOCK_VENUES, { ...defaultState, minScore: 10 });
  assert.strictEqual(result.length, 0);
});


// ── Tests: Combined Filters ───────────────────────────────────

console.log('\nCombined filters');

test('cafe type + Sri Lankan cuisine returns one venue', () => {
  const state = { ...defaultState, typeFilter: 'cafe', cuisineFilter: 'Sri Lankan' };
  const result = applyFilters(MOCK_VENUES, state);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].name, 'Cafe Eden');
});


// ── Summary ───────────────────────────────────────────────────

console.log(`\n${'─'.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('Some tests failed.');
  process.exit(1);
} else {
  console.log('All tests passed.');
}
