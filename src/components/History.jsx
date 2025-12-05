import React, { useEffect, useState, useMemo } from "react";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5678";

export default function History() {
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Highlight search matches
  const highlightMatch = (text, query) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, "gi");

    return text.split(regex).map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="bg-green-200 text-green-800 px-1 rounded">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  useEffect(() => {
    fetch(`${API_BASE}/webhook/get-finance-history`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setHistory(data);
        }
      })
      .catch((err) => console.error("History load error:", err));
  }, []);

  // Filter + Sort Logic
  const filteredAndSorted = useMemo(() => {
    let data = [...history];

    if (search.trim() !== "") {
      data = data.filter(
        (item) =>
          item.input_text.toLowerCase().includes(search.toLowerCase()) ||
          item.phrases.some((p) =>
            p.toLowerCase().includes(search.toLowerCase())
          )
      );
    }

    data.sort((a, b) => {
      if (sortField === "id") {
        return sortOrder === "asc" ? a.id - b.id : b.id - a.id;
      } else if (sortField === "created_at") {
        return sortOrder === "asc"
          ? new Date(a.created_at) - new Date(b.created_at)
          : new Date(b.created_at) - new Date(a.created_at);
      }
      return 0;
    });

    return data;
  }, [history, search, sortField, sortOrder]);

  // Pagination
  const startIndex = (page - 1) * pageSize;
  const pageData = filteredAndSorted.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(filteredAndSorted.length / pageSize);

  const changeSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-emerald-700">
        Extraction History
      </h1>

      {/* Search Bar */}
      <div className="mb-6 flex items-center gap-3">
        <input
          type="text"
          placeholder="Search input text or phrases..."
          className="border border-emerald-700 px-4 py-2 rounded w-full md:w-1/2 focus:ring-2 focus:ring-emerald-700"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto rounded-lg shadow-lg border border-emerald-500">
        <table className="min-w-full text-sm bg-white">
          <thead className="bg-emerald-700 text-white">
            <tr>
              <th
                className="px-4 py-3 text-left cursor-pointer border-r border-emerald-600"
                onClick={() => changeSort("id")}
              >
                ID {sortField === "id" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>

              <th className="px-4 py-3 text-left w-1/3 border-r border-emerald-600">
                Input Text
              </th>

              <th className="px-4 py-3 text-left border-r border-emerald-600">
                Extracted Phrases
              </th>

              <th
                className="px-4 py-3 text-left cursor-pointer"
                onClick={() => changeSort("created_at")}
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
              >
                {/* ID */}
                <td className="px-4 py-3 border-r border-gray-300">
                  {item.id}
                </td>

                {/* Input Text */}
                <td className="px-4 py-3 text-gray-800 border-r border-gray-300">
                  {highlightMatch(item.input_text, search)}
                </td>

                {/* Phrases */}
                <td className="px-4 py-3 border-r border-gray-300">
                  <ul className="list-disc list-inside text-gray-800 space-y-1">
                    {item.phrases.map((phrase, i) => (
                      <li key={i}>{highlightMatch(phrase, search)}</li>
                    ))}
                  </ul>
                </td>

                {/* Created At */}
                <td className="px-4 py-3 text-gray-600">
                  {new Date(item.created_at).toLocaleString()}
                </td>
              </tr>
            ))}

            {pageData.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center py-6 text-gray-500">
                  No matching records found!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-4 mt-6">
        <button
          className="px-4 py-2 bg-emerald-700 text-white rounded disabled:opacity-50 hover:bg-emerald-700 transition"
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          ← Prev
        </button>

        <span className="text-md text-emerald-700 font-semibold">
          Page {page} of {totalPages}
        </span>

        <button
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
