interface LoadingFallbackProps {
  text: string
}

export const LoadingFallback = ({ text }: LoadingFallbackProps) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <svg
        className="mb-4 h-12 w-12 animate-spin text-primary"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>

      <p className="text-base text-foreground">{text}</p>
    </div>
  )
}
