'use client'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
} from '@onsaero-shared/shared/ui'
import { Goals } from './goals'
import { MainRoutes } from './main-routes'
import { NavUser } from './nav-user'

const GOALS = [
  {
    name: 'Project Management & Task Tracking',
    url: '#',
    emoji: '📊',
  },
  {
    name: 'Family Recipe Collection & Meal Planning',
    url: '#',
    emoji: '🍳',
  },
  {
    name: 'Fitness Tracker & Workout Routines',
    url: '#',
    emoji: '💪',
  },
  {
    name: 'Book Notes & Reading List',
    url: '#',
    emoji: '📚',
  },
  {
    name: 'Sustainable Gardening Tips & Plant Care',
    url: '#',
    emoji: '🌱',
  },
  {
    name: 'Language Learning Progress & Resources',
    url: '#',
    emoji: '🗣️',
  },
  {
    name: 'Home Renovation Ideas & Budget Tracker',
    url: '#',
    emoji: '🏠',
  },
  {
    name: 'Personal Finance & Investment Portfolio',
    url: '#',
    emoji: '💰',
  },
  {
    name: 'Movie & TV Show Watchlist with Reviews',
    url: '#',
    emoji: '🎬',
  },
  {
    name: 'Daily Habit Tracker & Goal Setting',
    url: '#',
    emoji: '✅',
  },
]

export function LeftSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader>
        <MainRoutes />
      </SidebarHeader>
      <SidebarContent>
        <Goals goals={GOALS} />
      </SidebarContent>
      <SidebarRail />
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
