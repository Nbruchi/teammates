import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema } from "drizzle-zod"
import { nanoid } from "nanoid"
import type { z } from "zod"

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
  (table) => [index().on(table.userId)]
)

export const insertBotSchema = createInsertSchema(bots, {
  name: (schema) => schema.trim().min(1, "Give your bot a name").max(50),
  job: (schema) => schema.trim().min(1, "Give your bot a job").max(100),
  avatar: (schema) => schema.min(1),
  instructions: (schema) => schema.trim().max(2000),
})

/** Fields the user controls when creating a bot. `userId` comes from Clerk. */
export const createBotSchema = insertBotSchema.pick({
  name: true,
  job: true,
  avatar: true,
  instructions: true,
})

export type CreateBotInput = z.infer<typeof createBotSchema>
