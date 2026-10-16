import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  clerkId: text().notNull().unique(),
  email: text().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
});
