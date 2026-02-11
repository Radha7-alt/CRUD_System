import dbConnect from "../../../../lib/mongodb";
import Paper from "../../../../models/Paper";
import Journal from "../../../../models/Journal";
import User from "../../../../models/User";
import Log from "../../../../models/Log";
import { requireAuth } from "../../../../lib/requireAuth";

function sameText(a, b) {
  return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
}

function normalizeAuthors(authors) {
  if (Array.isArray(authors)) {
    return authors
      .map((a) => {
        if (typeof a === "string") return { name: a.trim(), isCorresponding: false };
        return { name: String(a?.name || "").trim(), isCorresponding: !!a?.isCorresponding };
      })
      .filter((a) => a.name);
  }

  const str = String(authors || "").trim();
  if (!str) return [];
  return str
    .split(",")
    .map((x) => ({ name: x.trim(), isCorresponding: false }))
    .filter((a) => a.name);
}

async function canEditPaper(auth, paper) {
  if (!auth || !paper) return false;
  if (auth.role === "admin") return true;

  if (paper.createdBy && paper.createdBy.toString() === auth.userId) return true;

  const me = await User.findById(auth.userId).select("name email");
  if (!me) return false;

  const authorNames = Array.isArray(paper.authors) ? paper.authors.map((a) => a?.name) : [];
  return authorNames.some((n) => sameText(n, me.name) || sameText(n, me.email));
}

async function writeLog({ auth, action, entityId, before, after, meta }) {
  const user = await User.findById(auth.userId).select("email");
  await Log.create({
    actorId: auth.userId,
    actor: auth.userId,
    actorEmail: user?.email || "",
    action,
    entityType: "Paper",
    entityId,
    before: before ?? null,
    after: after ?? null,
    meta: meta ?? null,
  });
}

export default async function handler(req, res) {
  const auth = requireAuth(req, res);
  if (!auth) return;

  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  try {
    await dbConnect();

    const { id } = req.query;
    const { journalId } = req.body || {};
    if (!journalId) return res.status(400).json({ message: "journalId is required" });

    const paper = await Paper.findById(id);
    if (!paper) return res.status(404).json({ message: "Paper not found" });

    const ok = await canEditPaper(auth, paper);
    if (!ok) return res.status(403).json({ message: "Forbidden" });

    const journal = await Journal.findById(journalId).select("name");
    if (!journal) return res.status(404).json({ message: "Journal not found" });

    
    paper.authors = normalizeAuthors(paper.authors);

    const now = new Date();
    const before = { journalHistoryLength: Array.isArray(paper.journalHistory) ? paper.journalHistory.length : 0 };

    paper.journalHistory = Array.isArray(paper.journalHistory) ? paper.journalHistory : [];
    paper.journalHistory.push({
      journalId,
      journalTitle: journal.name,
      status: "submitted",
      date_submitted: now,
      last_updated: now,
    });

    await paper.save();

    const after = { journalHistoryLength: paper.journalHistory.length };

    await writeLog({
      auth,
      action: "paper.add_journal",
      entityId: paper._id,
      before,
      after,
      meta: { addedJournalId: journalId, addedJournalTitle: journal.name },
    });

    return res.status(200).json({ ok: true, paper });
  } catch (err) {
    console.error("ADD JOURNAL ERROR:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
}
