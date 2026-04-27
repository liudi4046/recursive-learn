import type { AppState } from "@/domain/app-state";
import { migrateAppStateV1toV2 } from "@/domain/migrate-app-state";
import { deleteIndexedDbRecord, getIndexedDbRecord, putIndexedDbRecord } from "./indexed-db";

/** Stable key; keep in sync with any code that must clear the session in tests. */
export const LEGACY_STATE_STORAGE_KEY = "maplearn.state.v1";
export const STATE_STORAGE_KEY = LEGACY_STATE_STORAGE_KEY;

const STATE_ID = "state";
const BACKUP_VERSION = 1;

type StoredRecord = {
  id: string;
  state: AppState;
};

type BackupPayload = {
  version: 1;
  exportedAt: string;
  state: AppState;
};

function stripTransientState(state: AppState): AppState {
  return { ...state, createChildStreamUi: null };
}

function loadLegacyState(): AppState | null {
  const storage = typeof window === "undefined" ? undefined : window.localStorage;
  if (!storage || typeof storage.getItem !== "function") return null;
  const raw = storage.getItem(LEGACY_STATE_STORAGE_KEY);
  if (!raw) return null;
  const parsed = JSON.parse(raw) as AppState;
  return stripTransientState(parsed);
}

function clearLegacyState(): void {
  const storage = typeof window === "undefined" ? undefined : window.localStorage;
  if (!storage || typeof storage.removeItem !== "function") return;
  storage.removeItem(LEGACY_STATE_STORAGE_KEY);
}

function parseBackupJson(json: string): BackupPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Invalid backup JSON");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid backup JSON");
  }

  const payload = parsed as Partial<BackupPayload>;
  if (payload.version !== BACKUP_VERSION || !payload.state || typeof payload.state !== "object") {
    throw new Error("Unsupported backup format");
  }

  return {
    version: BACKUP_VERSION,
    exportedAt: typeof payload.exportedAt === "string" ? payload.exportedAt : new Date().toISOString(),
    state: stripTransientState(migrateAppStateV1toV2(payload.state))
  };
}

export function createStateBackupJson(state: AppState): string {
  const payload: BackupPayload = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    state: stripTransientState(state)
  };
  return JSON.stringify(payload, null, 2);
}

export async function saveState(state: AppState): Promise<void> {
  const record: StoredRecord = { id: STATE_ID, state: stripTransientState(state) };
  await putIndexedDbRecord(record);
}

export async function loadState(): Promise<AppState | null> {
  const record = await getIndexedDbRecord<StoredRecord>(STATE_ID);
  if (record?.state) {
    return stripTransientState(migrateAppStateV1toV2(record.state));
  }

  const legacy = loadLegacyState();
  if (!legacy) return null;
  const normalized = migrateAppStateV1toV2(legacy);
  await saveState(normalized);
  clearLegacyState();
  return legacy;
}

export async function clearStoredState(): Promise<void> {
  await deleteIndexedDbRecord(STATE_ID);
  clearLegacyState();
}

export async function exportStateJson(state?: AppState): Promise<string> {
  const source = state ?? (await loadState());
  if (!source) {
    throw new Error("No learning data to export");
  }
  return createStateBackupJson(source);
}

export async function importStateJson(json: string): Promise<AppState> {
  const payload = parseBackupJson(json);
  const next = migrateAppStateV1toV2(payload.state);
  await saveState(next);
  return next;
}
