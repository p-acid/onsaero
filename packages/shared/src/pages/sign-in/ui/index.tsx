import { LoginButton } from './login-button'

export const SignInPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <main className="w-full max-w-md px-4">
        <div className="text-center">
          <div className="mb-8">
            <h1 className="mb-2 font-bold text-4xl">Onsaero</h1>
            <p className="text-lg text-muted-foreground">
              Task management for productivity
            </p>
          </div>

          <LoginButton />
        </div>
      </main>
    </div>
  )
}
