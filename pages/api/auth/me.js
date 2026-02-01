import dbConnect from "../../../lib/mongodb";
import User from "../../../models/User";
import { requireAuth } from "../../../lib/requireAuth";

export default async function handler(req, res) {
  const auth = requireAuth(req, res);
  if (!auth) return;

  await dbConnect();
  const user = await User.findById(auth.userId).select("name email role createdAt");
  return res.status(200).json(user);
}
