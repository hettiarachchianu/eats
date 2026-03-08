// ============================================================
//  ELLA EATS — SCORING MODULE
//  Implements the Bayesian-adjusted composite scoring algorithm.
//
//  METHODOLOGY OVERVIEW:
//  Raw platform ratings are adjusted using a Bayesian confidence
//  model before being combined into a composite score. This prevents
//  venues with very few reviews from appearing artificially high or low.
//
//  The confidence of a rating is calculated as:
//    confidence = reviewCount / (reviewCount + threshold)
//
//  Where "threshold" is the median TripAdvisor review count across all
//  venues — the point at which a venue has reached 50% confidence.
//
//  The Bayesian-adjusted rating is then:
//    adjusted = (confidence × rawRating) + ((1 - confidence) × globalAverage)
//
//  Finally, the composite score is the weighted sum of both platforms:
//    compositeScore = (googleAdjusted × googleWeight) + (taAdjusted × taWeight)
//    Normalised to /10 by dividing by RATING_MAX and multiplying by DISPLAY_MAX.
// ============================================================


/**
 * Calculates the global average rating across all venues and both platforms.
 * Used as the prior mean in the Bayesian adjustment.
 *
 * @param {Object[]} venues - Array of venue objects with rating and tripadvisor data
 * @returns {number} Mean rating across all venues and platforms
 */
function getGlobalAverage(venues) {
  const allRatings = venues.flatMap(venue => {
    const ratings = [venue.rating];
    if (venue.tripadvisor?.rating) ratings.push(venue.tripadvisor.rating);
    return ratings;
  });

  if (!allRatings.length) return 4.0; // Safe fallback default
  return allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length;
}


/**
 * Calculates the Bayesian threshold from the median TripAdvisor review count.
 * At this review count, confidence = 50% (rating is equally weighted with prior).
 *
 * @param {Object[]} venues - Array of venue objects
 * @returns {number} Threshold value (minimum 10)
 */
function getBayesianThreshold(venues) {
  const reviewCounts = venues
    .map(venue => venue.tripadvisor?.reviewCount || 0)
    .filter(count => count > 0)
    .sort((a, b) => a - b);

  if (!reviewCounts.length) return 50; // Fallback if no TA data

  const midIndex = Math.floor(reviewCounts.length / 2);
  const median = reviewCounts.length % 2 === 0
    ? (reviewCounts[midIndex - 1] + reviewCounts[midIndex]) / 2
    : reviewCounts[midIndex];

  return Math.max(Math.round(median), 10); // Minimum threshold of 10
}


/**
 * Applies Bayesian confidence adjustment to a single platform rating.
 * Low review counts are pulled toward the global average (the prior).
 * High review counts are trusted closer to their raw value.
 *
 * @param {number} rawRating    - The platform's raw star rating
 * @param {number} reviewCount  - Number of reviews for this venue on this platform
 * @param {number} globalAvg    - Global mean rating used as Bayesian prior
 * @param {number} threshold    - Review count at which confidence = 50%
 * @returns {number} Bayesian-adjusted rating
 */
function bayesianAdjust(rawRating, reviewCount, globalAvg, threshold) {
  const count = reviewCount || 0;
  const confidence = count / (count + threshold);
  return (confidence * rawRating) + ((1 - confidence) * globalAvg);
}


/**
 * Calculates the final composite score for a single venue.
 * Applies Bayesian adjustment to each available platform rating,
 * then combines them using the survey-derived weights.
 *
 * @param {number}      googleRating    - Google Maps raw rating (out of 5)
 * @param {number|null} taRating        - TripAdvisor raw rating, or null if unavailable
 * @param {number}      googleWeight    - Weight for Google Maps (e.g. 0.60)
 * @param {number}      taWeight        - Weight for TripAdvisor (e.g. 0.40)
 * @param {number}      googleReviews   - Google Maps review count
 * @param {number}      taReviews       - TripAdvisor review count
 * @param {number}      globalAvg       - Bayesian prior (global average rating)
 * @param {number}      threshold       - Bayesian threshold (50% confidence point)
 * @returns {number} Composite score normalised to DISPLAY_MAX (/10)
 */
function calculateCompositeScore(
  googleRating, taRating,
  googleWeight, taWeight,
  googleReviews, taReviews,
  globalAvg, threshold
) {
  const googleAdjusted = bayesianAdjust(googleRating, googleReviews, globalAvg, threshold);
  const taAdjusted     = taRating
    ? bayesianAdjust(taRating, taReviews, globalAvg, threshold)
    : null;

  let rawScore;
  if (taAdjusted !== null) {
    // Both platforms connected — use full weighted composite
    rawScore = (googleAdjusted * googleWeight) + (taAdjusted * taWeight);
  } else {
    // TripAdvisor not connected — fall back to Google-only score
    rawScore = googleAdjusted;
  }

  // Normalise from RATING_MAX (/5) to DISPLAY_MAX (/10)
  return (rawScore / CONFIG.RATING_MAX) * CONFIG.DISPLAY_MAX;
}


/**
 * Merges Google and TripAdvisor data arrays into enriched venue objects,
 * computing global stats and composite scores for each venue.
 *
 * @param {Object[]} googleData - Venues from Google Places API
 * @param {Object[]} taData     - TripAdvisor data aligned by index
 * @returns {Object[]} Merged venue array with composite scores
 */
function mergeAndScore(googleData, taData) {
  const venues = googleData.map((venue, index) => ({
    ...venue,
    tripadvisor: taData[index],
  }));

  // Calculate global stats from the full dataset
  const globalAvg = getGlobalAverage(venues);
  const threshold = getBayesianThreshold(venues);

  // Attach score metadata to each venue
  return venues.map(venue => ({
    ...venue,
    googleWeight: CONFIG.DEFAULT_GOOGLE_WEIGHT,
    tripWeight:   CONFIG.DEFAULT_TRIP_WEIGHT,
    combinedScore: calculateCompositeScore(
      venue.rating,
      venue.tripadvisor?.rating ?? null,
      CONFIG.DEFAULT_GOOGLE_WEIGHT,
      CONFIG.DEFAULT_TRIP_WEIGHT,
      venue.reviewCount || 0,
      venue.tripadvisor?.reviewCount || 0,
      globalAvg,
      threshold
    ),
    _meta: { globalAvg, threshold }, // Attach for display in card breakdown
  }));
}
