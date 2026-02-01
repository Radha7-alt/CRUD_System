import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function PapersPage() {
  const router = useRouter();

  const [me, setMe] = useState(null);
  const [journals, setJournals] = useState([]);
  const [papers, setPapers] = useState([]);

  const [form, setForm] = useState({
    title: "",
    authors: "",
    journalId: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState("");

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
    setJournals(data);
    if (data.length && !form.journalId) {
      setForm((f) => ({ ...f, journalId: data[0]._id }));
    }
  }

  async function loadPapers() {
    const res = await fetch("/api/papers");
    const data = await res.json();
    setPapers(data);
  }

  useEffect(() => {
    (async () => {
      await loadMe();
      await loadJournals();
      await loadPapers();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitPaper(e) {
    e.preventDefault();
    setMsg("");

    const payload = {
      title: form.title,
      journalId: form.journalId,
      authors: form.authors,
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
    setForm({ title: "", authors: "", journalId: journals[0]?._id || "" });
    setEditingId(null);
    await loadPapers();
  }

  function startEdit(p) {
    setEditingId(p._id);
    setForm({
      title: p.title,
      authors: (p.authors || []).join(", "),
      journalId: p.journalId?._id || p.journalId,
    });
    setMsg("");
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
    await loadPapers();
  }

  async function logout() {
    await fetch("/api/auth/logout");
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-300 p-6">
      <div className="mx-auto w-full max-w-6xl">
        <header className="rounded-3xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/40 px-8 py-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Papers</h1>
              {me ? (
                <p className="mt-1 text-slate-600">
                  Logged in as <span className="font-semibold text-slate-900">{me.name}</span>{" "}
                  — role{" "}
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
                Title and journal are required. Authors can be comma-separated.
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
                <label className="text-sm font-medium text-slate-700">Journal</label>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={form.journalId}
                  onChange={(e) => setForm({ ...form, journalId: e.target.value })}
                  required
                >
                  {journals.map((j) => (
                    <option key={j._id} value={j._id}>
                      {j.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Authors</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Radha Yadav, Monzurul, Gaurab"
                value={form.authors}
                onChange={(e) => setForm({ ...form, authors: e.target.value })}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 font-semibold shadow-md transition"
              >
                {editingId ? "Save changes" : "Create paper"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm({ title: "", authors: "", journalId: journals[0]?._id || "" });
                    setMsg("");
                  }}
                  className="rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 px-5 py-3 font-semibold shadow-sm transition"
                >
                  Cancel
                </button>
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
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-slate-900">Your papers</h2>
            <div className="text-sm text-slate-600">
              Total: <span className="font-semibold text-slate-900">{papers.length}</span>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-700">
                  <th className="px-5 py-3 font-semibold">Title</th>
                  <th className="px-5 py-3 font-semibold">Journal</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Last Updated</th>
                  <th className="px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {papers.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{p.title}</div>
                      <div className="mt-1 text-xs text-slate-600">
                        Authors: {(p.authors || []).join(", ") || "—"}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-800">{p.journalId?.name || "—"}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-blue-800 font-semibold">
                        {p.current_status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      {new Date(p.date_lastupdated).toLocaleString()}
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
                ))}

                {!papers.length && (
                  <tr>
                    <td colSpan="5" className="px-5 py-10 text-center text-slate-600">
                      No papers yet. Create your first submission above.
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
                  <p className="text-sm text-blue-800">
                    Manage statuses, journals, and users.
                  </p>
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
