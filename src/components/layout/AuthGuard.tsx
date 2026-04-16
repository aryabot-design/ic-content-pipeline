'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { Loader2, LogIn, LogOut, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  // Auto re-sign-in if refresh token failed
  useEffect(() => {
    if ((session as any)?.error === 'RefreshTokenError') {
      signIn('google');
    }
  }, [(session as any)?.error]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center text-white font-bold text-2xl mx-auto mb-6">
            M
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Master Dashboard</h1>
          <p className="text-sm text-muted-foreground mb-8">
            K-10 Mathematics Curriculum Project Tracker
          </p>
          <button
            onClick={() => signIn('google')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-lg font-medium text-sm hover:opacity-90 transition-smooth"
          >
            <LogIn size={16} />
            Sign in with Google
          </button>
          <p className="text-xs text-muted-foreground mt-4">
            Sign in with your Google account that has access to the curriculum sheet
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function UserMenu() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  return (
    <div className="flex items-center gap-2">
      {session.user.image && (
        <img
          src={session.user.image}
          alt=""
          className="w-7 h-7 rounded-full"
        />
      )}
      <span className="text-xs text-muted-foreground hidden md:block">
        {session.user.email}
      </span>
      <button
        onClick={() => signOut()}
        className="p-1.5 rounded-lg hover:bg-muted transition-smooth"
        title="Sign out"
      >
        <LogOut size={14} className="text-muted-foreground" />
      </button>
    </div>
  );
}
