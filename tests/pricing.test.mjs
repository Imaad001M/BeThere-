import assert from "node:assert/strict";
import { quote, quoteSchema, detailSchema, economics } from "../lib/pricing.ts";
assert.equal(quote({ event: "birthday", hours: 2, addons: [] }).total, 19900);
assert.equal(
  quote({ event: "wedding", hours: 4, addons: ["bouquet", "cake", "gift"] })
    .total,
  58400,
);
const q = quote({ event: "birthday", hours: 2, addons: ["bouquet", "cake"] });
assert.equal(q.total, 32700);
assert.equal(q.representative, 9810);
assert.equal(q.platform, 22890);
assert.equal(
  economics({ event: "birthday", hours: 2, addons: ["bouquet", "cake"] })
    .contribution,
  15374,
);
for (const bad of [
  { event: "funeral", hours: 2, addons: ["cake"] },
  { event: "birthday", hours: 2, addons: ["gift", "gift"] },
  { event: "birthday", hours: 0, addons: [] },
  { event: "birthday", hours: 2, addons: [], total: 1 },
])
  assert.equal(quoteSchema.safeParse(bad).success, false);
const detail = {
  yourName: "Alex Tan",
  email: "alex@example.com",
  recipient: "Jamie",
  date: new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10),
  time: "18:00",
  venue: "Sample venue, Singapore",
  language: "English",
  message: "Happy birthday",
  notes: "",
};
assert(detailSchema.safeParse(detail).success);
assert(!detailSchema.safeParse({ ...detail, date: "2026-02-31" }).success);
assert(!detailSchema.safeParse({ ...detail, date: "2020-01-01" }).success);
assert(!detailSchema.safeParse({ ...detail, email: "invalid" }).success);
console.log(
  "PASS: totals, full-order 30% share, contribution, duplicate add-ons, funeral rules, price tampering, date/time and email validation.",
);
