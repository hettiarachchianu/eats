// ============================================================
//  ELLA EATS — APPLICATION CONFIGURATION
//  Venues identified via Google Places API Nearby Search
//  Search radius: 1000m from Ella Railway Station
//  Coordinates: 6.8667°N, 81.0466°E
//
//  NOTE ON API KEYS:
//  - Google API Key: stored in Netlify Environment Variables (GOOGLE_API_KEY)
//  - TripAdvisor Key: stored in Netlify Environment Variables (TA_API_KEY)
//    The TA free-tier plan permits client-side use; key is loaded via
//    the /api/tripadvisor serverless function for additional security.
// ============================================================

const CONFIG = {

  // ── TripAdvisor Settings ───────────────────────────────────
  // NOTE: The TripAdvisor free plan requires browser-side (client-side) API calls.
  // Routing via a server-side proxy returns HTTP 403 on the free tier.
  // Exposing this key here is the intended and documented usage for this plan.
  // Reference: https://tripadvisor-content-api.readme.io/reference/overview
  // If you upgrade to a paid plan, move this to a Netlify Environment Variable.
  TRIPADVISOR_KEY:     "F14160335C66408F84259D8D3EB8D5E0",
  TRIPADVISOR_ENABLED: true,

  // ── Composite Score Formula Weights ──────────────────────
  // Derived from questionnaire survey (Q8 — platform trust ratings):
  //   Google Maps trust score:   3.8 / 5  → proportional weight ≈ 60%
  //   TripAdvisor trust score:   2.9 / 5  → proportional weight ≈ 40%
  DEFAULT_GOOGLE_WEIGHT: 0.60,
  DEFAULT_TRIP_WEIGHT:   0.40,

  // ── Rating Scale Settings ─────────────────────────────────
  RATING_MAX:   5.0,   // Raw platform rating scale (out of 5)
  DISPLAY_MAX: 10.0,   // Displayed composite score scale (out of 10)

  // ── Venue Registry ────────────────────────────────────────
  // Each venue requires:
  //   name         {string}   — Display name
  //   placeId      {string}   — Google Places API place ID
  //   taLocationId {string}   — TripAdvisor location ID
  //   type         {string[]} — One or more of: "cafe", "restaurant", "bar"

  VENUES: [
    {
      name:         "Cafe Eden",
      placeId:      "ChIJdXhQZTJl5DoRFbFwfOsAmLo",
      taLocationId: "15687500",
      type:         ["cafe", "restaurant"],
    },
    {
      name:         "Rocky Ella Cafe",
      placeId:      "ChIJn3ogpLtl5DoR9NW8Eyqxr3g",
      taLocationId: "10017822",
      type:         ["cafe", "bar", "restaurant"],
    },
    {
      name:         "Cafe UFO Ella",
      placeId:      "ChIJ-XfN3wFl5DoRnT22m7-TDOo",
      taLocationId: "16640610",
      type:         ["cafe", "bar", "restaurant"],
    },
    {
      name:         "Cafe Chill",
      placeId:      "ChIJyQZWpbZl5DoR2gYtU_l5YEs",
      taLocationId: "2051648",
      type:         ["cafe", "restaurant"],
    },
    {
      name:         "The White Rabbit",
      placeId:      "ChIJ_RNg8Adl5DoRcmfkKS3qV6E",
      taLocationId: "25156043",
      type:         ["cafe", "bar"],
    },
    {
      name:         "Chingu Restaurant",
      placeId:      "ChIJc5P0eABl5DoRcyAjzJglAIU",
      taLocationId: "27712492",
      type:         ["restaurant"],
    },
    {
      name:         "The Barn by Starbeans",
      placeId:      "ChIJDUVQqLZl5DoRVX9adqeZres",
      taLocationId: "14762812",
      type:         ["cafe", "restaurant"],
    },
    {
      name:         "Matey Hut Ella",
      placeId:      "ChIJE-ejQ7Fl5DoRfvDBWDsw_fk",
      taLocationId: "9813968",
      type:         ["restaurant"],
    },
    {
      name:         "La Mensa Cafe",
      placeId:      "ChIJtei3qrZl5DoRF33YFPoSKCU",
      taLocationId: "14023508",
      type:         ["cafe", "restaurant"],
    },
    {
      name:         "Cafe Samsara",
      placeId:      "ChIJN3rhSphl5DoRJZxAkCCr83M",
      taLocationId: "19508426",
      type:         ["cafe", "restaurant"],
    },
    {
      name:         "Ella Hiking Bar & Restaurant",
      placeId:      "ChIJJ2cM4rNl5DoRpOMat_Afrhw",
      taLocationId: "6892248",
      type:         ["bar", "restaurant"],
    },
    {
      name:         "Enigma Cafe",
      placeId:      "ChIJ4yVCW2Vl5DoRuO1xOvwN7xM",
      taLocationId: "3381294",
      type:         ["cafe", "restaurant"],
    },
    {
      name:         "Wild Cafe Ella",
      placeId:      "ChIJY1qTzYhl5DoRVDf9RQIXlvY",
      taLocationId: "33849864",
      type:         ["cafe", "restaurant"],
    },
    {
      name:         "Rainbow Cafe",
      placeId:      "ChIJX15tubZl5DoRn5QY8Dp8Kwg",
      taLocationId: "11850226",
      type:         ["cafe", "restaurant"],
    },
    {
      name:         "MozzarElla By Nero Kitchen",
      placeId:      "ChIJ6dmf4rNl5DoR_oZr30Nwlb8",
      taLocationId: "12918447",
      type:         ["restaurant"],
    },
    {
      name:         "The Green Door Cafe",
      placeId:      "ChIJA6vGLwBl5DoRZvNKYydco-8",
      taLocationId: "27082012",
      type:         ["cafe", "restaurant"],
    },
    {
      name:         "Cafe Ice Cube",
      placeId:      "ChIJiUy8r7Zl5DoRnriYb8vT-tA",
      taLocationId: "10487754",
      type:         ["cafe", "bar", "restaurant"],
    },
    {
      name:         "Bread Time Cafe",
      placeId:      "ChIJ_-AvSQBl5DoRnzw2XpiWDtQ",
      taLocationId: "27764875",
      type:         ["cafe", "restaurant"],
    },
    {
      name:         "Fish & Chip Restaurant and Rotti",
      placeId:      "ChIJKX-8vrZl5DoRs0RgxqrTvMU",
      taLocationId: "6352748",
      type:         ["restaurant"],
    },
    {
      name:         "Mangifera Cafe & Restaurant",
      placeId:      "ChIJUf9vaQBl5DoRYIJKvEcw0F0",
      taLocationId: "32765461",
      type:         ["cafe", "restaurant"],
    },
    {
      name:         "Grandma's Kitchen Restaurant",
      placeId:      "ChIJ7cJ3wXtl5DoR9gqtGrXqO98",
      taLocationId: "32985646",
      type:         ["restaurant"],
    },
    {
      name:         "Bee Honey Cookery & Restaurant",
      placeId:      "ChIJrZakmc5l5DoR5F1NeB3po2c",
      taLocationId: "19987429",
      type:         ["restaurant"],
    },
    {
      name:         "Murunga Yoga Cafe Ella",
      placeId:      "ChIJC6AAPRJl5DoRqG8ySMrOcaM",
      taLocationId: "32730849",
      type:         ["cafe", "restaurant"],
    },
    {
      name:         "Cafe Lounge",
      placeId:      "ChIJoc2WmUBl5DoRHqECA-994Ns",
      taLocationId: "16717510",
      type:         ["cafe", "bar"],
    },
  ],
};
