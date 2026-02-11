import dbConnect from "../../../../lib/mongodb";
import User from "../../../../models/User";
import { requireAuth } from "../../../../lib/requireAuth";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  const auth = requireAuth(req, res);
  if (!auth || auth.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  await dbConnect();
  const { id } = req.query;

  if (req.method === "PUT") {
    const { email, role, password, name, orcid, address } = req.body || {};

    // Only set fields that were actually provided
    const updateData = {};

    if (name !== undefined) updateData.name = String(name).trim();
    if (email !== undefined) updateData.email = String(email).trim().toLowerCase();
    if (role !== undefined) updateData.role = role === "admin" ? "admin" : "user";
    if (orcid !== undefined) updateData.orcid = String(orcid).trim();
    if (address !== undefined) updateData.address = String(address).trim();

    // Optional password update
    if (password !== undefined && String(password).length > 0) {
      if (String(password).length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      updateData.passwordHash = await bcrypt.hash(String(password), 10);
    }

    try {
      const user = await User.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
        select: "-passwordHash", // hide passwordHash
      });

      if (!user) return res.status(404).json({ message: "User not found" });

      return res.status(200).json(user);
    } catch (err) {
      return res.status(500).json({ message: "Update failed: " + err.message });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
