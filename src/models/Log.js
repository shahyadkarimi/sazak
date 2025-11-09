import mongoose from "mongoose";

const userInfoSchema = new mongoose.Schema(
  {
    userId: { type: String },
    name: { type: String },
    familyName: { type: String },
    phoneNumber: { type: String },
    role: { type: String },
  },
  { _id: false }
);

const logSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    performedBy: { type: userInfoSchema, default: undefined },
    target: { type: mongoose.Schema.Types.Mixed, default: undefined },
    metadata: { type: mongoose.Schema.Types.Mixed, default: undefined },
    context: {
      ip: { type: String },
      userAgent: { type: String },
    },
  },
  { timestamps: true }
);

export default mongoose.models.Log || mongoose.model("Log", logSchema);





