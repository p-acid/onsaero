import { MobileNav } from './mobile-nav'
import { Sidebar } from './sidebar'

export const DashboardPage = () => {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <MobileNav />

        <main className="flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <header className="mb-8">
              <h1 className="font-bold text-3xl">Dashboard</h1>
              <p className="mt-2 text-muted-foreground">
                Manage your tasks and track your productivity
              </p>
            </header>

            <section>
              <h2 className="mb-4 font-semibold text-xl">Active Tasks</h2>
              <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
                <p>Your tasks will appear here</p>
              </div>
            </section>

            <section className="mt-8">
              <h2 className="mb-4 font-semibold text-xl">Completed Tasks</h2>
              <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
                <p>Completed tasks will appear here</p>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
