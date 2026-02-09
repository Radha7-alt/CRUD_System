import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

const STATUSES = ["submitted", "under_review", "revision_submitted", "rejected", "accepted"];

function statusClasses(status) {
  if (status === "accepted") return "bg-green-100 text-green-800";
  if (status === "rejected") return "bg-red-100 text-red-800";
  if (status === "under_review") return "bg-amber-100 text-amber-800";
  if (status === "revision_submitted") return "bg-purple-100 text-purple-800";
  return "bg-blue-100 text-blue-800";
}

function getLastEntry(p) {
  const hist = Array.isArray(p.journalHistory) ? p.journalHistory : [];
  return hist.length ? hist[hist.length - 1] : null;
}

function getJournalName(entry) {
  if (!entry) return "—";
  if (entry.journalId && typeof entry.journalId === "object" && entry.journalId.name) return entry.journalId.name;
  return entry.journalTitle || "—";
}

export default function AdminPapersPage() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [papers, setPapers] = useState([]);
  const [journals, setJournals] = useState([]);

  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [msg, setMsg] = useState("");

  // For "add new journal submission" row controls
  const [newJournalForPaper, setNewJournalForPaper] = useState({}); // { [paperId]: journalId }

  async function loadMe() {
    const res = await fetch("/api/auth/me");
    if (res.status === 401) return router.push("/login");
    const data = await res.json();
    if (data.role !== "admin") return router.push("/papers");
    setMe(data);
  }

  async function loadJournals() {
    const res = await fetch("/api/journals");
    const data = await res.json();
    setJournals(Array.isArray(data) ? data : []);
  }

  async function loadPapers(deleted = includeDeleted) {
    setMsg("");
    const url = deleted ? "/api/papers?deleted=1" : "/api/papers";
    const res = await fetch(url);
    const data = await res.json();
    setPapers(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    (async () => {
      await loadMe();
      await loadJournals();
      await loadPapers(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateLatestStatus(paperId, status) {
    setMsg("");

    const res = await fetch(`/api/papers/${paperId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    const data = await res.json();
    if (!res.ok) {
      setMsg(data.message || "Status update failed");
      return;
    }

    setMsg("Status updated.");
    await loadPapers(includeDeleted);
  }

  async function addNewJournalSubmission(paperId) {
    setMsg("");
    const journalId = newJournalForPaper[paperId];

    if (!journalId) {
      setMsg("Pick a journal for the new submission first.");
      return;
    }

    const res = await fetch(`/api/papers/${paperId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        addNewJournal: true,
        journalId,
        // journalTitle optional; backend stores blank; GET populates name anyway
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setMsg(data.message || "Failed to add new submission");
      return;
    }

    setMsg("New journal submission added.");
    setNewJournalForPaper((prev) => ({ ...prev, [paperId]: "" }));
    await loadPapers(includeDeleted);
  }

  async function logout() {
    await fetch("/api/auth/logout");
    router.push("/login");
  }

  async function restorePaper(id) {
    if (!confirm("Restore this paper?")) return;

    const res = await fetch(`/api/papers/${id}/restore`, { method: "POST" });
    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Restore failed");
      return;
    }

    await loadPapers(includeDeleted);
  }

  const total = useMemo(() => papers.length, [papers]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-300 p-6">
      <div className="mx-auto w-full max-w-6xl">
        <header className="rounded-3xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/40 px-8 py-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Admin: Paper Statuses</h1>
              {me ? (
                <p className="mt-1 text-slate-600">
                  Logged in as <span className="font-semibold text-slate-900">{me.email}</span>
                </p>
              ) : (
                <p className="mt-1 text-slate-600">Loading admin…</p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push("/papers")}
                className="rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 px-5 py-2.5 font-semibold shadow-sm transition"
              >
                Back to Papers
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="inline-flex items-center gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 accent-blue-600"
                checked={includeDeleted}
                onChange={async (e) => {
                  const checked = e.target.checked;
                  setIncludeDeleted(checked);
                  await loadPapers(checked);
                }}
              />
              Show deleted papers too
            </label>

            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">
                Total: <span className="font-semibold text-slate-900">{total}</span>
              </span>
              {msg && (
                <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-sm text-blue-800">
                  {msg}
                </span>
              )}
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
                {papers.map((p) => {
                  const last = getLastEntry(p);
                  const latestStatus = p.currentStatus || last?.status || "—";
                  const latestJournal = getJournalName(last);

                  const submitted = last?.date_submitted ? new Date(last.date_submitted).toLocaleDateString() : "—";
                  const updated = last?.last_updated ? new Date(last.last_updated).toLocaleDateString() : "—";

                  const authorsText = (p.authors || [])
                    .map((a) => (a?.isCorresponding ? `${a.name}*` : a?.name))
                    .filter(Boolean)
                    .join(", ");

                  return (
                    <tr key={p._id} className="hover:bg-slate-50 align-top">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">{p.title}</div>
                        <div className="mt-1 text-xs text-slate-600">
                          Authors: {authorsText || "—"} {authorsText ? <span className="ml-1">( * corresponding )</span> : null}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-800">{p.createdBy?.email || "—"}</td>

                      <td className="px-5 py-4 text-slate-800">{latestJournal}</td>

                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 font-semibold ${statusClasses(latestStatus)}`}>
                          {latestStatus}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        <div className="text-xs">
                          <div><span className="font-semibold">submitted:</span> {submitted}</div>
                          <div><span className="font-semibold">updated:</span> {updated}</div>
                        </div>

                        <div className="mt-2">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 font-semibold ${
                              p.is_deleted ? "bg-slate-200 text-slate-700" : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {p.is_deleted ? "deleted" : "active"}
                          </span>

                          {p.is_deleted && (
                            <button
                              onClick={() => restorePaper(p._id)}
                              className="ml-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-semibold shadow-sm transition"
                            >
                              Restore
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-2">
                          {/* Update latest status */}
                          <select
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
                            value={latestStatus}
                            onChange={(e) => updateLatestStatus(p._id, e.target.value)}
                            disabled={p.is_deleted}
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>

                          {/* Add new journal submission (after rejection, or anytime) */}
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <div className="text-xs font-semibold text-slate-700">Add new journal submission</div>
                            <div className="mt-2 flex gap-2">
                              <select
                                className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
                                value={newJournalForPaper[p._id] || ""}
                                onChange={(e) =>
                                  setNewJournalForPaper((prev) => ({ ...prev, [p._id]: e.target.value }))
                                }
                                disabled={p.is_deleted}
                              >
                                <option value="">Select journal…</option>
                                {journals.map((j) => (
                                  <option key={j._id} value={j._id}>
                                    {j.name}
                                  </option>
                                ))}
                              </select>

                              <button
                                onClick={() => addNewJournalSubmission(p._id)}
                                disabled={p.is_deleted}
                                className="rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 font-semibold shadow-sm transition"
                                title={
                                  latestStatus !== "rejected"
                                    ? "You can add a new submission anytime, but typically after rejection."
                                    : ""
                                }
                              >
                                Add
                              </button>
                            </div>

                            {latestStatus !== "rejected" && (
                              <div className="mt-2 text-[11px] text-slate-600">
                                Tip: usually used after status becomes <b>rejected</b>.
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!papers.length && (
                  <tr>
                    <td colSpan="6" className="px-5 py-10 text-center text-slate-600">
                      No papers.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-slate-600">
            Status dropdown updates the <b>latest journal entry</b>. “Add new journal submission” pushes a new entry with
            status <b>submitted</b>.
          </p>
        </section>

        <p className="mt-8 text-center text-xs text-slate-600">Built with React, Next.js, MongoDB, and Tailwind CSS</p>
      </div>
    </main>
  );
}
