import dbConnect from "../../../lib/mongodb";
import Paper from "../../../models/Paper";
import { requireAuth } from "../../../lib/requireAuth";

function normalizeAuthors(authors) {
  return Array.isArray(authors)
    ? authors.map((a) => String(a).trim()).filter(Boolean)
    : String(authors || "")
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);
}

function normalizeJournalIds(journalIds, journalId) {
  
  if (Array.isArray(journalIds) && journalIds.length) return journalIds;
  if (journalId) return [journalId];
  return [];
}

export default async function handler(req, res) {
  const auth = requireAuth(req, res);
  if (!auth) return;

  await dbConnect();

  if (req.method === "GET") {
    const includeDeleted = req.query.deleted === "1";
    const filter = includeDeleted ? {} : { is_deleted: false };

    if (auth.role !== "admin") {
      filter.createdBy = auth.userId;
    }

    const papers = await Paper.find(filter)
      .populate({ path: "journalIds", select: "name" })
      .populate({ path: "createdBy", select: "name email role" })
      .sort({ date_lastupdated: -1 });

    return res.status(200).json(papers);
  }

  // POST /api/papers
  if (req.method === "POST") {
    const { title, authors, journalIds, journalId } = req.body || {};

    const cleanTitle = String(title || "").trim();
    const jIds = normalizeJournalIds(journalIds, journalId);

    if (!cleanTitle || !jIds.length) {
      return res.status(400).json({ message: "Missing fields: title, journalIds" });
    }

    const authorsArray = normalizeAuthors(authors);
    const now = new Date();

    const paper = await Paper.create({
      title: cleanTitle,
      authors: authorsArray,
      journalIds: jIds,
      journalHistory: jIds.map((jid) => ({
        journalId: jid,
        current_status: "submitted",
        date_submitted: now,
        date_lastupdated: now,
      })),
      createdBy: auth.userId,
      current_status: "submitted",
      date_submitted: now,
      date_lastupdated: now,
    });

    return res.status(201).json(paper);
  }

  return res.status(405).json({ message: "Method not allowed" });
}
