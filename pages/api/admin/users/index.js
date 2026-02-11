import dbConnect from "../../../../lib/mongodb.js";
import User from "../../../../models/User.js";
import { requireAuth } from "../../../../lib/requireAuth.js";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  const auth = requireAuth(req, res);
  if (!auth || auth.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  await dbConnect();

  // GET: list users (never return passwordHash)
  if (req.method === "GET") {
    const users = await User.find({}, "-passwordHash").sort({ createdAt: -1 });
    return res.status(200).json(users);
  }

  // POST: create user (admin creates users)
  if (req.method === "POST") {
    const { name, email, role, password, orcid, address } = req.body || {};

    const cleanName = String(name || "").trim();
    const cleanEmail = String(email || "").trim().toLowerCase();

    if (!cleanName || !cleanEmail || !password) {
      return res.status(400).json({ message: "Missing name, email, or password" });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ email: cleanEmail });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const passwordHash = await bcrypt.hash(String(password), 10);

    const newUser = await User.create({
      name: cleanName,
      email: cleanEmail,
      role: role === "admin" ? "admin" : "user",
      orcid: orcid ? String(orcid).trim() : "",
      address: address ? String(address).trim() : "",
      passwordHash,
    });

    // never send passwordHash back
    return res.status(201).json({
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      orcid: newUser.orcid,
      address: newUser.address,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    });
  }

  return res.status(405).json({ message: "Method not allowed" });
}
