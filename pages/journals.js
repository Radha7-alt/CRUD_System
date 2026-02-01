import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function JournalsPage() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [journals, setJournals] = useState([]);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");

  async function loadMe() {
    const res = await fetch("/api/auth/me");
    if (res.status === 401) return router.push("/login");
    const data = await res.json();
    if (data.role !== "admin") return router.push("/dashboard");
    setMe(data);
  }

  async function loadJournals() {
    const res = await fetch("/api/journals");
    const data = await res.json();
    setJournals(data);
  }

  useEffect(() => {
    (async () => {
      await loadMe();
      await loadJournals();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addJournal(e) {
    e.preventDefault();
    setMsg("");

    const res = await fetch("/api/journals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    const data = await res.json();
    if (!res.ok) {
      setMsg(data.message || "Create failed");
      return;
    }

    setName("");
    setMsg("Journal created!");
    await loadJournals();
  }

  async function renameJournal(j) {
    const newName = prompt("New journal name:", j.name);
    if (!newName) return;

    const res = await fetch(`/api/journals/${j._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.message || "Update failed");
      return;
    }
    await loadJournals();
  }

  async function deleteJournal(j) {
    if (!confirm(`Delete journal "${j.name}"?`)) return;

    const res = await fetch(`/api/journals/${j._id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.message || "Delete failed");
      return;
    }
    await loadJournals();
  }

  async function logout() {
    await fetch("/api/auth/logout");
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-300 p-6">
      <div className="mx-auto w-full max-w-5xl">
        <header className="rounded-3xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/40 px-8 py-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Admin: Journals</h1>
              {me ? (
                <p className="mt-1 text-slate-600">
                  Logged in as{" "}
                  <span className="font-semibold text-slate-900">{me.email}</span>
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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Add journal</h2>
              <p className="mt-1 text-sm text-slate-600">
                Add journals that users can select when submitting papers.
              </p>
            </div>

            <span className="text-sm text-slate-600">
              Total:{" "}
              <span className="font-semibold text-slate-900">{journals.length}</span>
            </span>
          </div>

          <form onSubmit={addJournal} className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Journal name (e.g., IEEE Access)"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="submit"
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 font-semibold shadow-md transition"
            >
              Add
            </button>
          </form>

          {msg && (
            <div className="mt-4 rounded-2xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
              {msg}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-3xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/40 p-7">
          <h2 className="text-xl font-semibold text-slate-900">Journals list</h2>
          <p className="mt-1 text-sm text-slate-600">
            Rename or delete journals. Deleting may affect existing papers that reference it.
          </p>

          <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-700">
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {journals.map((j) => (
                  <tr key={j._id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-semibold text-slate-900">{j.name}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => renameJournal(j)}
                          className="rounded-lg bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1.5 font-semibold text-slate-800"
                        >
                          Rename
                        </button>
                        <button
                          onClick={() => deleteJournal(j)}
                          className="rounded-lg bg-red-600 hover:bg-red-700 px-3 py-1.5 font-semibold text-white"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!journals.length && (
                  <tr>
                    <td colSpan="2" className="px-5 py-10 text-center text-slate-600">
                      No journals yet. Add your first journal above.
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
