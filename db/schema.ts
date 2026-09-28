import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
export const demoRequests = sqliteTable("demo_requests", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  payload: text("payload").notNull(),
  totalCents: integer("total_cents").notNull(),
  representativeCents: integer("representative_cents").notNull(),
  createdAt: text("created_at").notNull(),
  status: text("status").notNull().default("demo_request"),
});
