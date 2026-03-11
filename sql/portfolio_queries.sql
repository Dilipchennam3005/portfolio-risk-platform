-- ============================================================
-- APEX CAPITAL MANAGEMENT
-- Portfolio Risk Intelligence Platform
-- Snowflake SQL — Portfolio Analytics Queries
-- Author: Dilip Chennam
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. SCHEMA SETUP
-- ──────────────────────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS APEX_CAPITAL;
CREATE SCHEMA  IF NOT EXISTS APEX_CAPITAL.PORTFOLIO;
USE SCHEMA APEX_CAPITAL.PORTFOLIO;

-- ──────────────────────────────────────────────────────────────
-- 2. TABLE DEFINITIONS
-- ──────────────────────────────────────────────────────────────

CREATE OR REPLACE TABLE HOLDINGS (
    TICKER          VARCHAR(10)    NOT NULL,
    COMPANY_NAME    VARCHAR(100)   NOT NULL,
    SECTOR          VARCHAR(50)    NOT NULL,
    WEIGHT_PCT      FLOAT          NOT NULL,
    BETA            FLOAT          NOT NULL,
    ANN_RETURN_PCT  FLOAT          NOT NULL,
    ANN_VOL_PCT     FLOAT          NOT NULL,
    AUM_MILLIONS    FLOAT          NOT NULL,
    AS_OF_DATE      DATE           DEFAULT CURRENT_DATE,
    PRIMARY KEY (TICKER, AS_OF_DATE)
);

CREATE OR REPLACE TABLE DAILY_RETURNS (
    TRADE_DATE      DATE           NOT NULL,
    TICKER          VARCHAR(10)    NOT NULL,
    DAILY_RETURN    FLOAT          NOT NULL,
    CUMULATIVE_RET  FLOAT,
    CREATED_AT      TIMESTAMP_NTZ  DEFAULT CURRENT_TIMESTAMP(),
    PRIMARY KEY (TRADE_DATE, TICKER)
);

CREATE OR REPLACE TABLE PORTFOLIO_PERFORMANCE (
    TRADE_DATE      DATE           NOT NULL,
    PORT_RETURN     FLOAT          NOT NULL,
    BENCH_RETURN    FLOAT          NOT NULL,
    PORT_CUMRET     FLOAT          NOT NULL,
    BENCH_CUMRET    FLOAT          NOT NULL,
    DRAWDOWN        FLOAT          NOT NULL,
    ROLLING_VOL_20D FLOAT,
    ROLLING_SHARPE  FLOAT,
    PRIMARY KEY (TRADE_DATE)
);

CREATE OR REPLACE TABLE RISK_METRICS_DAILY (
    CALC_DATE       DATE           NOT NULL,
    VAR_95          FLOAT,
    CVAR_95         FLOAT,
    VAR_99          FLOAT,
    CVAR_99         FLOAT,
    ROLLING_BETA    FLOAT,
    MAX_DRAWDOWN    FLOAT,
    SHARPE_TTM      FLOAT,
    SORTINO_TTM     FLOAT,
    PRIMARY KEY (CALC_DATE)
);

CREATE OR REPLACE TABLE ANOMALY_FLAGS (
    TRADE_DATE      DATE           NOT NULL,
    PORT_RETURN     FLOAT          NOT NULL,
    Z_SCORE         FLOAT          NOT NULL,
    ROLLING_VOL     FLOAT,
    IS_ANOMALY      BOOLEAN        NOT NULL DEFAULT FALSE,
    ANOMALY_SCORE   FLOAT,
    FLAG_REASON     VARCHAR(200),
    PRIMARY KEY (TRADE_DATE)
);

-- ──────────────────────────────────────────────────────────────
-- 3. CORE PORTFOLIO ANALYTICS
-- ──────────────────────────────────────────────────────────────

