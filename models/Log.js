import mongoose from "mongoose";

const LogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // 
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // optional compatibility
    actorEmail: { type: String, default: "" },
    action: { type: String, required: true },
    entityType: { type: String, default: "" },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    before: { type: mongoose.Schema.Types.Mixed, default: null },
    after: { type: mongoose.Schema.Types.Mixed, default: null },
    meta: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Log || mongoose.model("Log", LogSchema);

