import dbConnect from "../../../../lib/mongodb";
import User from "../../../../models/User";
import bcrypt from "bcryptjs";
import { requireAdmin } from "../../../../lib/requireAuth";

export default async function handler(req, res) {
  const auth = requireAdmin(req, res);
  if (!auth) return;

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { email, newPassword } = req.body || {};
  if (!email || !newPassword) {
    return res.status(400).json({ message: "Missing fields: email, newPassword" });
  }
  if (String(newPassword).length < 6) {
    return res.status(400).json({ message: "Password too short (min 6)" });
  }

  await dbConnect();

  const user = await User.findOne({ email: String(email).toLowerCase() });
  if (!user) return res.status(404).json({ message: "User not found" });

  user.passwordHash = await bcrypt.hash(String(newPassword), 10);
  await user.save();

  return res.status(200).json({ message: "Password updated", email: user.email });
}
