// pages/api/papers/[id]/index.js
import dbConnect from "../../../../lib/mongodb";
import Paper from "../../../../models/Paper";
import User from "../../../../models/User";
import Log from "../../../../models/Log";
import { requireAuth } from "../../../../lib/requireAuth";

function sameText(a, b) {
  return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
}

function normalizeAuthors(authors) {
  // If it's already an array, force object format
  if (Array.isArray(authors)) {
    const cleaned = authors
      .map((a) => {
        // Allow array of strings
        if (typeof a === "string") {
          return { name: a.trim(), isCorresponding: false };
        }
        // Allow objects
        return {
          name: String(a?.name || "").trim(),
          isCorresponding: !!a?.isCorresponding,
        };
      })
      .filter((a) => a.name);

    // ensure one corresponding if any exist
    if (cleaned.length && !cleaned.some((x) => x.isCorresponding)) {
      cleaned[0].isCorresponding = true;
    }

    // remove duplicates (case-insensitive)
    const seen = new Set();
    return cleaned.filter((a) => {
      const k = a.name.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  // If it's a string "A, B"
  const str = String(authors || "").trim();
  if (!str) return [];

  const arr = str
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((name, idx) => ({ name, isCorresponding: idx === 0 }));

  // remove duplicates
  const seen = new Set();
  return arr.filter((a) => {
    const k = a.name.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

async function canEditPaper(auth, paper) {
  if (!auth || !paper) return false;
  if (auth.role === "admin") return true;

  // owner can edit
  if (paper.createdBy && paper.createdBy.toString() === auth.userId) return true;

  // co-authors can edit (match by their user name/email against authors[].name)
  const me = await User.findById(auth.userId).select("name email");
  if (!me) return false;

  const authorNames = Array.isArray(paper.authors) ? paper.authors.map((a) => a?.name) : [];
  return authorNames.some((n) => sameText(n, me.name) || sameText(n, me.email));
}

async function writeLog({ auth, action, entityId, before, after, meta }) {
  const user = await User.findById(auth.userId).select("email");
  await Log.create({
    actorId: auth.userId, // required by current schema/data
    actor: auth.userId,   // matches models/Log.js
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

  const { id } = req.query;

  try {
    await dbConnect();

    const paper = await Paper.findById(id);
    if (!paper) return res.status(404).json({ message: "Paper not found" });

    const ok = await canEditPaper(auth, paper);
    if (!ok) return res.status(403).json({ message: "Forbidden" });

    // VERY IMPORTANT:
    // If an old/bad paper has authors as a string, ANY save() will fail.
    // So always sanitize before any save in this route.
    paper.authors = normalizeAuthors(paper.authors);

    // --------------------------
    // PUT = edit paper fields
    // --------------------------
    if (req.method === "PUT") {
      const { title, url, authors } = req.body || {};

      const before = {
        title: paper.title,
        url: paper.url,
        authors: paper.authors,
      };

      if (typeof title === "string") paper.title = title.trim();
      if (typeof url === "string") paper.url = url.trim();

      // always normalize incoming authors (string OR array OR objects)
      if (authors !== undefined) {
        paper.authors = normalizeAuthors(authors);
      }

      await paper.save();

      await writeLog({
        auth,
        action: "paper.update",
        entityId: paper._id,
        before,
        after: { title: paper.title, url: paper.url, authors: paper.authors },
        meta: null,
      });

      return res.status(200).json({ ok: true, paper });
    }

    // --------------------------
    // DELETE = soft delete
    // --------------------------
    if (req.method === "DELETE") {
      const before = { is_deleted: paper.is_deleted };

      paper.is_deleted = true;

      await paper.save(); 

      await writeLog({
        auth,
        action: "paper.soft_delete",
        entityId: paper._id,
        before,
        after: { is_deleted: paper.is_deleted },
        meta: null,
      });

      return res.status(200).json({ ok: true, paperId: paper._id, is_deleted: true });
    }

    // --------------------------
    // PATCH = restore
    // body: { restore: true }
    // --------------------------
    if (req.method === "PATCH") {
      const { restore } = req.body || {};
      if (!restore) return res.status(400).json({ message: "Missing restore=true" });

      const before = { is_deleted: paper.is_deleted };

      paper.is_deleted = false;

      await paper.save();

      await writeLog({
        auth,
        action: "paper.restore",
        entityId: paper._id,
        before,
        after: { is_deleted: paper.is_deleted },
        meta: null,
      });

      return res.status(200).json({ ok: true, paperId: paper._id, is_deleted: false });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (err) {
    console.error("PAPER [id] API ERROR:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
}
