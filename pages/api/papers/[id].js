import dbConnect from "../../../lib/mongodb";
import Paper from "../../../models/Paper";
import { requireAuth } from "../../../lib/requireAuth";

function canEditPaper(auth, paper) {
  if (auth.role === "admin") return true;
  return paper.createdBy.toString() === auth.userId;
}

function normalizeAuthors(authors) {
  return Array.isArray(authors)
    ? authors.map((a) => String(a).trim()).filter(Boolean)
    : String(authors || "")
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);
}

function normalizeJournalIds(journalIds) {
  if (journalIds === undefined) return undefined;
  if (Array.isArray(journalIds)) return journalIds.map(String).filter(Boolean);
  const s = String(journalIds || "").trim();
  if (!s) return [];
  return [s];
}

function sameIdSet(a = [], b = []) {
  const as = new Set(a.map(String));
  const bs = new Set(b.map(String));
  if (as.size !== bs.size) return false;
  for (const x of as) if (!bs.has(x)) return false;
  return true;
}

export default async function handler(req, res) {
  const auth = requireAuth(req, res);
  if (!auth) return;

  await dbConnect();

  const { id } = req.query;
  const paper = await Paper.findById(id);
  if (!paper) return res.status(404).json({ message: "Paper not found" });

  if (req.method === "PUT") {
    if (!canEditPaper(auth, paper)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { title, authors, journalIds } = req.body || {};
    const now = new Date();

    if (title !== undefined) paper.title = String(title).trim();

    if (authors !== undefined) {
      paper.authors = normalizeAuthors(authors);
    }

    const nextJournalIds = normalizeJournalIds(journalIds);
    if (nextJournalIds !== undefined) {
      const prev = Array.isArray(paper.journalIds) ? paper.journalIds.map(String) : [];
      if (!sameIdSet(prev, nextJournalIds)) {
        paper.journalIds = nextJournalIds;
        paper.date_lastupdated = now;
      }
    }

    paper.date_lastupdated = now;
    await paper.save();
    return res.status(200).json(paper);
  }

  if (req.method === "PATCH") {
    if (auth.role !== "admin") {
      return res.status(403).json({ message: "Forbidden (admin only)" });
    }

    const { current_status } = req.body || {};
    const allowed = ["submitted", "under_review", "rejected", "accepted"];

    if (!allowed.includes(current_status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const now = new Date();
    paper.current_status = current_status;
    paper.date_lastupdated = now;

    await paper.save();
    return res.status(200).json(paper);
  }

  if (req.method === "DELETE") {
    if (!canEditPaper(auth, paper)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    paper.is_deleted = true;
    paper.date_lastupdated = new Date();
    await paper.save();
    return res.status(200).json({ message: "Soft deleted" });
  }

  return res.status(405).json({ message: "Method not allowed" });
}
