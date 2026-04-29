import { fetchLogs, saveLog, deleteLog } from './api';

let cachedData = {};

// Initialize data from API on app load
export async function loadData() {
  try {
    cachedData = await fetchLogs();
    return cachedData;
  } catch (error) {
    console.error('Failed to load data from MongoDB:', error);
    return {};
  }
}

export async function saveData(data) {
  cachedData = data;
}

export async function upsertEntry(data, dateStr, entry) {
  const updated = { ...data, [dateStr]: entry };
  try {
    await saveLog(dateStr, entry);
    cachedData = updated;
    return updated;
  } catch (error) {
    console.error('Failed to save entry:', error);
    return data;
  }
}

export async function deleteEntry(data, dateStr) {
  const updated = { ...data };
  delete updated[dateStr];
  try {
    await deleteLog(dateStr);
    cachedData = updated;
    return updated;
  } catch (error) {
    console.error('Failed to delete entry:', error);
    return data;
  }
}
