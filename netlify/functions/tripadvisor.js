// ============================================================
//  ELLA EATS — NETLIFY FUNCTION: TripAdvisor (Paid Plan Upgrade)
//
//  WARNING: THIS FUNCTION IS NOT ACTIVE ON THE FREE PLAN.
//
//  The TripAdvisor free plan requires browser-side calls (returns 403 server-side).
//  The live implementation calls TripAdvisor directly from the browser in api.js.
//
//  UPGRADE PATH (paid plan):
//    1. Set TA_API_KEY in Netlify → Environment Variables
//    2. In src/js/api.js, change the TA fetch URL to: /api/tripadvisor?locationId=...
//    3. Remove TRIPADVISOR_KEY from src/js/config.js
// ============================================================

exports.handler = async function (event) {
  const { locationId } = event.queryStringParameters || {};
  if (!locationId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing locationId' }) };
  }
  const apiKey = process.env.TA_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'TA_API_KEY not configured' }) };
  }
  try {
    const url = `https://api.content.tripadvisor.com/api/v1/location/${locationId}/details?key=${apiKey}&language=en&currency=LKR`;
    const response = await fetch(url, { method: 'GET', headers: { accept: 'application/json' } });
    if (!response.ok) {
      return { statusCode: response.status, body: JSON.stringify({ error: `TA API returned ${response.status}` }) };
    }
    const data = await response.json();
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
