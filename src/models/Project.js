import mongoose from "mongoose";

const objectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    color: { type: String, default: "#ffffff" },
    position: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      z: { type: Number, default: 0 },
    },
    rotation: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      z: { type: Number, default: 0 },
    },
    scale: {
      x: { type: Number, default: 1 },
      y: { type: Number, default: 1 },
      z: { type: Number, default: 1 },
    },
  },
  { timestamps: true }
);

const projectSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    description: { type: String, required: false },
    objects: [objectSchema],
    deletedAt: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Project ||
  mongoose.model("Project", projectSchema);
