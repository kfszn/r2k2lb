export default async function handler(req, res) {
  try {
    const apiKey = "edadb58b-ea99-4c27-9b91-60b84c095ee9";
    const after = req.query.after || "8-20-2023"; // expects M-D-YYYY
    const url = `https://packdraw.com/api/v1/affiliates/leaderboard?after=${encodeURIComponent(after)}&apiKey=${encodeURIComponent(apiKey)}`;

    const r = await fetch(url, {
      headers: { "Accept": "application/json" }
    });

    const text = await r.text();

    // Pass through status + body (usually JSON)
    res.setHeader("Content-Type", r.headers.get("content-type") || "application/json");
    res.setHeader("Cache-Control", "no-store");

    // Allow your frontend to call YOUR endpoint
    res.setHeader("Access-Control-Allow-Origin", "*");

    return res.status(r.status).send(text);
  } catch (e) {
    return res.status(500).json({ error: "proxy_error", message: String(e) });
  }
}
