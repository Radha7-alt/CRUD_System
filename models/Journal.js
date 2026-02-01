import mongoose from "mongoose";

const JournalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
  },
  { timestamps: true }
);

export default mongoose.models.Journal || mongoose.model("Journal", JournalSchema);

