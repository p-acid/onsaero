import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@onsaero-shared/shared/ui'
import { LoginButton } from './login-button'

export const SignInPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Welcome to Onsaero!</CardTitle>
          <CardDescription>
            Plan your schedule, track your growth, and unlock your potential.
          </CardDescription>
        </CardHeader>

        <CardFooter>
          <LoginButton />
        </CardFooter>
      </Card>
    </div>
  )
}
