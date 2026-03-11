import { useState, useEffect, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  ScatterChart, Scatter, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, ReferenceDot
} from "recharts";

// ── COLORS ────────────────────────────────────────────────────────────────────
const C = {
  bg:      "#07090f",
  panel:   "#0c1018",
  border:  "#161d2e",
  accent:  "#00d4aa",   // teal green
  gold:    "#f0b429",
  red:     "#f45b5b",
  blue:    "#4d9fff",
  blueD:   "#1a3a6b",
  purple:  "#8b7cf8",
  text:    "#e2e8f0",
  textMid: "#7d93b2",
  textDim: "#3d5070",
  green:   "#00d4aa",
};

const SECTOR_COLORS = {
  "Technology":       "#4d9fff",
  "Financials":       "#f0b429",
  "Healthcare":       "#00d4aa",
  "Consumer Disc":    "#f45b5b",
  "Consumer Staples": "#8b7cf8",
  "Energy":           "#fb923c",
  "Utilities":        "#34d399",
  "Real Estate":      "#a78bfa",
  "Materials":        "#60a5fa",
  "Industrials":      "#fbbf24",
};

// ── EMBEDDED DATA ─────────────────────────────────────────────────────────────
const SUMMARY = {"firm":"Apex Capital Management","aum_millions":250,"n_holdings":20,"ann_return":6.69,"ann_vol":19.04,"sharpe":0.352,"sortino":0.52,"max_dd":-54.07,"var_95":-1.788,"cvar_95":-2.692,"var_99":-3.144,"cvar_99":-4.115,"beta":1.098,"alpha":-0.65,"n_anomalies":53,"sector_weights":{"Technology":23.11,"Financials":17.09,"Healthcare":15.08,"Energy":7.54,"Consumer Disc":14.58,"Consumer Staples":9.05,"Utilities":4.02,"Real Estate":3.52,"Materials":3.02,"Industrials":3.02},"optimal_portfolio":{"return":14.44,"volatility":21.11,"sharpe":0.684},"min_variance_portfolio":{"return":-6.37,"volatility":13.91,"sharpe":-0.458}};

const HOLDINGS = [{"ticker":"AAPL","name":"Apple Inc","sector":"Technology","weight":8.54,"beta":1.2,"ret":28.0,"vol":24.0,"aum":21.36},{"ticker":"MSFT","name":"Microsoft Corp","sector":"Technology","weight":8.04,"beta":1.1,"ret":32.0,"vol":22.0,"aum":20.1},{"ticker":"GOOGL","name":"Alphabet Inc","sector":"Technology","weight":6.53,"beta":1.15,"ret":25.0,"vol":26.0,"aum":16.33},{"ticker":"JPM","name":"JPMorgan Chase","sector":"Financials","weight":7.04,"beta":1.25,"ret":18.0,"vol":28.0,"aum":17.6},{"ticker":"GS","name":"Goldman Sachs","sector":"Financials","weight":5.53,"beta":1.4,"ret":20.0,"vol":30.0,"aum":13.83},{"ticker":"BAC","name":"Bank of America","sector":"Financials","weight":4.52,"beta":1.35,"ret":15.0,"vol":29.0,"aum":11.3},{"ticker":"JNJ","name":"J&J","sector":"Healthcare","weight":6.03,"beta":0.65,"ret":10.0,"vol":14.0,"aum":15.08},{"ticker":"UNH","name":"UnitedHealth","sector":"Healthcare","weight":5.53,"beta":0.75,"ret":18.0,"vol":18.0,"aum":13.83},{"ticker":"PFE","name":"Pfizer","sector":"Healthcare","weight":3.52,"beta":0.7,"ret":8.0,"vol":20.0,"aum":8.8},{"ticker":"XOM","name":"ExxonMobil","sector":"Energy","weight":4.02,"beta":0.9,"ret":14.0,"vol":26.0,"aum":10.05},{"ticker":"CVX","name":"Chevron","sector":"Energy","weight":3.52,"beta":0.85,"ret":12.0,"vol":24.0,"aum":8.8},{"ticker":"AMZN","name":"Amazon","sector":"Consumer Disc","weight":7.04,"beta":1.3,"ret":22.0,"vol":28.0,"aum":17.6},{"ticker":"TSLA","name":"Tesla","sector":"Consumer Disc","weight":4.02,"beta":1.8,"ret":30.0,"vol":55.0,"aum":10.05},{"ticker":"HD","name":"Home Depot","sector":"Consumer Disc","weight":3.52,"beta":1.05,"ret":16.0,"vol":20.0,"aum":8.8},{"ticker":"PG","name":"P&G","sector":"Consumer Staples","weight":5.03,"beta":0.55,"ret":9.0,"vol":13.0,"aum":12.58},{"ticker":"KO","name":"Coca-Cola","sector":"Consumer Staples","weight":4.02,"beta":0.5,"ret":7.0,"vol":12.0,"aum":10.05},{"ticker":"NEE","name":"NextEra Energy","sector":"Utilities","weight":4.02,"beta":0.6,"ret":11.0,"vol":15.0,"aum":10.05},{"ticker":"AMT","name":"American Tower","sector":"Real Estate","weight":3.52,"beta":0.8,"ret":13.0,"vol":18.0,"aum":8.8},{"ticker":"LIN","name":"Linde PLC","sector":"Materials","weight":3.02,"beta":0.85,"ret":15.0,"vol":18.0,"aum":7.55},{"ticker":"CAT","name":"Caterpillar","sector":"Industrials","weight":3.02,"beta":1.1,"ret":17.0,"vol":22.0,"aum":7.55}];

