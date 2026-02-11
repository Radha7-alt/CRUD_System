import dbConnect from "../../../../lib/mongodb";
import Paper from "../../../../models/Paper";
import User from "../../../../models/User";
import Log from "../../../../models/Log";
import { requireAuth } from "../../../../lib/requireAuth";

const ALLOWED = ["submitted", "under_review", "revision_submitted", "rejected", "accepted"];

function normalizeStatus(s) {
  return String(s || "").trim().toLowerCase().replace(/\s+/g, "_");
}

function sameText(a, b) {
  return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
}

function normalizeAuthors(authors) {
  // if already array, ensure objects format
  if (Array.isArray(authors)) {
    return authors
      .map((a) => {
        if (typeof a === "string") return { name: a.trim(), isCorresponding: false };
        return {
          name: String(a?.name || "").trim(),
          isCorresponding: !!a?.isCorresponding,
        };
      })
      .filter((a) => a.name);
  }

  // if string like "Name1, Name2"
  const str = String(authors || "").trim();
  if (!str) return [];
  return str
    .split(",")
    .map((x) => ({ name: x.trim(), isCorresponding: false }))
    .filter((a) => a.name);
}

async function canEditPaper(auth, paper) {
  if (!auth || !paper) return false;
  if (auth.role === "admin") return true;

  if (paper.createdBy && paper.createdBy.toString() === auth.userId) return true;

  const me = await User.findById(auth.userId).select("name email");
  if (!me) return false;

  const authorNames = Array.isArray(paper.authors) ? paper.authors.map((a) => a?.name) : [];
  return authorNames.some((n) => sameText(n, me.name) || sameText(n, me.email));
}

async function writeLog({ auth, action, entityId, before, after, meta }) {
  const user = await User.findById(auth.userId).select("email");
  await Log.create({
    actorId: auth.userId, 
    actor: auth.userId,   
    actorEmail: user?.email || "",
    action,
    entityType: "Paper",
    entityId,
    before: before ?? null,
    after: after ?? null,
    meta: meta ?? null,
  });
}

export default async function handler(req, res) {
  const auth = requireAuth(req, res);
  if (!auth) return;

  if (req.method !== "PUT") return res.status(405).json({ message: "Method not allowed" });

  try {
    await dbConnect();

    const { id } = req.query;
    const raw = req.body?.status;
    const clean = normalizeStatus(raw);

    if (!ALLOWED.includes(clean)) {
      return res.status(400).json({
        message: `Invalid status. Allowed: ${ALLOWED.join(", ")}`,
        debug: { rawStatus: raw, normalized: clean },
      });
    }

    const paper = await Paper.findById(id);
    if (!paper) return res.status(404).json({ message: "Paper not found" });

    const ok = await canEditPaper(auth, paper);
    if (!ok) return res.status(403).json({ message: "Forbidden" });

    paper.authors = normalizeAuthors(paper.authors);

    if (!Array.isArray(paper.journalHistory) || paper.journalHistory.length === 0) {
      return res.status(400).json({ message: "Paper has no journal history" });
    }

    const idx = paper.journalHistory.length - 1;

    const before = {
      journalIndex: idx,
      status: paper.journalHistory[idx].status,
      last_updated: paper.journalHistory[idx].last_updated,
    };

    paper.journalHistory[idx].status = clean;
    paper.journalHistory[idx].last_updated = new Date();

    await paper.save();

    const after = {
      journalIndex: idx,
      status: paper.journalHistory[idx].status,
      last_updated: paper.journalHistory[idx].last_updated,
    };

    await writeLog({
      auth,
      action: "paper.status_update",
      entityId: paper._id,
      before,
      after,
      meta: { rawStatus: raw, normalized: clean },
    });

    return res.status(200).json({ ok: true, paper });
  } catch (err) {
    console.error("STATUS UPDATE ERROR:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
}
