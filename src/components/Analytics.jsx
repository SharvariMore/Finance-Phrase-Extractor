import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";

const API_BASE = process.env.REACT_APP_API_BASE;

export default function Analytics() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/webhook/get-finance-history`)
      .then((res) => res.json())
      .then((data) => setHistory(Array.isArray(data) ? data : data.data));
  }, []);

  const phraseFrequency = {};
  history.forEach((item) => {
    item.phrases.forEach((p) => {
      phraseFrequency[p] = (phraseFrequency[p] || 0) + 1;
    });
  });

  const chartData = Object.keys(phraseFrequency).map((key) => ({
    phrase: key,
    count: phraseFrequency[key],
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-emerald-700">Analytics Dashboard</h1>

      <h2 className="text-xl font-semibold mb-3">Phrase Frequency</h2>

      <BarChart width={600} height={350} data={chartData}>
        <XAxis dataKey="phrase" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" fill="#059669" />
      </BarChart>
    </div>
  );
}