const PERF_DATA = [{"date":"2021-01","port":1.16,"bench":0.9,"dd":0.0},{"date":"2021-01","port":2.32,"bench":0.84,"dd":0.0},{"date":"2021-01","port":0.22,"bench":-0.08,"dd":-3.05},{"date":"2021-01","port":-0.58,"bench":-1.62,"dd":-3.87},{"date":"2021-02","port":0.97,"bench":-0.57,"dd":-3.11},{"date":"2021-02","port":2.78,"bench":1.09,"dd":-1.3},{"date":"2021-02","port":5.07,"bench":3.1,"dd":0.0},{"date":"2021-02","port":4.31,"bench":2.57,"dd":-0.73},{"date":"2021-03","port":7.84,"bench":5.62,"dd":0.0},{"date":"2021-03","port":5.11,"bench":3.66,"dd":-2.55},{"date":"2021-03","port":12.72,"bench":9.31,"dd":0.0},{"date":"2021-03","port":17.43,"bench":12.45,"dd":0.0},{"date":"2021-04","port":18.7,"bench":13.12,"dd":0.0},{"date":"2021-04","port":23.52,"bench":17.18,"dd":0.0},{"date":"2021-04","port":26.1,"bench":18.87,"dd":0.0},{"date":"2021-04","port":25.44,"bench":18.62,"dd":-0.52},{"date":"2021-05","port":27.98,"bench":20.6,"dd":0.0},{"date":"2021-05","port":28.41,"bench":21.03,"dd":0.0},{"date":"2021-05","port":26.34,"bench":19.26,"dd":-1.62},{"date":"2021-05","port":27.71,"bench":20.49,"dd":-0.54},{"date":"2021-06","port":30.73,"bench":22.21,"dd":0.0},{"date":"2021-06","port":31.87,"bench":22.7,"dd":0.0},{"date":"2021-06","port":32.71,"bench":23.7,"dd":0.0},{"date":"2021-07","port":32.04,"bench":22.71,"dd":-0.5},{"date":"2021-07","port":29.7,"bench":20.66,"dd":-2.27},{"date":"2021-07","port":32.32,"bench":23.03,"dd":0.0},{"date":"2021-07","port":35.49,"bench":25.39,"dd":0.0},{"date":"2021-08","port":36.65,"bench":26.07,"dd":0.0},{"date":"2021-08","port":38.8,"bench":27.62,"dd":0.0},{"date":"2021-08","port":43.45,"bench":30.94,"dd":0.0},{"date":"2021-08","port":44.59,"bench":31.49,"dd":0.0},{"date":"2021-09","port":46.03,"bench":32.48,"dd":0.0},{"date":"2021-09","port":46.82,"bench":32.88,"dd":0.0},{"date":"2021-09","port":44.54,"bench":31.1,"dd":-1.57},{"date":"2021-09","port":44.26,"bench":30.86,"dd":-1.77},{"date":"2021-10","port":45.99,"bench":32.15,"dd":-0.03},{"date":"2021-10","port":49.18,"bench":34.68,"dd":0.0},{"date":"2021-10","port":48.41,"bench":33.83,"dd":-0.51},{"date":"2021-11","port":52.07,"bench":36.71,"dd":0.0},{"date":"2021-11","port":48.11,"bench":33.14,"dd":-2.61},{"date":"2021-11","port":44.8,"bench":30.56,"dd":-4.78},{"date":"2021-11","port":43.41,"bench":29.29,"dd":-5.71},{"date":"2021-12","port":43.77,"bench":29.85,"dd":-5.4},{"date":"2021-12","port":46.37,"bench":31.92,"dd":-3.62},{"date":"2021-12","port":49.38,"bench":34.37,"dd":-1.74},{"date":"2021-12","port":53.19,"bench":37.35,"dd":0.0},{"date":"2022-01","port":50.21,"bench":34.89,"dd":-1.96},{"date":"2022-01","port":45.82,"bench":30.86,"dd":-4.87},{"date":"2022-01","port":38.87,"bench":25.06,"dd":-9.47},{"date":"2022-01","port":31.46,"bench":19.28,"dd":-14.34},{"date":"2022-02","port":28.73,"bench":16.93,"dd":-16.17},{"date":"2022-02","port":24.59,"bench":13.71,"dd":-18.94},{"date":"2022-02","port":22.1,"bench":11.55,"dd":-20.58},{"date":"2022-02","port":21.05,"bench":10.64,"dd":-21.35},{"date":"2022-03","port":18.35,"bench":8.4,"dd":-23.25},{"date":"2022-03","port":22.7,"bench":11.88,"dd":-20.49},{"date":"2022-03","port":24.23,"bench":13.4,"dd":-19.24},{"date":"2022-03","port":22.87,"bench":12.09,"dd":-20.26},{"date":"2022-04","port":18.61,"bench":8.72,"dd":-23.04},{"date":"2022-04","port":12.33,"bench":3.51,"dd":-27.93},{"date":"2022-04","port":5.93,"bench":-1.88,"dd":-32.69},{"date":"2022-04","port":3.66,"bench":-3.85,"dd":-34.22},{"date":"2022-05","port":0.66,"bench":-6.38,"dd":-36.44},{"date":"2022-05","port":-3.25,"bench":-9.61,"dd":-39.17},{"date":"2022-05","port":-6.96,"bench":-12.68,"dd":-42.01},{"date":"2022-06","port":-14.55,"bench":-18.96,"dd":-47.93},{"date":"2022-06","port":-21.73,"bench":-24.93,"dd":-53.03},{"date":"2022-06","port":-27.81,"bench":-29.97,"dd":-57.26},{"date":"2022-06","port":-25.43,"bench":-27.67,"dd":-55.29},{"date":"2022-07","port":-22.85,"bench":-25.35,"dd":-52.93},{"date":"2022-07","port":-17.97,"bench":-20.95,"dd":-48.65},{"date":"2022-07","port":-12.9,"bench":-16.37,"dd":-44.42},{"date":"2022-07","port":-9.97,"bench":-13.61,"dd":-41.97},{"date":"2022-08","port":-7.66,"bench":-11.48,"dd":-40.0},{"date":"2022-08","port":-5.28,"bench":-9.37,"dd":-38.0},{"date":"2022-08","port":-8.97,"bench":-12.44,"dd":-40.9},{"date":"2022-08","port":-10.97,"bench":-14.32,"dd":-42.54},{"date":"2022-09","port":-13.54,"bench":-16.78,"dd":-44.64},{"date":"2022-09","port":-16.5,"bench":-19.4,"dd":-46.99},{"date":"2022-09","port":-20.18,"bench":-22.8,"dd":-49.8},{"date":"2022-09","port":-22.9,"bench":-25.3,"dd":-51.98},{"date":"2022-10","port":-26.65,"bench":-28.73,"dd":-54.86},{"date":"2022-10","port":-23.62,"bench":-26.0,"dd":-52.43},{"date":"2022-10","port":-19.45,"bench":-22.19,"dd":-49.07},{"date":"2022-10","port":-16.37,"bench":-19.29,"dd":-46.65},{"date":"2022-11","port":-13.2,"bench":-16.27,"dd":-44.08},{"date":"2022-11","port":-10.01,"bench":-13.24,"dd":-41.62},{"date":"2022-11","port":-6.79,"bench":-10.3,"dd":-39.06},{"date":"2022-12","port":-9.71,"bench":-12.81,"dd":-41.36},{"date":"2022-12","port":-11.73,"bench":-14.89,"dd":-42.94},{"date":"2022-12","port":-8.66,"bench":-12.07,"dd":-40.5},{"date":"2022-12","port":-6.2,"bench":-9.75,"dd":-38.61},{"date":"2023-01","port":-3.52,"bench":-7.27,"dd":-36.7},{"date":"2023-01","port":1.61,"bench":-3.17,"dd":-32.86},{"date":"2023-01","port":4.16,"bench":-1.0,"dd":-30.89},{"date":"2023-01","port":6.17,"bench":0.77,"dd":-29.41},{"date":"2023-02","port":4.63,"bench":-0.67,"dd":-30.62},{"date":"2023-02","port":7.15,"bench":1.58,"dd":-28.58},{"date":"2023-02","port":7.06,"bench":1.44,"dd":-28.65},{"date":"2023-03","port":9.57,"bench":3.59,"dd":-26.7},{"date":"2023-03","port":11.53,"bench":5.42,"dd":-25.12},{"date":"2023-03","port":14.87,"bench":8.31,"dd":-22.5},{"date":"2023-03","port":17.26,"bench":10.47,"dd":-20.5},{"date":"2023-04","port":18.43,"bench":11.28,"dd":-19.56},{"date":"2023-04","port":20.71,"bench":13.49,"dd":-17.73},{"date":"2023-04","port":23.02,"bench":15.42,"dd":-15.79},{"date":"2023-05","port":21.57,"bench":14.19,"dd":-17.0},{"date":"2023-05","port":22.45,"bench":15.07,"dd":-16.24},{"date":"2023-05","port":21.38,"bench":14.06,"dd":-17.09},{"date":"2023-06","port":24.57,"bench":16.84,"dd":-14.34},{"date":"2023-06","port":27.67,"bench":19.37,"dd":-11.87},{"date":"2023-06","port":29.52,"bench":21.06,"dd":-10.32},{"date":"2023-07","port":28.07,"bench":19.6,"dd":-11.48},{"date":"2023-07","port":31.56,"bench":22.6,"dd":-8.56},{"date":"2023-07","port":33.86,"bench":24.59,"dd":-6.62},{"date":"2023-07","port":35.62,"bench":26.25,"dd":-5.11},{"date":"2023-08","port":32.86,"bench":23.75,"dd":-7.37},{"date":"2023-08","port":33.58,"bench":24.53,"dd":-6.72},{"date":"2023-08","port":34.22,"bench":25.24,"dd":-6.17},{"date":"2023-09","port":32.62,"bench":23.71,"dd":-7.63},{"date":"2023-09","port":31.15,"bench":22.35,"dd":-8.74},{"date":"2023-09","port":29.26,"bench":20.69,"dd":-10.31},{"date":"2023-10","port":26.52,"bench":18.27,"dd":-12.66},{"date":"2023-10","port":24.91,"bench":16.74,"dd":-13.95},{"date":"2023-10","port":24.02,"bench":15.91,"dd":-14.67},{"date":"2023-10","port":26.37,"bench":18.11,"dd":-12.73},{"date":"2023-11","port":29.16,"bench":20.71,"dd":-10.32},{"date":"2023-11","port":33.84,"bench":24.78,"dd":-6.52},{"date":"2023-11","port":37.84,"bench":28.15,"dd":-2.84},{"date":"2023-12","port":40.19,"bench":30.12,"dd":-0.79},{"date":"2023-12","port":39.31,"bench":29.25,"dd":-1.48},{"date":"2023-12","port":39.18,"bench":29.1,"dd":-1.58},{"date":"2023-12","port":40.75,"bench":30.52,"dd":-0.12},{"date":"2024-01","port":39.65,"bench":29.56,"dd":-1.03},{"date":"2024-01","port":40.96,"bench":30.71,"dd":0.0},{"date":"2024-01","port":41.75,"bench":31.44,"dd":0.0},{"date":"2024-02","port":42.47,"bench":32.17,"dd":0.0},{"date":"2024-02","port":43.91,"bench":33.44,"dd":0.0},{"date":"2024-02","port":46.59,"bench":35.71,"dd":0.0},{"date":"2024-02","port":48.73,"bench":37.51,"dd":0.0},{"date":"2024-03","port":50.66,"bench":39.29,"dd":0.0},{"date":"2024-03","port":52.97,"bench":41.18,"dd":0.0},{"date":"2024-03","port":55.12,"bench":43.24,"dd":0.0},{"date":"2024-04","port":53.94,"bench":42.22,"dd":-0.77},{"date":"2024-04","port":52.73,"bench":41.26,"dd":-1.56},{"date":"2024-04","port":51.18,"bench":40.0,"dd":-2.55},{"date":"2024-04","port":50.07,"bench":38.92,"dd":-3.26},{"date":"2024-05","port":53.21,"bench":41.62,"dd":-1.24},{"date":"2024-05","port":56.2,"bench":44.3,"dd":0.0},{"date":"2024-05","port":57.46,"bench":45.38,"dd":0.0},{"date":"2024-06","port":58.44,"bench":46.41,"dd":0.0},{"date":"2024-06","port":58.98,"bench":46.77,"dd":0.0},{"date":"2024-06","port":59.88,"bench":47.46,"dd":0.0},{"date":"2024-07","port":60.72,"bench":48.32,"dd":0.0},{"date":"2024-07","port":61.4,"bench":49.07,"dd":0.0},{"date":"2024-07","port":62.1,"bench":49.6,"dd":0.0},{"date":"2024-08","port":60.87,"bench":48.49,"dd":-0.76},{"date":"2024-08","port":58.97,"bench":46.85,"dd":-1.94},{"date":"2024-08","port":60.53,"bench":48.37,"dd":-0.98},{"date":"2024-09","port":65.22,"bench":52.14,"dd":0.0},{"date":"2024-09","port":68.82,"bench":55.58,"dd":0.0},{"date":"2024-09","port":70.56,"bench":57.22,"dd":0.0},{"date":"2024-10","port":73.03,"bench":59.4,"dd":0.0},{"date":"2024-10","port":75.42,"bench":61.47,"dd":0.0},{"date":"2024-10","port":77.73,"bench":63.5,"dd":0.0},{"date":"2024-11","port":76.08,"bench":62.0,"dd":-0.94},{"date":"2024-11","port":73.61,"bench":59.72,"dd":-2.34},{"date":"2024-11","port":68.87,"bench":55.32,"dd":-5.0},{"date":"2024-12","port":66.97,"bench":53.47,"dd":-5.97},{"date":"2024-12","port":64.79,"bench":51.51,"dd":-7.12},{"date":"2024-12","port":63.67,"bench":50.48,"dd":-7.94}];

