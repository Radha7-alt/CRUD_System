import dbConnect from "../../../../lib/mongodb";
import Paper from "../../../../models/Paper";
import User from "../../../../models/User";
import Log from "../../../../models/Log";
import { requireAuth } from "../../../../lib/requireAuth";

function sameText(a, b) {
  return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
}

async function canEditPaper(auth, paper) {
  if (auth.role === "admin") return true;
  if (paper.createdBy.toString() === auth.userId) return true;

  const me = await User.findById(auth.userId).select("name email");
  const authorNames = (paper.authors || []).map((a) => a?.name);
  return authorNames.some((n) => sameText(n, me.name) || sameText(n, me.email));
}

async function writeLog({ auth, action, paper, before, after }) {
  const user = await User.findById(auth.userId).select("email");

  try {
    await Log.create({
      
      actorId: auth.userId,

      actor: auth.userId,

      actorEmail: user?.email || "",
      action,
      entityType: "Paper",
      entityId: paper._id,
      before,
      after,
    });
  } catch (err) {
    
    console.error("writeLog failed:", err?.message || err);
  }
}


export default async function handler(req, res) {
  const auth = requireAuth(req, res);
  if (!auth) return;
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  await dbConnect();
  const { id } = req.query;

  const paper = await Paper.findById(id);
  if (!paper) return res.status(404).json({ message: "Paper not found" });

  const ok = await canEditPaper(auth, paper);
  if (!ok) return res.status(403).json({ message: "Forbidden" });

  const before = { is_deleted: paper.is_deleted };
  paper.is_deleted = false;
  await paper.save();

  await writeLog({
    auth,
    action: "paper.restore",
    paper,
    before,
    after: { is_deleted: false },
  });

  return res.status(200).json({ message: "Paper restored", paper });
}
