import dbConnect from "../../../lib/mongodb";
import Paper from "../../../models/Paper";
import Journal from "../../../models/Journal";
import { requireAuth } from "../../../lib/requireAuth";

export default async function handler(req, res) {
    const auth = requireAuth(req, res);
    if (!auth) return;

    await dbConnect();

    // GET /api/papers?deleted=0|1
    if (req.method === "GET") {
        const includeDeleted = req.query.deleted === "1";

        const filter = includeDeleted ? {} : { is_deleted: false };

        // normal users see only their papers; admin sees all
        if (auth.role !== "admin") {
            filter.createdBy = auth.userId;
        }

        const papers = await Paper.find(filter)
            .populate({ path: "journalId", select: "name" })
            .populate({ path: "createdBy", select: "name email role" })
            .sort({ date_lastupdated: -1 });


        return res.status(200).json(papers);
    }

    // POST /api/papers
    if (req.method === "POST") {
        const { title, authors, journalId } = req.body || {};

        if (!title || !journalId) {
            return res.status(400).json({ message: "Missing fields: title, journalId" });
        }

        const authorsArray =
            Array.isArray(authors)
                ? authors.map((a) => String(a).trim()).filter(Boolean)
                : String(authors || "")
                    .split(",")
                    .map((a) => a.trim())
                    .filter(Boolean);

        const paper = await Paper.create({
            title: String(title).trim(),
            authors: authorsArray,
            journalId,
            createdBy: auth.userId,
            // date_submitted defaults, status defaults, etc.
        });

        return res.status(201).json(paper);
    }

    return res.status(405).json({ message: "Method not allowed" });
}
