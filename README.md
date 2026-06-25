# Portfolio Risk Intelligence Platform
### Apex Capital Management — Quantitative Portfolio Analytics

![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat&logo=python&logoColor=white)
![SQL](https://img.shields.io/badge/Snowflake-SQL-29B5E8?style=flat&logo=snowflake&logoColor=white)
![Power BI](https://img.shields.io/badge/Power%20BI-DAX-F2C811?style=flat&logo=powerbi&logoColor=black)
![scikit-learn](https://img.shields.io/badge/scikit--learn-Isolation%20Forest-F7931E?style=flat&logo=scikitlearn&logoColor=white)
![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat&logo=react&logoColor=black)
![Netlify](https://img.shields.io/badge/Netlify-Live-00C7B7?style=flat&logo=netlify&logoColor=white)

> End-to-end quantitative risk analytics platform for a fictional $250M equity portfolio — built to demonstrate financial data engineering, statistical modeling, and interactive visualization skills relevant to buy-side and fintech analytics roles.

**[🔴 Live Dashboard →](https://portfolio-risk-platform.netlify.app)**

---

## Overview

This project covers the full analytics lifecycle of a 20-stock, $250M equity portfolio spanning 2021–2024:

- **Portfolio construction** — weighted return attribution, sector allocation, benchmark comparison
- **Risk quantification** — historical VaR/CVaR at 90/95/99% confidence, drawdown analysis, rolling Sharpe
- **Optimization** — Markowitz efficient frontier with 5,000 simulated portfolios, max-Sharpe and min-variance solutions
- **Anomaly detection** — Isolation Forest on daily returns to flag tail-risk events
- **Monte Carlo simulation** — 500 forward paths over 252-day horizon with percentile fan chart
- **What-If rebalancer** — interactive tool to model impact of reallocating capital between positions

---

## Tech Stack

| Layer | Tools |
|-------|-------|
| Data Generation | Python · pandas · NumPy · scipy |
| Machine Learning | scikit-learn (Isolation Forest) |
| Statistical Modeling | Markowitz MPT · Monte Carlo · VaR/CVaR |
| Database & Queries | Snowflake SQL · Window Functions · Stored Procedures |
| BI & Reporting | Power BI · DAX Measures · Conditional Formatting |
| Visualization | React 18 · Recharts · Netlify Functions |
| Automation | GitHub Actions · Yahoo Finance API |

---

## Repository Structure

```
portfolio-risk-platform/
├── analysis/
│   └── portfolio_analysis.ipynb    # Full Python analytics notebook
├── sql/
│   └── portfolio_queries.sql       # Snowflake SQL — schema, views, stored procedures
├── dax/
│   └── measures.dax                # 30+ Power BI DAX measures
├── powerbi/
│   └── POWERBI_GUIDE.md            # 4-page Power BI dashboard build guide
├── dashboard/
│   └── portfolio_dashboard.jsx     # React dashboard — 6 pages, live Yahoo Finance data
├── data/
│   ├── generate_portfolio_data.py  # Synthetic data generator
│   └── holdings.csv                # 20-stock portfolio
├── netlify/functions/
│   └── stock-data.js               # Yahoo Finance serverless proxy
└── .github/workflows/
    └── daily-refresh.yml           # 8am PST Mon–Fri auto-rebuild
```

---

## Key Results

| Metric | Value |
|--------|-------|
| Annualized Return | **6.69%** |
| Annualized Volatility | **19.04%** |
| Sharpe Ratio | **0.352** |
| Sortino Ratio | **0.52** |
| Max Drawdown | **-54.07%** (2022 bear market) |
| VaR 95% (1D) | **-1.79%** ($4.5M on $250M AUM) |
| CVaR 95% (1D) | **-2.69%** |
| Portfolio Beta | **1.098** |
| Anomalies Detected | **53** (Isolation Forest, 5% contamination) |
| Optimal Sharpe Available | **0.684** (+94% vs current) |
| Monte Carlo Median (1yr) | **+4.8%** |

---

## Dashboard Pages

| Page | Description |
|------|-------------|
| **Portfolio Overview** | KPI cards, cumulative return vs benchmark, sector allocation, holdings table with live prices, monthly return bar chart |
| **Risk Analytics** | Drawdown chart, VaR/CVaR intervals, correlation heatmap, beta by holding |
| **Efficient Frontier** | 5,000 simulated portfolios, current vs optimal vs min-variance |
| **Anomaly Detection** | Isolation Forest scatter, anomaly summary |
| **Monte Carlo** | 500-path fan chart, terminal value distribution |
| **What-If Rebalancer** | Interactive capital reallocation — live impact on return/vol/Sharpe |

---

## SQL Highlights

- **VW_ROLLING_RISK** — 20/60-day rolling Sharpe and volatility using window functions
- **VW_VAR_ANALYSIS** — Historical VaR/CVaR with dollar impact at all confidence levels
- **VW_DRAWDOWN_PERIODS** — Drawdown start/trough/recovery detection
- **VW_ACTIVE_RETURN** — Tracking error and Information Ratio vs benchmark
- **SP_REFRESH_RISK_METRICS** — Stored procedure for daily risk metric refresh with MERGE upsert

---

## DAX Measures

30+ measures including: `[Sharpe Ratio]`, `[Sortino Ratio]`, `[CVaR 95% (1D) %]`, `[VaR 95% Dollar ($M)]`, `[Tracking Error %]`, `[Information Ratio]`, `[Monthly Return Color]`, `[KPI Status Icon]`, `[Drawdown Severity]`

---

## Live Data Architecture

```
GitHub Actions (cron 8am PST Mon–Fri)
        ↓
Netlify Build Hook → Site Rebuild
        ↓
Netlify Function → Yahoo Finance API (20 tickers)
        ↓
Live prices + daily % change in dashboard
Auto-refresh every 5 minutes while tab is open
```

---

## Running Locally

```bash
# Generate data
pip install pandas numpy scikit-learn
python data/generate_portfolio_data.py

# Run the notebook
pip install jupyter matplotlib seaborn scipy
jupyter notebook analysis/portfolio_analysis.ipynb

# Run the dashboard
cd dashboard && npm install && npm run dev
```

---

## Related Projects

- **[Financial Workforce Analytics Suite](https://github.com/Dilipchennam3005/financial-workforce-analytics)** — HR analytics with Random Forest attrition model and headcount forecasting. [Live →](https://meridian-workforce-analytics.netlify.app)

---

*Built by Dilip Chennam · MS Information Systems, Cal State Fullerton 
