exports.handler = async (event) => {
  const headers = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

  const gKey  = process.env.GOOGLE_API_KEY;
  const taKey = process.env.TA_API_KEY;

  const result = {
    env: {
      GOOGLE_API_KEY: gKey  ? `SET — starts with ${gKey.slice(0,8)}...`  : "NOT SET",
      TA_API_KEY:     taKey ? `SET — starts with ${taKey.slice(0,8)}...` : "NOT SET",
    },
    google_test: null,
    tripadvisor_test: null,
  };

  // Test Google
  if (gKey) {
    try {
      const r = await fetch(
        "https://places.googleapis.com/v1/places/ChIJyQZWpbZl5DoR2gYtU_l5YEs",
        { headers: { "X-Goog-Api-Key": gKey, "X-Goog-FieldMask": "id,displayName,rating" } }
      );
      const body = await r.text();
      result.google_test = { status: r.status, body: r.ok ? JSON.parse(body) : body };
    } catch(e) { result.google_test = { error: e.message }; }
  }

  // Test TripAdvisor — exactly matching their own sample code
  if (taKey) {
    try {
      const url = `https://api.content.tripadvisor.com/api/v1/location/2051648/details?key=${taKey}&language=en&currency=LKR`;
      const r = await fetch(url, { method: "GET", headers: { accept: "application/json" } });
      const body = await r.text();
      result.tripadvisor_test = {
        status: r.status,
        url_used: url.replace(taKey, "***KEY***"),
        body: r.ok ? JSON.parse(body) : body,
      };
    } catch(e) { result.tripadvisor_test = { error: e.message }; }
  }

  return { statusCode: 200, headers, body: JSON.stringify(result, null, 2) };
};
