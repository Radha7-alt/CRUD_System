 import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-300 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl rounded-3xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/40 px-10 py-12">
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-slate-900 drop-shadow-sm">
            Paper Management System
          </h1>
          <p className="mt-2 text-slate-600 text-lg">
            Manage your research papers with ease.
          </p>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <Link
            href="/register"
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-3 text-center text-lg font-semibold shadow-md transition"
          >
            Register
          </Link>

          <Link
            href="/login"
            className="rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 py-3 text-center text-lg font-semibold shadow-sm transition"
          >
            Login
          </Link>
        </div>

        {/* Info box */}
        <div className="rounded-2xl bg-blue-50 p-6 border border-blue-100 shadow-inner">
          <h2 className="text-xl font-semibold text-blue-900 mb-3">
            What you can do
          </h2>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li>• Submit papers with title, authors, and journal</li>
            <li>• Update your submissions</li>
            <li>• Admins can manage journals and paper statuses</li>
          </ul>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-8">
          Built with React, Next.js, MongoDB, and Tailwind CSS
        </p>
      </div>
    </main>
  );
}
