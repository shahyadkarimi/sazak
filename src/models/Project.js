import mongoose from "mongoose";

const objectSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    path: { type: String, required: true },
    color: { type: String, default: "#ffffff" },
    position: { type: Array, default: [0, 0, 0] },
    rotation: { type: Array, default: [0, 0, 0] },
    noColor: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const projectSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    description: { type: String, required: false },
    image: { type: String, default: null },
    objects: [objectSchema],
    autoSave: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: false },
    deletedAt: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Project ||
  mongoose.model("Project", projectSchema);
