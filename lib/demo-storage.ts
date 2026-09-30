import { z } from "zod";
import { detailFieldsSchema, quote, quoteSchema, requestSchema } from "./pricing.ts";

type DemoStorage = Pick<Storage, "getItem" | "setItem">;
const PREFIX = "bethere-demo-v1:";
const storedSchema = z.object({
  version: z.literal(1),
  id: z.string().uuid(),
  selection: quoteSchema,
  // Historical plans remain readable after their event date has passed.
  details: detailFieldsSchema,
  createdAt: z.string().datetime(),
  status: z.literal("local_demo_request"),
}).strict();

export type SavedRequest = Omit<z.infer<typeof storedSchema>, "version"> & {
  quote: ReturnType<typeof quote>;
};

function browserStorage(): DemoStorage {
  try {
    return window.localStorage;
  } catch {
    throw new Error("Browser storage is unavailable. Allow storage for this site and try again.");
  }
}

export function loadDemoRequest(id: string, storage: DemoStorage = browserStorage()): SavedRequest {
  if (!z.string().uuid().safeParse(id).success) {
    throw new Error("This demo request reference is invalid.");
  }
  let raw: string | null;
  try {
    raw = storage.getItem(PREFIX + id);
  } catch {
    throw new Error("We couldn’t read this browser’s saved plans. Allow storage and try again.");
  }
  if (raw === null) {
    throw new Error("This plan isn’t saved in this browser. Open it in the browser where you saved it, or arrange a new presence.");
  }
  try {
    if (raw.length > 16000) throw new Error("Oversized record");
    const { version: _version, ...record } = storedSchema.parse(JSON.parse(raw));
    if (record.id !== id) throw new Error("Reference mismatch");
    return { ...record, quote: quote(record.selection) };
  } catch {
    throw new Error("This saved plan could not be read. Please arrange a new presence.");
  }
}

export function saveDemoRequest(input: unknown, storage: DemoStorage = browserStorage()): SavedRequest {
  const { requestId, selection, details } = requestSchema.parse(input);
  const record = {
    version: 1 as const,
    id: requestId,
    selection,
    details,
    createdAt: new Date().toISOString(),
    status: "local_demo_request" as const,
  };
  try {
    const previous = storage.getItem(PREFIX + requestId);
    if (previous !== null) {
      const saved = loadDemoRequest(requestId, storage);
      if (JSON.stringify({ selection: saved.selection, details: saved.details }) !== JSON.stringify({ selection, details })) {
        throw new Error("This reference belongs to another plan. Arrange a new presence to save these details.");
      }
      return saved;
    }
    storage.setItem(PREFIX + requestId, JSON.stringify(record));
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("This reference")) throw error;
    throw new Error("We couldn’t save in this browser. Your details are still here. Allow browser storage or free some space, then try again.");
  }
  return { id: record.id, selection, details, createdAt: record.createdAt, status: record.status, quote: quote(selection) };
}
