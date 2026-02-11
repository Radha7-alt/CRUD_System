import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";

export default function PapersPage() {
  const router = useRouter();

  const [me, setMe] = useState(null);
  const [journals, setJournals] = useState([]);
  const [papers, setPapers] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState("");

  const [search, setSearch] = useState("");

  // Form fields
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [journalId, setJournalId] = useState("");

  // Authors as objects: [{name,isCorresponding}]
  const [authors, setAuthors] = useState([]);
  const [authorQuery, setAuthorQuery] = useState("");
  const [authorSuggestions, setAuthorSuggestions] = useState([]);
  const [authorOpen, setAuthorOpen] = useState(false);

  const authorWrapRef = useRef(null);
  const authorInputRef = useRef(null);

  async function loadMe() {
    const res = await fetch("/api/auth/me");
    if (res.status === 401) {
      router.push("/login");
      return null;
    }
    const data = await res.json();
    setMe(data);
    return data;
  }

  async function loadJournals() {
    const res = await fetch("/api/journals");
    const data = await res.json();
    const list = Array.isArray(data) ? data : [];
    setJournals(list);

    if (!journalId && list?.[0]?._id) {
      setJournalId(String(list[0]._id));
    }
  }

  // Papers page should NOT show deleted papers
  async function loadPapers() {
    const res = await fetch("/api/papers"); // no ?deleted=1
    const data = await res.json();
    setPapers(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    (async () => {
      const user = await loadMe();
      if (!user) return;
      await loadJournals();
      await loadPapers();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // author suggestions (from users)
  useEffect(() => {
    let ignore = false;
    (async () => {
      const q = authorQuery.trim();
      if (!q) {
        setAuthorSuggestions([]);
        return;
      }
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!ignore) setAuthorSuggestions(Array.isArray(data) ? data : []);
    })();
    return () => {
      ignore = true;
    };
  }, [authorQuery]);

  // close suggestions on outside click
  useEffect(() => {
    function onDocMouseDown(e) {
      if (!authorWrapRef.current) return;
      if (!authorWrapRef.current.contains(e.target)) setAuthorOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  function addAuthor(name) {
    const clean = (name || "").trim();
    if (!clean) return;
    if (authors.some((a) => a.name.toLowerCase() === clean.toLowerCase())) return;
    setAuthors((prev) => [...prev, { name: clean, isCorresponding: prev.length === 0 }]);
  }

  function removeAuthor(name) {
    setAuthors((prev) => {
      const next = prev.filter((a) => a.name !== name);
      if (next.length && !next.some((a) => a.isCorresponding)) {
        next[0] = { ...next[0], isCorresponding: true };
      }
      return next;
    });
  }

  function setCorresponding(name) {
    setAuthors((prev) => prev.map((a) => ({ ...a, isCorresponding: a.name === name })));
  }

  function addFromInput() {
    const q = authorQuery.trim();
    if (!q) return;
    addAuthor(q);
    setAuthorQuery("");
    setAuthorSuggestions([]);
    setAuthorOpen(false);
    setTimeout(() => authorInputRef.current?.focus(), 0);
  }

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setUrl("");
    setAuthors([]);
    setAuthorQuery("");
    setAuthorSuggestions([]);
    setAuthorOpen(false);
    setMsg("");
  }

  async function submitPaper(e) {
    e.preventDefault();
    setMsg("");

    if (!title.trim()) return setMsg("Title is required.");
    if (!journalId) return setMsg("Please select a journal.");

    const payload = {
      title: title.trim(),
      url: url || "",
      authors,
      journalId,
    };

    const endpoint = editingId ? `/api/papers/${editingId}` : "/api/papers";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      setMsg(data.message || "Failed");
      return;
    }

    setMsg(editingId ? "Paper updated!" : "Paper created!");
    resetForm();
    await loadPapers();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startEdit(p) {
    setEditingId(p._id);
    setTitle(p.title || "");
    setUrl(p.url || "");
    setAuthors(Array.isArray(p.authors) ? p.authors : []);

    const last =
      Array.isArray(p.journalHistory) && p.journalHistory.length
        ? p.journalHistory[p.journalHistory.length - 1]
        : null;

    if (last?.journalId?._id) setJournalId(String(last.journalId._id));
    else if (last?.journalId) setJournalId(String(last.journalId));
    else if (!journalId && journals?.[0]?._id) setJournalId(String(journals[0]._id));

    setMsg("");
    setAuthorQuery("");
    setAuthorSuggestions([]);
    setAuthorOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function softDelete(id) {
    if (!confirm("Soft delete this paper?")) return;

    // optimistic UI: remove instantly
    setPapers((prev) => prev.filter((p) => p._id !== id));

    const res = await fetch(`/api/papers/${id}`, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Delete failed");
      await loadPapers();
      return;
    }

    await loadPapers();
    if (editingId === id) resetForm();
  }

  // helpers
  function getLastJournalEntry(p) {
    const hist = Array.isArray(p.journalHistory) ? p.journalHistory : [];
    return hist.length ? hist[hist.length - 1] : null;
  }

  function getJournalName(entry) {
    if (!entry) return "";
    if (entry.journalId && typeof entry.journalId === "object" && entry.journalId.name) {
      return entry.journalId.name;
    }
    return entry.journalTitle || "";
  }

  const filteredPapers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return papers;

    return papers.filter((p) => {
      const t = (p.title || "").toLowerCase();
      const a = (p.authors || []).map((x) => x?.name || "").join(", ").toLowerCase();
      const j = (p.journalHistory || []).map(getJournalName).join(", ").toLowerCase();
      const s = (p.currentStatus || "").toLowerCase();
      return t.includes(q) || a.includes(q) || j.includes(q) || s.includes(q);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [papers, search]);

  // XLSX export (exports filtered list)
  async function exportXLSX(rows) {
    try {
      const XLSX = await import("xlsx");

      const data = rows.map((p) => {
        const authorObjs = Array.isArray(p.authors) ? p.authors : [];
        const corresponding = authorObjs.find((a) => a?.isCorresponding)?.name || "";
        const allAuthors = authorObjs.map((a) => a?.name).filter(Boolean).join(", ");

        const hist = Array.isArray(p.journalHistory) ? p.journalHistory : [];
        const last = hist.length ? hist[hist.length - 1] : null;

        const journalNames = hist.map(getJournalName).filter(Boolean).join(" → ");

        return {
          Title: p.title || "",
          Corresponding: corresponding || "",
          Authors: allAuthors || "",
          Journals: journalNames || "",
          Status: p.currentStatus || last?.status || "",
          "Date Submitted (latest)": last?.date_submitted
            ? new Date(last.date_submitted).toLocaleString()
            : "",
          "Last Updated (latest)": last?.last_updated
            ? new Date(last.last_updated).toLocaleString()
            : "",
          URL: p.url || "",
        };
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, "Papers");

      const stamp = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `papers_export_${stamp}.xlsx`);
    } catch (e) {
      alert("Export failed. Make sure you installed 'xlsx'.");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-300 p-6">
      <div className="mx-auto w-full max-w-6xl">
        <header className="rounded-3xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/40 px-8 py-7">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-slate-900">Papers</h1>
            {msg && (
              <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
                {msg}
              </div>
            )}
          </div>
        </header>

        {/* FORM */}
        <section className="relative z-50 mt-6 rounded-3xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/40 p-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {editingId ? "Update paper" : "Add paper"}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Create a paper with its initial journal submission. Status starts as <b>submitted</b>.
              </p>
            </div>
            {editingId && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-amber-800 text-sm font-semibold">
                Editing mode
              </span>
            )}
          </div>

          <form onSubmit={submitPaper} className="mt-6 grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Title</label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Paper title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">URL</label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="(optional)"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Initial Journal</label>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={journalId}
                  onChange={(e) => setJournalId(e.target.value)}
                  required
                >
                  {journals.map((j) => (
                    <option key={j._id} value={j._id}>
                      {j.name}
                    </option>
                  ))}
                </select>
              </div>
              <div />
            </div>

            {/* AUTHORS */}
            <div className="relative isolate" ref={authorWrapRef}>
              <label className="text-sm font-medium text-slate-700">Authors</label>

              <div className="mt-2 flex flex-wrap gap-2">
                {authors.map((a) => (
                  <span
                    key={a.name}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-sm text-blue-900"
                    title={a.isCorresponding ? "Corresponding author" : ""}
                  >
                    {a.name}
                    {a.isCorresponding && (
                      <span className="text-xs font-semibold text-blue-700">(corresponding)</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setCorresponding(a.name)}
                      className="text-xs rounded-full border border-blue-200 px-2 py-0.5 hover:bg-blue-100"
                      title="Set as corresponding"
                    >
                      Set
                    </button>
                    <button
                      type="button"
                      onClick={() => removeAuthor(a.name)}
                      className="text-blue-700 hover:text-blue-900 font-bold"
                      aria-label={`Remove ${a.name}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="relative isolate">
                <input
                  ref={authorInputRef}
                  className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Type a name/email and press Enter to add"
                  value={authorQuery}
                  onChange={(e) => {
                    setAuthorQuery(e.target.value);
                    setAuthorOpen(true);
                  }}
                  onFocus={() => setAuthorOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addFromInput();
                    }
                    if (e.key === "Escape") setAuthorOpen(false);
                  }}
                />

                {authorOpen && authorSuggestions.length > 0 && (
                  <div className="absolute left-0 top-full z-[9999] mt-2 w-full rounded-2xl border border-slate-200 bg-white shadow-lg">
                    

                    {authorSuggestions.map((u) => (
                      <button
                        key={u._id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          addAuthor(u.name || u.email);
                          setAuthorQuery("");
                          setAuthorSuggestions([]);
                          setAuthorOpen(false);
                          setTimeout(() => authorInputRef.current?.focus(), 0);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50"
                      >
                        <div className="font-semibold text-slate-900">{u.name || "No name"}</div>
                        <div className="text-xs text-slate-600">{u.email}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="submit"
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 font-semibold shadow-md transition"
              >
                {editingId ? "Save changes" : "Create paper"}
              </button>

              {editingId && (
                <>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 px-5 py-2.5 font-semibold shadow-sm transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => softDelete(editingId)}
                    className="rounded-xl bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 font-semibold shadow-sm transition"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </form>
        </section>

        {/* LIST */}
        <section className="mt-6 rounded-3xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/40 p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-slate-900">Papers</h2>
            </div>

            {/* Search + Export XLSX */}
            <div className="flex w-full sm:w-auto gap-2">
              <input
                className="w-full sm:w-96 rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Search by title, author, journal, status…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button
                type="button"
                onClick={() => exportXLSX(filteredPapers)}
                className="whitespace-nowrap rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 font-semibold shadow-md transition"
              >
                Export XLSX
              </button>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-700">
                  <th className="px-5 py-3 font-semibold">Title</th>
                  <th className="px-5 py-3 font-semibold">Corresponding</th>
                  <th className="px-5 py-3 font-semibold">Authors</th>
                  <th className="px-5 py-3 font-semibold">Journals</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Last Updated</th>
                  <th className="px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {filteredPapers.map((p) => {
                  const last = getLastJournalEntry(p);
                  const status = p.currentStatus || last?.status || "—";
                  const lastUpdated = last?.last_updated
                    ? new Date(last.last_updated).toLocaleString()
                    : "—";
                  const journalNames = (p.journalHistory || [])
                    .map(getJournalName)
                    .filter(Boolean);

                  const authorObjs = Array.isArray(p.authors) ? p.authors : [];
                  const corresponding =
                    authorObjs.find((a) => a?.isCorresponding)?.name || "—";
                  const allAuthors =
                    authorObjs.map((a) => a?.name).filter(Boolean).join(", ") || "—";

                  return (
                    <tr key={p._id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">{p.title}</div>

                        {p.url ? (
                          <div className="mt-1 text-xs">
                            <a
                              className="text-blue-700 hover:underline"
                              href={p.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open URL
                            </a>
                          </div>
                        ) : (
                          <div className="mt-1 text-xs text-slate-500">URL: —</div>
                        )}
                      </td>

                      <td className="px-5 py-4 text-slate-800">{corresponding}</td>
                      <td className="px-5 py-4 text-slate-800">{allAuthors}</td>

                      <td className="px-5 py-4 text-slate-800">
                        {journalNames.length ? journalNames.join(" → ") : "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-blue-800 font-semibold">
                          {status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-700">{lastUpdated}</td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => startEdit(p)}
                            className="rounded-lg bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1.5 font-semibold text-slate-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => softDelete(p._id)}
                            className="rounded-lg bg-red-600 hover:bg-red-700 px-3 py-1.5 font-semibold text-white"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!filteredPapers.length && (
                  <tr>
                    <td colSpan="7" className="px-5 py-10 text-center text-slate-600">
                      No papers match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <p className="mt-8 text-center text-xs text-slate-600">
          Built with React, Next.js, MongoDB, and Tailwind CSS
        </p>
      </div>
    </main>
  );
}
