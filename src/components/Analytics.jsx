import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { FaFilePdf } from "react-icons/fa6";
import { PiExportBold } from "react-icons/pi";
import { RiFileExcel2Fill } from "react-icons/ri";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5678";

export default function Analytics() {
  const [history, setHistory] = useState([]);
  const [dateRange, setDateRange] = useState(30);
  const [exportOpen, setExportOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const analyticsRef = useRef(null);
  const exportRef = useRef(null);

  const exportMenuId = "analytics-export-menu";

  /* ---------------- Fetch Data ---------------- */
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    fetch(`${API_BASE}/webhook/get-finance-history`)
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;

        const rows = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];

        // Normalize phrases -> always array
        const normalized = rows.map((r) => ({
          ...r,
          phrases: Array.isArray(r?.phrases) ? r.phrases : [],
        }));

        setHistory(normalized);
      })
      .catch(() => {
        if (!mounted) return;
        setHistory([]);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  /* ---------------- Close Export Dropdown (outside + Escape) ---------------- */
  useEffect(() => {
    const handleOutside = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setExportOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") setExportOpen(false);
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  /* ---------------- Date Filter ---------------- */
  const filteredHistory = useMemo(() => {
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - dateRange);

    return history.filter((item) => {
      const d = new Date(item.created_at);
      return !isNaN(d) && d >= cutoff;
    });
  }, [history, dateRange]);

  /* ---------------- Phrase Frequency ---------------- */
  const phraseFrequency = useMemo(() => {
    const freq = {};
    filteredHistory.forEach((item) => {
      (Array.isArray(item.phrases) ? item.phrases : []).forEach((p) => {
        const key = String(p);
        freq[key] = (freq[key] || 0) + 1;
      });
    });
    return freq;
  }, [filteredHistory]);

  const topPhrases = useMemo(() => {
    return Object.entries(phraseFrequency)
      .map(([phrase, count]) => ({ phrase, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [phraseFrequency]);

  /* ---------------- Usage Over Time ---------------- */
  const usageByDate = useMemo(() => {
    const map = {};
    filteredHistory.forEach((item) => {
      const d = new Date(item.created_at);
      if (isNaN(d)) return;
      const date = d.toLocaleDateString();
      map[date] = (map[date] || 0) + 1;
    });

    // stable ordering for chart
    return Object.entries(map)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [filteredHistory]);

  /* ---------------- KPIs ---------------- */
  const totalExtractions = filteredHistory.length;
  const uniquePhrases = Object.keys(phraseFrequency).length;
  const topPhrase = topPhrases[0]?.phrase || "—";

  const canExport = filteredHistory.length > 0 && !loading;

  /* ---------------- Export PDF ---------------- */
  const exportPDF = async () => {
    if (!analyticsRef.current || !canExport) return;

    const pdf = new jsPDF("p", "pt", "a4");
    pdf.setFontSize(20);
    pdf.text("Finance Phrase Analytics Report", 40, 40);

    pdf.setFontSize(12);
    pdf.text(`Date Range: Last ${dateRange} days`, 40, 70);
    pdf.text(`Total Extractions: ${totalExtractions}`, 40, 90);
    pdf.text(`Unique Phrases: ${uniquePhrases}`, 40, 110);

    const topPhraseLine = pdf.splitTextToSize(`Top Phrase: ${topPhrase}`, 520);
    pdf.text(topPhraseLine, 40, 130);

    const canvas = await html2canvas(analyticsRef.current, {
      scale: 2,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;

    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, 20, width, height);
    pdf.save("Finance_Analytics_Report.pdf");

    setExportOpen(false);
  };

  /* ---------------- Export Excel ---------------- */
  const exportExcel = () => {
    if (!canExport) return;

    const summarySheet = XLSX.utils.json_to_sheet([
      {
        DateRangeDays: dateRange,
        TotalExtractions: totalExtractions,
        UniquePhrases: uniquePhrases,
        TopPhrase: topPhrase,
      },
    ]);

    const phraseSheet = XLSX.utils.json_to_sheet(topPhrases);
    const usageSheet = XLSX.utils.json_to_sheet(usageByDate);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");
    XLSX.utils.book_append_sheet(wb, phraseSheet, "Phrase Frequency");
    XLSX.utils.book_append_sheet(wb, usageSheet, "Usage Over Time");

    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });

    saveAs(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      "Finance_Analytics_Report.xlsx"
    );

    setExportOpen(false);
  };

  /* ---------------- Axis tick helper ---------------- */
  const formatPhraseTick = (value, index) => {
    if (index % 2 !== 0) return "";
    const s = String(value || "");
    return s.length > 10 ? `${s.slice(0, 10)}…` : s;
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto" data-testid="analytics-page">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-emerald-700">
          Analytics Dashboard
        </h1>

        {/* Controls */}
        <div className="w-full sm:w-auto flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="w-full sm:w-auto">
            <label className="sr-only" htmlFor="dateRangeSelect">
              Date range
            </label>
            <select
              id="dateRangeSelect"
              data-testid="date-range"
              value={dateRange}
              onChange={(e) => setDateRange(Number(e.target.value))}
              className="w-full sm:w-auto border border-emerald-300 rounded-md px-3 py-2 text-sm cursor-pointer"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>

          {/* Export Dropdown */}
          <div className="w-full sm:w-auto relative" ref={exportRef}>
            <button
              data-testid="export-btn"
              type="button"
              disabled={!canExport}
              onClick={() => setExportOpen((o) => !o)}
              aria-label="Export analytics report"
              aria-haspopup="menu"
              aria-expanded={exportOpen}
              aria-controls={exportMenuId}
              className={`w-full sm:w-auto px-4 py-2 rounded-lg text-white transition font-semibold text-sm
              ${
                !canExport
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-emerald-700 hover:bg-emerald-800"
              }`}
            >
              Export{" "}
              <PiExportBold
                aria-hidden="true"
                className="inline-block ml-2 mb-1"
                size={19}
              />
            </button>

            {exportOpen && canExport && (
              <div
                id={exportMenuId}
                role="menu"
                aria-label="Export menu"
                data-testid="export-menu"
                className="
                absolute right-0 top-full mt-2 bg-white shadow-xl rounded-lg border z-50
                w-full sm:w-44 overflow-hidden
              "
              >
                <button
                  data-testid="export-excel"
                  type="button"
                  role="menuitem"
                  aria-label="Export analytics as Excel"
                  onClick={exportExcel}
                  className="block w-full text-left px-4 py-2 text-sm font-semibold text-green-900 hover:bg-emerald-50"
                >
                  Export Excel{" "}
                  <RiFileExcel2Fill
                    aria-hidden="true"
                    className="inline-block ml-2 mb-1"
                    size={16}
                  />
                </button>

                <button
                  data-testid="export-pdf"
                  type="button"
                  role="menuitem"
                  aria-label="Export analytics as PDF"
                  onClick={exportPDF}
                  className="block w-full text-left px-4 py-2 text-sm font-semibold text-green-900 hover:bg-emerald-50"
                >
                  Export PDF{" "}
                  <FaFilePdf
                    aria-hidden="true"
                    className="inline-block ml-2 mb-1"
                    size={16}
                  />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Exportable Area */}
      <div ref={analyticsRef}>
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
          <KpiCard
            title="Total Extractions"
            value={totalExtractions}
            testId="kpi-total"
          />
          <KpiCard
            title="Unique Phrases"
            value={uniquePhrases}
            testId="kpi-unique"
          />
          <KpiCard title="Top Phrase" value={topPhrase} testId="kpi-top" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10">
          <ChartCard title="Top Phrase Frequency" testId="chart-frequency">
            <div className="w-full overflow-x-auto">
              <div className="min-w-[340px]">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={topPhrases}
                    margin={{ top: 16, right: 12, left: 8, bottom: 28 }}
                  >
                    <XAxis
                      dataKey="phrase"
                      interval={0}
                      tickFormatter={formatPhraseTick}
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 10 }}
                      label={{
                        value: "Frequency",
                        angle: -90,
                        position: "insideLeft",
                        offset: -2,
                      }}
                    />
                    <Tooltip
                      formatter={(value) => [`${value}`, "Occurrences"]}
                      labelFormatter={(label) => `Phrase: ${label}`}
                    />
                    <Legend verticalAlign="top" height={24} />
                    <Bar
                      dataKey="count"
                      name="Phrase Frequency"
                      fill="#059669"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-3">
              Note: X-axis shows every other phrase label for readability. Hover
              bars to see full phrase.
            </p>
          </ChartCard>

          <ChartCard title="Extraction Activity Over Time" testId="chart-trend">
            <div className="w-full overflow-x-auto">
              <div className="min-w-[340px]">
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart
                    data={usageByDate}
                    margin={{ top: 16, right: 12, left: 8, bottom: 28 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 10 }}
                      label={{
                        value: "Extractions",
                        angle: -90,
                        position: "insideLeft",
                        offset: -2,
                      }}
                    />
                    <Tooltip
                      formatter={(value) => [`${value}`, "Extractions"]}
                    />
                    <Legend verticalAlign="top" height={24} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="Extractions Over Time"
                      stroke="#059669"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ChartCard>
        </div>

        {loading && (
          <p
            data-testid="loading"
            className="text-sm text-gray-500 mt-6"
            role="status"
            aria-live="polite"
          >
            Loading analytics...
          </p>
        )}
      </div>
    </div>
  );
}

/* ---------------- Reusable UI ---------------- */

function KpiCard({ title, value, testId }) {
  return (
    <div
      data-testid={testId}
      className="bg-emerald-600 shadow-lg rounded-xl p-6 border border-emerald-200"
    >
      <p className="text-sm text-white mb-1">{title}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

function ChartCard({ title, children, testId }) {
  return (
    <div
      data-testid={testId}
      className="bg-white shadow-xl rounded-xl p-4 sm:p-6 border-2 border-emerald-500"
    >
      <h2 className="text-lg sm:text-xl font-semibold text-emerald-700 mb-3 sm:mb-4">
        {title}
      </h2>
      {children}
    </div>
  );
}
