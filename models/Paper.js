import mongoose from "mongoose";

const PaperSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    authors: [{ type: String, trim: true }],

    journalId: { type: mongoose.Schema.Types.ObjectId, ref: "Journal", required: true },

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

// Auto-update date_lastupdated whenever paper changes
PaperSchema.pre("save", function () {
  this.date_lastupdated = new Date();
});


export default mongoose.models.Paper || mongoose.model("Paper", PaperSchema);
