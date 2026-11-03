"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"

import { db } from "@/db"
import {
  bots,
  chatMembers,
  chats,
  createBotSchema,
  insertBotSchema,
  insertChatMemberSchema,
  insertChatSchema,
} from "@/db/schema"

export type CreateBotResult =
  { ok: true; id: string; chatId: string } | { ok: false; error: string }

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

  // One transaction: the bot, its direct chat, and the membership either all
  // exist or none do.
  const { botId, chatId } = await db.transaction(async (tx) => {
    const [bot] = await tx
      .insert(bots)
      .values(values)
      .returning({ id: bots.id })

    const [chat] = await tx
      .insert(chats)
      .values(insertChatSchema.parse({ userId, kind: "direct" }))
      .returning({ id: chats.id })

    await tx
      .insert(chatMembers)
      .values(insertChatMemberSchema.parse({ chatId: chat.id, botId: bot.id }))

    return { botId: bot.id, chatId: chat.id }
  })

  revalidatePath("/")
  return { ok: true, id: botId, chatId }
}
