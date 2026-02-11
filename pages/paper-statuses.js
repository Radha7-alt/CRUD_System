import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

const STATUS_OPTIONS = [
  { value: "submitted", label: "submitted" },
  { value: "under_review", label: "under_review" },
  { value: "revision_submitted", label: "revision_submitted" },
  { value: "rejected", label: "rejected" },
  { value: "accepted", label: "accepted" },
];

export default function PaperStatusesPage() {
  const router = useRouter();

  const [me, setMe] = useState(null);
  const [papers, setPapers] = useState([]);
  const [journals, setJournals] = useState([]);
  const [msg, setMsg] = useState("");
  const [search, setSearch] = useState("");

  // show deleted toggle
  const [showDeleted, setShowDeleted] = useState(false);

  // per-row journal select
  const [addJournalChoice, setAddJournalChoice] = useState({}); // {paperId: journalId}
  const [loadingId, setLoadingId] = useState("");

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

  async function loadPapers(includeDeleted = showDeleted) {
    const url = includeDeleted ? "/api/papers?deleted=1" : "/api/papers";
    const res = await fetch(url);
    const data = await res.json();
    setPapers(Array.isArray(data) ? data : []);
  }

  async function loadJournals() {
    const res = await fetch("/api/journals");
    const data = await res.json();
    setJournals(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    (async () => {
      const u = await loadMe();
      if (!u) return;
      await loadJournals();
      await loadPapers(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getLastJournalEntry(p) {
    const hist = Array.isArray(p.journalHistory) ? p.journalHistory : [];
    return hist.length ? hist[hist.length - 1] : null;
  }

  function getJournalName(entry) {
    if (!entry) return "—";
    if (entry.journalId && typeof entry.journalId === "object" && entry.journalId.name) return entry.journalId.name;
    return entry.journalTitle || "—";
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return papers;

    return papers.filter((p) => {
      const title = String(p.title || "").toLowerCase();
      const owner = String(p?.createdBy?.email || "").toLowerCase();
      const authors = (p.authors || []).map((a) => a?.name || "").join(", ").toLowerCase();
      const journalsText = (p.journalHistory || []).map(getJournalName).join(", ").toLowerCase();
      const st = String(p.currentStatus || getLastJournalEntry(p)?.status || "").toLowerCase();
      return title.includes(q) || owner.includes(q) || authors.includes(q) || journalsText.includes(q) || st.includes(q);
    });
  }, [papers, search]);

  async function updateStatus(paperId, newStatus) {
    setMsg("");
    setLoadingId(paperId);
    try {
      const res = await fetch(`/api/papers/${paperId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.message || "Failed to update status");
        return;
      }
      await loadPapers(showDeleted);
    } finally {
      setLoadingId("");
    }
  }

  async function addJournal(paperId) {
    setMsg("");
    const journalId = addJournalChoice[paperId];
    if (!journalId) {
      setMsg("Please select a journal first.");
      return;
    }

    setLoadingId(paperId);
    try {
      const res = await fetch(`/api/papers/${paperId}/add-journal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ journalId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.message || "Failed to add journal");
        return;
      }
      setAddJournalChoice((prev) => ({ ...prev, [paperId]: "" }));
      await loadPapers(showDeleted);
    } finally {
      setLoadingId("");
    }
  }

  // restore
  async function restorePaper(paperId) {
    setMsg("");
    setLoadingId(paperId);
    try {
      const res = await fetch(`/api/papers/${paperId}/restore`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.message || "Failed to restore paper");
        return;
      }
      await loadPapers(showDeleted);
    } finally {
      setLoadingId("");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-300 p-6">
      <div className="mx-auto w-full max-w-6xl">
        <div className="rounded-3xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/40 px-8 py-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Paper Status</h1>
              <p className="mt-1 text-slate-600">{me ? `Logged in as ${me.email || me.name}` : "Loading…"}</p>
            </div>

            <div className="flex items-center gap-3">
              {/* show deleted toggle */}
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-blue-600"
                  checked={showDeleted}
                  onChange={async (e) => {
                    const checked = e.target.checked;
                    setShowDeleted(checked);
                    await loadPapers(checked);
                  }}
                />
                Show deleted
              </label>

              <input
                className="w-80 rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Search by title, author, journal, owner, status…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {msg && (
          <div className="mt-4 rounded-2xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">{msg}</div>
        )}

        <section className="mt-6 rounded-3xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/40 p-7">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Papers</h2>
            <div className="text-sm text-slate-600">
              Total: <span className="font-semibold text-slate-900">{filtered.length}</span>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-700">
                  <th className="px-5 py-3 font-semibold">Title</th>
                  <th className="px-5 py-3 font-semibold">Owner</th>
                  <th className="px-5 py-3 font-semibold">Latest Journal</th>
                  <th className="px-5 py-3 font-semibold">Latest Status</th>
                  <th className="px-5 py-3 font-semibold">Dates</th>
                  <th className="px-5 py-3 font-semibold">Update</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {filtered.map((p) => {
                  const last = getLastJournalEntry(p);
                  const latestJournal = getJournalName(last);
                  const latestStatus = String(p.currentStatus || last?.status || "submitted");
                  const submitted = last?.date_submitted ? new Date(last.date_submitted).toLocaleDateString() : "—";
                  const updated = last?.last_updated ? new Date(last.last_updated).toLocaleDateString() : "—";

                  const corresponding = (p.authors || []).find((a) => a?.isCorresponding)?.name || "";
                  const authorsText = (p.authors || []).map((a) => a?.name).filter(Boolean).join(", ") || "—";

                  const isArchived = !!p.is_deleted;

                  return (
                    <tr key={p._id} className="hover:bg-slate-50 align-top">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          <span>{p.title}</span>
                          
                          {isArchived && (
                            <span className="inline-flex items-center rounded-full bg-slate-200 px-3 py-1 text-slate-700 text-xs font-semibold">
                              Archived
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-slate-600">
                          Authors: {authorsText}
                          {corresponding ? ` (corresponding: ${corresponding})` : ""}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-800">{p?.createdBy?.email || p?.createdBy?.name || "—"}</td>

                      <td className="px-5 py-4 text-slate-800">{latestJournal}</td>

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-blue-800 font-semibold">
                          {latestStatus}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        <div>
                          <b>submitted:</b> {submitted}
                        </div>
                        <div>
                          <b>updated:</b> {updated}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="grid gap-2">
                          {/* status dropdown */}
                          <select
                            className="w-56 rounded-xl border border-slate-300 bg-white px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
                            value={latestStatus}
                            disabled={loadingId === p._id || isArchived}
                            onChange={(e) => updateStatus(p._id, e.target.value)}
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>

                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                            <div className="font-semibold text-slate-900 mb-2">Add new journal submission</div>
                            <div className="flex gap-2">
                              <select
                                className="w-44 rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none disabled:opacity-50"
                                value={addJournalChoice[p._id] || ""}
                                onChange={(e) =>
                                  setAddJournalChoice((prev) => ({ ...prev, [p._id]: e.target.value }))
                                }
                                disabled={loadingId === p._id || isArchived}
                              >
                                <option value="">Select journal…</option>
                                {journals.map((j) => (
                                  <option key={j._id} value={j._id}>
                                    {j.name}
                                  </option>
                                ))}
                              </select>

                              <button
                                onClick={() => addJournal(p._id)}
                                disabled={loadingId === p._id || isArchived}
                                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 font-semibold shadow-sm transition disabled:opacity-50"
                              >
                                Add
                              </button>
                            </div>
                            <div className="mt-2 text-xs text-slate-600">
                              Tip: usually used after status becomes <b>rejected</b>.
                            </div>
                          </div>

                          {/* restore button only when archived */}
                          {isArchived && (
                            <button
                              onClick={() => restorePaper(p._id)}
                              disabled={loadingId === p._id}
                              className="w-56 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 font-semibold shadow-sm transition disabled:opacity-50"
                            >
                              Restore
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!filtered.length && (
                  <tr>
                    <td colSpan="6" className="px-5 py-10 text-center text-slate-600">
                      No papers match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
