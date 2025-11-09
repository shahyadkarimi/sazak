import mongoose from "mongoose";

const SettingSchema = new mongoose.Schema(
  {
    siteName: {
      type: String,
      default: "سازک",
    },
    siteEmail: {
      type: String,
      default: "",
    },
    siteDescription: {
      type: String,
      default: "آموزشگاه رباتیک سازک",
    },
    logo: {
      type: String,
      default: "",
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    maintenanceMessage: {
      type: String,
      default: "سایت در حال بروزرسانی است",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Setting || mongoose.model("Setting", SettingSchema);

