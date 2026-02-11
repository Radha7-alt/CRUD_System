import dbConnect from "../../../lib/mongodb";
import Log from "../../../models/Log";
import { requireAuth } from "../../../lib/requireAuth";

export default async function handler(req, res) {
  const auth = requireAuth(req, res);
  if (!auth) return;

  // Admin only
  if (auth.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  await dbConnect();

  const { q = "", limit = "200" } = req.query;
  const cleanQ = String(q || "").trim();
  const n = Math.min(Math.max(parseInt(limit, 10) || 200, 1), 1000);

  const filter = {};
  if (cleanQ) {
    const rx = new RegExp(cleanQ.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [
      { action: rx },
      { actorEmail: rx },
      { entityType: rx },
    ];
  }

  const logs = await Log.find(filter)
    .sort({ createdAt: -1 })
    .limit(n);

  return res.status(200).json(logs);
}
