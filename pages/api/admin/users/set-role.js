import dbConnect from "../../../../lib/mongodb";
import User from "../../../../models/User";
import { requireAdmin } from "../../../../lib/requireAuth";

export default async function handler(req, res) {
  const auth = requireAdmin(req, res);
  if (!auth) return;

  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const { email, role } = req.body || {};
  if (!email || !role) return res.status(400).json({ message: "Missing fields: email, role" });

  if (!["admin", "user"].includes(role)) return res.status(400).json({ message: "Invalid role" });

  await dbConnect();

  const user = await User.findOneAndUpdate(
    { email: String(email).toLowerCase() },
    { role },
    { new: true }
  );

  if (!user) return res.status(404).json({ message: "User not found" });

  return res.status(200).json({ message: "Role updated", email: user.email, role: user.role });
}
