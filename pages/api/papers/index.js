// pages/api/papers/index.js
import dbConnect from "../../../lib/mongodb";
import Paper from "../../../models/Paper";
import User from "../../../models/User";
import { requireAuth } from "../../../lib/requireAuth";

/**
 * Authors can be:
 * - [{ name, userId, email, isCorresponding }]
 * - OR old comma-separated string "Name 1, Name 2"
 */
function normalizeAuthors(authors) {
  
  if (Array.isArray(authors)) {
    return authors
      .map((a) => ({
        name: String(a?.name || "").trim(),
        userId: a?.userId || null,
        email: a?.email ? String(a.email).trim().toLowerCase() : "",
        isCorresponding: !!a?.isCorresponding,
      }))
      .filter((a) => a.name);
  }

  return String(authors || "")
    .split(",")
    .map((n) => ({
      name: n.trim(),
      userId: null,
      email: "",
      isCorresponding: false,
    }))
    .filter((a) => a.name);
}

export default async function handler(req, res) {
  const auth = requireAuth(req, res);
  if (!auth) return;

  await dbConnect();

  // --- GET METHOD ---
  if (req.method === "GET") {
    const includeDeleted = req.query.deleted === "1";
    const filter = includeDeleted ? {} : { is_deleted: false };

    // Non-admins can see:
    // - papers they created
    // - OR papers where they are listed as an author
    if (auth.role !== "admin") {
      // Fetch current user's name/email so we can do safe fallback matching
      const me = await User.findById(auth.userId).select("name email");
      const meName = String(me?.name || "").trim();
      const meEmail = String(me?.email || "").trim().toLowerCase();

      filter.$or = [
        { createdBy: auth.userId },
        { "authors.userId": auth.userId },
        ...(meEmail ? [{ "authors.email": meEmail }] : []),
        ...(meName ? [{ "authors.name": meName }] : []),
      ];
    }

    try {
      const papers = await Paper.find(filter)
        .populate({ path: "journalHistory.journalId", select: "name" })
        .populate({ path: "createdBy", select: "name email role" })
        .sort({ updatedAt: -1 });

      return res.status(200).json(papers);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // --- POST METHOD ---
  if (req.method === "POST") {
    const { title, url, authors, journalId, journalTitle, journalIds } = req.body || {};
    const cleanTitle = String(title || "").trim();

    const firstJournalId = journalId || (Array.isArray(journalIds) ? journalIds[0] : null);

    if (!cleanTitle || !firstJournalId) {
      return res.status(400).json({ message: "Missing title or journal selection" });
    }

    const authorsArray = normalizeAuthors(authors);
    const now = new Date();

    try {
      const paper = await Paper.create({
        title: cleanTitle,
        url: url || "",
        authors: authorsArray,
        journalHistory: [
          {
            journalId: firstJournalId,
            journalTitle: journalTitle || "",
            status: "submitted",
            date_submitted: now,
            last_updated: now,
          },
        ],
        createdBy: auth.userId,
        is_deleted: false,
      });

      return res.status(201).json(paper);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
