 import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-300 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl rounded-3xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/40 px-10 py-12">
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-slate-900 drop-shadow-sm">
            DocuSwift
          </h1>
          <p className="mt-2 text-slate-600 text-lg">
            Manage your research papers with ease.
          </p>
        </div>

        {/* Buttons - Modified for Requirement 1 */}
        <div className="flex justify-center mb-10">
          <Link
            href="/login"
            className="w-full sm:w-64 rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-4 text-center text-xl font-semibold shadow-lg transition transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Login to Portal
          </Link>
        </div>

        {/* Info box */}
        <div className="rounded-2xl bg-blue-50 p-6 border border-blue-100 shadow-inner">
          <h2 className="text-xl font-semibold text-blue-900 mb-3">
            Internal Lab System
          </h2>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li>• Submit papers with title, authors, and journal</li>
            <li>• Track full submission cycles and history</li>
            <li>• Admins manage all user accounts and roles</li>
            <li className="font-semibold mt-2 underline">Note: Registration is disabled. Contact an administrator for access.</li>
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