const EF_DATA = [{"r":1.95,"v":18.75,"s":0.104},{"r":5.05,"v":17.54,"s":0.288},{"r":7.69,"v":21.6,"s":0.356},{"r":12.35,"v":25.68,"s":0.481},{"r":8.73,"v":22.18,"s":0.394},{"r":4.13,"v":18.98,"s":0.218},{"r":3.64,"v":19.34,"s":0.188},{"r":11.55,"v":25.07,"s":0.461},{"r":6.77,"v":19.92,"s":0.34},{"r":9.15,"v":21.78,"s":0.42},{"r":6.29,"v":20.23,"s":0.311},{"r":7.51,"v":21.58,"s":0.348},{"r":10.33,"v":23.17,"s":0.446},{"r":5.89,"v":18.93,"s":0.311},{"r":3.08,"v":18.61,"s":0.166},{"r":12.97,"v":26.84,"s":0.483},{"r":14.02,"v":28.19,"s":0.497},{"r":8.26,"v":21.4,"s":0.386},{"r":6.58,"v":19.97,"s":0.329},{"r":4.67,"v":18.62,"s":0.251},{"r":9.88,"v":22.54,"s":0.438},{"r":11.08,"v":24.06,"s":0.461},{"r":7.14,"v":20.47,"s":0.349},{"r":13.41,"v":27.3,"s":0.491},{"r":5.42,"v":18.79,"s":0.288},{"r":10.76,"v":23.65,"s":0.455},{"r":3.88,"v":18.92,"s":0.205},{"r":8.5,"v":21.95,"s":0.387},{"r":6.03,"v":19.38,"s":0.311},{"r":2.61,"v":18.84,"s":0.139},{"r":12.08,"v":25.41,"s":0.475},{"r":9.41,"v":22.35,"s":0.421},{"r":7.87,"v":21.13,"s":0.372},{"r":4.4,"v":18.73,"s":0.235},{"r":11.28,"v":24.48,"s":0.461},{"r":5.68,"v":18.86,"s":0.301},{"r":13.64,"v":27.7,"s":0.492},{"r":6.84,"v":20.05,"s":0.341},{"r":10.04,"v":22.78,"s":0.441},{"r":8.02,"v":21.28,"s":0.377},{"r":3.32,"v":18.7,"s":0.178},{"r":14.27,"v":28.97,"s":0.493},{"r":9.63,"v":22.6,"s":0.426},{"r":7.34,"v":20.72,"s":0.354},{"r":11.52,"v":24.94,"s":0.462},{"r":5.15,"v":18.69,"s":0.276},{"r":12.72,"v":26.51,"s":0.48},{"r":4.89,"v":18.65,"s":0.262},{"r":8.76,"v":22.05,"s":0.397},{"r":6.41,"v":19.6,"s":0.327},{"r":10.51,"v":23.39,"s":0.449},{"r":2.85,"v":18.72,"s":0.152},{"r":13.18,"v":27.02,"s":0.488},{"r":7.61,"v":20.92,"s":0.364},{"r":9.25,"v":22.17,"s":0.417},{"r":5.56,"v":18.82,"s":0.295},{"r":11.76,"v":25.22,"s":0.467},{"r":4.16,"v":18.77,"s":0.222},{"r":8.14,"v":21.45,"s":0.379},{"r":6.17,"v":19.49,"s":0.317},{"r":12.44,"v":25.94,"s":0.48},{"r":3.57,"v":18.88,"s":0.189},{"r":10.23,"v":23.01,"s":0.445},{"r":7.04,"v":20.32,"s":0.346},{"r":14.44,"v":29.28,"s":0.493},{"r":9.78,"v":22.72,"s":0.431},{"r":5.31,"v":18.73,"s":0.283},{"r":13.86,"v":28.4,"s":0.488},{"r":8.38,"v":21.7,"s":0.386},{"r":6.72,"v":20.01,"s":0.336},{"r":11.02,"v":23.92,"s":0.461},{"r":4.59,"v":18.68,"s":0.246},{"r":12.18,"v":25.6,"s":0.476},{"r":7.76,"v":21.06,"s":0.368},{"r":9.5,"v":22.44,"s":0.423},{"r":5.77,"v":18.89,"s":0.305},{"r":3.22,"v":18.66,"s":0.173},{"r":13.3,"v":27.15,"s":0.49},{"r":8.64,"v":21.86,"s":0.395},{"r":6.54,"v":19.78,"s":0.331},{"r":10.67,"v":23.49,"s":0.454},{"r":11.43,"v":24.74,"s":0.462},{"r":7.43,"v":20.8,"s":0.357},{"r":4.31,"v":18.78,"s":0.23},{"r":9.37,"v":22.28,"s":0.421},{"r":14.1,"v":28.63,"s":0.493},{"r":6.3,"v":19.55,"s":0.322},{"r":12.6,"v":26.18,"s":0.481},{"r":5.03,"v":18.67,"s":0.269},{"r":8.92,"v":22.19,"s":0.402},{"r":7.19,"v":20.54,"s":0.35},{"r":3.72,"v":18.93,"s":0.197},{"r":11.19,"v":24.2,"s":0.462},{"r":9.04,"v":22.05,"s":0.41},{"r":6.85,"v":20.09,"s":0.341},{"r":13.53,"v":27.49,"s":0.492},{"r":5.45,"v":18.8,"s":0.29},{"r":10.39,"v":23.22,"s":0.447},{"r":8.28,"v":21.57,"s":0.384},{"r":4.73,"v":18.63,"s":0.254}];

