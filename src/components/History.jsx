import React, { useEffect, useState, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import { PiExportBold } from "react-icons/pi";
import { RiFileExcel2Fill } from "react-icons/ri";
import { FaFilePdf } from "react-icons/fa6";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5678";

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default function History() {
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);
  const pageSize = 5;

  // Highlight search matches (safe regex)
  const highlightMatch = (text, query) => {
    if (!query) return text;
    const safe = escapeRegExp(query);
    const regex = new RegExp(`(${safe})`, "gi");

    return String(text)
      .split(regex)
      .map((part, index) =>
        regex.test(part) ? (
          <span
            key={index}
            className="bg-green-200 text-green-800 px-1 rounded"
          >
            {part}
          </span>
        ) : (
          part
        )
      );
  };

  useEffect(() => {
    let alive = true;

    fetch(`${API_BASE}/webhook/get-finance-history`)
      .then((res) => res.json())
      .then((data) => {
        if (!alive) return;

        const rows = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];
        // Normalize phrases to arrays so UI doesn't crash
        const normalized = rows.map((r) => ({
          ...r,
          phrases: Array.isArray(r?.phrases) ? r.phrases : [],
        }));

        setHistory(normalized);
        setPage(1);
      })
      .catch((err) => console.error("History load error:", err));

    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") setDropdownOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      alive = false;
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  /* ------------------------- EXPORT: EXCEL ------------------------- */
  const downloadHistoryExcel = () => {
    const data = history.map((item) => ({
      ID: item.id,
      Input_Text: item.input_text,
      Extracted_Phrases: (Array.isArray(item.phrases) ? item.phrases : []).join(
        ", "
      ),
      Created_At: item.created_at,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "History");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    saveAs(
      new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      "Finance_Extraction_History.xlsx"
    );
  };

  /* --------------------------- EXPORT: PDF -------------------------- */
  const downloadHistoryPDF = () => {
    const doc = new jsPDF("p", "pt", "a4");
    const marginLeft = 40;
    let y = 50;

    doc.setFontSize(18);
    doc.text("Finance Extraction History Report", marginLeft, y);
    y += 30;

    history.forEach((item, idx) => {
      doc.setFontSize(14);
      doc.text(`Record #${idx + 1}`, marginLeft, y);
      y += 20;

      doc.setFontSize(12);
      const inputLines = doc.splitTextToSize(
        String(item.input_text || ""),
        520
      );

      doc.text("Input:", marginLeft, y);
      y += 16;
      doc.text(inputLines, marginLeft, y);
      y += inputLines.length * 14 + 10;

      doc.text("Phrases:", marginLeft, y);
      y += 16;

      (Array.isArray(item.phrases) ? item.phrases : []).forEach((p) => {
        doc.text(`• ${p}`, marginLeft, y);
        y += 14;
      });

      y += 20;

      if (y > 750) {
        doc.addPage();
        y = 50;
      }
    });

    doc.save("Finance_Extraction_History.pdf");
  };

  // Filter + Sort
  const filteredAndSorted = useMemo(() => {
    let data = [...history];

    const q = search.trim().toLowerCase();
    if (q) {
      data = data.filter(
        (item) =>
          String(item.input_text || "")
            .toLowerCase()
            .includes(q) ||
          (Array.isArray(item.phrases) ? item.phrases : []).some((p) =>
            String(p).toLowerCase().includes(q)
          )
      );
    }

    data.sort((a, b) => {
      if (sortField === "id") {
        return sortOrder === "asc"
          ? (a.id ?? 0) - (b.id ?? 0)
          : (b.id ?? 0) - (a.id ?? 0);
      }
      if (sortField === "created_at") {
        const da = new Date(a.created_at).getTime();
        const db = new Date(b.created_at).getTime();
        return sortOrder === "asc" ? da - db : db - da;
      }
      return 0;
    });

    return data;
  }, [history, search, sortField, sortOrder]);

  // Pagination
  const startIndex = (page - 1) * pageSize;
  const pageData = filteredAndSorted.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.max(
    1,
    Math.ceil(filteredAndSorted.length / pageSize)
  );

  const changeSort = (field) => {
    if (sortField === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const canExport = history.length > 0;
  const exportMenuId = "history-export-menu";

  return (
    <div className="p-6 max-w-7xl mx-auto" data-testid="history-page">
      <h1 className="text-3xl font-bold mb-6 text-emerald-700">
        Extraction History
      </h1>

      {/* Search Bar */}
      <div className="mb-6 flex items-center gap-3">
        <input
          data-testid="history-search"
          type="text"
          placeholder="Search input text or phrases..."
          aria-label="Search history"
          className="border border-emerald-700 px-4 py-2 rounded w-full md:w-1/2 focus:ring-2 focus:ring-emerald-700"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {/* EXPORT DROPDOWN */}
      <div
        className="w-full sm:w-auto flex justify-end mb-6 relative"
        ref={dropdownRef}
        data-testid="history-export-wrapper"
      >
        <button
          data-testid="history-export-btn"
          type="button"
          onClick={() => setDropdownOpen((v) => !v)}
          disabled={!canExport}
          aria-label="Export history"
          aria-haspopup="menu"
          aria-expanded={dropdownOpen}
          aria-controls={exportMenuId}
          className={`
            w-full sm:w-auto px-4 py-2 rounded-lg shadow-md transition text-white text-sm font-semibold
            ${
              !canExport
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-emerald-700 hover:bg-emerald-800"
            }
          `}
        >
          Export{" "}
          <PiExportBold
            aria-hidden="true"
            className="inline-block ml-2 mb-1"
            size={20}
          />
        </button>

        {dropdownOpen && canExport && (
          <div
            id={exportMenuId}
            role="menu"
            aria-label="Export menu"
            data-testid="history-export-menu"
            className="absolute right-0 top-full mt-2 bg-white shadow-xl rounded-lg border z-50 w-full sm:w-44 overflow-hidden"
          >
            <button
              data-testid="history-export-excel"
              type="button"
              role="menuitem"
              aria-label="Export history as Excel"
              onClick={() => {
                downloadHistoryExcel();
                setDropdownOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm font-semibold text-green-900 hover:bg-emerald-50"
            >
              Export as Excel{" "}
              <RiFileExcel2Fill
                aria-hidden="true"
                className="inline-block ml-2 mb-1"
                size={16}
              />
            </button>

            <button
              data-testid="history-export-pdf"
              type="button"
              role="menuitem"
              aria-label="Export history as PDF"
              onClick={() => {
                downloadHistoryPDF();
                setDropdownOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm font-semibold text-green-900 hover:bg-emerald-50"
            >
              Export as PDF{" "}
              <FaFilePdf
                aria-hidden="true"
                className="inline-block ml-2 mb-1"
                size={16}
              />
            </button>
          </div>
        )}
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto rounded-lg shadow-lg border border-emerald-500">
        <table
          className="min-w-[900px] w-full text-sm bg-white"
          data-testid="history-table"
        >
          <thead className="bg-emerald-700 text-white">
            <tr>
              <th
                className="px-4 py-3 text-left cursor-pointer border-r border-emerald-600"
                onClick={() => changeSort("id")}
                scope="col"
              >
                ID {sortField === "id" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>

              <th
                className="px-4 py-3 text-left w-1/3 border-r border-emerald-600"
                scope="col"
              >
                Input Text
              </th>

              <th
                className="px-4 py-3 text-left border-r border-emerald-600"
                scope="col"
              >
                Extracted Phrases
              </th>

              <th
                className="px-4 py-3 text-left cursor-pointer"
                onClick={() => changeSort("created_at")}
                scope="col"
              >
                Created At{" "}
                {sortField === "created_at" &&
                  (sortOrder === "asc" ? "↑" : "↓")}
              </th>
            </tr>
          </thead>

          <tbody>
            {pageData.map((item) => (
              <tr
                key={item.id}
                className="border-b hover:bg-green-50 transition"
                data-testid="history-row"
              >
                <td className="px-4 py-3 border-r border-gray-300">
                  {item.id}
                </td>

                <td className="px-4 py-3 text-gray-800 border-r border-gray-300">
                  {highlightMatch(item.input_text, search)}
                </td>

                <td className="px-4 py-3 border-r border-gray-300">
                  <ul className="list-disc list-inside text-gray-800 space-y-1">
                    {(Array.isArray(item.phrases) ? item.phrases : []).map(
                      (phrase, i) => (
                        <li key={i}>{highlightMatch(phrase, search)}</li>
                      )
                    )}
                  </ul>
                </td>

                <td className="px-4 py-3 text-gray-600">
                  {item.created_at
                    ? new Date(item.created_at).toLocaleString()
                    : ""}
                </td>
              </tr>
            ))}

            {pageData.length === 0 && (
              <tr>
                <td
                  colSpan="4"
                  className="text-center py-6 text-gray-500"
                  data-testid="history-empty"
                >
                  No matching records found!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div
        className="flex justify-center items-center gap-4 mt-6"
        data-testid="history-pagination"
      >
        <button
          type="button"
          aria-label="Previous page"
          data-testid="history-prev"
          className="px-4 py-2 bg-emerald-700 text-white rounded disabled:opacity-50 hover:bg-emerald-700 transition"
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          ← Prev
        </button>

        <span
          className="text-md text-emerald-700 font-semibold"
          data-testid="history-page-indicator"
        >
          Page {page} of {totalPages}
        </span>

        <button
          type="button"
          aria-label="Next page"
          data-testid="history-next"
          className="px-4 py-2 bg-emerald-700 text-white rounded disabled:opacity-50 hover:bg-emerald-700 transition"
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
