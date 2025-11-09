import Log from "@/models/Log";
import User from "@/models/User";
import { LogActions } from "@/constants/logActions";

export { LogActions };

const normalizeUserInfo = (info) => {
  if (!info) return undefined;

  const userId =
    info.userId ||
    info.id ||
    info._id ||
    (info.user && (info.user.id || info.user._id));

  const name =
    info.name ||
    (info.user && info.user.name) ||
    (info.fullName && info.fullName.split(" ")[0]);

  const familyName =
    info.familyName ||
    (info.user && info.user.familyName) ||
    (info.fullName && info.fullName.split(" ").slice(1).join(" "));

  const phoneNumber =
    info.phoneNumber || (info.user && info.user.phoneNumber) || undefined;

  const role = info.role || (info.user && info.user.role) || undefined;

  return {
    userId: userId ? userId.toString() : undefined,
    name,
    familyName,
    phoneNumber,
    role,
  };
};

const resolveUserInfo = async (info) => {
  const normalized = normalizeUserInfo(info);
  if (!normalized) return undefined;
  if (normalized.userId) return normalized;
  if (normalized.phoneNumber) {
    const user = await User.findOne({ phoneNumber: normalized.phoneNumber })
      .select("_id name familyName phoneNumber role")
      .lean();
    if (user) {
      return {
        userId: user._id.toString(),
        name: normalized.name || user.name,
        familyName: normalized.familyName || user.familyName,
        phoneNumber: user.phoneNumber || normalized.phoneNumber,
        role: normalized.role || user.role,
      };
    }
  }
  return normalized;
};

const extractRequestContext = (request) => {
  if (!request) return undefined;

  try {
    const ipHeader = request.headers.get("x-forwarded-for");
    const ip = ipHeader ? ipHeader.split(",")[0].trim() : undefined;
    const userAgent = request.headers.get("user-agent") || undefined;

    if (!ip && !userAgent) {
      return undefined;
    }

    return { ip, userAgent };
  } catch (_error) {
    return undefined;
  }
};

export async function createLog(action, options = {}) {
  const { performedBy, target, metadata, request } = options;

  try {
    await Log.create({
      action,
      performedBy: await resolveUserInfo(performedBy),
      target: target ? JSON.parse(JSON.stringify(target)) : undefined,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      context: extractRequestContext(request),
    });
  } catch (error) {
    console.error("Log creation failed:", error);
  }
}

