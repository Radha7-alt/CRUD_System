import dbConnect from "../../../lib/mongodb";
import Paper from "../../../models/Paper";
import { requireAuth } from "../../../lib/requireAuth";

function canEditPaper(auth, paper) {
  if (auth.role === "admin") return true;
  return paper.createdBy.toString() === auth.userId;
}

export default async function handler(req, res) {
  const auth = requireAuth(req, res);
  if (!auth) return;

  await dbConnect();

  const { id } = req.query;
  const paper = await Paper.findById(id);
  if (!paper) return res.status(404).json({ message: "Paper not found" });

  // PUT /api/papers/:id  (update title/authors/journalId)
  if (req.method === "PUT") {
    if (!canEditPaper(auth, paper)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { title, authors, journalId } = req.body || {};

    if (title !== undefined) paper.title = String(title).trim();

    if (authors !== undefined) {
      paper.authors = Array.isArray(authors)
        ? authors.map((a) => String(a).trim()).filter(Boolean)
        : String(authors || "")
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean);
    }

    if (journalId !== undefined) paper.journalId = journalId;

    await paper.save();
    return res.status(200).json(paper);
  }

  // PATCH /api/papers/:id/status (admin only)
  if (req.method === "PATCH") {
    if (auth.role !== "admin") {
      return res.status(403).json({ message: "Forbidden (admin only)" });
    }

    const { current_status } = req.body || {};
    const allowed = ["submitted", "under_review", "rejected", "accepted"];

    if (!allowed.includes(current_status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    paper.current_status = current_status;
    await paper.save();
    return res.status(200).json(paper);
  }

  // DELETE /api/papers/:id (soft delete)
  if (req.method === "DELETE") {
    if (!canEditPaper(auth, paper)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    paper.is_deleted = true;
    await paper.save();
    return res.status(200).json({ message: "Soft deleted" });
  }

  return res.status(405).json({ message: "Method not allowed" });
}
