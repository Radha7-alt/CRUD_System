import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [orcid, setOrcid] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, orcid, address, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      setMsg(data.message || "Registration failed");
      return;
    }

    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-300 flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-3xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/40 px-8 py-10">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">Create account</h1>
          <p className="mt-2 text-slate-600">Register to submit and manage papers.</p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Name</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Radha Kumari Yadav"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="you@txstate.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">ORCID (optional)</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="0000-0000-0000-0000"
                value={orcid}
                onChange={(e) => setOrcid(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Address (optional)</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="San Marcos, TX"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Minimum 6 characters"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-3 text-center text-base font-semibold shadow-md transition"
          >
            Create account
          </button>

          {msg && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {msg}
            </div>
          )}
        </form>

        <div className="mt-6 flex items-center justify-between text-sm">
          <Link href="/" className="text-slate-600 hover:text-slate-900">
            ← Back
          </Link>
          <Link href="/login" className="text-blue-700 hover:text-blue-900 font-medium">
            Already have an account?
          </Link>
        </div>
      </div>
    </main>
  );
}
