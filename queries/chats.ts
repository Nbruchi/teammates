import { auth } from "@clerk/nextjs/server"
import { and, eq } from "drizzle-orm"

import { db } from "@/db"
import { chats } from "@/db/schema"

export type Chat = {
  id: string
  name: string
  avatar: string
  bot: {
    id: string
    name: string
    job: string
    avatar: string
    instructions: string | null
  }
}

/**
 * One chat by id, or `null` when it doesn't exist. Scoped to the Clerk
 * `userId`, so another user's chat is indistinguishable from a missing one.
 *
 * Group chats aren't handled yet: the name and avatar come from the first bot.
 */
export async function getChat(chatId: string): Promise<Chat | null> {
  const { userId } = await auth()
  if (!userId) return null

  const chat = await db.query.chats.findFirst({
    where: and(eq(chats.id, chatId), eq(chats.userId, userId)),
    with: { members: { with: { bot: true } } },
  })

  const bot = chat?.members[0]?.bot
  if (!chat || !bot) return null

  return {
    id: chat.id,
    name: chat.name ?? bot.name,
    avatar: bot.avatar,
    bot: {
      id: bot.id,
      name: bot.name,
      job: bot.job,
      avatar: bot.avatar,
      instructions: bot.instructions,
    },
  }
}
