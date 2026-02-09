import dbConnect from "../../../lib/mongodb";
import Paper from "../../../models/Paper";
import Journal from "../../../models/Journal";
import { requireAuth } from "../../../lib/requireAuth";

function normalizeAuthors(authors) {
  let arr = [];

  if (Array.isArray(authors)) {
    arr = authors;
  } else {
    arr = String(authors || "")
      .split(",")
      .map((a) => ({ name: a.trim(), isCorresponding: false }));
  }

  // Clean + keep only valid
  arr = arr
    .map((a) => ({
      name: String(a?.name || "").trim(),
      isCorresponding: !!a?.isCorresponding,
    }))
    .filter((a) => a.name);

  // Ensure at most one corresponding author
  const firstCorrespondingIndex = arr.findIndex((a) => a.isCorresponding);
  if (firstCorrespondingIndex === -1 && arr.length > 0) {
    arr[0].isCorresponding = true; // default first author
  } else if (firstCorrespondingIndex > -1) {
    arr = arr.map((a, idx) => ({ ...a, isCorresponding: idx === firstCorrespondingIndex }));
  }

  return arr;
}

export default async function handler(req, res) {
  const auth = requireAuth(req, res);
  if (!auth) return;

  await dbConnect();

  // --- GET ---
  if (req.method === "GET") {
    const includeDeleted = req.query.deleted === "1";
    const filter = includeDeleted ? {} : { is_deleted: false };

    if (auth.role !== "admin") {
      filter.createdBy = auth.userId;
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

  // --- POST ---
  if (req.method === "POST") {
    const { title, url, authors, journalId, journalIds } = req.body || {};

    const cleanTitle = String(title || "").trim();
    const firstJournalId = journalId || (Array.isArray(journalIds) ? journalIds[0] : null);

    if (!cleanTitle || !firstJournalId) {
      return res.status(400).json({ message: "Missing title or journal selection" });
    }

    const authorsArray = normalizeAuthors(authors);
    const now = new Date();

    try {
      // Get journal title from journals collection
      const j = await Journal.findById(firstJournalId).select("name");
      const journalTitle = j?.name || "";

      const paper = await Paper.create({
        title: cleanTitle,
        url: String(url || "").trim(),
        authors: authorsArray,
        journalHistory: [
          {
            journalId: firstJournalId,
            journalTitle, // ✅ filled automatically
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
