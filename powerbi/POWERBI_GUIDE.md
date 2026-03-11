# Power BI Dashboard — Build Guide
## Apex Capital Management · Portfolio Risk Intelligence Platform

---

## Data Sources (import in this order)
1. `powerbi_data/performance.csv` → table: `PortfolioPerformance`
2. `powerbi_data/holdings_enriched.csv` → table: `Holdings`
3. `powerbi_data/anomaly_flags.csv` → table: `AnomalyFlags`
4. `powerbi_data/monte_carlo.csv` → table: `MonteCarlo`
5. `powerbi_data/kpi_summary.json` → table: `KPISummary`

**Get Data → Text/CSV** for each file. Enable "Use First Row as Headers."

---

## Page 1 — Executive Overview
| Visual | Type | Fields |
|--------|------|--------|
| Ann Return | KPI Card | `[Annualized Return %]` vs target 8% |
| Sharpe Ratio | KPI Card | `[Sharpe Ratio]` vs target 0.5 |
| Max Drawdown | KPI Card | `[Max Drawdown %]` |
| VaR 95% | KPI Card | `[VaR 95% (1D) %]` |
| Cumulative Return | Line Chart | date vs port_cumret, bench_cumret |
| Sector Allocation | Donut Chart | Holdings[sector] + `[Sector Weight %]` |
| Monthly Return Heatmap | Matrix | Year (rows), Month (cols), `[Monthly Return %]` with conditional formatting |
| Holdings Table | Table | ticker, company, weight, `[Return Contribution %]`, individual_sharpe, beta_flag |

**Conditional Formatting on Monthly Heatmap:**
- Background: `[Monthly Return Color]` measure
- Positive months → `#00d4aa`, Negative → `#f45b5b`

---

## Page 2 — Risk Analytics
| Visual | Type | Fields |
|--------|------|--------|
| Drawdown Chart | Area Chart | date vs drawdown (fill below zero, red) |
| VaR Gauge | Gauge | `[VaR 95% (1D) %]`, min=-5, max=0, target=-1.5 |
| CVaR Card | Card | `[CVaR 95% (1D) %]` |
| Dollar at Risk | Card | `[VaR 95% Dollar ($M)]` |
| Beta by Holding | Horizontal Bar | ticker vs beta, conditional color (>1.3=red) |
| Rolling Vol | Line Chart | date vs ROLLING_VOL_20D (from PortfolioPerformance) |
| Risk Summary Table | Table | All VaR/CVaR metrics from KPISummary |

---

## Page 3 — Anomaly Detection
| Visual | Type | Fields |
|--------|------|--------|
| Total Anomalies | KPI Card | `[Total Anomalies]` |
| Anomaly Rate | KPI Card | `[Anomaly Rate %]` |
| Return Scatter | Scatter Chart | date (X), return_pct (Y), is_anomaly (color) |
| Anomaly Table | Table | date, return_pct, z_score, is_anomaly, filtered to is_anomaly=TRUE |
| Z-Score Distribution | Histogram (custom) | z_score binned |

**Scatter chart color:** Add conditional column in Power Query:
```
= if [is_anomaly] = true then "Anomaly" else "Normal"
```
Then use as Legend field.

---

## Page 4 — Monte Carlo
| Visual | Type | Fields |
|--------|------|--------|
| MC Fan Chart | Line Chart | day vs p5, p25, p50, p75, p95 |
| Terminal Value Cards | 5x Cards | p5/p25/p50/p75/p95 at day=252 |
| Probability of Loss | Card | Calculated from p5 trend |

**DAX for terminal values:**
```
[MC Median Terminal] = 
CALCULATE(MAX(MonteCarlo[p50]), MonteCarlo[day] = 252)

[MC Worst Terminal] = 
CALCULATE(MAX(MonteCarlo[p5]), MonteCarlo[day] = 252)
```

---

## Theme Colors (paste into View → Themes → Customize)
```json
{
  "name": "Apex Dark",
  "dataColors": ["#00d4aa","#4d9fff","#f0b429","#f45b5b","#8b7cf8","#fb923c"],
  "background": "#07090f",
  "foreground": "#e2e8f0",
  "tableAccent": "#00d4aa"
}
```

---

## Publishing to Power BI Service
1. File → Publish → Publish to Power BI
2. Select your workspace
3. Open the dataset → Schedule Refresh → connect to CSV files
4. Share the report link — paste into project README as: `[Live Power BI Dashboard →](your-link)`
