import { auth } from "@clerk/nextjs/server"
import { desc, eq } from "drizzle-orm"

import { db } from "@/db"
import { chats } from "@/db/schema"

export type SidebarChat = {
  id: string
  name: string
  avatar: string
  lastMessagePreview: string | null
  lastMessageAt: Date
}

/**
 * The signed-in user's chats, most recently active first. Scoped to the Clerk
 * `userId`, so it never returns another user's chats.
 *
 * Group chats aren't handled yet: every chat falls back to its first bot for
 * the name and avatar.
 */
export async function getUserChats(): Promise<SidebarChat[]> {
  const { userId } = await auth()
  if (!userId) return []

  const rows = await db.query.chats.findMany({
    where: eq(chats.userId, userId),
    orderBy: desc(chats.lastMessageAt),
    with: { members: { with: { bot: true } } },
  })

  return rows.flatMap((chat) => {
    const bot = chat.members[0]?.bot
    if (!bot) return []

    return {
      id: chat.id,
      name: chat.name ?? bot.name,
      avatar: bot.avatar,
      lastMessagePreview: chat.lastMessagePreview,
      lastMessageAt: chat.lastMessageAt,
    }
  })
}
