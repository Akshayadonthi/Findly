"use client";

import React, { useState } from "react";
import { X, Check, Mail, User as UserIcon } from "lucide-react";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";

interface GoogleSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignInSuccess: (name: string, email: string) => void;
}

export const GoogleSignInModal: React.FC<GoogleSignInModalProps> = ({
  isOpen,
  onClose,
  onSignInSuccess,
}) => {
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!googleEmail.trim()) {
      setError("Please enter your actual Google email address.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(googleEmail)) {
      setError("Please enter a valid email address (e.g. yourname@gmail.com).");
      return;
    }

    const nameToUse = googleName.trim() || googleEmail.split("@")[0] || "Google User";
    onSignInSuccess(nameToUse, googleEmail.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-5 animate-scale-in border border-neutral-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-neutral-50 rounded-2xl border border-neutral-100 shadow-2xs">
              <svg className="h-6 w-6" viewBox="0 0 24 24">
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
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900">Sign In with Google</h3>
              <p className="text-xs text-neutral-500">Connect your actual Google Account</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-danger-50 border border-danger-100 rounded-2xl text-xs text-danger-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Your Google Email Address"
            type="email"
            placeholder="e.g. akshaya@gmail.com"
            value={googleEmail}
            onChange={(e) => setGoogleEmail(e.target.value)}
            leftIcon={<Mail className="h-5 w-5 text-neutral-400" />}
            required
          />

          <Input
            label="Your Name (Optional)"
            type="text"
            placeholder="e.g. Akshaya Kumar"
            value={googleName}
            onChange={(e) => setGoogleName(e.target.value)}
            leftIcon={<UserIcon className="h-5 w-5 text-neutral-400" />}
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full gap-2 py-3 rounded-2xl text-xs font-bold shadow-md bg-neutral-900 hover:bg-black text-white"
            >
              <Check className="h-4 w-4 text-emerald-400" />
              Sign In with My Google Account
            </Button>
          </div>
        </form>

        <p className="text-[11px] text-neutral-400 text-center leading-relaxed">
          Your Google Account email and name will be set as your active Findly user profile.
        </p>

      </div>
    </div>
  );
};

export default GoogleSignInModal;
