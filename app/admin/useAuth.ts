// app/admin/useAuth.ts
'use client';

import { useEffect, useRef, useState } from 'react';
import { auth, googleProvider } from '@/app/lib/firebaseClient';
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut, User } from 'firebase/auth';

type AdminState = { isAdmin: boolean; email?: string | null };

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState<AdminState>({ isAdmin: false, email: null });
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);

  const signingIn = useRef(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      //  Reset admin state at the START of each auth change
      // This prevents the "Access Denied" flash
      setAdminChecked(false);
      setAdminLoading(true);
      
      setUser(u);
      setLoading(false);

      if (u) {
        try {
          const token = await u.getIdToken();
          const res = await fetch('/api/admin/me', { 
            headers: { Authorization: `Bearer ${token}` } 
          });
          const j = await res.json().catch(() => ({ isAdmin: false }));
          setAdmin({ isAdmin: !!j?.isAdmin, email: u.email });
        } catch {
          setAdmin({ isAdmin: false, email: u.email });
        } finally {
          setAdminLoading(false);
          setAdminChecked(true);
        }
      } else {
        setAdmin({ isAdmin: false, email: null });
        setAdminLoading(false);
        setAdminChecked(true);
      }
    });
    return () => unsub();
  }, []);

  const signIn = async () => {
    if (signingIn.current) return;
    signingIn.current = true;
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, googleProvider);
      } else if (code !== 'auth/cancelled-popup-request' && code !== 'auth/popup-closed-by-user') {
        console.error('Sign-in error', err);
        alert('Sign-in failed. See console.');
      }
    } finally {
      signingIn.current = false;
    }
  };

  const logOut = () => signOut(auth);
  const getToken = () => auth.currentUser?.getIdToken();

  return { user, loading, admin, adminLoading, adminChecked, signIn, logOut, getToken };
}