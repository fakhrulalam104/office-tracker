import { connectToDatabase } from "@/lib/mongodb";
import { UserSettings } from "@/models/UserSettings";
import { DEFAULT_USER_SETTINGS, normalizeUserSettings } from "@/lib/utils";
import type { UserSettings as UserSettingsShape } from "@/types";

export async function getUserSettings(userId: string): Promise<UserSettingsShape> {
  await connectToDatabase();
  const settings = await UserSettings.findOne({ userId }).lean();
  return normalizeUserSettings((settings as Partial<UserSettingsShape> | null) ?? DEFAULT_USER_SETTINGS);
}

export async function upsertUserSettings(userId: string, payload: Partial<UserSettingsShape>) {
  await connectToDatabase();
  const settings = normalizeUserSettings(payload);
  await UserSettings.findOneAndUpdate({ userId }, { userId, ...settings }, { upsert: true, new: true, setDefaultsOnInsert: true });
  return settings;
}
