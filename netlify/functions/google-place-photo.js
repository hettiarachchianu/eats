// netlify/functions/google-place-photo.js
// Proxies Google Places photo requests server-side to protect API key

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  const photoName = event.queryStringParameters?.name;
  if (!photoName) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing name" }) };
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "No API key" }) };
  }

  try {
    const url = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=400&maxWidthPx=600&key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      return { statusCode: response.status, headers, body: JSON.stringify({ error: "Photo fetch failed" }) };
    }
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
      body: base64,
      isBase64Encoded: true,
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};