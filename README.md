# Ella Eats — Combined Venue Rating System

A live venue rating dashboard for restaurants and cafes in **Ella, Sri Lanka**.  
Combines Google Maps and TripAdvisor ratings into a single composite score using a Bayesian-adjusted weighted formula derived from primary questionnaire research.

---

## Project Overview

This web application was built as part of a BSc (Hons) Computing research project investigating how tourists and locals in Ella, Sri Lanka discover and evaluate dining venues.

The composite scoring system weights platform ratings based on trust data collected from a structured questionnaire survey (n = respondents), then applies Bayesian confidence adjustment to account for disparities in review volume between platforms.

---

## Composite Scoring Methodology

### Survey-Derived Weights

| Platform       | Trust Score (Q8) | Proportional Weight |
|----------------|-----------------|---------------------|
| Google Maps    | 3.8 / 5          | **60%**             |
| TripAdvisor    | 2.9 / 5          | **40%**             |

### Bayesian Confidence Adjustment

Before weighting, each platform rating is adjusted using a Bayesian confidence model:

```
confidence    = reviewCount / (reviewCount + threshold)
adjustedRating = (confidence × rawRating) + ((1 - confidence) × globalAverage)
```

- **threshold** = median TripAdvisor review count across all venues (the 50% confidence point)
- **globalAverage** = mean rating across all venues on both platforms

This prevents venues with very few reviews from appearing artificially high or low.

### Final Composite Score Formula

```
compositeScore = (googleAdjusted × 0.60) + (taAdjusted × 0.40)
normalisedScore = (compositeScore / 5.0) × 10        → displayed out of /10
```

If TripAdvisor is not connected, the score falls back to Google-only (Bayesian-adjusted).

---

## Project Structure

```
ella-eats/
│
├── README.md                     ← This file
├── package.json                  ← Project metadata and test scripts
├── netlify.toml                  ← Netlify deployment and function routing
├── .env.example                  ← Required environment variable names
├── .gitignore
│
├── src/                          ← All frontend source files
│   ├── index.html                ← Single-page application shell
│   ├── css/
│   │   └── style.css             ← All styles
│   ├── js/
│   │   ├── config.js             ← Venue registry and formula constants
│   │   ├── scoring.js            ← Bayesian scoring algorithm (pure functions)
│   │   ├── api.js                ← Google and TripAdvisor API fetch functions
│   │   ├── filters.js            ← Search, filter, and sort logic
│   │   ├── ui.js                 ← DOM rendering and card generation
│   │   └── main.js               ← Entry point: AppState + init()
│   └── assets/
│       └── EE-logo.png
│
├── netlify/
│   └── functions/                ← Server-side API proxy functions
│       ├── google-place.js       ← Google Places API proxy
│       ├── google-place-photo.js ← Google photo proxy
│       ├── tripadvisor.js        ← TripAdvisor API proxy
│       └── debug.js              ← Development debug endpoint
│
├── tests/                        ← Unit tests
│   ├── scoring.test.js           ← Bayesian algorithm tests
│   └── filters.test.js           ← Filter logic tests
│
└── docs/
    ├── methodology.md            ← Extended scoring methodology notes
    └── api-setup.md              ← API key configuration guide
```

---

## Setup and Deployment

### Prerequisites

- A [Netlify](https://netlify.com) account
- Google Cloud project with **Places API (New)** enabled
- TripAdvisor Content API key (free plan)

### Environment Variables

Set the following in **Netlify → Site Configuration → Environment Variables**:

| Variable        | Description                        |
|-----------------|------------------------------------|
| `GOOGLE_API_KEY` | Google Cloud API key with Places API (New) enabled |

> **TripAdvisor key:** The free plan requires browser-side API calls (server-side returns 403).
> The key is stored in `src/js/config.js` — this is the correct and documented usage for the free tier.
> If you upgrade to a paid plan, move it to a Netlify Environment Variable and switch to the server-side function.

See `.env.example` for reference.

### Local Development

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Start local dev server (serves functions + frontend)
netlify dev
```

### Running Tests

```bash
node tests/scoring.test.js
node tests/filters.test.js
```

---

## Technology Stack

| Layer        | Technology                        |
|--------------|-----------------------------------|
| Frontend     | Vanilla HTML / CSS / JavaScript   |
| Hosting      | Netlify (static site)             |
| Serverless   | Netlify Functions (Node.js)       |
| Data Sources | Google Places API (New), TripAdvisor Content API |

---

## Venue Coverage

24 venues within a 1,000m radius of Ella Railway Station (6.8667°N, 81.0466°E), covering restaurants, cafes, and bars.
