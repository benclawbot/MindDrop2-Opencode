import { useState, useEffect } from 'react'
import * as FirebaseService from '../services/firebase'

export interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  isGuest?: boolean
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = FirebaseService.onAuthChange((u: AuthUser | null) => {
      setUser(u)
      setIsLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const signOut = () => FirebaseService.signOut()

  return { user, isLoading, signOut }
}
