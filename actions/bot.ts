"use server"

import { auth } from "@clerk/nextjs/server"
import { and, eq, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { db } from "@/db"
import {
  bots,
  chatMembers,
  chats,
  createBotSchema,
  deleteBotSchema,
  insertBotSchema,
  insertChatMemberSchema,
  insertChatSchema,
  updateBotSchema,
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

  // The chats list is fetched in the dashboard layout, so revalidate the layout
  // (and everything under it), not just the page.
  revalidatePath("/", "layout")
  return { ok: true, id: botId, chatId }
}

export type UpdateBotResult = { ok: true } | { ok: false; error: string }

export async function updateBot(input: unknown): Promise<UpdateBotResult> {
  const { userId } = await auth()
  if (!userId) {
    return { ok: false, error: "You need to be signed in to edit a bot." }
  }

  const parsed = updateBotSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid bot details.",
    }
  }

  const { id, ...fields } = parsed.data

  // Scoped to the signed-in user, so another user's bot can't be edited.
  const updated = await db
    .update(bots)
    .set({ ...fields, instructions: fields.instructions || null })
    .where(and(eq(bots.id, id), eq(bots.userId, userId)))
    .returning({ id: bots.id })

  if (updated.length === 0) return { ok: false, error: "Bot not found." }

  revalidatePath("/", "layout")
  return { ok: true }
}

export type DeleteBotResult = { ok: true } | { ok: false; error: string }

export async function deleteBot(input: unknown): Promise<DeleteBotResult> {
  const { userId } = await auth()
  if (!userId) {
    return { ok: false, error: "You need to be signed in to delete a bot." }
  }

  const parsed = deleteBotSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "Invalid bot." }
  const { id } = parsed.data

  const deleted = await db.transaction(async (tx) => {
    // Both tables are scoped to the signed-in user. Deleting the bot cascades
    // its memberships but not the chats, so remove its direct chats first.
    const memberships = await tx
      .select({ chatId: chatMembers.chatId })
      .from(chatMembers)
      .innerJoin(chats, eq(chats.id, chatMembers.chatId))
      .where(
        and(
          eq(chatMembers.botId, id),
          eq(chats.userId, userId),
          eq(chats.kind, "direct")
        )
      )

    const removed = await tx
      .delete(bots)
      .where(and(eq(bots.id, id), eq(bots.userId, userId)))
      .returning({ id: bots.id })
    if (removed.length === 0) return false

    const chatIds = memberships.map((m) => m.chatId)
    if (chatIds.length > 0) {
      await tx
        .delete(chats)
        .where(and(inArray(chats.id, chatIds), eq(chats.userId, userId)))
    }
    return true
  })

  if (!deleted) return { ok: false, error: "Bot not found." }

  revalidatePath("/", "layout")
  return { ok: true }
}
