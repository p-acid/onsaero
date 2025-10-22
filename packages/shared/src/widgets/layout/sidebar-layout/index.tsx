import { SidebarInset, SidebarProvider } from '@onsaero-shared/shared/ui'
import type { PropsWithChildren } from 'react'
import { InsetHeader } from './inset-header'
import { LeftSidebar } from './left-sidebar'

export const SidebarLayout = ({ children }: PropsWithChildren) => {
  return (
    <SidebarProvider>
      <LeftSidebar />
      <SidebarInset>
        <InsetHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
