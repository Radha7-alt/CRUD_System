import dbConnect from "../../../lib/mongodb";
import User from "../../../models/User";
import { requireAuth } from "../../../lib/requireAuth";

export default async function handler(req, res) {
  const auth = requireAuth(req, res);
  if (!auth) return;

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  await dbConnect();

  const q = String(req.query.q || "").trim();
  if (!q) return res.status(200).json([]);

  const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

  const users = await User.find({
    $or: [{ name: regex }, { email: regex }],
  })
    .select("name email")
    .limit(10);

  return res.status(200).json(users);
}
