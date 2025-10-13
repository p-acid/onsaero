import type { ReactNode } from 'react'
import { ErrorMessage } from '../auth/ErrorMessage'
import { LoginButton } from '../auth/LoginButton'
import {
  container,
  errorContainer,
  footer,
  header,
  main,
} from './NewTabLayout.css'

interface NewTabLayoutProps {
  children: ReactNode
}

export function NewTabLayout({ children }: NewTabLayoutProps) {
  return (
    <div className={container}>
      <header className={header}>
        <h1 className="">Onsaero Tasks</h1>
        <LoginButton />
      </header>

      {/* Auth error messages */}
      <div className={errorContainer}>
        <ErrorMessage />
      </div>

      <main className={main}>{children}</main>

      <footer className={footer}>
        <p>Press Ctrl+Enter to quickly add a task</p>
      </footer>
    </div>
  )
}