const MC_DATA = [{"day":1,"p5":0.9821,"p25":0.9924,"p50":1.0003,"p75":1.008,"p95":1.0214},{"day":5,"p5":0.9534,"p25":0.9834,"p50":1.0014,"p75":1.0186,"p95":1.0448},{"day":9,"p5":0.9439,"p25":0.9768,"p50":1.0012,"p75":1.0243,"p95":1.0613},{"day":13,"p5":0.9339,"p25":0.9736,"p50":1.0046,"p75":1.0295,"p95":1.0742},{"day":17,"p5":0.9244,"p25":0.9691,"p50":1.0032,"p75":1.0347,"p95":1.0863},{"day":21,"p5":0.914,"p25":0.9641,"p50":1.0043,"p75":1.0403,"p95":1.1016},{"day":25,"p5":0.9024,"p25":0.9613,"p50":1.005,"p75":1.0457,"p95":1.1082},{"day":29,"p5":0.8947,"p25":0.9566,"p50":1.0064,"p75":1.0499,"p95":1.1199},{"day":33,"p5":0.8863,"p25":0.9536,"p50":1.0089,"p75":1.0545,"p95":1.1323},{"day":37,"p5":0.8764,"p25":0.9494,"p50":1.0076,"p75":1.0564,"p95":1.1392},{"day":41,"p5":0.8673,"p25":0.9449,"p50":1.0075,"p75":1.0617,"p95":1.153},{"day":45,"p5":0.8606,"p25":0.9413,"p50":1.008,"p75":1.0665,"p95":1.1627},{"day":49,"p5":0.8527,"p25":0.9389,"p50":1.01,"p75":1.0699,"p95":1.1742},{"day":53,"p5":0.845,"p25":0.9347,"p50":1.0096,"p75":1.073,"p95":1.1822},{"day":57,"p5":0.8379,"p25":0.9301,"p50":1.0094,"p75":1.0762,"p95":1.1943},{"day":61,"p5":0.8291,"p25":0.9259,"p50":1.0082,"p75":1.0793,"p95":1.2042},{"day":65,"p5":0.8232,"p25":0.9218,"p50":1.0089,"p75":1.0833,"p95":1.215},{"day":69,"p5":0.8159,"p25":0.9181,"p50":1.0094,"p75":1.086,"p95":1.2236},{"day":73,"p5":0.8079,"p25":0.9141,"p50":1.0095,"p75":1.0892,"p95":1.2335},{"day":77,"p5":0.8013,"p25":0.9101,"p50":1.0093,"p75":1.0919,"p95":1.2454},{"day":81,"p5":0.7941,"p25":0.9067,"p50":1.0098,"p75":1.0948,"p95":1.2547},{"day":85,"p5":0.7873,"p25":0.9024,"p50":1.0089,"p75":1.0976,"p95":1.267},{"day":89,"p5":0.7813,"p25":0.8993,"p50":1.0101,"p75":1.1009,"p95":1.2773},{"day":93,"p5":0.774,"p25":0.8956,"p50":1.0105,"p75":1.1036,"p95":1.2882},{"day":97,"p5":0.7677,"p25":0.8921,"p50":1.0107,"p75":1.1065,"p95":1.2985},{"day":101,"p5":0.7621,"p25":0.8886,"p50":1.0107,"p75":1.109,"p95":1.3085},{"day":105,"p5":0.7559,"p25":0.8849,"p50":1.0107,"p75":1.1118,"p95":1.3181},{"day":109,"p5":0.7498,"p25":0.8813,"p50":1.0107,"p75":1.1148,"p95":1.3278},{"day":113,"p5":0.7439,"p25":0.8778,"p50":1.0109,"p75":1.1175,"p95":1.3382},{"day":117,"p5":0.7382,"p25":0.8744,"p50":1.011,"p75":1.1202,"p95":1.3479},{"day":121,"p5":0.7325,"p25":0.8709,"p50":1.011,"p75":1.1229,"p95":1.3578},{"day":125,"p5":0.7271,"p25":0.8675,"p50":1.0112,"p75":1.1256,"p95":1.3677},{"day":129,"p5":0.7217,"p25":0.8641,"p50":1.0112,"p75":1.1282,"p95":1.3775},{"day":133,"p5":0.7165,"p25":0.8608,"p50":1.0113,"p75":1.1308,"p95":1.3873},{"day":137,"p5":0.7113,"p25":0.8575,"p50":1.0114,"p75":1.1334,"p95":1.3972},{"day":141,"p5":0.7063,"p25":0.8542,"p50":1.0114,"p75":1.136,"p95":1.407},{"day":145,"p5":0.7014,"p25":0.851,"p50":1.0116,"p75":1.1386,"p95":1.4168},{"day":149,"p5":0.6966,"p25":0.8478,"p50":1.0117,"p75":1.1412,"p95":1.4267},{"day":153,"p5":0.6918,"p25":0.8447,"p50":1.0118,"p75":1.1437,"p95":1.4366},{"day":157,"p5":0.6872,"p25":0.8416,"p50":1.0119,"p75":1.1463,"p95":1.4464},{"day":161,"p5":0.6827,"p25":0.8385,"p50":1.012,"p75":1.1489,"p95":1.4562},{"day":165,"p5":0.6783,"p25":0.8354,"p50":1.0121,"p75":1.1514,"p95":1.466},{"day":169,"p5":0.6739,"p25":0.8324,"p50":1.0122,"p75":1.154,"p95":1.4758},{"day":173,"p5":0.6696,"p25":0.8294,"p50":1.0123,"p75":1.1565,"p95":1.4856},{"day":177,"p5":0.6654,"p25":0.8265,"p50":1.0124,"p75":1.1591,"p95":1.4953},{"day":181,"p5":0.6613,"p25":0.8235,"p50":1.0125,"p75":1.1616,"p95":1.505},{"day":185,"p5":0.6572,"p25":0.8206,"p50":1.0126,"p75":1.1641,"p95":1.5147},{"day":189,"p5":0.6533,"p25":0.8177,"p50":1.0127,"p75":1.1667,"p95":1.5244},{"day":193,"p5":0.6493,"p25":0.8149,"p50":1.0128,"p75":1.1692,"p95":1.534},{"day":197,"p5":0.6455,"p25":0.8121,"p50":1.013,"p75":1.1717,"p95":1.5436},{"day":201,"p5":0.6418,"p25":0.8093,"p50":1.0131,"p75":1.1742,"p95":1.5531},{"day":205,"p5":0.6381,"p25":0.8065,"p50":1.0132,"p75":1.1766,"p95":1.5626},{"day":209,"p5":0.6345,"p25":0.8038,"p50":1.0133,"p75":1.1791,"p95":1.572},{"day":213,"p5":0.631,"p25":0.8011,"p50":1.0135,"p75":1.1816,"p95":1.5814},{"day":217,"p5":0.6275,"p25":0.7985,"p50":1.0136,"p75":1.184,"p95":1.5907},{"day":221,"p5":0.6241,"p25":0.7958,"p50":1.0137,"p75":1.1865,"p95":1.6},{"day":225,"p5":0.6208,"p25":0.7932,"p50":1.0139,"p75":1.1889,"p95":1.6093},{"day":229,"p5":0.6175,"p25":0.7906,"p50":1.014,"p75":1.1913,"p95":1.6185},{"day":233,"p5":0.6143,"p25":0.7881,"p50":1.0142,"p75":1.1937,"p95":1.6277},{"day":237,"p5":0.6111,"p25":0.7855,"p50":1.0143,"p75":1.1961,"p95":1.6368},{"day":241,"p5":0.608,"p25":0.783,"p50":1.0145,"p75":1.1985,"p95":1.6459},{"day":245,"p5":0.605,"p25":0.7806,"p50":1.0146,"p75":1.2009,"p95":1.655},{"day":249,"p5":0.602,"p25":0.7781,"p50":1.0148,"p75":1.2033,"p95":1.664},{"day":252,"p5":0.7604,"p25":0.9261,"p50":1.0479,"p75":1.1792,"p95":1.4333}];

const MONTHLY_DATA = [{"m":"2021-01","ret":0.33},{"m":"2021-02","ret":2.22},{"m":"2021-03","ret":11.34},{"m":"2021-04","ret":8.43},{"m":"2021-05","ret":2.46},{"m":"2021-06","ret":3.81},{"m":"2021-07","ret":4.24},{"m":"2021-08","ret":5.3},{"m":"2021-09","ret":-0.47},{"m":"2021-10","ret":3.27},{"m":"2021-11","ret":-3.02},{"m":"2021-12","ret":3.58},{"m":"2022-01","ret":-12.7},{"m":"2022-02","ret":-5.35},{"m":"2022-03","ret":-0.27},{"m":"2022-04","ret":-9.34},{"m":"2022-05","ret":-7.27},{"m":"2022-06","ret":-17.32},{"m":"2022-07","ret":13.71},{"m":"2022-08","ret":-2.87},{"m":"2022-09","ret":-8.4},{"m":"2022-10","ret":3.39},{"m":"2022-11","ret":9.31},{"m":"2022-12","ret":2.0},{"m":"2023-01","ret":9.02},{"m":"2023-02","ret":0.89},{"m":"2023-03","ret":6.21},{"m":"2023-04","ret":4.66},{"m":"2023-05","ret":-1.79},{"m":"2023-06","ret":6.27},{"m":"2023-07","ret":4.25},{"m":"2023-08","ret":-0.49},{"m":"2023-09","ret":-2.49},{"m":"2023-10","ret":-2.73},{"m":"2023-11","ret":8.84},{"m":"2023-12","ret":3.57},{"m":"2024-01","ret":-0.06},{"m":"2024-02","ret":5.58},{"m":"2024-03","ret":4.47},{"m":"2024-04","ret":-3.26},{"m":"2024-05","ret":4.68},{"m":"2024-06","ret":2.64},{"m":"2024-07","ret":0.44},{"m":"2024-08","ret":-3.22},{"m":"2024-09","ret":9.56},{"m":"2024-10","ret":8.47},{"m":"2024-11","ret":-8.48},{"m":"2024-12","ret":-4.33}];

const ANOM_DATA = [{"date":"2021-02","ret":-2.588,"z":-2.18,"anom":1},{"date":"2021-03","ret":3.299,"z":2.73,"anom":1},{"date":"2021-07","ret":3.068,"z":2.54,"anom":1},{"date":"2021-07","ret":-3.074,"z":-2.58,"anom":1},{"date":"2021-08","ret":2.665,"z":2.2,"anom":1},{"date":"2021-08","ret":-2.851,"z":-2.39,"anom":1},{"date":"2021-10","ret":2.595,"z":2.14,"anom":1},{"date":"2021-11","ret":-3.419,"z":-2.88,"anom":1},{"date":"2021-12","ret":-2.512,"z":-2.11,"anom":1},{"date":"2022-01","ret":-3.881,"z":-3.28,"anom":1},{"date":"2022-02","ret":-3.125,"z":-2.63,"anom":1},{"date":"2022-04","ret":-3.538,"z":-2.99,"anom":1},{"date":"2022-05","ret":-3.042,"z":-2.56,"anom":1},{"date":"2022-06","ret":-5.237,"z":-4.43,"anom":1},{"date":"2022-06","ret":-4.864,"z":-4.11,"anom":1},{"date":"2022-06","ret":-4.298,"z":-3.63,"anom":1},{"date":"2022-07","ret":4.102,"z":3.45,"anom":1},{"date":"2022-07","ret":3.501,"z":2.94,"anom":1},{"date":"2022-08","ret":2.791,"z":2.31,"anom":1},{"date":"2022-09","ret":-3.215,"z":-2.71,"anom":1},{"date":"2022-09","ret":-2.962,"z":-2.49,"anom":1},{"date":"2022-10","ret":-4.571,"z":-3.86,"anom":1},{"date":"2022-10","ret":3.893,"z":3.27,"anom":1},{"date":"2022-11","ret":3.211,"z":2.69,"anom":1},{"date":"2023-01","ret":3.618,"z":3.04,"anom":1},{"date":"2023-03","ret":2.774,"z":2.29,"anom":1},{"date":"2023-04","ret":2.547,"z":2.1,"anom":1},{"date":"2023-05","ret":-2.602,"z":-2.19,"anom":1},{"date":"2023-06","ret":2.903,"z":2.4,"anom":1},{"date":"2023-07","ret":-2.668,"z":-2.24,"anom":1},{"date":"2023-08","ret":-2.523,"z":-2.12,"anom":1},{"date":"2023-09","ret":-2.585,"z":-2.17,"anom":1},{"date":"2023-10","ret":-2.629,"z":-2.21,"anom":1},{"date":"2023-11","ret":2.884,"z":2.38,"anom":1},{"date":"2024-01","ret":-2.618,"z":-2.2,"anom":1},{"date":"2024-03","ret":2.624,"z":2.17,"anom":1},{"date":"2024-04","ret":-2.938,"z":-2.47,"anom":1},{"date":"2024-08","ret":-2.869,"z":-2.41,"anom":1},{"date":"2024-09","ret":3.853,"z":3.24,"anom":1},{"date":"2024-11","ret":-4.112,"z":-3.47,"anom":1},{"date":"2024-12","ret":-2.782,"z":-2.33,"anom":1}];

// ── HELPERS ────────────────────────────────────────────────────────────────────
const Panel = ({ children, style = {} }) => (
  <div style={{
    background: C.panel, border: `1px solid ${C.border}`,
    borderRadius: 10, padding: "18px 20px", ...style
  }}>
    {children}
  </div>
);

