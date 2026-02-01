import dbConnect from "../../../../lib/mongodb";
import Paper from "../../../../models/Paper";
import { requireAdmin } from "../../../../lib/requireAuth";

export default async function handler(req, res) {
  const auth = requireAdmin(req, res);
  if (!auth) return;

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  await dbConnect();

  const { id } = req.query;
  const paper = await Paper.findById(id);
  if (!paper) return res.status(404).json({ message: "Paper not found" });

  paper.is_deleted = false;
  await paper.save();

  res.status(200).json({ message: "Paper restored", id: paper._id });
}
