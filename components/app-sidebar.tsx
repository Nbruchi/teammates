"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { UserButton } from "@clerk/nextjs"
import { formatDistanceToNowStrict } from "date-fns"
import { PlusIcon, SearchIcon, UsersIcon } from "lucide-react"

import { BotDialog } from "@/components/bot-dialog"
import { ChatAvatar } from "@/components/chat-avatar"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Kbd } from "@/components/ui/kbd"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import type { SidebarChat } from "@/queries/bots"

export function AppSidebar({ chats }: { chats: SidebarChat[] }) {
  const router = useRouter()
  const [botDialogOpen, setBotDialogOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  // Cmd/Ctrl + K toggles the chat search.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setSearchOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" aria-label="Create" />
              }
            >
              <PlusIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setBotDialogOpen(true)}>
                <PlusIcon className="text-muted-foreground" />
                Create new bot
              </DropdownMenuItem>
              <DropdownMenuItem>
                <UsersIcon className="text-muted-foreground" />
                Create group chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {/* Input's default classes on a Button; the outline variant keeps the
            button's own hover effect. */}
        <Button
          variant="outline"
          onClick={() => setSearchOpen(true)}
          aria-label="Search"
          className="h-8 w-full min-w-0 justify-start gap-2 rounded-lg border-input bg-transparent px-2.5 py-1 text-base font-normal text-muted-foreground group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-transparent group-data-[collapsible=icon]:px-0 md:text-sm dark:bg-input/30 group-data-[collapsible=icon]:dark:bg-transparent group-data-[collapsible=icon]:dark:hover:bg-muted/50"
        >
          <SearchIcon />
          <span className="group-data-[collapsible=icon]:hidden">Search</span>
          <Kbd className="ml-auto group-data-[collapsible=icon]:hidden">⌘K</Kbd>
        </Button>
        <BotDialog open={botDialogOpen} onOpenChange={setBotDialogOpen} />
        <CommandDialog
          open={searchOpen}
          onOpenChange={setSearchOpen}
          title="Search chats"
          description="Search your chats by bot name or message."
        >
          <CommandInput placeholder="Search chats..." />
          <CommandList>
            <CommandEmpty>No chats found.</CommandEmpty>
            <CommandGroup>
              {chats.map((chat) => (
                <CommandItem
                  key={chat.id}
                  value={chat.id}
                  keywords={[
                    chat.name,
                    ...(chat.lastMessagePreview
                      ? [chat.lastMessagePreview]
                      : []),
                  ]}
                  onSelect={() => {
                    setSearchOpen(false)
                    router.push(`/chats/${chat.id}`)
                  }}
                  className="gap-3"
                >
                  <ChatAvatar seed={chat.avatar} className="shrink-0" />
                  <div className="grid min-w-0 flex-1 gap-0.5 leading-tight">
                    <span className="truncate text-sm">{chat.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {chat.lastMessagePreview ?? "No messages yet"}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {chats.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton
                    size="lg"
                    className="gap-3 group-data-[collapsible=icon]:justify-center"
                    tooltip={chat.name}
                    render={<Link href={`/chats/${chat.id}`} />}
                  >
                    <ChatAvatar
                      seed={chat.avatar}
                      className="shrink-0 group-data-[collapsible=icon]:size-6"
                    />
                    <div className="grid min-w-0 flex-1 gap-0.5 leading-tight group-data-[collapsible=icon]:hidden">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm">{chat.name}</span>
                        <span
                          suppressHydrationWarning
                          className="shrink-0 text-xs text-muted-foreground"
                        >
                          {formatDistanceToNowStrict(chat.lastMessageAt)}
                        </span>
                      </div>
                      <span className="truncate text-xs text-muted-foreground">
                        {chat.lastMessagePreview ?? "No messages yet"}
                      </span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {/* The wrapper supplies SidebarMenuButton's size, radius and hover
                state. Clerk renders the name and the avatar button as siblings,
                so the button's ::after stretches over the whole (relative)
                wrapper to make the entire row the click target. */}
            <SidebarMenuButton
              size="lg"
              className="relative p-2 has-focus-visible:ring-2 has-aria-expanded:bg-sidebar-accent has-aria-expanded:text-sidebar-accent-foreground"
              render={<div />}
            >
              <UserButton
                showName
                appearance={{
                  elements: {
                    rootBox: "!static !w-full !bg-transparent",
                    userButtonBox:
                      "!static !w-full !flex-row-reverse !justify-end !gap-2 !bg-transparent !text-inherit group-data-[collapsible=icon]:!justify-center",
                    userButtonTrigger:
                      "!static !rounded-lg !bg-transparent !shadow-none after:absolute after:inset-0 after:rounded-md after:content-[''] focus-visible:!ring-0 focus-visible:!outline-none",
                    userButtonAvatarBox: "!size-6 !rounded-lg",
                    userButtonOuterIdentifier:
                      "!m-0 !truncate !text-sm !text-inherit group-data-[collapsible=icon]:!hidden",
                  },
                }}
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
