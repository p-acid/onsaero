import { LoadingFallback, PAGE_ROUTES, supabase } from '@onsaero/shared'
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useStore } from 'zustand'
import { webAuthStore } from '@/shared/store'

export const RedirectPage = () => {
  const navigate = useNavigate()

  const updateAuth = useStore(webAuthStore, (state) => state.updateAuth)

  useEffect(() => {
    const hashParams = new URLSearchParams(
      window.location.hash.replace('#', ''),
    )
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')

    const handleAuth = async () => {
      if (!accessToken || !refreshToken) return

      const { data: authData, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      if (error) {
        console.error(error)
        navigate(PAGE_ROUTES.SIGN_IN)
        return
      }

      if (authData.session && authData.user) {
        updateAuth(authData)
        navigate(PAGE_ROUTES.DASHBOARD)
      } else {
        navigate(PAGE_ROUTES.SIGN_IN)
      }
    }

    handleAuth()
  }, [])

  return <LoadingFallback text="로그인 중입니다..." />
}
