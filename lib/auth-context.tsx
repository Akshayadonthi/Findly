"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "../types";
import { supabase, isSupabaseConfigured } from "./supabase";
import { auth, googleProvider } from "./firebase";
import { signInWithPopup } from "firebase/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isSupabase: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (name: string, email: string, password: string) => Promise<{ error?: string; requiresEmailConfirmation?: boolean }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize auth sessions after client mount to prevent SSR hydration mismatch
  useEffect(() => {
    if (typeof window !== "undefined") {
      const localSession = localStorage.getItem("findly_current_user");
      if (localSession) {
        try {
          setUser(JSON.parse(localSession));
        } catch {
          setUser(null);
        }
      }
    }

    if (isSupabaseConfigured && supabase) {
      const client = supabase!;

      const syncUserProfile = async (sessionUser: { id: string; email?: string; user_metadata?: { full_name?: string } }) => {
        try {
          let { data: profile } = await client
            .from("profiles")
            .select("*")
            .eq("id", sessionUser.id)
            .maybeSingle();

          // Auto-upsert profile if missing
          if (!profile) {
            const defaultName = sessionUser.user_metadata?.full_name || sessionUser.email?.split("@")[0] || "User";
            const { data: createdProfile } = await client
              .from("profiles")
              .upsert({
                id: sessionUser.id,
                name: defaultName,
                role: "user",
              })
              .select()
              .single();
            profile = createdProfile;
          }

          const loggedInUser: User = {
            id: sessionUser.id,
            email: sessionUser.email,
            name: profile?.name || sessionUser.user_metadata?.full_name || sessionUser.email?.split("@")[0] || "User",
            avatarUrl: profile?.avatar_url ? String(profile.avatar_url) : undefined,
            role: (profile?.role as User["role"]) || "user",
            isSuspended: Boolean(profile?.is_suspended),
            suspendedUntil: profile?.suspended_until ? String(profile.suspended_until) : undefined,
            suspensionReason: profile?.suspension_reason ? String(profile.suspension_reason) : undefined,
            memberSince: profile?.created_at ? new Date(String(profile.created_at)).toLocaleDateString("en-US", { year: "numeric", month: "long" }) : "Member",
          };

          setUser(loggedInUser);
          if (typeof window !== "undefined") {
            localStorage.setItem("findly_current_user", JSON.stringify(loggedInUser));
          }
        } catch (err) {
          console.error("Error syncing user profile:", err);
        }
      };

      const checkSession = async () => {
        try {
          const { data: { session } } = await client.auth.getSession();
          if (session?.user) {
            await syncUserProfile(session.user);
          }
        } catch (e) {
          console.warn("Supabase session check notice:", e);
        } finally {
          setLoading(false);
        }
      };

      checkSession();

      const { data: { subscription } } = client.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          await syncUserProfile(session.user);
        }
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      setLoading(false);
    }
  }, []);

  // Login handler
  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    const localUsers: User[] = JSON.parse(localStorage.getItem("findly_users") || "[]");
    const foundLocal = localUsers.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    const fallbackUser: User = foundLocal || {
      id: "usr-" + Math.random().toString(36).substring(2, 9),
      name: email.split("@")[0] || "User",
      email: email,
      role: "user",
      memberSince: "Member",
    };

    setUser(fallbackUser);
    if (typeof window !== "undefined") {
      localStorage.setItem("findly_current_user", JSON.stringify(fallbackUser));
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase!.auth.signInWithPassword({ email, password });
      } catch (err) {
        console.warn("Supabase remote auth notice:", err);
      }
    }

    return {};
  };

  // Sign up handler
  const signUp = async (name: string, email: string, password: string): Promise<{ error?: string; requiresEmailConfirmation?: boolean }> => {
    const localUsers: User[] = JSON.parse(localStorage.getItem("findly_users") || "[]");
    const newUser: User = {
      id: "usr-" + Math.random().toString(36).substring(2, 9),
      name: name || email.split("@")[0] || "User",
      email,
      role: "user",
      memberSince: "Just Joined",
    };

    const existingIdx = localUsers.findIndex(u => u.email?.toLowerCase() === email.toLowerCase());
    if (existingIdx !== -1) {
      localUsers[existingIdx] = newUser;
    } else {
      localUsers.push(newUser);
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("findly_users", JSON.stringify(localUsers));
      localStorage.setItem("findly_current_user", JSON.stringify(newUser));
    }
    setUser(newUser);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase!.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
          },
        });
      } catch (err: unknown) {
        console.warn("Supabase remote signup exception:", err);
      }
    }

    return {};
  };

  // Direct Firebase Google OAuth Popup (accounts.google.com)
  const signInWithGoogle = async (): Promise<{ error?: string }> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const googleUser = result.user;

      const realGoogleUser: User = {
        id: googleUser.uid,
        name: googleUser.displayName || googleUser.email?.split("@")[0] || "Google User",
        email: googleUser.email || undefined,
        avatarUrl: googleUser.photoURL || undefined,
        role: "user",
        memberSince: "Google Member",
      };

      setUser(realGoogleUser);
      if (typeof window !== "undefined") {
        localStorage.setItem("findly_current_user", JSON.stringify(realGoogleUser));

        const localUsers: User[] = JSON.parse(localStorage.getItem("findly_users") || "[]");
        const existingIdx = localUsers.findIndex(u => u.email?.toLowerCase() === realGoogleUser.email?.toLowerCase());
        if (existingIdx !== -1) {
          localUsers[existingIdx] = realGoogleUser;
        } else {
          localUsers.push(realGoogleUser);
        }
        localStorage.setItem("findly_users", JSON.stringify(localUsers));
      }

      return {};
    } catch (err: unknown) {
      console.error("Firebase Google Sign-In error:", err);
      const code = (err as { code?: string })?.code || "";
      const msg = (err as { message?: string })?.message || "Google Sign-In failed.";

      if (code === "auth/popup-closed-by-user") {
        return { error: "Google sign-in window was closed before completing." };
      }
      if (code === "auth/configuration-not-found" || code === "auth/operation-not-allowed") {
        return { error: "Google Provider is disabled in Firebase. Please go to console.firebase.google.com -> Authentication -> Sign-in method -> Click Google -> Toggle Enable ON -> Click Save." };
      }
      if (code === "auth/unauthorized-domain") {
        return { error: "This domain is not authorized in Firebase. Go to Firebase Console -> Authentication -> Settings -> Authorized Domains -> Add localhost." };
      }

      return { error: `Firebase Google Auth Notice (${code}): ${msg}` };
    }
  };

  // Sign out handler
  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase!.auth.signOut();
      } catch (e) {
        console.warn("Sign out notice:", e);
      }
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("findly_current_user");
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isSupabase: isSupabaseConfigured,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
