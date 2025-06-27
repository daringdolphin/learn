/*
<ai_context>
This client component provides a user section for the sidebar.
</ai_context>
*/

"use client"

import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar"
import { User } from "lucide-react"

export function NavUser() {
  return (
    <SidebarMenu>
      <SidebarMenuItem className="flex items-center gap-2 font-medium">
        <User className="size-4" />
        Guest User
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
