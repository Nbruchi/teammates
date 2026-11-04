import { MonitorIcon } from "lucide-react"

import { BotDialog } from "@/components/bot-dialog"
import { ChatAvatar } from "@/components/chat-avatar"
import { Button } from "@/components/ui/button"
import type { Chat } from "@/queries/chats"

export function ChatHeader({ chat }: { chat: Chat }) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
      {/* Opens the bot's edit dialog. */}
      <BotDialog
        bot={chat.bot}
        trigger={
          <Button
            variant="ghost"
            className="-ml-2 min-w-0 gap-2 px-2"
            aria-label={`Edit ${chat.name}`}
          >
            <ChatAvatar seed={chat.avatar} className="size-6 shrink-0" />
            <span className="truncate text-sm font-medium">{chat.name}</span>
          </Button>
        }
      />
      <div className="flex-1" />
      {/* Placeholder: intentionally does nothing yet. */}
      <Button variant="ghost" size="icon-sm" aria-label="Desktop">
        <MonitorIcon />
      </Button>
    </header>
  )
}
