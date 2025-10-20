interface LoadingFallbackProps {
  text: string
}

export const LoadingFallback = ({ text }: LoadingFallbackProps) => {
  return (
    <div>
      <div /> {/* Loading */}
      <div>{text}</div>
    </div>
  )
}
