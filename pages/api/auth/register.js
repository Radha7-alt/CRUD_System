import dbConnect from "../../../lib/mongodb";
import User from "../../../models/User";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const { name, email, password, orcid = "", address = "" } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Missing fields: name, email, password" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password too short (min 6)" });
  }

  await dbConnect();

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(409).json({ message: "Email already in use" });

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: "user",
      orcid,
      address,
    });

    return res.status(201).json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      orcid: user.orcid,
      address: user.address,
    });
  } catch (err) {
    // In case ORCID regex fails, etc.
    return res.status(400).json({ message: err.message || "Register failed" });
  }
}
