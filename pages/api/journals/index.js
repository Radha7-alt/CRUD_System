import dbConnect from "../../../lib/mongodb";
import Journal from "../../../models/Journal";
import { requireAuth } from "../../../lib/requireAuth";

export default async function handler(req, res) {
  const auth = requireAuth(req, res);
  if (!auth) return;

  await dbConnect();

  if (req.method === "GET") {
    const journals = await Journal.find({}).sort({ name: 1 });
    return res.status(200).json(journals);
  }

  if (req.method === "POST") {
    const { name } = req.body || {};
    const clean = String(name || "").trim();
    if (!clean) return res.status(400).json({ message: "Journal name required" });

    try {
      const created = await Journal.create({ name: clean });
      return res.status(201).json(created);
    } catch (e) {
      return res.status(400).json({ message: e.message });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
