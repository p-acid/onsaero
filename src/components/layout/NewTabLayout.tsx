import type { ReactNode } from 'react'
import { container, header, main, footer } from './NewTabLayout.css'

interface NewTabLayoutProps {
  children: ReactNode
}

export function NewTabLayout({ children }: NewTabLayoutProps) {
  return (
    <div className={container}>
      <header className={header}>
        <h1>Onsaero Tasks</h1>
      </header>

      <main className={main}>{children}</main>

      <footer className={footer}>
        <p>
          Press Ctrl+Enter to quickly add a task
        </p>
      </footer>
    </div>
  )
}
