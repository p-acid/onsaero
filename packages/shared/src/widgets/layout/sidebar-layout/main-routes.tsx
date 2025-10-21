import { PAGE_ROUTES } from '@onsaero-shared/shared/config'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@onsaero-shared/shared/ui'
import { CheckSquare, Goal, LayoutDashboard } from 'lucide-react'
import { Link } from 'react-router'

const MAIN_ROUTES = [
  {
    title: 'Dashboard',
    url: PAGE_ROUTES.DASHBOARD,
    icon: LayoutDashboard,
  },
  {
    title: 'Goals',
    url: PAGE_ROUTES.GOALS,
    icon: Goal,
  },
  {
    title: 'Tasks',
    url: PAGE_ROUTES.TASKS,
    icon: CheckSquare,
  },
]

export const MainRoutes = () => {
  return (
    <SidebarMenu>
      {MAIN_ROUTES.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild>
            <Link to={item.url}>
              <item.icon />
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}
