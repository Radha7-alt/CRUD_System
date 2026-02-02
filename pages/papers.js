import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";

export default function PapersPage() {
  const router = useRouter();

  const [me, setMe] = useState(null);
  const [journals, setJournals] = useState([]);
  const [papers, setPapers] = useState([]);

  const [form, setForm] = useState({
    title: "",
    journalIds: [],
  });

  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState("");

  const [search, setSearch] = useState("");

  const [authorsList, setAuthorsList] = useState([]);
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
    setJournals(Array.isArray(data) ? data : []);
    setForm((f) => {
      const first = data?.[0]?._id || "";
      const hasAny = Array.isArray(f.journalIds) && f.journalIds.length > 0;
      return {
        ...f,
        journalIds: hasAny ? f.journalIds : first ? [first] : [],
      };
    });
  }

  async function loadPapers() {
    const res = await fetch("/api/papers");
    const data = await res.json();
    setPapers(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    (async () => {
      await loadMe();
      await loadJournals();
      await loadPapers();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      if (!ignore) {
        setAuthorSuggestions(Array.isArray(data) ? data : []);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [authorQuery]);

  useEffect(() => {
    function onDocMouseDown(e) {
      if (!authorWrapRef.current) return;
      if (!authorWrapRef.current.contains(e.target)) {
        setAuthorOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  function addAuthor(name) {
    const clean = (name || "").trim();
    if (!clean) return;
    if (authorsList.some((a) => a.toLowerCase() === clean.toLowerCase())) return;
    setAuthorsList((prev) => [...prev, clean]);
  }

  function removeAuthor(name) {
    setAuthorsList((prev) => prev.filter((a) => a !== name));
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

  async function submitPaper(e) {
    e.preventDefault();
    setMsg("");

    const payload = {
      title: form.title,
      journalIds: form.journalIds,
      authors: authorsList,
    };

    const url = editingId ? `/api/papers/${editingId}` : "/api/papers";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
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
    const first = journals?.[0]?._id || "";
    setForm({ title: "", journalIds: first ? [first] : [] });
    setAuthorsList([]);
    setAuthorQuery("");
    setAuthorSuggestions([]);
    setAuthorOpen(false);
    setEditingId(null);
    await loadPapers();
  }

  function startEdit(p) {
    setEditingId(p._id);

    const ids =
      Array.isArray(p.journalIds) && p.journalIds.length
        ? p.journalIds.map((j) => (typeof j === "string" ? j : j?._id)).filter(Boolean)
        : [];

    setForm({
      title: p.title || "",
      journalIds: ids.length ? ids : journals?.[0]?._id ? [journals[0]._id] : [],
    });

    setAuthorsList(p.authors || []);
    setMsg("");
    setAuthorQuery("");
    setAuthorSuggestions([]);
    setAuthorOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function softDelete(id) {
    if (!confirm("Soft delete this paper?")) return;

    const res = await fetch(`/api/papers/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.message || "Delete failed");
      return;
    }

    if (editingId === id) {
      const first = journals?.[0]?._id || "";
      setEditingId(null);
      setForm({ title: "", journalIds: first ? [first] : [] });
      setAuthorsList([]);
      setAuthorQuery("");
      setAuthorSuggestions([]);
      setAuthorOpen(false);
    }

    await loadPapers();
  }

  async function logout() {
    await fetch("/api/auth/logout");
    router.push("/login");
  }

  const filteredPapers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return papers;

    return papers.filter((p) => {
      const title = (p.title || "").toLowerCase();
      const authors = (p.authors || []).join(", ").toLowerCase();
      const journalsText = (p.journalIds || [])
        .map((j) => (typeof j === "string" ? j : j?.name || ""))
        .join(", ")
        .toLowerCase();
      const status = (p.current_status || "").toLowerCase();

      return title.includes(q) || authors.includes(q) || journalsText.includes(q) || status.includes(q);
    });
  }, [papers, search]);

  function csvEscape(v) {
    const s = String(v ?? "");
    if (s.includes('"') || s.includes(",") || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }

  function exportCSV(rows) {
    const header = ["Title", "Authors", "Journals", "Status", "Last Updated"];
    const lines = [
      header.join(","),
      ...rows.map((p) => {
        const journalNames = (p.journalIds || [])
          .map((j) => (typeof j === "string" ? j : j?.name))
          .filter(Boolean)
          .join("; ");


        const row = [
          csvEscape(p.title),
          csvEscape((p.authors || []).join("; ")),
          csvEscape(journalNames),
          csvEscape(p.current_status || ""),
          csvEscape(p.date_lastupdated ? new Date(p.date_lastupdated).toISOString() : ""),
        ];
        return row.join(",");
      }),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `papers_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  }

  const selectedJournalNames = useMemo(() => {
    const map = new Map(journals.map((j) => [String(j._id), j.name]));
    return (form.journalIds || []).map((id) => map.get(String(id)) || id);
  }, [form.journalIds, journals]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-300 p-6">
      <div className="mx-auto w-full max-w-6xl">
        <header className="rounded-3xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/40 px-8 py-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Papers</h1>
              {me ? (
                <p className="mt-1 text-slate-600">
                  Logged in as <span className="font-semibold text-slate-900">{me.name}</span> — role{" "}
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-blue-800 font-semibold">
                    {me.role}
                  </span>
                </p>
              ) : (
                <p className="mt-1 text-slate-600">Loading your account…</p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push("/dashboard")}
                className="rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 px-5 py-2.5 font-semibold shadow-sm transition"
              >
                Dashboard
              </button>

              <button
                onClick={logout}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 font-semibold shadow-md transition"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <section className="mt-6 rounded-3xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/40 p-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {editingId ? "Update paper" : "Add paper"}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Title and at least one journal are required. Authors can be selected from users or typed manually.
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
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Journals</label>
                <select
                  multiple
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 h-40"
                  value={form.journalIds}
                  onChange={(e) => {
                    const vals = Array.from(e.target.selectedOptions, (opt) => opt.value);
                    setForm({ ...form, journalIds: vals });
                  }}
                  required
                >
                  {journals.map((j) => (
                    <option key={j._id} value={j._id}>
                      {j.name}
                    </option>
                  ))}
                </select>

                {!!selectedJournalNames.length && (
                  <div className="mt-2 text-xs text-slate-600">
                    Selected: <span className="font-semibold text-slate-800">{selectedJournalNames.join(", ")}</span>
                  </div>
                )}

                <div className="mt-2 text-xs text-slate-600">
                  Hold <span className="font-semibold">Ctrl</span> (Windows) / <span className="font-semibold">Cmd</span>{" "}
                  (Mac) to select multiple journals.
                </div>
              </div>
            </div>

            <div className="relative" ref={authorWrapRef}>
              <label className="text-sm font-medium text-slate-700">Authors</label>

              <div className="mt-2 flex flex-wrap gap-2">
                {authorsList.map((a) => (
                  <span
                    key={a}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-sm text-blue-900"
                  >
                    {a}
                    <button
                      type="button"
                      onClick={() => removeAuthor(a)}
                      className="text-blue-700 hover:text-blue-900 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="relative">
                <input
                  ref={authorInputRef}
                  className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Type a name/email and press Enter to add (supports non-users too)"
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
                    if (e.key === "Escape") {
                      setAuthorOpen(false);
                    }
                  }}
                />

                {authorOpen && authorSuggestions.length > 0 && (
                  <div className="absolute z-10 mt-2 w-full rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
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
                    onClick={() => {
                      setEditingId(null);
                      const first = journals?.[0]?._id || "";
                      setForm({ title: "", journalIds: first ? [first] : [] });
                      setAuthorsList([]);
                      setAuthorQuery("");
                      setAuthorSuggestions([]);
                      setAuthorOpen(false);
                    }}
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

            {msg && (
              <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
                {msg}
              </div>
            )}
          </form>
        </section>

        <section className="mt-6 rounded-3xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/40 p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-slate-900">Your papers</h2>
              <div className="text-sm text-slate-600">
                Showing: <span className="font-semibold text-slate-900">{filteredPapers.length}</span> /{" "}
                <span className="font-semibold text-slate-900">{papers.length}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                className="w-full sm:w-96 rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Search by title, author, journal, status…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <button
                type="button"
                onClick={() => exportCSV(filteredPapers)}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 font-semibold shadow-md transition"
              >
                Export CSV
              </button>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-700">
                  <th className="px-5 py-3 font-semibold">Title</th>
                  <th className="px-5 py-3 font-semibold">Journals</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Last Updated</th>
                  <th className="px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {filteredPapers.map((p) => {
                  const names = (p.journalIds || [])
                    .map((j) => (typeof j === "string" ? "" : j?.name || ""))
                    .filter(Boolean);
                  return (
                    <tr key={p._id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">{p.title}</div>
                        <div className="mt-1 text-xs text-slate-600">
                          Authors: {(p.authors || []).join(", ") || "—"}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-800">{names.length ? names.join(", ") : "—"}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-blue-800 font-semibold">
                          {p.current_status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {p.date_lastupdated ? new Date(p.date_lastupdated).toLocaleString() : "—"}
                      </td>
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
                    <td colSpan="5" className="px-5 py-10 text-center text-slate-600">
                      No papers match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {me?.role === "admin" && (
            <div className="mt-6 rounded-2xl bg-blue-50 border border-blue-100 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900">Admin tools</h3>
                  <p className="text-sm text-blue-800">Manage statuses, journals, and users.</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => router.push("/admin/papers")}
                    className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 font-semibold shadow-md transition"
                  >
                    Paper Statuses
                  </button>
                  <button
                    onClick={() => router.push("/journals")}
                    className="rounded-xl bg-white hover:bg-blue-100 border border-blue-200 text-blue-900 px-5 py-2.5 font-semibold shadow-sm transition"
                  >
                    Journals
                  </button>
                  <button
                    onClick={() => router.push("/admin/users")}
                    className="rounded-xl bg-white hover:bg-blue-100 border border-blue-200 text-blue-900 px-5 py-2.5 font-semibold shadow-sm transition"
                  >
                    Users
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        <p className="mt-8 text-center text-xs text-slate-600">
          Built with React, Next.js, MongoDB, and Tailwind CSS
        </p>
      </div>
    </main>
  );
}
