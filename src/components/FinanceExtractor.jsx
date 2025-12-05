import React, { useEffect, useState } from "react";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5678";

export default function FinanceExtractor() {
  const [text, setText] = useState("");
  const [phrases, setPhrases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [apiUrl, setApiUrl] = useState("");

  useEffect(() => {
    setApiUrl(`${API_BASE}/webhook/extract-finance`);
  }, []);

  const extractPhrases = async () => {
    setError("");
    setPhrases([]);
    setCopied(false);

    if (!text.trim()) {
      setError("Please enter some text before extracting!");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data = await res.json();
      setPhrases(data.phrases || []);
    } catch (err) {
      console.error("Extraction error:", err);
      setError("Unable to extract phrases. Please try again.");
    }

    setLoading(false);
  };

  const copyPhrases = () => {
    if (phrases.length === 0) return;

    navigator.clipboard.writeText(phrases.join(", ")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto mt-10">
      {/* Page Title */}
      <h1 className="text-4xl font-bold text-emerald-700 mb-10 text-center drop-shadow-sm">
        Finance Phrase Extraction
      </h1>

      {/* Side-by-side layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* LEFT PANEL — Input */}
        <div className="bg-white rounded-xl shadow-xl p-8 border-2 border-emerald-600">
          <h2 className="text-2xl font-semibold text-emerald-700 mb-4">
            Input Text:
          </h2>

          <textarea
            className="w-full border-2 border-emerald-200 rounded-lg p-4 text-gray-700 
                       focus:outline-none focus:ring-2 focus:ring-emerald-600
                       placeholder-gray-400 transition-all"
            rows="12"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste financial news, earnings report, or article..."
          />

          {error && (
            <p className="text-red-600 text-sm mt-2 font-medium">{error}</p>
          )}

          <button
            onClick={extractPhrases}
            disabled={loading}
            className="
              mt-5 w-full
              bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-300 
              text-white font-semibold px-8 py-3 rounded-lg transition-all
              shadow-md hover:shadow-lg active:scale-[0.98]
              flex items-center justify-center gap-2
            "
          >
            {loading ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                Extracting...
              </>
            ) : (
              "Extract Phrases"
            )}
          </button>
        </div>

        {/* RIGHT PANEL — Results */}
        <div className="bg-white rounded-xl shadow-xl p-8 border-2 border-emerald-600">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-emerald-700">
              Extracted Phrases:
            </h2>

            {phrases.length > 0 && (
              <button
                onClick={copyPhrases}
                className="bg-emerald-600 hover:bg-emerald-700 text-white 
                           px-4 py-2 rounded-md text-sm shadow-md transition"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
          </div>

          {phrases.length > 0 ? (
            <ul className="space-y-3 list-disc list-inside text-gray-800">
              {phrases.map((p, i) => (
                <li key={i} className="text-gray-800">
                  {p}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center mt-4">
              No Phrases Extracted Yet!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
