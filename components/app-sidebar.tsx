import { UserButton } from "@clerk/nextjs"

import {
  Sidebar,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AppSidebar() {
  return (
    <Sidebar>
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
                      "!static !w-full !flex-row-reverse !justify-end !gap-2 !bg-transparent !text-inherit",
                    userButtonTrigger:
                      "!static !rounded-lg !bg-transparent !shadow-none after:absolute after:inset-0 after:rounded-md after:content-[''] focus-visible:!ring-0 focus-visible:!outline-none",
                    userButtonAvatarBox: "!size-6 !rounded-lg",
                    userButtonOuterIdentifier:
                      "!m-0 !truncate !text-sm !text-inherit",
                  },
                }}
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
