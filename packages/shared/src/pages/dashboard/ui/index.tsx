export const DashboardPage = () => {
  return (
    <main className="flex-1 p-5">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="font-bold text-xl">Dashboard</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            Manage your tasks and track your productivity
          </p>
        </header>

        <section>
          <h2 className="mb-3 font-semibold text-base">Active Tasks</h2>
          <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
            <p>Your tasks will appear here</p>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 font-semibold text-base">Completed Tasks</h2>
          <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
            <p>Completed tasks will appear here</p>
          </div>
        </section>
      </div>
    </main>
  )
}