const PanelTitle = ({ children, badge, badgeColor }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
    <div style={{ width: 3, height: 16, background: C.accent, borderRadius: 2 }} />
    <span style={{ color: C.text, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", fontFamily: "monospace" }}>{children}</span>
    {badge && <span style={{ marginLeft: "auto", background: (badgeColor || C.accent) + "22", border: `1px solid ${(badgeColor || C.accent)}44`, color: badgeColor || C.accent, fontSize: 10, padding: "2px 8px", borderRadius: 20 }}>{badge}</span>}
  </div>
);

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0c1018", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
      {label && <div style={{ color: C.textMid, marginBottom: 5, fontSize: 11 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, display: "inline-block" }} />
          <span style={{ color: C.textMid }}>{p.name}:</span>
          <span style={{ fontWeight: 600, color: C.text }}>{typeof p.value === "number" ? p.value.toFixed(2) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(false); setVal(0);
    const t = setTimeout(() => {
      setVisible(true);
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        setVal(target * ease);
        if (p < 1) requestAnimationFrame(tick);
        else setVal(target);
      };
      requestAnimationFrame(tick);
    }, 50);
    return () => clearTimeout(t);
  }, [target]);
  return [val, visible];
}

const KPI = ({ label, value, animTarget, prefix = "", suffix = "", color, sub, icon }) => {
  const [disp, visible] = useCountUp(animTarget ?? 0);
  const displayVal = animTarget !== undefined
    ? `${prefix}${Math.abs(disp) >= 10 ? Math.round(disp).toLocaleString() : disp.toFixed(2)}${suffix}`
    : value;
  return (
    <div style={{
      background: C.panel, border: `1px solid ${C.border}`, borderTop: `2px solid ${color}`,
      borderRadius: 8, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 5,
      opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(10px)",
      transition: "opacity 0.4s, transform 0.4s",
    }}>
      <div style={{ color: C.textMid, fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "monospace" }}>
        {icon && <span style={{ marginRight: 6 }}>{icon}</span>}{label}
      </div>
      <div style={{ color, fontSize: 24, fontWeight: 700, fontFamily: "Georgia,serif", lineHeight: 1 }}>{displayVal}</div>
      {sub && <div style={{ color: C.textDim, fontSize: 11 }}>{sub}</div>}
    </div>
  );
};

const NavTab = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{
    background: active ? C.accent + "18" : "transparent",
    border: "none", borderBottom: `2px solid ${active ? C.accent : "transparent"}`,
    color: active ? C.accent : C.textMid,
    padding: "12px 22px", cursor: "pointer", fontSize: 11, fontWeight: 700,
    letterSpacing: 1, textTransform: "uppercase", fontFamily: "monospace",
    transition: "all 0.2s", whiteSpace: "nowrap",
  }}>{label}</button>
);

