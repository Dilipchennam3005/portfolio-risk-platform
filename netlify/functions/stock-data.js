// netlify/functions/stock-data.js
// Fetches live price, change, and key stats for all 20 portfolio tickers
// from Yahoo Finance's free query API — no API key required.
// Called by the dashboard on page load, and by GitHub Actions at 8am PST daily.

const TICKERS = [
  "AAPL","MSFT","GOOGL","JPM","GS","BAC",
  "JNJ","UNH","PFE","XOM","CVX","AMZN",
  "TSLA","HD","PG","KO","NEE","AMT","LIN","CAT"
];

const FIELDS = [
  "symbol","regularMarketPrice","regularMarketChange",
  "regularMarketChangePercent","regularMarketVolume",
  "marketCap","fiftyTwoWeekHigh","fiftyTwoWeekLow",
  "trailingPE","forwardPE","dividendYield",
  "regularMarketPreviousClose","regularMarketOpen",
  "shortName","regularMarketTime"
].join(",");

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
    "Cache-Control": "public, max-age=3600", // cache 1 hour
  };

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const symbols = TICKERS.join(",");
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}&fields=${FIELDS}&lang=en-US&region=US`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance returned ${response.status}`);
    }

    const data = await response.json();
    const quotes = data?.quoteResponse?.result ?? [];

    if (!quotes.length) {
      throw new Error("No quotes returned from Yahoo Finance");
    }

    // Shape into clean lookup object keyed by ticker
    const result = {};
    for (const q of quotes) {
      result[q.symbol] = {
        ticker:        q.symbol,
        name:          q.shortName ?? q.symbol,
        price:         round2(q.regularMarketPrice),
        change:        round2(q.regularMarketChange),
        changePct:     round2(q.regularMarketChangePercent),
        prevClose:     round2(q.regularMarketPreviousClose),
        open:          round2(q.regularMarketOpen),
        volume:        q.regularMarketVolume ?? null,
        marketCap:     q.marketCap ?? null,
        week52High:    round2(q.fiftyTwoWeekHigh),
        week52Low:     round2(q.fiftyTwoWeekLow),
        peTrailing:    q.trailingPE ? round2(q.trailingPE) : null,
        peForward:     q.forwardPE  ? round2(q.forwardPE)  : null,
        divYield:      q.dividendYield ? round2(q.dividendYield * 100) : null,
        lastUpdated:   new Date().toISOString(),
        marketTime:    q.regularMarketTime
          ? new Date(q.regularMarketTime * 1000).toISOString()
          : null,
      };
    }

    // Market status
    const marketOpen = isMarketOpen();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success:     true,
        fetchedAt:   new Date().toISOString(),
        marketOpen,
        tickerCount: Object.keys(result).length,
        quotes:      result,
      }),
    };

  } catch (err) {
    console.error("stock-data function error:", err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error:   err.message,
        fetchedAt: new Date().toISOString(),
      }),
    };
  }
};

function round2(n) {
  return typeof n === "number" ? Math.round(n * 100) / 100 : null;
}

function isMarketOpen() {
  const now = new Date();
  const nyTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day  = nyTime.getDay();   // 0=Sun, 6=Sat
  const hour = nyTime.getHours();
  const min  = nyTime.getMinutes();
  const timeVal = hour * 60 + min;
  if (day === 0 || day === 6) return false;
  return timeVal >= 570 && timeVal <= 960; // 9:30am–4:00pm ET
}
