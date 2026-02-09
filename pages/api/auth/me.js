import dbConnect from "../../../lib/mongodb";
import User from "../../../models/User";
import { requireAuth } from "../../../lib/requireAuth";

export default async function handler(req, res) {
  const auth = requireAuth(req, res);
  if (!auth) return; // requireAuth already sent 401

  await dbConnect();

  const user = await User.findById(auth.userId).select("name email role createdAt");
  if (!user) {
    // Token was valid but user is missing (deleted from DB)
    return res.status(401).json({ message: "Unauthorized" });
  }

  return res.status(200).json(user);
}
