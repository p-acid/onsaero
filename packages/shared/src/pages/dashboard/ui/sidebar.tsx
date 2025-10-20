import { PAGE_ROUTES } from '@onsaero-shared/shared/config'
import { useAuthContext } from '@onsaero-shared/shared/context'
import { supabase } from '@onsaero-shared/shared/lib'
import { Button, Separator } from '@onsaero-shared/shared/ui'
import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router'

export const Sidebar = () => {
  const navigate = useNavigate()
  const updateAuth = useAuthContext((state) => state.updateAuth)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    updateAuth({ user: null, session: null })
    navigate(PAGE_ROUTES.SIGN_IN)
  }

  return (
    <aside className="hidden w-64 border-border border-r bg-sidebar text-sidebar-foreground lg:block">
      <div className="flex h-full flex-col">
        <div className="border-sidebar-border border-b p-6">
          <h2 className="font-bold text-xl">Onsaero</h2>
        </div>

        <nav className="flex-1 space-y-1 p-4" aria-label="Main navigation">
          <a
            href="#tasks"
            aria-current="page"
            className="flex items-center rounded-md bg-sidebar-accent px-3 py-2 font-medium text-sidebar-accent-foreground text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
          >
            Tasks
          </a>
          <a
            href="#archive"
            className="flex items-center rounded-md px-3 py-2 font-medium text-sidebar-foreground text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
          >
            Archive
          </a>
        </nav>

        <Separator className="bg-sidebar-border" />

        <div className="p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Logout
          </Button>
        </div>
      </div>
    </aside>
  )
}
