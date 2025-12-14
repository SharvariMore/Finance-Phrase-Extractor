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

  const analyticsRef = useRef(null);
  const exportRef = useRef(null);

  /* ---------------- Fetch Data ---------------- */
  useEffect(() => {
    fetch(`${API_BASE}/webhook/get-finance-history`)
      .then((res) => res.json())
      .then((data) => setHistory(Array.isArray(data) ? data : data.data || []));
  }, []);

  /* ---------------- Close Export Dropdown on Outside Click ---------------- */
  useEffect(() => {
    const handler = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setExportOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
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
      item.phrases.forEach((p) => {
        freq[p] = (freq[p] || 0) + 1;
      });
    });
    return freq;
  }, [filteredHistory]);

  const topPhrases = Object.entries(phraseFrequency)
    .map(([phrase, count]) => ({ phrase, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  /* ---------------- Usage Over Time ---------------- */
  const usageByDate = useMemo(() => {
    const map = {};
    filteredHistory.forEach((item) => {
      const date = new Date(item.created_at).toLocaleDateString();
      map[date] = (map[date] || 0) + 1;
    });
    return Object.entries(map).map(([date, count]) => ({ date, count }));
  }, [filteredHistory]);

  /* ---------------- KPIs ---------------- */
  const totalExtractions = filteredHistory.length;
  const uniquePhrases = Object.keys(phraseFrequency).length;
  const topPhrase = topPhrases[0]?.phrase || "—";

  /* ---------------- Export PDF ---------------- */
  const exportPDF = async () => {
    if (!analyticsRef.current) return;

    const pdf = new jsPDF("p", "pt", "a4");
    pdf.setFontSize(20);
    pdf.text("Finance Phrase Analytics Report", 40, 40);

    pdf.setFontSize(12);
    pdf.text(`Date Range: Last ${dateRange} days`, 40, 70);
    pdf.text(`Total Extractions: ${totalExtractions}`, 40, 90);
    pdf.text(`Unique Phrases: ${uniquePhrases}`, 40, 110);
    pdf.text(`Top Phrase: ${topPhrase}`, 40, 130);

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
    if (filteredHistory.length === 0) return;

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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold text-emerald-700">
          Analytics Dashboard
        </h1>

        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(Number(e.target.value))}
            className="border border-emerald-300 rounded-md px-3 py-2 text-sm cursor-pointer"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>

          {/* Export Dropdown */}
          <div className="flex justify-end relative" ref={exportRef}>
            <button
              disabled={filteredHistory.length === 0}
              onClick={() => setExportOpen((o) => !o)}
              className={`gap-2 px-4 py-2 rounded-lg text-white transition font-semibold text-sm
                ${
                  filteredHistory.length === 0
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-emerald-700 hover:bg-emerald-800"
                }`}
            >
              Export{" "}
              <PiExportBold className="inline-block ml-2 mb-1" size={19} />
            </button>

            {exportOpen && (
              <div
                className="absolute right-0 top-full mt-2 bg-white shadow-xl rounded-lg border z-50 w-40"
              >
                <button
                  onClick={exportExcel}
                  className="block w-full text-left px-4 py-2 text-sm font-semibold text-green-900 hover:bg-emerald-50"
                >
                  Export Excel{" "}
                  <RiFileExcel2Fill
                    className="inline-block ml-2 mb-1"
                    size={16}
                  />
                </button>
                <button
                  onClick={exportPDF}
                  className="block w-full text-left px-4 py-2 text-sm font-semibold text-green-900 hover:bg-emerald-50"
                >
                  Export PDF{" "}
                  <FaFilePdf className="inline-block ml-2 mb-1" size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Exportable Area */}
      <div ref={analyticsRef}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <KpiCard title="Total Extractions" value={totalExtractions} />
          <KpiCard title="Unique Phrases" value={uniquePhrases} />
          <KpiCard title="Top Phrase" value={topPhrase} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <ChartCard title="Top Phrase Frequency">
            <ResponsiveContainer width="100%" height={340}>
              <BarChart
                data={topPhrases}
                margin={{ top: 20, right: 20, left: 30, bottom: 30 }}
              >
                <XAxis
                  dataKey="phrase"
                  tick={false}
                  angle={-30}
                  textAnchor="end"
                  interval={1}
                  label={{
                    value: "Financial Phrases",
                    position: "bottom",
                    offset: 10,
                  }}
                />
                <YAxis
                  allowDecimals={false}
                  label={{
                    value: "Frequency",
                    angle: -90,
                    position: "insideLeft",
                    offset: -10,
                  }}
                />
                <Tooltip formatter={(value) => [`${value}`, "Occurrences"]} />
                <Legend verticalAlign="top" height={36} />
                <Bar
                  dataKey="count"
                  name="Phrase Frequency"
                  fill="#059669"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Extraction Activity Over Time">
            <ResponsiveContainer width="100%" height={340}>
              <LineChart
                data={usageByDate}
                margin={{ top: 20, right: 20, left: 30, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  label={{
                    value: "Date",
                    position: "bottom",
                    offset: 20,
                  }}
                />
                <YAxis
                  allowDecimals={false}
                  label={{
                    value: "Number of Extractions",
                    angle: -90,
                    position: "insideLeft",
                    offset: -10,
                  }}
                />
                <Tooltip formatter={(value) => [`${value}`, "Extractions"]} />
                <Legend verticalAlign="top" height={36} />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Extractions Over Time"
                  stroke="#059669"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Reusable UI ---------------- */

function KpiCard({ title, value }) {
  return (
    <div className="bg-emerald-600 shadow-lg rounded-xl p-6 border border-emerald-200">
      <p className="text-sm text-white mb-1">{title}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white shadow-xl rounded-xl p-6 border-2 border-emerald-500">
      <h2 className="text-xl font-semibold text-emerald-700 mb-4">{title}</h2>
      {children}
    </div>
  );
}
