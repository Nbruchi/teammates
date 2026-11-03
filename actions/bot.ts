"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"

import { db } from "@/db"
import { bots, createBotSchema, insertBotSchema } from "@/db/schema"

export type CreateBotResult =
  { ok: true; id: string } | { ok: false; error: string }

export async function createBot(input: unknown): Promise<CreateBotResult> {
  const { userId } = await auth()
  if (!userId) {
    return { ok: false, error: "You need to be signed in to create a bot." }
  }

  const parsed = createBotSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid bot details.",
    }
  }

  const values = insertBotSchema.parse({
    ...parsed.data,
    instructions: parsed.data.instructions || null,
    userId,
  })

  const [bot] = await db.insert(bots).values(values).returning({ id: bots.id })

  revalidatePath("/")
  return { ok: true, id: bot.id }
}