-- 3a. Portfolio-level summary with annualized metrics
CREATE OR REPLACE VIEW VW_PORTFOLIO_SUMMARY AS
WITH daily_stats AS (
    SELECT
        AVG(PORT_RETURN)                               AS avg_daily_return,
        STDDEV(PORT_RETURN)                            AS daily_vol,
        AVG(PORT_RETURN) * 252                         AS ann_return,
        STDDEV(PORT_RETURN) * SQRT(252)                AS ann_vol,
        MIN(DRAWDOWN)                                  AS max_drawdown,
        COUNT(*)                                       AS trading_days,
        SUM(CASE WHEN PORT_RETURN > 0 THEN 1 ELSE 0 END) AS up_days,
        SUM(CASE WHEN PORT_RETURN < 0 THEN 1 ELSE 0 END) AS down_days
    FROM PORTFOLIO_PERFORMANCE
),
risk_metrics AS (
    SELECT
        PERCENTILE_CONT(0.05) WITHIN GROUP (ORDER BY PORT_RETURN) AS var_95,
        PERCENTILE_CONT(0.01) WITHIN GROUP (ORDER BY PORT_RETURN) AS var_99,
        AVG(CASE WHEN PORT_RETURN <= PERCENTILE_CONT(0.05) WITHIN GROUP
            (ORDER BY PORT_RETURN) THEN PORT_RETURN END)           AS cvar_95
    FROM PORTFOLIO_PERFORMANCE
)
SELECT
    d.ann_return                                       AS ann_return_pct,
    d.ann_vol                                          AS ann_volatility_pct,
    (d.ann_return - 0.045) / NULLIF(d.ann_vol, 0)     AS sharpe_ratio,
    d.max_drawdown                                     AS max_drawdown_pct,
    d.trading_days,
    d.up_days,
    d.down_days,
    ROUND(d.up_days / NULLIF(d.trading_days, 0) * 100, 2) AS win_rate_pct,
    r.var_95  * 100                                    AS var_95_pct,
    r.var_99  * 100                                    AS var_99_pct,
    r.cvar_95 * 100                                    AS cvar_95_pct
FROM daily_stats d
CROSS JOIN risk_metrics r;