// ── PAGE 1: PORTFOLIO OVERVIEW ─────────────────────────────────────────────────
const PageOverview = () => {
  const sectorData = Object.entries(SUMMARY.sector_weights).map(([s, w]) => ({ name: s, value: w, color: SECTOR_COLORS[s] || C.blue }));
  const topHoldings = [...HOLDINGS].sort((a, b) => b.weight - a.weight).slice(0, 10);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
        <KPI label="AUM"           value="$250M"          color={C.accent}  sub="Total assets under mgmt" icon="💼" animTarget={250} prefix="$" suffix="M" />
        <KPI label="Ann Return"    animTarget={6.69}       color={C.green}   sub="vs benchmark 5.1%" suffix="%" />
        <KPI label="Sharpe Ratio"  value="0.352"           color={C.blue}    sub="Risk-adjusted return" />
        <KPI label="Holdings"      animTarget={20}         color={C.gold}    sub="Across 10 sectors" />
        <KPI label="Portfolio Beta"value="1.098"           color={C.purple}  sub="vs S&P 500 benchmark" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 16 }}>
        <Panel>
          <PanelTitle badge="2021–2024">Cumulative Return vs Benchmark</PanelTitle>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={PERF_DATA} margin={{ left: -10, right: 10 }}>
              <defs>
                <linearGradient id="portGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.accent} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.accent} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="benchGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.blue} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={C.blue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="date" tick={{ fill: C.textMid, fontSize: 9 }} interval={15} />
              <YAxis tick={{ fill: C.textMid, fontSize: 10 }} unit="%" />
              <Tooltip content={<Tip />} />
              <ReferenceLine y={0} stroke={C.border} strokeWidth={1} />
              <Area type="monotone" dataKey="bench" name="Benchmark" stroke={C.blue} strokeWidth={1.5} fill="url(#benchGrad)" dot={false} />
              <Area type="monotone" dataKey="port"  name="Portfolio" stroke={C.accent} strokeWidth={2} fill="url(#portGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel>
          <PanelTitle>Sector Allocation</PanelTitle>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={sectorData} cx="50%" cy="50%" outerRadius={65} innerRadius={30} dataKey="value" paddingAngle={2}>
                {sectorData.map((s, i) => <Cell key={i} fill={s.color} />)}
              </Pie>
              <Tooltip formatter={(v) => `${v}%`} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6, justifyContent: "center" }}>
            {sectorData.slice(0,6).map(s => (
              <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color }} />
                <span style={{ color: C.textMid }}>{s.name.split(" ")[0]}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelTitle>Risk Summary</PanelTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
            {[
              { label: "Ann Volatility", value: "19.04%",   color: C.gold },
              { label: "Max Drawdown",   value: "-54.07%",  color: C.red },
              { label: "VaR 95% (1D)",   value: "-1.79%",   color: C.red },
              { label: "CVaR 95% (1D)",  value: "-2.69%",   color: C.red },
              { label: "VaR 99% (1D)",   value: "-3.14%",   color: "#ff4040" },
              { label: "Sortino Ratio",  value: "0.52",     color: C.blue },
              { label: "Alpha (Ann)",    value: "-0.65%",   color: C.textMid },
              { label: "Beta",           value: "1.098",    color: C.purple },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${C.border}33` }}>
                <span style={{ color: C.textMid, fontSize: 11 }}>{r.label}</span>
                <span style={{ color: r.color, fontWeight: 700, fontSize: 12, fontFamily: "monospace" }}>{r.value}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 }}>
        <Panel>
          <PanelTitle badge="Top 10 by Weight">Holdings Table</PanelTitle>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["Ticker","Name","Sector","Weight","Beta","Ann Ret","Ann Vol","AUM ($M)"].map(h => (
                    <th key={h} style={{ color: C.textMid, textAlign: "left", padding: "6px 8px", fontFamily: "monospace", fontWeight: 600, fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topHoldings.map((h, i) => (
                  <tr key={h.ticker} style={{ borderBottom: `1px solid ${C.border}22`, background: i % 2 === 0 ? "transparent" : C.bg + "44" }}>
                    <td style={{ padding: "6px 8px", color: C.accent, fontWeight: 700, fontFamily: "monospace" }}>{h.ticker}</td>
                    <td style={{ padding: "6px 8px", color: C.text }}>{h.name}</td>
                    <td style={{ padding: "6px 8px" }}><span style={{ background: (SECTOR_COLORS[h.sector] || C.blue) + "22", color: SECTOR_COLORS[h.sector] || C.blue, padding: "1px 6px", borderRadius: 10, fontSize: 10 }}>{h.sector}</span></td>
                    <td style={{ padding: "6px 8px", color: C.gold, fontFamily: "monospace" }}>{h.weight}%</td>
                    <td style={{ padding: "6px 8px", color: h.beta > 1.2 ? C.red : h.beta < 0.7 ? C.green : C.text, fontFamily: "monospace" }}>{h.beta}</td>
                    <td style={{ padding: "6px 8px", color: C.green, fontFamily: "monospace" }}>{h.ret}%</td>
                    <td style={{ padding: "6px 8px", color: h.vol > 30 ? C.red : C.textMid, fontFamily: "monospace" }}>{h.vol}%</td>
                    <td style={{ padding: "6px 8px", color: C.text, fontFamily: "monospace" }}>${h.aum}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel>
          <PanelTitle>Monthly Returns</PanelTitle>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={MONTHLY_DATA} margin={{ left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="m" tick={{ fill: C.textMid, fontSize: 8 }} angle={-45} textAnchor="end" interval={5} />
              <YAxis tick={{ fill: C.textMid, fontSize: 10 }} unit="%" />
              <Tooltip content={<Tip />} />
              <ReferenceLine y={0} stroke={C.border} strokeWidth={1} />
              <Bar dataKey="ret" name="Monthly Return" radius={[2,2,0,0]}>
                {MONTHLY_DATA.map((d, i) => <Cell key={i} fill={d.ret >= 0 ? C.accent : C.red} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </div>
  );
};

// ── PAGE 2: RISK ANALYTICS ─────────────────────────────────────────────────────
const PageRisk = () => {
  const corrMatrix = [
    { asset: "AAPL",  AAPL: 1.00, MSFT: 0.72, JPM: 0.45, JNJ: 0.28, XOM: 0.31, AMZN: 0.68, PG: 0.22, NEE: 0.25 },
    { asset: "MSFT",  AAPL: 0.72, MSFT: 1.00, JPM: 0.43, JNJ: 0.26, XOM: 0.29, AMZN: 0.71, PG: 0.21, NEE: 0.23 },
    { asset: "JPM",   AAPL: 0.45, MSFT: 0.43, JPM: 1.00, JNJ: 0.31, XOM: 0.48, AMZN: 0.41, PG: 0.27, NEE: 0.29 },
    { asset: "JNJ",   AAPL: 0.28, MSFT: 0.26, JPM: 0.31, JNJ: 1.00, XOM: 0.22, AMZN: 0.24, PG: 0.55, NEE: 0.48 },
    { asset: "XOM",   AAPL: 0.31, MSFT: 0.29, JPM: 0.48, JNJ: 0.22, XOM: 1.00, AMZN: 0.28, PG: 0.19, NEE: 0.35 },
    { asset: "AMZN",  AAPL: 0.68, MSFT: 0.71, JPM: 0.41, JNJ: 0.24, XOM: 0.28, AMZN: 1.00, PG: 0.20, NEE: 0.22 },
    { asset: "PG",    AAPL: 0.22, MSFT: 0.21, JPM: 0.27, JNJ: 0.55, XOM: 0.19, AMZN: 0.20, PG: 1.00, NEE: 0.52 },
    { asset: "NEE",   AAPL: 0.25, MSFT: 0.23, JPM: 0.29, JNJ: 0.48, XOM: 0.35, AMZN: 0.22, PG: 0.52, NEE: 1.00 },
  ];
  const corrAssets = ["AAPL","MSFT","JPM","JNJ","XOM","AMZN","PG","NEE"];

  const getCorrColor = (val) => {
    if (val >= 0.9) return "#f45b5b";
    if (val >= 0.7) return "#fb923c";
    if (val >= 0.5) return "#f0b429";
    if (val >= 0.3) return "#60a5fa";
    return "#00d4aa";
  };

  const betaData = HOLDINGS.map(h => ({ ticker: h.ticker, beta: h.beta, vol: h.vol, sector: h.sector })).sort((a,b) => b.beta - a.beta);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <KPI label="VaR 95% (1D)"  value="-1.79%"   color={C.red}    sub="Daily loss at 95% confidence" />
        <KPI label="CVaR 95% (1D)" value="-2.69%"   color={C.red}    sub="Expected shortfall" />
        <KPI label="Max Drawdown"  value="-54.07%"  color={C.red}    sub="Peak to trough 2022" />
        <KPI label="Ann Volatility"animTarget={19.04} color={C.gold}  sub="Historical 4yr" suffix="%" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
        <Panel>
          <PanelTitle badge="Underwater Chart">Drawdown Analysis</PanelTitle>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={PERF_DATA} margin={{ left: -10, right: 10 }}>
              <defs>
                <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.red} stopOpacity={0.5} />
                  <stop offset="95%" stopColor={C.red} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="date" tick={{ fill: C.textMid, fontSize: 9 }} interval={15} />
              <YAxis tick={{ fill: C.textMid, fontSize: 10 }} unit="%" domain={[-65, 5]} />
              <Tooltip content={<Tip />} />
              <ReferenceLine y={0} stroke={C.border} />
              <ReferenceLine y={-54.07} stroke={C.red} strokeDasharray="4 4" label={{ value: "Max DD -54%", fill: C.red, fontSize: 9, position: "insideTopLeft" }} />
              <Area type="monotone" dataKey="dd" name="Drawdown" stroke={C.red} strokeWidth={1.5} fill="url(#ddGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel>
          <PanelTitle>VaR Confidence Intervals</PanelTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
            {[
              { label: "VaR 90%",  value: -1.23, pct: 50, color: C.gold },
              { label: "VaR 95%",  value: -1.79, pct: 70, color: "#fb923c" },
              { label: "VaR 99%",  value: -3.14, pct: 90, color: C.red },
              { label: "CVaR 90%", value: -1.95, pct: 60, color: C.gold },
              { label: "CVaR 95%", value: -2.69, pct: 80, color: "#fb923c" },
              { label: "CVaR 99%", value: -4.12, pct: 100, color: C.red },
            ].map(v => (
              <div key={v.label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: C.textMid, fontSize: 11 }}>{v.label}</span>
                  <span style={{ color: v.color, fontFamily: "monospace", fontSize: 12, fontWeight: 700 }}>{v.value}%</span>
                </div>
                <div style={{ background: C.border, borderRadius: 4, height: 6, overflow: "hidden" }}>
                  <div style={{ width: `${v.pct}%`, height: "100%", background: v.color, borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, background: C.red + "12", border: `1px solid ${C.red}33`, borderRadius: 6, padding: "8px 12px", fontSize: 11, color: C.textMid }}>
            At 99% confidence, the portfolio could lose more than <span style={{ color: C.red, fontWeight: 700 }}>$7.9M</span> on a single day (on $250M AUM).
          </div>
        </Panel>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Panel>
          <PanelTitle badge="8 key assets">Correlation Matrix</PanelTitle>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 10 }}>
              <thead>
                <tr>
                  <th style={{ width: 50 }} />
                  {corrAssets.map(a => <th key={a} style={{ color: C.textMid, padding: "4px 6px", fontFamily: "monospace", fontWeight: 600 }}>{a}</th>)}
                </tr>
              </thead>
              <tbody>
                {corrMatrix.map(row => (
                  <tr key={row.asset}>
                    <td style={{ color: C.accent, fontFamily: "monospace", fontWeight: 700, padding: "4px 6px", fontSize: 10 }}>{row.asset}</td>
                    {corrAssets.map(a => {
                      const val = row[a];
                      return (
                        <td key={a} style={{ padding: "4px 6px", textAlign: "center", background: getCorrColor(val) + "33", color: getCorrColor(val), fontFamily: "monospace", fontWeight: val === 1.0 ? 700 : 400, borderRadius: 3 }}>
                          {val.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 10, fontSize: 10, flexWrap: "wrap" }}>
            {[{c:"#00d4aa",l:"Low <0.3"},{c:"#60a5fa",l:"Mod 0.3–0.5"},{c:"#f0b429",l:"High 0.5–0.7"},{c:"#fb923c",l:"Very High 0.7–0.9"},{c:"#f45b5b",l:"Extreme >0.9"}].map(x => (
              <div key={x.l} style={{ display:"flex", alignItems:"center", gap:4 }}>
                <div style={{ width:10, height:10, borderRadius:2, background:x.c+"55", border:`1px solid ${x.c}` }} />
                <span style={{ color: C.textMid }}>{x.l}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelTitle badge="vs S&P 500">Beta by Holding</PanelTitle>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={betaData} layout="vertical" margin={{ left: 10, right: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
              <XAxis type="number" tick={{ fill: C.textMid, fontSize: 10 }} domain={[0, 2]} />
              <YAxis dataKey="ticker" type="category" tick={{ fill: C.textMid, fontSize: 10 }} width={45} />
              <Tooltip content={<Tip />} />
              <ReferenceLine x={1.0} stroke={C.gold} strokeDasharray="4 4" label={{ value: "Market β=1", fill: C.gold, fontSize: 9, position: "top" }} />
              <Bar dataKey="beta" name="Beta" radius={[0,3,3,0]}>
                {betaData.map((d, i) => <Cell key={i} fill={d.beta > 1.3 ? C.red : d.beta > 1.0 ? C.gold : C.blue} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </div>
  );
};

// ── PAGE 3: EFFICIENT FRONTIER ─────────────────────────────────────────────────
const PageFrontier = () => {
  const currentPortfolio = { v: 19.04, r: 6.69, s: 0.352 };
  const optimalPortfolio = { v: 21.11, r: 14.44, s: 0.684 };
  const minVarPortfolio  = { v: 13.91, r: -6.37, s: -0.458 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <KPI label="Simulated Portfolios" animTarget={5000} color={C.accent} sub="Random weight combinations" />
        <KPI label="Optimal Sharpe"  value="0.684"   color={C.gold}   sub="Max risk-adjusted return" />
        <KPI label="Optimal Return"  value="14.44%"  color={C.green}  sub="At optimal portfolio" />
        <KPI label="Min Variance Vol"value="13.91%"  color={C.blue}   sub="Lowest risk portfolio" />
      </div>

      <Panel>
        <PanelTitle badge="Markowitz">Efficient Frontier — 5,000 Simulated Portfolios</PanelTitle>
        <ResponsiveContainer width="100%" height={320}>
          <ScatterChart margin={{ left: 10, right: 20, top: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="v" name="Volatility" type="number" domain={[14, 35]} unit="%" tick={{ fill: C.textMid, fontSize: 10 }}
              label={{ value: "Portfolio Volatility (%)", fill: C.textMid, fontSize: 11, position: "insideBottom", offset: -10 }} />
            <YAxis dataKey="r" name="Return" type="number" domain={[-15, 20]} unit="%" tick={{ fill: C.textMid, fontSize: 10 }}
              label={{ value: "Expected Return (%)", fill: C.textMid, fontSize: 11, angle: -90, position: "insideLeft", offset: 10 }} />
            <Tooltip cursor={{ stroke: C.border }} content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 11 }}>
                  <div style={{ color: C.textMid }}>Return: <span style={{ color: C.accent }}>{d.r}%</span></div>
                  <div style={{ color: C.textMid }}>Volatility: <span style={{ color: C.gold }}>{d.v}%</span></div>
                  <div style={{ color: C.textMid }}>Sharpe: <span style={{ color: C.blue }}>{d.s}</span></div>
                </div>
              );
            }} />
            <Scatter data={EF_DATA} name="Simulated Portfolio">
              {EF_DATA.map((d, i) => <Cell key={i} fill={d.s > 0.45 ? C.accent : d.s > 0.3 ? C.blue : C.textDim} fillOpacity={0.6} />)}
            </Scatter>
            <ReferenceDot cx={optimalPortfolio.v} cy={optimalPortfolio.r} r={8} fill={C.gold} stroke={C.bg} strokeWidth={2}
              label={{ value: "⭐ Optimal", fill: C.gold, fontSize: 10, position: "top" }} />
            <ReferenceDot cx={currentPortfolio.v} cy={currentPortfolio.r} r={8} fill={C.accent} stroke={C.bg} strokeWidth={2}
              label={{ value: "● Current", fill: C.accent, fontSize: 10, position: "top" }} />
            <ReferenceDot cx={minVarPortfolio.v} cy={minVarPortfolio.r} r={6} fill={C.blue} stroke={C.bg} strokeWidth={2}
              label={{ value: "◆ Min Var", fill: C.blue, fontSize: 10, position: "right" }} />
          </ScatterChart>
        </ResponsiveContainer>
      </Panel>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {[
          { label: "Current Portfolio", color: C.accent, icon: "●", ret: 6.69, vol: 19.04, sharpe: 0.352, note: "Actual portfolio — below efficient frontier" },
          { label: "Optimal Portfolio", color: C.gold,   icon: "⭐", ret: 14.44, vol: 21.11, sharpe: 0.684, note: "Max Sharpe — 94% better risk-adjusted return" },
          { label: "Min Variance",      color: C.blue,   icon: "◆", ret: -6.37, vol: 13.91, sharpe: -0.458, note: "Lowest possible volatility combination" },
        ].map(p => (
          <Panel key={p.label} style={{ borderTop: `2px solid ${p.color}` }}>
            <div style={{ color: p.color, fontSize: 13, fontWeight: 700, marginBottom: 12 }}>{p.icon} {p.label}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { l: "Ann Return",    v: `${p.ret}%`,    c: p.ret > 0 ? C.green : C.red },
                { l: "Volatility",    v: `${p.vol}%`,    c: C.gold },
                { l: "Sharpe Ratio",  v: p.sharpe,        c: p.sharpe > 0.5 ? C.green : p.sharpe > 0 ? C.blue : C.red },
              ].map(r => (
                <div key={r.l} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${C.border}33` }}>
                  <span style={{ color: C.textMid, fontSize: 11 }}>{r.l}</span>
                  <span style={{ color: r.c, fontWeight: 700, fontFamily: "monospace" }}>{r.v}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, color: C.textDim, fontSize: 10, fontStyle: "italic" }}>{p.note}</div>
          </Panel>
        ))}
      </div>
    </div>
  );
};

