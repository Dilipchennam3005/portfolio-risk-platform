"""
Portfolio Risk Intelligence Platform
Apex Capital Management
Data Generator — generates synthetic portfolio data, returns, and risk metrics
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import os

np.random.seed(42)

# ── CONFIGURATION ─────────────────────────────────────────────────────────────
FIRM = "Apex Capital Management"
START_DATE = datetime(2021, 1, 1)
END_DATE   = datetime(2024, 12, 31)

# 20 realistic holdings across sectors
HOLDINGS = [
    # Ticker, Name, Sector, Beta, Ann_Return, Ann_Vol, Weight
    ("AAPL",  "Apple Inc",               "Technology",       1.20, 0.28, 0.24, 0.085),
    ("MSFT",  "Microsoft Corp",          "Technology",       1.10, 0.32, 0.22, 0.080),
    ("GOOGL", "Alphabet Inc",            "Technology",       1.15, 0.25, 0.26, 0.065),
    ("JPM",   "JPMorgan Chase",          "Financials",       1.25, 0.18, 0.28, 0.070),
    ("GS",    "Goldman Sachs",           "Financials",       1.40, 0.20, 0.30, 0.055),
    ("BAC",   "Bank of America",         "Financials",       1.35, 0.15, 0.29, 0.045),
    ("JNJ",   "Johnson & Johnson",       "Healthcare",       0.65, 0.10, 0.14, 0.060),
    ("UNH",   "UnitedHealth Group",      "Healthcare",       0.75, 0.18, 0.18, 0.055),
    ("PFE",   "Pfizer Inc",              "Healthcare",       0.70, 0.08, 0.20, 0.035),
    ("XOM",   "ExxonMobil Corp",         "Energy",           0.90, 0.14, 0.26, 0.040),
    ("CVX",   "Chevron Corp",            "Energy",           0.85, 0.12, 0.24, 0.035),
    ("AMZN",  "Amazon.com Inc",          "Consumer Disc",    1.30, 0.22, 0.28, 0.070),
    ("TSLA",  "Tesla Inc",               "Consumer Disc",    1.80, 0.30, 0.55, 0.040),
    ("HD",    "Home Depot",              "Consumer Disc",    1.05, 0.16, 0.20, 0.035),
    ("PG",    "Procter & Gamble",        "Consumer Staples", 0.55, 0.09, 0.13, 0.050),
    ("KO",    "Coca-Cola Co",            "Consumer Staples", 0.50, 0.07, 0.12, 0.040),
    ("NEE",   "NextEra Energy",          "Utilities",        0.60, 0.11, 0.15, 0.040),
    ("AMT",   "American Tower",          "Real Estate",      0.80, 0.13, 0.18, 0.035),
    ("LIN",   "Linde PLC",              "Materials",        0.85, 0.15, 0.18, 0.030),
    ("CAT",   "Caterpillar Inc",         "Industrials",      1.10, 0.17, 0.22, 0.030),
]

TICKERS  = [h[0] for h in HOLDINGS]
SECTORS  = list(set(h[2] for h in HOLDINGS))

# ── 1. GENERATE DAILY RETURNS ──────────────────────────────────────────────────
def generate_returns():
    dates = pd.bdate_range(START_DATE, END_DATE)
    n = len(dates)

    # Correlation matrix — sector clustering
    corr = np.full((20, 20), 0.25)
    np.fill_diagonal(corr, 1.0)

    # Higher intra-sector correlation
    sector_map = {h[0]: h[2] for h in HOLDINGS}
    for i, ti in enumerate(TICKERS):
        for j, tj in enumerate(TICKERS):
            if i != j and sector_map[ti] == sector_map[tj]:
                corr[i, j] = 0.60

    # Market factor correlation
    corr = corr * 0.7 + np.full((20, 20), 0.3)
    np.fill_diagonal(corr, 1.0)
    corr = np.clip(corr, -1, 1)

    # Cholesky decomposition for correlated returns
    L = np.linalg.cholesky(corr + np.eye(20) * 1e-8)

    daily_vols         = np.array([h[5] / np.sqrt(252) for h in HOLDINGS])
    daily_returns_mean = np.array([h[4] / 252          for h in HOLDINGS])

    # Add 3 market crash periods
    raw = np.random.randn(n, 20) @ L.T
    returns = raw * daily_vols + daily_returns_mean

    # Inject crash: COVID (Mar 2020 not in range), inject 2022 bear market
    for i, d in enumerate(dates):
        if datetime(2022, 1, 1) <= d.to_pydatetime() <= datetime(2022, 10, 1):
            returns[i] *= 1.4
            returns[i] -= 0.003   # drift down
        if datetime(2022, 6, 1) <= d.to_pydatetime() <= datetime(2022, 7, 15):
            returns[i] -= 0.008   # crash spike

    df = pd.DataFrame(returns, index=dates, columns=TICKERS)
    return df

# ── 2. PORTFOLIO WEIGHTS & METRICS ─────────────────────────────────────────────
def compute_portfolio_metrics(returns_df):
    weights = np.array([h[6] for h in HOLDINGS])
    weights /= weights.sum()  # normalize

    port_returns = (returns_df * weights).sum(axis=1)

    # Benchmark: S&P 500 proxy
    bench_returns = returns_df.mean(axis=1) * 0.85 + np.random.randn(len(returns_df)) * 0.003

    # Cumulative returns
    port_cumret   = (1 + port_returns).cumprod()
    bench_cumret  = (1 + bench_returns).cumprod()

    # Annualized metrics
    ann_return = port_returns.mean() * 252
    ann_vol    = port_returns.std()  * np.sqrt(252)
    sharpe     = ann_return / ann_vol
    sortino    = ann_return / (port_returns[port_returns < 0].std() * np.sqrt(252))

    # Max drawdown
    roll_max   = port_cumret.cummax()
    drawdown   = (port_cumret - roll_max) / roll_max
    max_dd     = drawdown.min()

    # VaR / CVaR (95% and 99%)
    var_95  = np.percentile(port_returns, 5)
    cvar_95 = port_returns[port_returns <= var_95].mean()
    var_99  = np.percentile(port_returns, 1)
    cvar_99 = port_returns[port_returns <= var_99].mean()

    # Beta vs benchmark
    cov   = np.cov(port_returns, bench_returns)
    beta  = cov[0, 1] / cov[1, 1]
    alpha = ann_return - beta * (bench_returns.mean() * 252)

    return {
        "weights":       weights,
        "port_returns":  port_returns,
        "bench_returns": bench_returns,
        "port_cumret":   port_cumret,
        "bench_cumret":  bench_cumret,
        "ann_return":    round(ann_return * 100, 2),
        "ann_vol":       round(ann_vol * 100, 2),
        "sharpe":        round(sharpe, 3),
        "sortino":       round(sortino, 3),
        "max_dd":        round(max_dd * 100, 2),
        "var_95":        round(var_95 * 100, 3),
        "cvar_95":       round(cvar_95 * 100, 3),
        "var_99":        round(var_99 * 100, 3),
        "cvar_99":       round(cvar_99 * 100, 3),
        "beta":          round(beta, 3),
        "alpha":         round(alpha * 100, 2),
        "drawdown":      drawdown,
    }

# ── 3. EFFICIENT FRONTIER ──────────────────────────────────────────────────────
def compute_efficient_frontier(returns_df, n_portfolios=5000):
    mu  = returns_df.mean() * 252
    cov = returns_df.cov()  * 252
    n   = len(TICKERS)

    results = []
    for _ in range(n_portfolios):
        w = np.random.dirichlet(np.ones(n))
        ret = float(w @ mu)
        vol = float(np.sqrt(w @ cov.values @ w))
        sr  = ret / vol if vol > 0 else 0
        results.append({"return": round(ret*100,2), "volatility": round(vol*100,2), "sharpe": round(sr,3)})

    df = pd.DataFrame(results)

    # Optimal portfolio (max Sharpe)
    opt_idx = df["sharpe"].idxmax()
    opt = df.loc[opt_idx]

    # Min variance portfolio
    minv_idx = df["volatility"].idxmin()
    minv = df.loc[minv_idx]

    return df, opt, minv

# ── 4. ANOMALY DETECTION ───────────────────────────────────────────────────────
def detect_anomalies(port_returns):
    from sklearn.ensemble import IsolationForest

    # Features: return, rolling vol, rolling skew
    df = pd.DataFrame({"return": port_returns})
    df["roll_vol"]  = df["return"].rolling(10).std().bfill()
    df["roll_mean"] = df["return"].rolling(10).mean().bfill()
    df["z_score"]   = (df["return"] - df["return"].mean()) / df["return"].std()

    X = df[["return", "roll_vol", "z_score"]].values

    clf = IsolationForest(contamination=0.05, random_state=42)
    df["anomaly"] = clf.fit_predict(X)
    df["anomaly_score"] = clf.score_samples(X)
    df["is_anomaly"] = df["anomaly"] == -1

    return df

# ── 5. MONTE CARLO ─────────────────────────────────────────────────────────────
def monte_carlo_simulation(port_returns, n_sims=500, horizon=252):
    mu  = port_returns.mean()
    vol = port_returns.std()

    sims = []
    for _ in range(n_sims):
        daily = np.random.normal(mu, vol, horizon)
        path  = (1 + daily).cumprod()
        sims.append(path)

    sims = np.array(sims)
    p5   = np.percentile(sims, 5,  axis=0)
    p25  = np.percentile(sims, 25, axis=0)
    p50  = np.percentile(sims, 50, axis=0)
    p75  = np.percentile(sims, 75, axis=0)
    p95  = np.percentile(sims, 95, axis=0)

    return sims, p5, p25, p50, p75, p95

# ── MAIN ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    os.makedirs("data", exist_ok=True)
    print("Generating daily returns...")
    returns_df = generate_returns()

    print("Computing portfolio metrics...")
    metrics = compute_portfolio_metrics(returns_df)

    print("Computing efficient frontier (5,000 portfolios)...")
    ef_df, opt_port, minv_port = compute_efficient_frontier(returns_df)

    print("Running anomaly detection...")
    anomaly_df = detect_anomalies(metrics["port_returns"])

    print("Running Monte Carlo simulation (500 paths)...")
    sims, p5, p25, p50, p75, p95 = monte_carlo_simulation(metrics["port_returns"])

    # ── SAVE OUTPUTS ──────────────────────────────────────────────────────────
    # 1. Holdings table
    holdings_data = []
    for i, h in enumerate(HOLDINGS):
        ticker, name, sector, beta, ann_ret, ann_vol, weight = h
        w = metrics["weights"][i]
        holdings_data.append({
            "ticker": ticker, "name": name, "sector": sector,
            "beta": beta, "ann_return_pct": round(ann_ret*100,1),
            "ann_vol_pct": round(ann_vol*100,1),
            "weight_pct": round(w*100,2),
            "aum_millions": round(w * 250, 2),  # $250M AUM
        })
    pd.DataFrame(holdings_data).to_csv("data/holdings.csv", index=False)
    print("Saved data/holdings.csv")

    # 2. Daily returns
    returns_df.round(6).to_csv("data/daily_returns.csv")
    print("Saved data/daily_returns.csv")

    # 3. Portfolio performance time series
    perf_df = pd.DataFrame({
        "date":          returns_df.index.strftime("%Y-%m-%d"),
        "port_return":   metrics["port_returns"].round(6).values,
        "bench_return":  metrics["bench_returns"].round(6).values,
        "port_cumret":   metrics["port_cumret"].round(6).values,
        "bench_cumret":  metrics["bench_cumret"].round(6).values,
        "drawdown":      metrics["drawdown"].round(6).values,
    })
    perf_df.to_csv("data/portfolio_performance.csv", index=False)
    print("Saved data/portfolio_performance.csv")

    # 4. Efficient frontier
    ef_df.to_csv("data/efficient_frontier.csv", index=False)
    print("Saved data/efficient_frontier.csv")

    # 5. Anomaly detection
    anomaly_out = pd.DataFrame({
        "date":          returns_df.index.strftime("%Y-%m-%d"),
        "return":        anomaly_df["return"].round(6).values,
        "roll_vol":      anomaly_df["roll_vol"].round(6).values,
        "z_score":       anomaly_df["z_score"].round(4).values,
        "is_anomaly":    anomaly_df["is_anomaly"].astype(int).values,
        "anomaly_score": anomaly_df["anomaly_score"].round(4).values,
    })
    anomaly_out.to_csv("data/anomaly_detection.csv", index=False)
    print("Saved data/anomaly_detection.csv")

    # 6. Monte Carlo
    mc_df = pd.DataFrame({
        "day": range(1, 253),
        "p5":  p5.round(4), "p25": p25.round(4),
        "p50": p50.round(4), "p75": p75.round(4), "p95": p95.round(4),
    })
    mc_df.to_csv("data/monte_carlo.csv", index=False)
    print("Saved data/monte_carlo.csv")

    # 7. Summary JSON
    sector_weights = {}
    for h, w in zip(HOLDINGS, metrics["weights"]):
        s = h[2]
        sector_weights[s] = round(sector_weights.get(s, 0) + w * 100, 2)

    summary = {
        "firm": FIRM,
        "aum_millions": 250,
        "n_holdings": 20,
        "ann_return":  metrics["ann_return"],
        "ann_vol":     metrics["ann_vol"],
        "sharpe":      metrics["sharpe"],
        "sortino":     metrics["sortino"],
        "max_dd":      metrics["max_dd"],
        "var_95":      metrics["var_95"],
        "cvar_95":     metrics["cvar_95"],
        "var_99":      metrics["var_99"],
        "cvar_99":     metrics["cvar_99"],
        "beta":        metrics["beta"],
        "alpha":       metrics["alpha"],
        "n_anomalies": int(anomaly_df["is_anomaly"].sum()),
        "sector_weights": sector_weights,
        "optimal_portfolio": {
            "return":     round(float(opt_port["return"]), 2),
            "volatility": round(float(opt_port["volatility"]), 2),
            "sharpe":     round(float(opt_port["sharpe"]), 3),
        },
        "min_variance_portfolio": {
            "return":     round(float(minv_port["return"]), 2),
            "volatility": round(float(minv_port["volatility"]), 2),
            "sharpe":     round(float(minv_port["sharpe"]), 3),
        },
    }
    with open("data/portfolio_summary.json", "w") as f:
        json.dump(summary, f, indent=2)
    print("Saved data/portfolio_summary.json")

    print("\n✅ All data generated successfully!")
    print(f"   Portfolio Ann Return: {metrics['ann_return']}%")
    print(f"   Portfolio Ann Vol:    {metrics['ann_vol']}%")
    print(f"   Sharpe Ratio:         {metrics['sharpe']}")
    print(f"   Max Drawdown:         {metrics['max_dd']}%")
    print(f"   VaR 95%:              {metrics['var_95']}%")
    print(f"   CVaR 95%:             {metrics['cvar_95']}%")
    print(f"   Anomalies detected:   {int(anomaly_df['is_anomaly'].sum())}")
