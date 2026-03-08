// netlify/functions/google-place.js
// Calls Google Places API (New) server-side — avoids all browser CORS/referrer issues.
// Reads GOOGLE_API_KEY from Netlify Environment Variables.

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  const placeId = event.queryStringParameters?.placeId;
  if (!placeId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Missing placeId parameter" }),
    };
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "GOOGLE_API_KEY environment variable not set" }),
    };
  }

  try {
    const url = `https://places.googleapis.com/v1/places/${placeId}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": [
          "id",
          "displayName",
          "rating",
          "userRatingCount",
          "formattedAddress",
          "regularOpeningHours",
          "priceLevel",
          "websiteUri",
          "googleMapsUri",
          "types",
          "photos",
          "editorialSummary",
        ].join(","),
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Google Places API error:", response.status, errText);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: `Google API returned ${response.status}`, detail: errText }),
      };
    }

    const data = await response.json();

    // Map to our standard shape
    const mapped = {
      placeId:     data.id,
      name:        data.displayName?.text || "",
      address:     data.formattedAddress || "",
      rating:      data.rating || 0,
      reviewCount: data.userRatingCount || 0,
      priceLevel:  data.priceLevel || null,
      isOpen:      data.regularOpeningHours?.openNow ?? null,
      hours:       data.regularOpeningHours?.weekdayDescriptions || [],
      googleUrl:   data.googleMapsUri || "",
      websiteUrl:  data.websiteUri || "",
      types:       data.types || [],
      photoName:   data.photos?.[0]?.name || null,
      summary:     data.editorialSummary?.text || "",
      source:      "google_places_api_v1",
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(mapped),
    };
  } catch (err) {
    console.error("Function error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error", detail: err.message }),
    };
  }
};
