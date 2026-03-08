# Composite Scoring Methodology

## Overview

The Ella Eats rating system combines data from Google Maps and TripAdvisor into a single composite score using a **Bayesian-adjusted weighted average**. The methodology was designed to address two key challenges specific to the Sri Lankan context:

1. **Platform trust disparity** — Survey respondents trusted Google Maps more than TripAdvisor
2. **Review volume disparity** — TripAdvisor has far fewer Sri Lanka reviews than Google Maps

---

## Step 1: Survey-Derived Weights

Weights are not arbitrary — they are calculated from primary research data collected via a structured questionnaire (Q8: "How much do you trust each platform's ratings?").

| Platform       | Mean Trust Score | Proportional Weight |
|----------------|-----------------|---------------------|
| Google Maps    | 3.8 / 5          | 56.7% → rounded to **60%** |
| TripAdvisor    | 2.9 / 5          | 43.3% → rounded to **40%** |

These weights are fixed in `config.js` and are not user-adjustable, as changing them would invalidate the research-backed methodology.

---

## Step 2: Global Reference Values

Before scoring, two global values are calculated from the full venue dataset:

### Global Average
The mean rating across all venues on both platforms. This serves as the **Bayesian prior** — the "expected" rating for a venue we know nothing about.

```
globalAverage = mean of all ratings (Google + TripAdvisor) across all venues
```

### Bayesian Threshold
The median TripAdvisor review count across all venues. At this review count, a venue has exactly **50% confidence** — its rating is weighted equally between the raw rating and the prior.

```
threshold = median(TripAdvisor review counts across all venues)
minimum   = 10 (floor to prevent division issues with very sparse data)
```

---

## Step 3: Bayesian Confidence Adjustment

Each platform rating is adjusted individually before weighting:

```
confidence    = reviewCount / (reviewCount + threshold)
adjustedRating = (confidence × rawRating) + ((1 - confidence) × globalAverage)
```

**Effect on venue ratings:**

| Review Count vs Threshold | Confidence | Effect |
|--------------------------|-----------|--------|
| Far below threshold       | < 30%     | Rating pulled strongly toward global average |
| Equal to threshold        | 50%       | Rating split equally between raw and average |
| Far above threshold       | > 90%     | Rating is close to its raw value |

This prevents a venue with 3 reviews and a 5-star rating from ranking higher than a venue with 300 reviews and a 4.8-star rating.

---

## Step 4: Weighted Composite Score

```
compositeScore  = (googleAdjusted × 0.60) + (taAdjusted × 0.40)
normalisedScore = (compositeScore / 5.0) × 10
```

The score is normalised from a 0–5 scale to a 0–10 display scale for readability.

### Fallback (TripAdvisor not connected)

If TripAdvisor data is unavailable, the score falls back to Google-only (still Bayesian-adjusted):

```
compositeScore  = googleAdjusted
normalisedScore = (googleAdjusted / 5.0) × 10
```

---

## Limitations and Future Work

- Weights are rounded from the raw survey proportions (56.7%/43.3% → 60%/40%)
- The threshold is recalculated dynamically each time data loads, so it may vary slightly if venues are added or removed
- TripAdvisor review counts for Sri Lanka are generally low, which reduces TripAdvisor's effective influence even at its 40% nominal weight