-- 3b. Rolling 20-day Sharpe and volatility
CREATE OR REPLACE VIEW VW_ROLLING_RISK AS
SELECT
    TRADE_DATE,
    PORT_RETURN,
    AVG(PORT_RETURN)    OVER (ORDER BY TRADE_DATE ROWS BETWEEN 19 PRECEDING AND CURRENT ROW) AS roll_20d_return,
    STDDEV(PORT_RETURN) OVER (ORDER BY TRADE_DATE ROWS BETWEEN 19 PRECEDING AND CURRENT ROW) AS roll_20d_vol,
    STDDEV(PORT_RETURN) OVER (ORDER BY TRADE_DATE ROWS BETWEEN 59 PRECEDING AND CURRENT ROW) AS roll_60d_vol,
    -- Annualized rolling Sharpe (20-day window)
    CASE
        WHEN STDDEV(PORT_RETURN) OVER (ORDER BY TRADE_DATE ROWS BETWEEN 19 PRECEDING AND CURRENT ROW) > 0
        THEN (AVG(PORT_RETURN) OVER (ORDER BY TRADE_DATE ROWS BETWEEN 19 PRECEDING AND CURRENT ROW) * 252
              - 0.045)
             / (STDDEV(PORT_RETURN) OVER (ORDER BY TRADE_DATE ROWS BETWEEN 19 PRECEDING AND CURRENT ROW) * SQRT(252))
        ELSE NULL
    END AS roll_20d_sharpe,
    -- Drawdown from rolling peak
    PORT_CUMRET - MAX(PORT_CUMRET) OVER (ORDER BY TRADE_DATE ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS drawdown,
    BENCH_RETURN,
    PORT_CUMRET,
    BENCH_CUMRET
FROM PORTFOLIO_PERFORMANCE
ORDER BY TRADE_DATE;


-- 3c. Active return and tracking error vs benchmark
CREATE OR REPLACE VIEW VW_ACTIVE_RETURN AS
SELECT
    TRADE_DATE,
    PORT_RETURN,
    BENCH_RETURN,
    PORT_RETURN - BENCH_RETURN                                            AS active_return,
    SUM(PORT_RETURN - BENCH_RETURN)
        OVER (ORDER BY TRADE_DATE ROWS BETWEEN 251 PRECEDING AND CURRENT ROW) AS ttm_active_return,
    STDDEV(PORT_RETURN - BENCH_RETURN)
        OVER (ORDER BY TRADE_DATE ROWS BETWEEN 251 PRECEDING AND CURRENT ROW)
        * SQRT(252)                                                        AS tracking_error_ann,
    -- Information Ratio
    CASE
        WHEN STDDEV(PORT_RETURN - BENCH_RETURN)
             OVER (ORDER BY TRADE_DATE ROWS BETWEEN 251 PRECEDING AND CURRENT ROW) > 0
        THEN (AVG(PORT_RETURN - BENCH_RETURN)
              OVER (ORDER BY TRADE_DATE ROWS BETWEEN 251 PRECEDING AND CURRENT ROW) * 252)
             / (STDDEV(PORT_RETURN - BENCH_RETURN)
                OVER (ORDER BY TRADE_DATE ROWS BETWEEN 251 PRECEDING AND CURRENT ROW) * SQRT(252))
        ELSE NULL
    END AS information_ratio
FROM PORTFOLIO_PERFORMANCE
ORDER BY TRADE_DATE;


-- ──────────────────────────────────────────────────────────────
-- 4. SECTOR & HOLDINGS ANALYTICS
-- ──────────────────────────────────────────────────────────────

-- 4a. Sector-level concentration and risk contribution
CREATE OR REPLACE VIEW VW_SECTOR_ANALYSIS AS
SELECT
    SECTOR,
    COUNT(TICKER)                                      AS num_holdings,
    ROUND(SUM(WEIGHT_PCT), 2)                          AS total_weight_pct,
    ROUND(SUM(AUM_MILLIONS), 2)                        AS total_aum_millions,
    ROUND(AVG(BETA), 3)                                AS avg_beta,
    ROUND(AVG(ANN_RETURN_PCT), 2)                      AS avg_ann_return_pct,
    ROUND(AVG(ANN_VOL_PCT), 2)                         AS avg_ann_vol_pct,
    ROUND(AVG(ANN_RETURN_PCT) / NULLIF(AVG(ANN_VOL_PCT), 0), 3) AS sector_sharpe,
    -- Herfindahl-Hirschman Index for concentration within sector
    ROUND(SUM(POWER(WEIGHT_PCT / NULLIF(SUM(WEIGHT_PCT) OVER (PARTITION BY SECTOR), 0), 2)), 4) AS hhi_within_sector
FROM HOLDINGS
GROUP BY SECTOR
ORDER BY total_weight_pct DESC;


-- 4b. Holdings ranked by risk-adjusted return contribution
CREATE OR REPLACE VIEW VW_HOLDINGS_RANKED AS
SELECT
    TICKER,
    COMPANY_NAME,
    SECTOR,
    WEIGHT_PCT,
    AUM_MILLIONS,
    ANN_RETURN_PCT,
    ANN_VOL_PCT,
    BETA,
    -- Return contribution to portfolio
    ROUND(WEIGHT_PCT / 100 * ANN_RETURN_PCT, 4)                 AS return_contribution_pct,
    -- Volatility contribution (simplified)
    ROUND(WEIGHT_PCT / 100 * ANN_VOL_PCT, 4)                    AS vol_contribution_pct,
    -- Individual Sharpe
    ROUND((ANN_RETURN_PCT - 4.5) / NULLIF(ANN_VOL_PCT, 0), 3)  AS individual_sharpe,
    -- Rank by return contribution
    RANK() OVER (ORDER BY WEIGHT_PCT / 100 * ANN_RETURN_PCT DESC) AS return_contrib_rank,
    -- Flag high-beta names
    CASE WHEN BETA > 1.3 THEN 'HIGH BETA' WHEN BETA < 0.7 THEN 'DEFENSIVE' ELSE 'NEUTRAL' END AS beta_flag
FROM HOLDINGS
ORDER BY return_contribution_pct DESC;


-- ──────────────────────────────────────────────────────────────
-- 5. RISK METRICS — VAR & DRAWDOWN
-- ──────────────────────────────────────────────────────────────

-- 5a. Historical VaR at multiple confidence levels
CREATE OR REPLACE VIEW VW_VAR_ANALYSIS AS
WITH percentiles AS (
    SELECT
        PERCENTILE_CONT(0.10) WITHIN GROUP (ORDER BY PORT_RETURN) AS var_90_raw,
        PERCENTILE_CONT(0.05) WITHIN GROUP (ORDER BY PORT_RETURN) AS var_95_raw,
        PERCENTILE_CONT(0.01) WITHIN GROUP (ORDER BY PORT_RETURN) AS var_99_raw
    FROM PORTFOLIO_PERFORMANCE
),
cvar AS (
    SELECT
        p.var_90_raw, p.var_95_raw, p.var_99_raw,
        AVG(CASE WHEN pp.PORT_RETURN <= p.var_90_raw THEN pp.PORT_RETURN END) AS cvar_90_raw,
        AVG(CASE WHEN pp.PORT_RETURN <= p.var_95_raw THEN pp.PORT_RETURN END) AS cvar_95_raw,
        AVG(CASE WHEN pp.PORT_RETURN <= p.var_99_raw THEN pp.PORT_RETURN END) AS cvar_99_raw
    FROM percentiles p
    CROSS JOIN PORTFOLIO_PERFORMANCE pp
    GROUP BY p.var_90_raw, p.var_95_raw, p.var_99_raw
)
SELECT
    ROUND(var_90_raw  * 100, 3)  AS var_90_pct,
    ROUND(var_95_raw  * 100, 3)  AS var_95_pct,
    ROUND(var_99_raw  * 100, 3)  AS var_99_pct,
    ROUND(cvar_90_raw * 100, 3)  AS cvar_90_pct,
    ROUND(cvar_95_raw * 100, 3)  AS cvar_95_pct,
    ROUND(cvar_99_raw * 100, 3)  AS cvar_99_pct,
    -- Dollar impact on $250M AUM
    ROUND(ABS(var_95_raw)  * 250, 2) AS var_95_dollars_millions,
    ROUND(ABS(cvar_95_raw) * 250, 2) AS cvar_95_dollars_millions,
    ROUND(ABS(var_99_raw)  * 250, 2) AS var_99_dollars_millions
FROM cvar;


-- 5b. Drawdown periods — start, end, depth, duration, recovery
CREATE OR REPLACE VIEW VW_DRAWDOWN_PERIODS AS
WITH peaks AS (
    SELECT
        TRADE_DATE,
        PORT_CUMRET,
        DRAWDOWN,
        MAX(PORT_CUMRET) OVER (ORDER BY TRADE_DATE ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_peak,
        LAG(DRAWDOWN, 1, 0) OVER (ORDER BY TRADE_DATE) AS prev_drawdown
    FROM PORTFOLIO_PERFORMANCE
),
drawdown_starts AS (
    SELECT
        TRADE_DATE AS dd_start,
        PORT_CUMRET AS peak_value,
        ROW_NUMBER() OVER (ORDER BY TRADE_DATE) AS dd_id
    FROM peaks
    WHERE DRAWDOWN < -0.001 AND prev_drawdown >= -0.001
)
SELECT
    d.dd_id,
    d.dd_start,
    MIN(p.TRADE_DATE)                                  AS trough_date,
    MIN(p.DRAWDOWN) * 100                              AS max_drawdown_pct,
    DATEDIFF('day', d.dd_start, MIN(p.TRADE_DATE))     AS days_to_trough,
    COUNT(p.TRADE_DATE)                                AS total_duration_days
FROM drawdown_starts d
JOIN PORTFOLIO_PERFORMANCE p ON p.TRADE_DATE >= d.dd_start
    AND (p.DRAWDOWN < -0.001)
GROUP BY d.dd_id, d.dd_start
HAVING MIN(p.DRAWDOWN) < -0.02   -- only show drawdowns > 2%
ORDER BY max_drawdown_pct ASC;


-- ──────────────────────────────────────────────────────────────
-- 6. ANOMALY DETECTION QUERIES
-- ──────────────────────────────────────────────────────────────

-- 6a. Flag returns beyond 2.5 standard deviations
CREATE OR REPLACE VIEW VW_ANOMALY_RETURNS AS
WITH stats AS (
    SELECT
        AVG(PORT_RETURN)    AS mean_ret,
        STDDEV(PORT_RETURN) AS std_ret
    FROM PORTFOLIO_PERFORMANCE
)
SELECT
    p.TRADE_DATE,
    p.PORT_RETURN * 100                                AS return_pct,
    (p.PORT_RETURN - s.mean_ret) / NULLIF(s.std_ret, 0) AS z_score,
    ABS((p.PORT_RETURN - s.mean_ret) / NULLIF(s.std_ret, 0)) AS abs_z_score,
    CASE
        WHEN ABS((p.PORT_RETURN - s.mean_ret) / NULLIF(s.std_ret, 0)) > 3.0 THEN 'EXTREME'
        WHEN ABS((p.PORT_RETURN - s.mean_ret) / NULLIF(s.std_ret, 0)) > 2.5 THEN 'HIGH'
        ELSE 'NORMAL'
    END AS anomaly_level,
    CASE WHEN p.PORT_RETURN < 0 THEN 'NEGATIVE' ELSE 'POSITIVE' END AS direction
FROM PORTFOLIO_PERFORMANCE p
CROSS JOIN stats s
WHERE ABS((p.PORT_RETURN - s.mean_ret) / NULLIF(s.std_ret, 0)) > 2.5
ORDER BY abs_z_score DESC;


-- ──────────────────────────────────────────────────────────────
-- 7. STORED PROCEDURE — DAILY RISK REFRESH
-- ──────────────────────────────────────────────────────────────

CREATE OR REPLACE PROCEDURE SP_REFRESH_RISK_METRICS(CALC_DATE DATE)
RETURNS VARCHAR
LANGUAGE SQL
AS
$$
DECLARE
    v_var_95    FLOAT;
    v_cvar_95   FLOAT;
    v_var_99    FLOAT;
    v_cvar_99   FLOAT;
    v_sharpe    FLOAT;
    v_sortino   FLOAT;
    v_max_dd    FLOAT;
BEGIN
    -- Calculate VaR using 252-day trailing window
    SELECT
        PERCENTILE_CONT(0.05) WITHIN GROUP (ORDER BY PORT_RETURN),
        PERCENTILE_CONT(0.01) WITHIN GROUP (ORDER BY PORT_RETURN),
        MIN(DRAWDOWN)
    INTO v_var_95, v_var_99, v_max_dd
    FROM PORTFOLIO_PERFORMANCE
    WHERE TRADE_DATE BETWEEN DATEADD('day', -252, :CALC_DATE) AND :CALC_DATE;

    -- CVaR
    SELECT AVG(PORT_RETURN)
    INTO v_cvar_95
    FROM PORTFOLIO_PERFORMANCE
    WHERE TRADE_DATE BETWEEN DATEADD('day', -252, :CALC_DATE) AND :CALC_DATE
      AND PORT_RETURN <= :v_var_95;

    SELECT AVG(PORT_RETURN)
    INTO v_cvar_99
    FROM PORTFOLIO_PERFORMANCE
    WHERE TRADE_DATE BETWEEN DATEADD('day', -252, :CALC_DATE) AND :CALC_DATE
      AND PORT_RETURN <= :v_var_99;

    -- Sharpe (TTM, RF = 4.5%)
    SELECT (AVG(PORT_RETURN) * 252 - 0.045) / NULLIF(STDDEV(PORT_RETURN) * SQRT(252), 0)
    INTO v_sharpe
    FROM PORTFOLIO_PERFORMANCE
    WHERE TRADE_DATE BETWEEN DATEADD('day', -252, :CALC_DATE) AND :CALC_DATE;

    -- Sortino (downside deviation only)
    SELECT (AVG(PORT_RETURN) * 252 - 0.045) /
           NULLIF(STDDEV(CASE WHEN PORT_RETURN < 0 THEN PORT_RETURN END) * SQRT(252), 0)
    INTO v_sortino
    FROM PORTFOLIO_PERFORMANCE
    WHERE TRADE_DATE BETWEEN DATEADD('day', -252, :CALC_DATE) AND :CALC_DATE;

    -- Upsert into risk metrics table
    MERGE INTO RISK_METRICS_DAILY tgt
    USING (SELECT :CALC_DATE AS calc_date) src
    ON tgt.CALC_DATE = src.calc_date
    WHEN MATCHED THEN UPDATE SET
        VAR_95       = :v_var_95,
        CVAR_95      = :v_cvar_95,
        VAR_99       = :v_var_99,
        CVAR_99      = :v_cvar_99,
        MAX_DRAWDOWN = :v_max_dd,
        SHARPE_TTM   = :v_sharpe,
        SORTINO_TTM  = :v_sortino
    WHEN NOT MATCHED THEN INSERT
        (CALC_DATE, VAR_95, CVAR_95, VAR_99, CVAR_99, MAX_DRAWDOWN, SHARPE_TTM, SORTINO_TTM)
    VALUES
        (:CALC_DATE, :v_var_95, :v_cvar_95, :v_var_99, :v_cvar_99, :v_max_dd, :v_sharpe, :v_sortino);

    RETURN 'Risk metrics refreshed for ' || :CALC_DATE::VARCHAR;
END;
$$;

-- Call the procedure
CALL SP_REFRESH_RISK_METRICS(CURRENT_DATE);


-- ──────────────────────────────────────────────────────────────
-- 8. REPORTING QUERIES (Power BI data sources)
-- ──────────────────────────────────────────────────────────────

-- 8a. Performance summary card (feeds Power BI KPI cards)
SELECT
    ROUND(ann_return_pct, 2)        AS "Ann Return %",
    ROUND(ann_volatility_pct, 2)    AS "Ann Volatility %",
    ROUND(sharpe_ratio, 3)          AS "Sharpe Ratio",
    ROUND(max_drawdown_pct * 100, 2) AS "Max Drawdown %",
    ROUND(var_95_pct, 3)            AS "VaR 95% (1D)",
    ROUND(cvar_95_pct, 3)           AS "CVaR 95% (1D)",
    win_rate_pct                    AS "Win Rate %",
    trading_days                    AS "Trading Days"
FROM VW_PORTFOLIO_SUMMARY;


-- 8b. Monthly return heatmap data (feeds Power BI matrix)
SELECT
    YEAR(TRADE_DATE)                         AS year,
    MONTHNAME(TRADE_DATE)                    AS month_name,
    MONTH(TRADE_DATE)                        AS month_num,
    ROUND(SUM(PORT_RETURN)  * 100, 2)        AS port_monthly_return_pct,
    ROUND(SUM(BENCH_RETURN) * 100, 2)        AS bench_monthly_return_pct,
    ROUND((SUM(PORT_RETURN) - SUM(BENCH_RETURN)) * 100, 2) AS active_return_pct
FROM PORTFOLIO_PERFORMANCE
GROUP BY YEAR(TRADE_DATE), MONTHNAME(TRADE_DATE), MONTH(TRADE_DATE)
ORDER BY year, month_num;


-- 8c. Holdings with live enrichment for Power BI table
SELECT
    h.TICKER,
    h.COMPANY_NAME,
    h.SECTOR,
    h.WEIGHT_PCT,
    h.AUM_MILLIONS,
    h.BETA,
    h.ANN_RETURN_PCT,
    h.ANN_VOL_PCT,
    r.return_contribution_pct,
    r.individual_sharpe,
    r.beta_flag,
    r.return_contrib_rank
FROM HOLDINGS h
JOIN VW_HOLDINGS_RANKED r ON h.TICKER = r.TICKER
ORDER BY h.WEIGHT_PCT DESC;
