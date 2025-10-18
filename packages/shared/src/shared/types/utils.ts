export type SetRequired<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>

export type OptionalKeys<T> = {
  [K in keyof T]: object extends Pick<T, K> ? K : never
}[keyof T]
