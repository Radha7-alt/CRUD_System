import dbConnect from "../../../lib/mongodb.js";
import Journal from "../../../models/Journal.js";
import { requireAuth, requireAdmin } from "../../../lib/requireAuth.js";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const journals = await Journal.find({}).sort({ name: 1 });
    return res.status(200).json(journals);
  }

  if (req.method === "POST") {
    const auth = requireAdmin(req, res);
    if (!auth) return;

    const { name } = req.body || {};
    if (!name) return res.status(400).json({ message: "Journal name required" });

    try {
      const journal = await Journal.create({ name: name.trim() });
      return res.status(201).json(journal);
    } catch (err) {
      return res.status(400).json({ message: err.message || "Create journal failed" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
