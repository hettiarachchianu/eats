// ============================================================
//  ELLA EATS — UNIT TESTS: Scoring Module
//  Tests the Bayesian-adjusted composite scoring algorithm.
//
//  Run with:  node tests/scoring.test.js
//  (No test framework required — uses Node's built-in assert)
// ============================================================

const assert = require('assert');

// ── Inline the scoring functions for isolated testing ────────
// (In a module-based build these would be imported via require/import)

function bayesianAdjust(rawRating, reviewCount, globalAvg, threshold) {
  const count = reviewCount || 0;
  const confidence = count / (count + threshold);
  return (confidence * rawRating) + ((1 - confidence) * globalAvg);
}

function calculateCompositeScore(
  googleRating, taRating,
  googleWeight, taWeight,
  googleReviews, taReviews,
  globalAvg, threshold,
  ratingMax = 5.0,
  displayMax = 10.0
) {
  const googleAdjusted = bayesianAdjust(googleRating, googleReviews, globalAvg, threshold);
  const taAdjusted     = taRating
    ? bayesianAdjust(taRating, taReviews, globalAvg, threshold)
    : null;

  let rawScore;
  if (taAdjusted !== null) {
    rawScore = (googleAdjusted * googleWeight) + (taAdjusted * taWeight);
  } else {
    rawScore = googleAdjusted;
  }

  return (rawScore / ratingMax) * displayMax;
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

function assertClose(actual, expected, tolerance = 0.001, message = '') {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    throw new Error(
      `${message} Expected ~${expected} (±${tolerance}), got ${actual} (diff: ${diff})`
    );
  }
}


// ── Tests: bayesianAdjust ─────────────────────────────────────

console.log('\nbayesianAdjust()');

test('returns globalAvg when reviewCount is 0', () => {
  const result = bayesianAdjust(5.0, 0, 4.0, 50);
  assertClose(result, 4.0);
});

test('returns rawRating when reviewCount is very large (high confidence)', () => {
  const result = bayesianAdjust(4.5, 100000, 4.0, 50);
  assertClose(result, 4.5, 0.01);
});

test('returns exact midpoint when reviewCount equals threshold (50% confidence)', () => {
  // confidence = 50 / (50 + 50) = 0.5
  // adjusted = (0.5 × 4.8) + (0.5 × 4.0) = 4.4
  const result = bayesianAdjust(4.8, 50, 4.0, 50);
  assertClose(result, 4.4);
});

test('pulls a low rating UP toward global average when reviews are few', () => {
  const raw = 2.0;
  const globalAvg = 4.0;
  const result = bayesianAdjust(raw, 5, globalAvg, 50);
  assert(result > raw, `Adjusted (${result}) should be greater than raw (${raw})`);
});

test('pulls a high rating DOWN toward global average when reviews are few', () => {
  const raw = 5.0;
  const globalAvg = 4.0;
  const result = bayesianAdjust(raw, 5, globalAvg, 50);
  assert(result < raw, `Adjusted (${result}) should be less than raw (${raw})`);
});

test('is deterministic — same inputs always give same output', () => {
  const r1 = bayesianAdjust(4.3, 120, 4.1, 45);
  const r2 = bayesianAdjust(4.3, 120, 4.1, 45);
  assert.strictEqual(r1, r2);
});


// ── Tests: calculateCompositeScore ────────────────────────────

console.log('\ncalculateCompositeScore()');

test('score is within 0–10 range for typical inputs', () => {
  const score = calculateCompositeScore(4.5, 4.0, 0.6, 0.4, 200, 80, 4.2, 50);
  assert(score >= 0 && score <= 10, `Score ${score} out of 0–10 range`);
});

test('Google-only score (taRating=null) is still within 0–10 range', () => {
  const score = calculateCompositeScore(4.2, null, 0.6, 0.4, 150, 0, 4.0, 50);
  assert(score >= 0 && score <= 10, `Score ${score} out of 0–10 range`);
});

test('higher raw rating produces higher composite score (all else equal)', () => {
  const lower  = calculateCompositeScore(3.5, 4.0, 0.6, 0.4, 200, 100, 4.0, 50);
  const higher = calculateCompositeScore(4.8, 4.0, 0.6, 0.4, 200, 100, 4.0, 50);
  assert(higher > lower, `higher rating (${higher}) should exceed lower (${lower})`);
});

test('more reviews produce a score closer to the raw rating (higher confidence)', () => {
  const fewReviews  = calculateCompositeScore(5.0, null, 0.6, 0.4, 5,   0, 4.0, 50);
  const manyReviews = calculateCompositeScore(5.0, null, 0.6, 0.4, 500, 0, 4.0, 50);
  assert(manyReviews > fewReviews,
    `Many-review score (${manyReviews}) should be higher than few-review score (${fewReviews})`);
});

test('weights sum to 1.0 — Google 0.6 + TA 0.4 gives expected composite', () => {
  // With very high review counts, Bayesian adjustment is negligible
  // Expected: (4.5 × 0.6 + 4.0 × 0.4) / 5.0 × 10 = (2.7 + 1.6) / 5 × 10 = 8.6
  const score = calculateCompositeScore(4.5, 4.0, 0.6, 0.4, 100000, 100000, 4.2, 50);
  assertClose(score, 8.6, 0.05);
});

test('a perfect 5/5 on both platforms approaches 10/10', () => {
  const score = calculateCompositeScore(5.0, 5.0, 0.6, 0.4, 100000, 100000, 4.5, 50);
  assertClose(score, 10.0, 0.05);
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
