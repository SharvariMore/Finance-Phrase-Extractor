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
} from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { FaFilePdf } from "react-icons/fa6";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5678";

export default function Analytics() {
  const [history, setHistory] = useState([]);
  const [dateRange, setDateRange] = useState(30);
  const analyticsRef = useRef(null);

  /* ---------------- Fetch Data ---------------- */
  useEffect(() => {
    fetch(`${API_BASE}/webhook/get-finance-history`)
      .then((res) => res.json())
      .then((data) =>
        setHistory(Array.isArray(data) ? data : data.data || [])
      );
  }, []);

  /* ---------------- Date Filter (FIXED) ---------------- */
  const filteredHistory = useMemo(() => {
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - dateRange);

    return history
      .filter((item) => {
        const d = new Date(item.created_at);
        return !isNaN(d) && d >= cutoff;
      })
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
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

    return Object.entries(map).map(([date, count]) => ({
      date,
      count,
    }));
  }, [filteredHistory]);

  /* ---------------- KPIs ---------------- */
  const totalExtractions = filteredHistory.length;
  const uniquePhrases = Object.keys(phraseFrequency).length;
  const topPhrase = topPhrases[0]?.phrase || "—";

  /* ---------------- Export PDF (WITH CONTEXT) ---------------- */
  const exportAnalyticsPDF = async () => {
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
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, 20, pageWidth, imgHeight);

    pdf.save("Finance_Analytics_Report.pdf");
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold mb-6 text-emerald-700">
          Analytics Dashboard
        </h1>

        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(Number(e.target.value))}
            className="border border-emerald-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-600 cursor-pointer"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>

          <button
            onClick={exportAnalyticsPDF}
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-md shadow-md text-sm font-semibold"
          >
            Export PDF <FaFilePdf className="inline-block ml-2 mb-1" size={16} />
          </button>
        </div>
      </div>

      {/* EXPORTABLE CONTENT */}
      <div ref={analyticsRef}>
        {/* KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <KpiCard title="Total Extractions" value={totalExtractions} />
          <KpiCard title="Unique Phrases" value={uniquePhrases} />
          <KpiCard title="Top Phrase" value={topPhrase} />
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Bar Chart */}
          <ChartCard title="Top Financial Phrase Frequency">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={topPhrases}>
                <XAxis
                  dataKey="phrase"
                  angle={-30}
                  textAnchor="end"
                  height={90}
                  label={{
                    value: "Financial Phrases",
                    position: "insideBottom",
                    offset: -70,
                  }}
                />
                <YAxis
                  allowDecimals={false}
                  label={{
                    value: "Frequency",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip />
                <Bar
                  dataKey="count"
                  name="Occurrences"
                  fill="#059669"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Line Chart */}
          <ChartCard title="Extraction Activity Over Time">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={usageByDate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  label={{
                    value: "Date",
                    position: "insideBottom",
                    offset: -5,
                  }}
                />
                <YAxis
                  allowDecimals={false}
                  label={{
                    value: "Number of Extractions",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Extractions"
                  stroke="#059669"
                  strokeWidth={3}
                  dot={{ r: 4 }}
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
    <div className="bg-white shadow-lg rounded-xl p-6 border border-emerald-200">
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-3xl font-bold text-emerald-700">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white shadow-xl rounded-xl p-6 border border-emerald-200">
      <h2 className="text-xl font-semibold text-emerald-700 mb-4">
        {title}
      </h2>
      {children}
    </div>
  );
}
