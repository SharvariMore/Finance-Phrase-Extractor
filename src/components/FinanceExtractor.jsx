import React, { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import { LuCopy } from "react-icons/lu";
import { PiExportBold } from "react-icons/pi";
import { RiFileExcel2Fill } from "react-icons/ri";
import { FaFilePdf } from "react-icons/fa6";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5678";

export default function FinanceExtractor() {
  const [text, setText] = useState("");
  const [phrases, setPhrases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [apiUrl, setApiUrl] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    setApiUrl(`${API_BASE}/webhook/extract-finance`);

    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ------------------------- EXPORT: EXCEL ------------------------- */
  const downloadExcel = () => {
    const data = [{ Input_Text: text, Extracted_Phrases: phrases.join(", ") }];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Extraction");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, "Finance_Extraction.xlsx");
  };

  /* --------------------------- EXPORT: PDF -------------------------- */
  const downloadPDF = () => {
    const doc = new jsPDF("p", "pt", "a4");
    const marginLeft = 40;
    let y = 50;

    doc.setFontSize(18);
    doc.text("Finance Phrase Extraction Report", marginLeft, y);
    y += 30;

    doc.setFontSize(14);
    doc.text("Input Text:", marginLeft, y);
    y += 20;

    doc.setFontSize(12);
    const inputLines = doc.splitTextToSize(text, 520);
    doc.text(inputLines, marginLeft, y);
    y += inputLines.length * 14 + 20;

    doc.setFontSize(14);
    doc.text("Extracted Phrases:", marginLeft, y);
    y += 20;

    doc.setFontSize(12);
    phrases.forEach((p) => {
      doc.text(`• ${p}`, marginLeft, y);
      y += 18;
    });

    doc.save("Finance_Extraction.pdf");
  };

  /* ------------------------- EXTRACT PHRASES ------------------------ */
  const extractPhrases = async () => {
    setError("");
    setPhrases([]);
    setCopied(false);
    setDropdownOpen(false);

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

  /* ------------------------- COPY TO CLIPBOARD ---------------------- */
  const copyPhrases = () => {
    if (phrases.length === 0) return;

    navigator.clipboard.writeText(phrases.join(", ")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Title */}
      <h1 className="text-4xl font-bold text-emerald-700 mb-6 text-center drop-shadow-sm">
        Finance Phrase Extraction Agent
      </h1>

      {/* EXPORT DROPDOWN */}
      <div className="flex justify-end mb-6 relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          disabled={phrases.length === 0}
          className={`
      px-5 py-2 rounded-lg shadow-md transition text-white 
      ${
        phrases.length === 0
          ? "bg-gray-400 cursor-not-allowed font-semibold"
          : "bg-emerald-700 hover:bg-emerald-800 font-semibold"
      }
    `}
        >
          Export <PiExportBold className="inline-block ml-2 mb-1" size={20} />
        </button>

        {dropdownOpen && phrases.length > 0 && (
          <div
            className="
        absolute right-0 top-full mt-2 
        bg-white shadow-xl rounded-lg border z-50 w-38
      "
          >
            <button
              onClick={() => {
                downloadExcel();
                setDropdownOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm font-semibold text-green-900 hover:bg-emerald-50"
            >
              Export as Excel <RiFileExcel2Fill className="inline-block ml-2 mb-1" size={16} />
            </button>

            <button
              onClick={() => {
                downloadPDF();
                setDropdownOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm font-semibold text-green-900 hover:bg-emerald-50"
            >
              Export as PDF <FaFilePdf className="inline-block ml-2 mb-1" size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* LEFT PANEL */}
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
              mt-5 w-full bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-300 
              text-white font-semibold px-8 py-3 rounded-lg shadow-md
              hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2
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

        {/* RIGHT PANEL */}
        <div className="bg-white rounded-xl shadow-xl p-8 border-2 border-emerald-600">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-emerald-700">
              Extracted Phrases:
            </h2>

            {phrases.length > 0 && (
              <button
                onClick={copyPhrases}
                className="bg-emerald-600 hover:bg-emerald-700 text-white 
                           px-4 py-2 rounded-md text-sm shadow-md transition font-semibold"
              >
                {copied ? "Copied!" : "Copy"}
                <LuCopy className="inline-block ml-2 mb-1" size={16} />
              </button>
            )}
          </div>

          {phrases.length > 0 ? (
            <ul className="space-y-3 list-disc list-inside text-gray-800">
              {phrases.map((p, i) => (
                <li key={i}>{p}</li>
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
