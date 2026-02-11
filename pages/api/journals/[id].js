import dbConnect from "../../../lib/mongodb";
import Journal from "../../../models/Journal";
import { requireAuth } from "../../../lib/requireAuth";

export default async function handler(req, res) {
  const auth = requireAuth(req, res);
  if (!auth) return;

  await dbConnect();

  const { id } = req.query;

  if (req.method === "PUT") {
    const { name } = req.body || {};
    const clean = String(name || "").trim();
    if (!clean) return res.status(400).json({ message: "Journal name required" });

    try {
      const updated = await Journal.findByIdAndUpdate(id, { name: clean }, { new: true });
      if (!updated) return res.status(404).json({ message: "Journal not found" });
      return res.status(200).json(updated);
    } catch (e) {
      return res.status(400).json({ message: e.message });
    }
  }

  if (req.method === "DELETE") {
    try {
      const deleted = await Journal.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ message: "Journal not found" });
      return res.status(200).json({ message: "Journal deleted" });
    } catch (e) {
      return res.status(400).json({ message: e.message });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
