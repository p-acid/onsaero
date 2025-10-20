import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@onsaero-shared/shared/ui'

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header Navigation */}
      <header className="border-border border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <h2 className="font-bold text-xl">Onsaero</h2>
          <nav>
            <a
              href="/sign-in"
              className="rounded-md px-4 py-2 font-medium text-foreground text-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Sign In
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 md:px-6 md:py-20">
        {/* Hero Section */}
        <section className="mb-16 text-center md:mb-24">
          <h1 className="mb-4 font-bold text-4xl tracking-tight md:text-5xl lg:text-6xl">
            Onsaero
          </h1>
          <p className="mb-6 text-muted-foreground text-xl md:text-2xl">
            Stay productive with effortless task management
          </p>
          <p className="mx-auto mb-8 max-w-2xl text-base text-muted-foreground md:text-lg">
            Capture your to-dos instantly every time you open a new tab. Track
            your progress, visualize your productivity, and stay focused on what
            matters most.
          </p>
          <Button
            asChild
            size="lg"
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <a href="/sign-in">Get Started</a>
          </Button>
        </section>

        {/* Feature Cards */}
        <section>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="dark:bg-card dark:text-card-foreground">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <span aria-hidden="true">⚡</span>
                  <span>Instant Capture</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Add tasks quickly every time you open a new tab
                </p>
              </CardContent>
            </Card>

            <Card className="dark:bg-card dark:text-card-foreground">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <span aria-hidden="true">📊</span>
                  <span>Track Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Visualize your productivity with beautiful charts
                </p>
              </CardContent>
            </Card>

            <Card className="dark:bg-card dark:text-card-foreground">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <span aria-hidden="true">🔄</span>
                  <span>Always Synced</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Access your tasks across all your devices
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  )
}
