import dbConnect from "../../../lib/mongodb";
import Paper from "../../../models/Paper";
import { requireAuth } from "../../../lib/requireAuth";

const ALLOWED_STATUSES = new Set([
  "submitted",
  "under_review",
  "revision_submitted",
  "rejected",
  "accepted",
]);

function canEditPaper(auth, paper) {
  if (auth.role === "admin") return true;
  return String(paper.createdBy) === String(auth.userId);
}

/**
 * Normalize authors into {name,isCorresponding}[]
 * - supports old input: "A, B, C"
 * - enforces at most one corresponding author
 * - if authors exist and none marked corresponding -> first one becomes corresponding
 */
function normalizeAuthors(authors) {
  let arr = [];

  if (Array.isArray(authors)) {
    arr = authors
      .map((a) => {
        if (!a) return null;
        if (typeof a === "string") return { name: a.trim(), isCorresponding: false };
        return {
          name: String(a.name || "").trim(),
          isCorresponding: Boolean(a.isCorresponding),
        };
      })
      .filter((a) => a && a.name);
  } else {
    arr = String(authors || "")
      .split(",")
      .map((a) => ({ name: a.trim(), isCorresponding: false }))
      .filter((a) => a.name);
  }

  // enforce single corresponding
  const correspondingCount = arr.filter((a) => a.isCorresponding).length;
  if (arr.length > 0) {
    if (correspondingCount === 0) {
      arr[0].isCorresponding = true;
    } else if (correspondingCount > 1) {
      let found = false;
      arr = arr.map((a) => {
        if (a.isCorresponding && !found) {
          found = true;
          return a;
        }
        return { ...a, isCorresponding: false };
      });
    }
  }

  return arr;
}

export default async function handler(req, res) {
  const auth = requireAuth(req, res);
  if (!auth) return;

  await dbConnect();

  try {
    const { id } = req.query;

    const paper = await Paper.findById(id);
    if (!paper) return res.status(404).json({ message: "Paper not found" });

    // Optional: block operations on archived papers (except maybe admin restore route)
    if (paper.is_deleted && req.method !== "GET") {
      return res.status(410).json({ message: "Paper is archived (soft deleted)" });
    }

    // --- PUT: Edit Paper Details (Title, URL, Authors) ---
    if (req.method === "PUT") {
      if (!canEditPaper(auth, paper)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { title, url, authors } = req.body || {};

      if (title !== undefined) {
        const t = String(title).trim();
        if (!t) return res.status(400).json({ message: "Title cannot be empty" });
        paper.title = t;
      }

      if (url !== undefined) paper.url = String(url).trim();

      if (authors !== undefined) {
        paper.authors = normalizeAuthors(authors);
      }

      await paper.save();
      return res.status(200).json(paper);
    }

    /**
     * --- PATCH: Manage Journal Cycle ---
     * Two modes:
     * 1) addNewJournal = true  -> push new journalHistory entry (status=submitted)
     * 2) addNewJournal = false -> update status of LAST entry + last_updated timestamp
     */
    if (req.method === "PATCH") {
      if (!canEditPaper(auth, paper)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { status, journalId, journalTitle, addNewJournal } = req.body || {};
      const now = new Date();

      if (addNewJournal) {
        if (!journalId) {
          return res.status(400).json({ message: "journalId is required for a new submission" });
        }

        paper.journalHistory.push({
          journalId,
          journalTitle: String(journalTitle || "").trim(), // ok to be blank; UI can display populated journal name
          status: "submitted",
          date_submitted: now,
          last_updated: now,
        });

        await paper.save();
        return res.status(200).json(paper);
      }

      // update existing last entry
      if (!paper.journalHistory || paper.journalHistory.length === 0) {
        return res.status(400).json({ message: "No journal submission found for this paper" });
      }

      if (!status || !ALLOWED_STATUSES.has(status)) {
        return res.status(400).json({
          message: `Invalid status. Allowed: ${Array.from(ALLOWED_STATUSES).join(", ")}`,
        });
      }

      const lastIndex = paper.journalHistory.length - 1;
      paper.journalHistory[lastIndex].status = status;
      paper.journalHistory[lastIndex].last_updated = now;

      await paper.save();
      return res.status(200).json(paper);
    }

    // --- DELETE: Soft Delete (Archive) ---
    if (req.method === "DELETE") {
      if (!canEditPaper(auth, paper)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      paper.is_deleted = true;
      await paper.save();
      return res.status(200).json({ message: "Paper successfully archived (soft deleted)" });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("papers/[id] error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
