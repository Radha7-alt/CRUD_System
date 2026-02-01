import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: { type: String, required: true, unique: true, lowercase: true, trim: true },

    role: { type: String, enum: ["admin", "user"], default: "user" },

    // ORCID is usually 0000-0000-0000-0000 (last digit can be X)
    orcid: {
      type: String,
      trim: true,
      default: "",
      match: [/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/, "Invalid ORCID format"],
    },

    address: { type: String, trim: true, default: "" },

    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
