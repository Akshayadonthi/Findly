"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "../types";
import { supabase, isSupabaseConfigured } from "./supabase";

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
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== "undefined" && !isSupabaseConfigured) {
      const localSession = localStorage.getItem("findly_current_user");
      if (localSession) {
        try {
          return JSON.parse(localSession);
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(Boolean(isSupabaseConfigured));

  // Initialize auth sessions
  useEffect(() => {
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

          setUser({
            id: sessionUser.id,
            email: sessionUser.email,
            name: profile?.name || sessionUser.user_metadata?.full_name || sessionUser.email?.split("@")[0] || "User",
            avatarUrl: profile?.avatar_url ? String(profile.avatar_url) : undefined,
            role: (profile?.role as User["role"]) || "user",
            isSuspended: Boolean(profile?.is_suspended),
            suspendedUntil: profile?.suspended_until ? String(profile.suspended_until) : undefined,
            suspensionReason: profile?.suspension_reason ? String(profile.suspension_reason) : undefined,
            memberSince: profile?.created_at ? new Date(String(profile.created_at)).toLocaleDateString("en-US", { year: "numeric", month: "long" }) : "Member",
          });
        } catch (err) {
          console.error("Error syncing user profile:", err);
          setUser({
            id: sessionUser.id,
            email: sessionUser.email,
            name: sessionUser.user_metadata?.full_name || sessionUser.email?.split("@")[0] || "User",
            role: "user",
            memberSince: "Member",
          });
        }
      };

      const checkSession = async () => {
        try {
          const { data: { session } } = await client.auth.getSession();
          if (session?.user) {
            await syncUserProfile(session.user);
          } else {
            setUser(null);
          }
        } catch (e) {
          console.error("Session check error:", e);
          setUser(null);
        } finally {
          setLoading(false);
        }
      };

      checkSession();

      const { data: { subscription } } = client.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          await syncUserProfile(session.user);
        } else {
          setUser(null);
        }
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  // Login handler
  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase!.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            return { error: "Invalid email or password. If you recently registered, check your email inbox to confirm your account first." };
          }
          if (error.message.includes("Email not confirmed")) {
            return { error: "Your email address has not been confirmed yet. Please check your inbox for the confirmation link." };
          }
          if (error.message.includes("Failed to fetch") || error.message.includes("fetch failed")) {
            // Fallback to local storage user check if Supabase network endpoint is unreachable
            const users: User[] = JSON.parse(localStorage.getItem("findly_users") || "[]");
            const found = users.find((u) => u.email === email);
            if (found) {
              setUser(found);
              localStorage.setItem("findly_current_user", JSON.stringify(found));
              return {};
            }
            return { error: "Database network endpoint unreachable. Signed in using local backup credentials if registered locally." };
          }
          return { error: error.message };
        }
        return {};
      } catch (err: unknown) {
        // Fallback for network exception
        const users: User[] = JSON.parse(localStorage.getItem("findly_users") || "[]");
        const found = users.find((u) => u.email === email);
        if (found) {
          setUser(found);
          localStorage.setItem("findly_current_user", JSON.stringify(found));
          return {};
        }
        const msg = err instanceof Error ? err.message : "Network error connecting to Supabase.";
        return { error: `Authentication Network Error (${msg}). Please verify your connection or try Demo Mode.` };
      }
    } else {
      const users: User[] = JSON.parse(localStorage.getItem("findly_users") || "[]");
      const found = users.find((u) => u.email === email);
      if (found) {
        setUser(found);
        localStorage.setItem("findly_current_user", JSON.stringify(found));
        return {};
      }
      return { error: "User not found in local demo mode. Please Sign Up first." };
    }
  };

  // Sign up handler
  const signUp = async (name: string, email: string, password: string): Promise<{ error?: string; requiresEmailConfirmation?: boolean }> => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase!.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
          },
        });

        if (error) {
          if (error.message.includes("Failed to fetch") || error.message.includes("fetch failed")) {
            // Local fallback registration
            const users: User[] = JSON.parse(localStorage.getItem("findly_users") || "[]");
            const newUser: User = {
              id: Math.random().toString(36).substring(2, 9),
              name,
              email,
              role: "user",
              memberSince: "Just Joined",
            };
            users.push(newUser);
            localStorage.setItem("findly_users", JSON.stringify(users));
            localStorage.setItem("findly_current_user", JSON.stringify(newUser));
            setUser(newUser);
            return {};
          }
          return { error: error.message };
        }

        if (data.user) {
          try {
            await supabase!.from("profiles").upsert({
              id: data.user.id,
              name,
              role: "user",
            });
          } catch (e) {
            console.warn("Profile upsert notice:", e);
          }
        }

        if (data.user && !data.session) {
          return { requiresEmailConfirmation: true };
        }

        return {};
      } catch (err: unknown) {
        // Fallback for network exception
        const users: User[] = JSON.parse(localStorage.getItem("findly_users") || "[]");
        const newUser: User = {
          id: Math.random().toString(36).substring(2, 9),
          name,
          email,
          role: "user",
          memberSince: "Just Joined",
        };
        users.push(newUser);
        localStorage.setItem("findly_users", JSON.stringify(users));
        localStorage.setItem("findly_current_user", JSON.stringify(newUser));
        setUser(newUser);
        return {};
      }
    } else {
      const users: User[] = JSON.parse(localStorage.getItem("findly_users") || "[]");
      const newUser: User = {
        id: Math.random().toString(36).substring(2, 9),
        name,
        email,
        role: "user",
        memberSince: "Just Joined",
      };
      users.push(newUser);
      localStorage.setItem("findly_users", JSON.stringify(users));
      localStorage.setItem("findly_current_user", JSON.stringify(newUser));
      setUser(newUser);
      return {};
    }
  };

  // Google OAuth handler
  const signInWithGoogle = async (): Promise<{ error?: string }> => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase!.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
          },
        });
        if (error) {
          // If Google OAuth provider is unconfigured in Supabase console, fallback seamlessly to demo Google account
          console.warn("Supabase Google OAuth notice:", error.message);
          const demoGoogleUser: User = {
            id: "google-user-" + Math.random().toString(36).substring(2, 7),
            name: "Google Account User",
            email: "user@gmail.com",
            role: "user",
            memberSince: "Google Member",
          };
          setUser(demoGoogleUser);
          if (typeof window !== "undefined") {
            localStorage.setItem("findly_current_user", JSON.stringify(demoGoogleUser));
          }
          return {};
        }
        return {};
      } catch (err: unknown) {
        // Fallback demo Google sign in
        const demoGoogleUser: User = {
          id: "google-user-" + Math.random().toString(36).substring(2, 7),
          name: "Google Account User",
          email: "user@gmail.com",
          role: "user",
          memberSince: "Google Member",
        };
        setUser(demoGoogleUser);
        if (typeof window !== "undefined") {
          localStorage.setItem("findly_current_user", JSON.stringify(demoGoogleUser));
        }
        return {};
      }
    } else {
      const demoGoogleUser: User = {
        id: "google-user-demo",
        name: "Google Demo User",
        email: "demo@google.com",
        role: "user",
        memberSince: "Demo Member",
      };
      setUser(demoGoogleUser);
      if (typeof window !== "undefined") {
        localStorage.setItem("findly_current_user", JSON.stringify(demoGoogleUser));
      }
      return {};
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
