import {
  Calendar,
  SidebarGroup,
  SidebarGroupContent,
} from '@onsaero-shared/shared/ui'

export const DatePicker = () => {
  return (
    <SidebarGroup className="px-0">
      <SidebarGroupContent>
        <Calendar className="[&_[role=gridcell].bg-accent]:bg-sidebar-primary [&_[role=gridcell].bg-accent]:text-sidebar-primary-foreground [&_[role=gridcell]]:flex [&_[role=gridcell]]:w-[33px] [&_[role=gridcell]]:items-center [&_[role=gridcell]]:justify-center" />
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
