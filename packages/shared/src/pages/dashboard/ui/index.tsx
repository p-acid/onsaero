import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import { PAGE_ROUTES } from '../../../shared/config'
import { useAuthContext } from '../../../shared/context'
import { supabase } from '../../../shared/lib'

export const DashboardPage = () => {
  const navigate = useNavigate()

  const updateAuth = useAuthContext((state) => state.updateAuth)

  useEffect(() => {
    supabase.auth.getSession().then(console.log)
  }, [])

  return (
    <div>
      <Link to={PAGE_ROUTES.LANDING}>Landing</Link>
      <Link to={PAGE_ROUTES.SIGN_IN}>Login</Link>

      <button
        type="button"
        onClick={async () => {
          await supabase.auth.signOut()
          updateAuth({ user: null, session: null })
          navigate(PAGE_ROUTES.SIGN_IN)
        }}
      >
        Logout
      </button>
    </div>
  )
}
