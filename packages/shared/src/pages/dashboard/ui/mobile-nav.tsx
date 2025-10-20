import { PAGE_ROUTES } from '@onsaero-shared/shared/config'
import { useAuthContext } from '@onsaero-shared/shared/context'
import { supabase } from '@onsaero-shared/shared/lib'
import {
  Button,
  Separator,
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@onsaero-shared/shared/ui'
import { LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'

export const MobileNav = () => {
  const navigate = useNavigate()
  const updateAuth = useAuthContext((state) => state.updateAuth)
  const [open, setOpen] = useState(false)

  const clickLink = (href: string) => {
    navigate(href)
    setOpen(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    updateAuth({ user: null, session: null })
    setOpen(false)
    navigate(PAGE_ROUTES.SIGN_IN)
  }

  return (
    <div className="border-border border-b bg-background lg:hidden">
      <div className="flex h-16 items-center justify-between px-4">
        <h2 className="font-bold text-xl">Onsaero</h2>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open navigation menu"
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Menu className="h-6 w-6" aria-hidden="true" />
            </Button>
          </SheetTrigger>

          <SheetContent side="right" className="w-64">
            <SheetHeader className="mb-6">
              <div className="flex items-center justify-between">
                <SheetTitle>Navigation</SheetTitle>
                <SheetClose asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Close navigation menu"
                    className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </Button>
                </SheetClose>
              </div>
            </SheetHeader>

            <nav className="space-y-1" aria-label="Main navigation">
              <button
                type="button"
                aria-current="page"
                onClick={() => clickLink('#tasks')}
                className="flex items-center rounded-md bg-accent px-3 py-2 font-medium text-accent-foreground text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Tasks
              </button>
              <button
                type="button"
                onClick={() => clickLink('#archive')}
                className="flex items-center rounded-md px-3 py-2 font-medium text-foreground text-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Archive
              </button>
            </nav>

            {/* Separator */}
            <Separator className="my-6" />

            {/* Logout Section */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Logout
            </Button>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
