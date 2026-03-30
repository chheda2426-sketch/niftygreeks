export async function fetchNSEGreeks(
  strike: number,
  expiry: string,
  optType: "CE" | "PE"
): Promise<Record<string, number | string> | null> {
  const prompt = `Search NSE India NIFTY 50 option chain right now for strike ${strike} ${optType} expiry ${expiry}.
Return ONLY valid JSON:
{"spot":<number>,"ltp":<number>,"iv":<pct number>,"delta":<number>,"theta":<number>,"vega":<number>,"gamma":<number>,"oi":<number>,"volume":<number>,"bid":<number>,"ask":<number>,"fetchTime":"<HH:MM IST>"}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 600,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await res.json();
    const text = (data.content || [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("");
    const match = text.match(/\{[\s\S]*?\}/);
    if (match) return JSON.parse(match[0]);
  } catch (e) {
    console.error("NSE fetch error:", e);
  }
  return null;
}
