import mongoose from "mongoose";

const AuthorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    email: { type: String, trim: true, lowercase: true, default: "" },

    isCorresponding: { type: Boolean, default: false },
  },
  { _id: false }
);

const JournalHistorySchema = new mongoose.Schema(
  {
    journalId: { type: mongoose.Schema.Types.ObjectId, ref: "Journal", required: true },
    journalTitle: { type: String, trim: true, default: "" },
    status: { type: String, trim: true, default: "submitted" },
    date_submitted: { type: Date, default: null },
    last_updated: { type: Date, default: null },
  },
  { _id: false }
);

const PaperSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    url: { type: String, trim: true, default: "" },

    authors: { type: [AuthorSchema], default: [] },

    journalHistory: { type: [JournalHistorySchema], default: [] },

    currentStatus: { type: String, trim: true, default: "" },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    is_deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Paper || mongoose.model("Paper", PaperSchema);
