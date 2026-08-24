import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const catalogEdits = sqliteTable("catalog_edits", {
  recordId: text("record_id").primaryKey(),
  status: text("status", { enum: ["upserted", "deleted"] }).notNull(),
  payload: text("payload").notNull().default("{}"),
  updatedBy: text("updated_by").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
