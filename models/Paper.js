import mongoose from "mongoose";

const JournalHistorySchema = new mongoose.Schema(
  {
    journalId: { type: mongoose.Schema.Types.ObjectId, ref: "Journal", required: true },
    current_status: {
      type: String,
      enum: ["submitted", "under_review", "rejected", "accepted"],
      default: "submitted",
    },
    date_submitted: { type: Date, default: Date.now },
    date_lastupdated: { type: Date, default: Date.now },
  },
  { _id: false }
);

const PaperSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    authors: [{ type: String, trim: true }],

    journalIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Journal", required: true }],

    // NEW: track each submission status per journal, in order
    journalHistory: { type: [JournalHistorySchema], default: [] },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    is_deleted: { type: Boolean, default: false },

    date_submitted: { type: Date, default: Date.now },
    date_lastupdated: { type: Date, default: Date.now },

    current_status: {
      type: String,
      enum: ["submitted", "under_review", "rejected", "accepted"],
      default: "submitted",
    },
  },
  { timestamps: true }
);

PaperSchema.pre("save", function () {
  this.date_lastupdated = new Date();
});

export default mongoose.models.Paper || mongoose.model("Paper", PaperSchema);