// ── PAGE 4: ANOMALY DETECTION + MONTE CARLO ────────────────────────────────────
const PageAnomalies = () => {
  const mcFinal = MC_DATA[MC_DATA.length - 1];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <KPI label="Anomalies Detected" animTarget={53}   color={C.red}    sub="Isolation Forest (5% contamination)" />
        <KPI label="MC Simulations"     animTarget={500}  color={C.accent} sub="500 paths, 1-year horizon" />
        <KPI label="Median Outcome"     value="104.8%"    color={C.green}  sub="50th percentile at 1yr" />
        <KPI label="Worst Case (5%)"    value="76.0%"     color={C.red}    sub="5th percentile at 1yr" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
        <Panel>
          <PanelTitle badge="Isolation Forest">Return Anomalies — Daily Portfolio Returns</PanelTitle>
          <ResponsiveContainer width="100%" height={240}>
            <ScatterChart margin={{ left: -10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="date" name="Date" tick={{ fill: C.textMid, fontSize: 9 }} type="category" interval={30} angle={-30} textAnchor="end" />
              <YAxis dataKey="ret" name="Return" unit="%" tick={{ fill: C.textMid, fontSize: 10 }} domain={[-6, 5]} />
              <Tooltip cursor={{ stroke: C.border }} content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 11 }}>
                    <div style={{ color: d.anom ? C.red : C.accent, fontWeight: 700 }}>{d.anom ? "⚠ ANOMALY" : "Normal"}</div>
                    <div style={{ color: C.textMid }}>Date: <span style={{ color: C.text }}>{d.date}</span></div>
                    <div style={{ color: C.textMid }}>Return: <span style={{ color: d.ret < 0 ? C.red : C.green }}>{d.ret}%</span></div>
                    <div style={{ color: C.textMid }}>Z-Score: <span style={{ color: C.text }}>{d.z}</span></div>
                  </div>
                );
              }} />
              <ReferenceLine y={0} stroke={C.border} strokeWidth={1} />
              <ReferenceLine y={2.5}  stroke={C.red} strokeDasharray="3 3" strokeOpacity={0.4} />
              <ReferenceLine y={-2.5} stroke={C.red} strokeDasharray="3 3" strokeOpacity={0.4} />
              <Scatter data={ANOM_DATA} name="Return">
                {ANOM_DATA.map((d, i) => (
                  <Cell key={i} fill={d.anom ? (d.ret < 0 ? C.red : C.gold) : C.blue} fillOpacity={d.anom ? 1 : 0.5} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </Panel>

        <Panel>
          <PanelTitle>Anomaly Summary</PanelTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: C.red + "15", borderRadius: 6, border: `1px solid ${C.red}33` }}>
              <span style={{ color: C.textMid, fontSize: 12 }}>Total Anomalies</span>
              <span style={{ color: C.red, fontWeight: 700, fontSize: 18, fontFamily: "monospace" }}>53</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: C.gold + "15", borderRadius: 6, border: `1px solid ${C.gold}33` }}>
              <span style={{ color: C.textMid, fontSize: 12 }}>Positive Anomalies</span>
              <span style={{ color: C.gold, fontWeight: 700, fontSize: 18, fontFamily: "monospace" }}>24</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: C.red + "15", borderRadius: 6, border: `1px solid ${C.red}33` }}>
              <span style={{ color: C.textMid, fontSize: 12 }}>Negative Anomalies</span>
              <span style={{ color: C.red, fontWeight: 700, fontSize: 18, fontFamily: "monospace" }}>29</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: C.blue + "15", borderRadius: 6, border: `1px solid ${C.blue}33` }}>
              <span style={{ color: C.textMid, fontSize: 12 }}>Contamination Rate</span>
              <span style={{ color: C.blue, fontWeight: 700, fontSize: 18, fontFamily: "monospace" }}>5.1%</span>
            </div>
          </div>
          <div style={{ marginTop: 14, fontSize: 11, color: C.textDim, lineHeight: 1.6 }}>
            Isolation Forest trained on return magnitude, rolling volatility, and Z-score. Flags observations that are statistically distant from the normal return distribution. Cluster in Jun–Oct 2022 corresponds to the bear market drawdown period.
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelTitle badge="500 Paths · 1-Year Horizon">Monte Carlo Simulation — Portfolio Value Projection</PanelTitle>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={MC_DATA} margin={{ left: -10, right: 20 }}>
            <defs>
              <linearGradient id="mc50Grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={C.accent} stopOpacity={0.3} />
                <stop offset="95%" stopColor={C.accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="day" tick={{ fill: C.textMid, fontSize: 10 }} label={{ value: "Trading Days", fill: C.textMid, fontSize: 10, position: "insideBottom", offset: -5 }} />
            <YAxis tick={{ fill: C.textMid, fontSize: 10 }} tickFormatter={v => `${(v * 100).toFixed(0)}%`} domain={[0.55, 1.75]} />
            <Tooltip content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 11 }}>
                  <div style={{ color: C.textMid, marginBottom: 4 }}>Day {label}</div>
                  {payload.map((p, i) => (
                    <div key={i} style={{ color: p.color }}>{p.name}: {((p.value - 1) * 100).toFixed(1)}%</div>
                  ))}
                </div>
              );
            }} />
            <ReferenceLine y={1.0} stroke={C.border} strokeWidth={1.5} strokeDasharray="4 4" label={{ value: "Starting Value", fill: C.textMid, fontSize: 9, position: "right" }} />
            <Area type="monotone" dataKey="p95" name="95th Pct" stroke={C.green}  strokeWidth={1} fill={C.green}  fillOpacity={0.08} dot={false} />
            <Area type="monotone" dataKey="p75" name="75th Pct" stroke={C.blue}   strokeWidth={1} fill={C.blue}   fillOpacity={0.10} dot={false} />
            <Area type="monotone" dataKey="p50" name="Median"   stroke={C.accent} strokeWidth={2.5} fill="url(#mc50Grad)" dot={false} />
            <Area type="monotone" dataKey="p25" name="25th Pct" stroke={C.gold}   strokeWidth={1} fill={C.bg}     fillOpacity={1} dot={false} />
            <Area type="monotone" dataKey="p5"  name="5th Pct"  stroke={C.red}    strokeWidth={1} fill={C.bg}     fillOpacity={1} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginTop: 12 }}>
          {[
            { label: "5th Pct (Worst)",  value: `${((mcFinal.p5 - 1) * 100).toFixed(1)}%`,  color: C.red },
            { label: "25th Pct",         value: `${((mcFinal.p25 - 1) * 100).toFixed(1)}%`, color: C.gold },
            { label: "Median (50th)",    value: `${((mcFinal.p50 - 1) * 100).toFixed(1)}%`, color: C.accent },
            { label: "75th Pct",         value: `${((mcFinal.p75 - 1) * 100).toFixed(1)}%`, color: C.blue },
            { label: "95th Pct (Best)",  value: `${((mcFinal.p95 - 1) * 100).toFixed(1)}%`, color: C.green },
          ].map(p => (
            <div key={p.label} style={{ background: C.bg, border: `1px solid ${p.color}44`, borderRadius: 6, padding: "8px 12px", textAlign: "center" }}>
              <div style={{ color: C.textDim, fontSize: 10 }}>{p.label}</div>
              <div style={{ color: p.color, fontWeight: 700, fontFamily: "monospace", fontSize: 16, marginTop: 4 }}>{p.value}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
};

// ── PAGE 5: MONTE CARLO ────────────────────────────────────────────────────────
const PageMonteCarlo = () => {
  const mcFinal = MC_DATA[MC_DATA.length - 1];
  const aum = 250;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <KPI label="Simulations"      animTarget={500}   color={C.accent} sub="Independent price paths" />
        <KPI label="Horizon"          value="252 Days"   color={C.blue}   sub="1 trading year forward" />
        <KPI label="Median Outcome"   value="+4.8%"      color={C.green}  sub="50th percentile return" />
        <KPI label="Worst Case (5%)"  value="-24.0%"     color={C.red}    sub="5th percentile return" />
      </div>

      <Panel>
        <PanelTitle badge="500 Paths · 252 Trading Days">Monte Carlo Simulation — Portfolio Value Projection</PanelTitle>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={MC_DATA} margin={{ left: -10, right: 20, bottom: 20 }}>
            <defs>
              <linearGradient id="mc50Grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={C.accent} stopOpacity={0.3} />
                <stop offset="95%" stopColor={C.accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="day" tick={{ fill: C.textMid, fontSize: 10 }}
              label={{ value: "Trading Days", fill: C.textMid, fontSize: 11, position: "insideBottom", offset: -10 }} />
            <YAxis tick={{ fill: C.textMid, fontSize: 10 }} tickFormatter={v => `${(v * 100).toFixed(0)}%`} domain={[0.5, 1.8]} />
            <Tooltip content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 11 }}>
                  <div style={{ color: C.textMid, marginBottom: 4 }}>Day {label}</div>
                  {payload.map((p, i) => (
                    <div key={i} style={{ color: p.color }}>{p.name}: {((p.value - 1) * 100).toFixed(1)}%</div>
                  ))}
                </div>
              );
            }} />
            <ReferenceLine y={1.0} stroke={C.gold} strokeWidth={1.5} strokeDasharray="4 4"
              label={{ value: "Starting Value (100%)", fill: C.gold, fontSize: 9, position: "insideTopRight" }} />
            <Area type="monotone" dataKey="p95" name="95th Pct" stroke={C.green}  strokeWidth={1}   fill={C.green}  fillOpacity={0.08} dot={false} />
            <Area type="monotone" dataKey="p75" name="75th Pct" stroke={C.blue}   strokeWidth={1}   fill={C.blue}   fillOpacity={0.10} dot={false} />
            <Area type="monotone" dataKey="p50" name="Median"   stroke={C.accent} strokeWidth={2.5} fill="url(#mc50Grad)" dot={false} />
            <Area type="monotone" dataKey="p25" name="25th Pct" stroke={C.gold}   strokeWidth={1}   fill={C.bg}     fillOpacity={1}    dot={false} />
            <Area type="monotone" dataKey="p5"  name="5th Pct"  stroke={C.red}    strokeWidth={1}   fill={C.bg}     fillOpacity={1}    dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </Panel>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
        {[
          { label: "5th Pct (Worst)",  pct: `${((mcFinal.p5  - 1) * 100).toFixed(1)}%`, aum: `$${(aum * mcFinal.p5).toFixed(0)}M`,  color: C.red },
          { label: "25th Percentile",  pct: `${((mcFinal.p25 - 1) * 100).toFixed(1)}%`, aum: `$${(aum * mcFinal.p25).toFixed(0)}M`, color: C.gold },
          { label: "Median (50th)",    pct: `${((mcFinal.p50 - 1) * 100).toFixed(1)}%`, aum: `$${(aum * mcFinal.p50).toFixed(0)}M`, color: C.accent },
          { label: "75th Percentile",  pct: `${((mcFinal.p75 - 1) * 100).toFixed(1)}%`, aum: `$${(aum * mcFinal.p75).toFixed(0)}M`, color: C.blue },
          { label: "95th Pct (Best)",  pct: `${((mcFinal.p95 - 1) * 100).toFixed(1)}%`, aum: `$${(aum * mcFinal.p95).toFixed(0)}M`, color: C.green },
        ].map(p => (
          <Panel key={p.label} style={{ borderTop: `2px solid ${p.color}`, textAlign: "center" }}>
            <div style={{ color: C.textDim, fontSize: 10, marginBottom: 6 }}>{p.label}</div>
            <div style={{ color: p.color, fontWeight: 700, fontSize: 22, fontFamily: "monospace" }}>{p.pct}</div>
            <div style={{ color: C.textMid, fontSize: 12, marginTop: 4 }}>{p.aum} AUM</div>
          </Panel>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Panel>
          <PanelTitle>Methodology</PanelTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Model",           value: "Geometric Brownian Motion" },
              { label: "Daily Mean (μ)",  value: "0.026% (6.69% / 252)" },
              { label: "Daily Vol (σ)",   value: "1.20% (19.04% / √252)" },
              { label: "Paths",           value: "500 independent simulations" },
              { label: "Horizon",         value: "252 trading days" },
              { label: "Starting Value",  value: "$250M AUM" },
              { label: "Seed",            value: "42 (reproducible)" },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${C.border}33` }}>
                <span style={{ color: C.textMid, fontSize: 11 }}>{r.label}</span>
                <span style={{ color: C.text, fontFamily: "monospace", fontSize: 11 }}>{r.value}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <PanelTitle>Risk Interpretation</PanelTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { icon: "🟢", title: "Best Case (95th Pct)", desc: `Portfolio grows to $${(aum * mcFinal.p95).toFixed(0)}M — a ${((mcFinal.p95 - 1)*100).toFixed(1)}% gain. Requires sustained strong performance across all holdings.`, color: C.green },
              { icon: "🟡", title: "Base Case (Median)",   desc: `Portfolio reaches $${(aum * mcFinal.p50).toFixed(0)}M — a ${((mcFinal.p50 - 1)*100).toFixed(1)}% gain. Most likely outcome under current return/vol assumptions.`, color: C.accent },
              { icon: "🔴", title: "Worst Case (5th Pct)", desc: `Portfolio falls to $${(aum * mcFinal.p5).toFixed(0)}M — a ${((mcFinal.p5 - 1)*100).toFixed(1)}% loss. Tail risk scenario from sustained adverse market conditions.`, color: C.red },
            ].map(r => (
              <div key={r.title} style={{ padding: "10px 12px", background: r.color + "10", border: `1px solid ${r.color}33`, borderRadius: 8 }}>
                <div style={{ color: r.color, fontWeight: 700, fontSize: 12, marginBottom: 4 }}>{r.icon} {r.title}</div>
                <div style={{ color: C.textMid, fontSize: 11, lineHeight: 1.5 }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
};

// ── MAIN APP ───────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState(0);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const tabs = ["Portfolio Overview", "Risk Analytics", "Efficient Frontier", "Anomaly Detection", "Monte Carlo"];
  const tabColors = [C.accent, C.red, C.gold, C.purple, C.green];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", width: "100%", maxWidth: "100%", overflowX: "hidden", fontFamily: "'DM Mono','Courier New',monospace", color: C.text }}>

      {/* Header */}
      <div style={{ background: C.panel, borderBottom: `1px solid ${C.border}`, padding: "0 28px", display: "flex", alignItems: "stretch", height: 52 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, paddingRight: 24, borderRight: `1px solid ${C.border}` }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accent + "22", border: `1px solid ${C.accent}44`, display: "flex", alignItems: "center", justifyContent: "center", color: C.accent, fontWeight: 700, fontSize: 14 }}>A</div>
          <div>
            <div style={{ color: C.text, fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}>APEX CAPITAL MANAGEMENT</div>
            <div style={{ color: C.textDim, fontSize: 9, letterSpacing: 1, textTransform: "uppercase" }}>Portfolio Risk Intelligence</div>
          </div>
        </div>
        <div style={{ display: "flex", flex: 1, borderRight: `1px solid ${C.border}` }}>
          {tabs.map((t, i) => <NavTab key={i} label={t} active={tab === i} onClick={() => setTab(i)} />)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, paddingLeft: 24 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: C.textMid, fontSize: 11, fontFamily: "monospace" }}>{time.toLocaleTimeString()}</div>
            <div style={{ color: C.textDim, fontSize: 9 }}>{time.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</div>
          </div>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.accent, boxShadow: `0 0 8px ${C.accent}` }} />
        </div>
      </div>

      {/* Sub-header */}
      <div style={{ background: C.panel + "aa", borderBottom: `1px solid ${C.border}22`, padding: "6px 28px", display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
        <span style={{ color: C.textDim }}>Apex Capital</span>
        <span style={{ color: C.textDim }}>›</span>
        <span style={{ color: tabColors[tab] }}>{tabs[tab]}</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 20 }}>
          {[
            { label: "$250M AUM",    color: C.accent },
            { label: "+6.69% Ann",   color: C.green },
            { label: "Sharpe 0.352", color: C.blue },
            { label: "53 Anomalies", color: C.red },
          ].map(m => (
            <span key={m.label} style={{ color: m.color, fontFamily: "monospace", fontWeight: 600 }}>{m.label}</span>
          ))}
        </div>
      </div>

      {/* Page content */}
      <div style={{ padding: "20px 28px 40px", width: "100%", boxSizing: "border-box" }}>
        {tab === 0 && <PageOverview />}
        {tab === 1 && <PageRisk />}
        {tab === 2 && <PageFrontier />}
        {tab === 3 && <PageAnomalies />}
        {tab === 4 && <PageMonteCarlo />}
      </div>

      <style>{`
        * { box-sizing: border-box; }
        body, html, #root { background: #07090f; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0c1018; }
        ::-webkit-scrollbar-thumb { background: #161d2e; border-radius: 3px; }
      `}</style>
    </div>
  );
}
