"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import Logo from "@/components/layout/Logo";
import { useAuth } from "@/lib/auth-context";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const { signUp, isSupabase } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!fullName) newErrors.fullName = "Full name is required";
    
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (validate()) {
      setIsSubmitting(true);
      try {
        const res = await signUp(fullName, email, password);
        if (res.error) {
          setErrorMessage(res.error);
        } else if (res.requiresEmailConfirmation) {
          setInfoMessage("Registration successful! A confirmation email has been sent to your inbox. Please click the link to verify your account before logging in.");
        } else {
          router.push("/");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "An unexpected registration error occurred.";
        setErrorMessage(msg);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleGoogleSignup = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
          },
        });
        if (error) {
          setErrorMessage(error.message);
        }
      } else {
        await signUp("SSO User", "sso-login@university.edu", "google-sso-dummy-pass");
        router.push("/");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google sign-in error.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-neutral-50 min-h-screen">
      <div className="max-w-md w-full bg-white rounded-3xl border border-neutral-100 p-8 shadow-md space-y-6">
        
        {/* Logo and Intro */}
        <div className="text-center space-y-2">
          <Logo size="lg" className="mx-auto" />
          <h2 className="text-2xl font-extrabold text-neutral-900">Create Account</h2>
          <p className="text-xs text-neutral-400">
            Join the Findly community to register missing items and coordinate claims.
          </p>
        </div>

        {/* Database indicator notice */}
        <div className="px-4 py-2 flex items-center justify-between text-[11px] font-semibold text-neutral-500 bg-neutral-50 border border-neutral-100 rounded-xl select-none">
          <span>Database Mode:</span>
          <span className="text-primary-600 uppercase font-bold">{isSupabase ? "Supabase Live" : "Demo Storage"}</span>
        </div>

        {/* Info / Success message alert */}
        {infoMessage && (
          <div className="flex gap-2.5 p-4 bg-success-50 border border-success-100 rounded-2xl text-xs text-success-700 leading-relaxed animate-scale-in">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 text-success-600" />
            <p className="font-medium">{infoMessage}</p>
          </div>
        )}

        {/* Error message alert */}
        {errorMessage && (
          <div className="flex gap-2.5 p-4 bg-danger-50 border border-danger-100 rounded-2xl text-xs text-danger-700 leading-relaxed animate-scale-in">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 text-danger-600" />
            <p className="font-medium">{errorMessage}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSignupSubmit} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            leftIcon={<User className="h-5 w-5 text-neutral-400" />}
            error={errors.fullName}
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="name@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="h-5 w-5 text-neutral-400" />}
            error={errors.email}
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="h-5 w-5 text-neutral-400" />}
              error={errors.password}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-neutral-400 hover:text-neutral-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              }
            />
          </div>

          <Input
            label="Confirm Password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={<Lock className="h-5 w-5 text-neutral-400" />}
            error={errors.confirmPassword}
          />

          <Button type="submit" variant="primary" className="w-full mt-6" isLoading={isSubmitting}>
            Create Account
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center justify-center gap-2 text-neutral-300 font-bold text-xs uppercase my-4">
          <span className="h-px bg-neutral-100 flex-1"></span>
          <span className="text-[10px] text-neutral-400 select-none">Or continue with</span>
          <span className="h-px bg-neutral-100 flex-1"></span>
        </div>

        {/* Third Party Login */}
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2 border-neutral-200 text-neutral-700 font-semibold"
          onClick={handleGoogleSignup}
        >
          {/* Custom SVG Google logo */}
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </Button>

        {/* Login redirection link */}
        <p className="text-center text-xs text-neutral-500 font-medium">
          Already have an account?{" "}
          <Link href="/login" className="text-primary-600 hover:underline font-bold">
            Log In
          </Link>
        </p>

      </div>
    </div>
  );
}
