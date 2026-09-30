import assert from "node:assert/strict";
import { saveDemoRequest, loadDemoRequest } from "../lib/demo-storage.ts";

const entries = new Map();
const storage = {
  getItem: (key) => entries.get(key) ?? null,
  setItem: (key, value) => entries.set(key, value),
};
const input = {
  requestId: crypto.randomUUID(),
  selection: { event: "birthday", hours: 2, addons: ["bouquet", "cake", "gift"], bouquetSize: "medium", bakery: "awfully", cakeFlavor: "Chocolate, 6 inch", giftItem: "A blue scarf", giftStore: "Example shop" },
  details: { yourName: "Alex Tan", email: "alex@example.com", recipient: "Jamie", date: new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10), time: "18:00", venue: "Sample venue, Singapore", language: "English", message: "Happy birthday!", notes: "" },
  demoAcknowledged: true,
};
const saved = saveDemoRequest(input, storage);
assert.equal(saved.quote.total, 42600);
assert.equal(saved.quote.representative, 12780);
assert.deepEqual(loadDemoRequest(saved.id, storage), saved);
assert.deepEqual(saveDemoRequest(input, storage), saved);
assert.equal(entries.size, 1);
assert.throws(() => saveDemoRequest({ ...input, details: { ...input.details, recipient: "Sam" } }, storage), /another plan/);
assert.throws(() => saveDemoRequest({ ...input, demoAcknowledged: false }, storage));
assert.throws(() => loadDemoRequest(crypto.randomUUID(), storage), /isn’t saved in this browser/);
assert.throws(() => loadDemoRequest("bad-reference", storage), /invalid/);
const unavailable = { getItem: () => null, setItem: () => { throw new DOMException("Full", "QuotaExceededError"); } };
assert.throws(() => saveDemoRequest(input, unavailable), /couldn’t save/);

// Historical plans remain viewable; only new submissions require future dates.
const key = `bethere-demo-v1:${saved.id}`;
const old = JSON.parse(entries.get(key));
old.details.date = "2020-01-01";
entries.set(key, JSON.stringify(old));
assert.equal(loadDemoRequest(saved.id, storage).details.date, "2020-01-01");

// Corrupt or altered records cannot become an unchecked confirmation.
entries.set(key, "not-json");
assert.throws(() => loadDemoRequest(saved.id, storage), /could not be read/);
entries.set(key, JSON.stringify({ ...old, id: crypto.randomUUID() }));
assert.throws(() => loadDemoRequest(saved.id, storage), /could not be read/);
entries.set(key, JSON.stringify({ ...old, quote: { total: 1 } }));
assert.throws(() => loadDemoRequest(saved.id, storage), /could not be read/);
console.log("PASS: local save/reload, full-order price/share, retries, conflicting references, acknowledgement, missing/invalid records, full storage, and historical plans.");

const funeralInput = {...input, requestId: crypto.randomUUID(), selection: {event: "funeral", hours: 2, addons: []}, details: {...input.details, religion: "Other", religionOther: "Family tradition"}};
const funeralSaved = saveDemoRequest(funeralInput, storage);
assert.equal(loadDemoRequest(funeralSaved.id, storage).details.religion, "Other");
assert.equal(loadDemoRequest(funeralSaved.id, storage).details.religionOther, "Family tradition");
assert.throws(() => saveDemoRequest({...funeralInput, requestId: crypto.randomUUID(), details: {...funeralInput.details, religion: "invalid"}}, storage));
