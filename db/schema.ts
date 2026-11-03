import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const bots = pgTable(
  "bots",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => nanoid()),
    userId: text().notNull(),
    name: text().notNull(),
    avatar: text()
      .notNull()
      .$defaultFn(() => nanoid()),
    job: text().notNull(),
    instructions: text(),
    sandboxId: text(),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (table) => [index().on(table.userId)],
);
