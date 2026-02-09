import dbConnect from "../../../lib/mongodb.js";
import Journal from "../../../models/Journal.js";
import { requireAdmin } from "../../../lib/requireAuth.js";

export default async function handler(req, res) {
  await dbConnect();

  const auth = requireAdmin(req, res);
  if (!auth) return;

  const { id } = req.query;

  if (req.method === "PUT") {
    const { name } = req.body || {};
    if (!name) return res.status(400).json({ message: "Journal name required" });

    try {
      const updated = await Journal.findByIdAndUpdate(
        id,
        { name: name.trim() },
        { new: true, runValidators: true }
      );
      if (!updated) return res.status(404).json({ message: "Journal not found" });
      return res.status(200).json(updated);
    } catch (err) {
      return res.status(400).json({ message: err.message || "Update failed" });
    }
  }

  if (req.method === "DELETE") {
    const deleted = await Journal.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Journal not found" });
    return res.status(200).json({ message: "Deleted" });
  }

  return res.status(405).json({ message: "Method not allowed" });
}
