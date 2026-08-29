"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  PlusCircle,
  LogIn,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  LayoutDashboard,
  Package,
  Bookmark,
  MessageSquare,
  ShieldCheck,
  ShieldAlert,
  Bell
} from "lucide-react";
import Logo from "./Logo";
import Button from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { getInitials } from "@/lib/utils";
import { dbService } from "@/lib/db";
import NotificationDrawer from "@/components/notifications/NotificationDrawer";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  const { user, signOut } = useAuth();
  const role = user?.role || "user";

  React.useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const notifs = await dbService.getNotifications(user.id);
        setUnreadNotifCount(notifs.filter(n => !n.isRead).length);
      } catch (e) {
        console.error("Error loading notification count:", e);
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [user, showNotifDrawer]);

  const navLinks = [
    { name: "Browse Lost", href: "/lost" },
    { name: "Browse Found", href: "/found" },
    { name: "How It Works", href: "/how-it-works" },
    { name: "Safety", href: "/safety" },
  ];

  const isActive = (path: string) => pathname === path;

  const handleSignOut = () => {
    signOut();
    setShowDropdown(false);
    setIsOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Logo */}
          <div className="flex-shrink-0">
            <Logo size="md" />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "text-primary-600 bg-primary-50/50"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                {link.name}
              </Link>
            ))}

            {user && (
              <Link
                href="/messages"
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                  isActive("/messages")
                    ? "text-primary-600 bg-primary-50/50"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                <MessageSquare className="h-4 w-4" /> Messages
              </Link>
            )}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2 relative">
            <Link href="/search">
              <Button variant="ghost" size="sm" className="h-10 w-10 !p-0 rounded-full">
                <Search className="h-5 w-5 text-neutral-600" />
              </Button>
            </Link>

            {/* Authenticated State */}
            {user ? (
              <div className="flex items-center gap-2 relative">
                {/* Notification Bell Button */}
                <button
                  type="button"
                  onClick={() => setShowNotifDrawer(true)}
                  className="relative p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors"
                  title="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotifCount > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 bg-danger-600 text-white font-bold text-[10px] rounded-full flex items-center justify-center shadow-xs animate-pulse">
                      {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                    </span>
                  )}
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="h-10 w-10 rounded-full bg-primary-100 border border-primary-200/50 flex items-center justify-center font-bold text-primary-700 text-sm focus:outline-none hover:bg-primary-200 transition-colors"
                  >
                    {getInitials(user.name)}
                  </button>

                {/* Desktop Dropdown */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2.5 w-60 bg-white border border-neutral-100 rounded-2xl shadow-xl py-2 z-50 animate-scale-in">
                    <div className="px-4 py-2 border-b border-neutral-50">
                      <p className="text-sm font-bold text-neutral-800 truncate">{user.name}</p>
                      <p className="text-[10px] text-neutral-400 font-semibold uppercase">Role: {role}</p>
                    </div>
                    
                    <div className="py-1 border-b border-neutral-50">
                      <Link
                        href="/dashboard"
                        onClick={() => setShowDropdown(false)}
                        className="px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                      >
                        <LayoutDashboard className="h-3.5 w-3.5 text-neutral-400" />
                        Dashboard
                      </Link>

                      <Link
                        href="/messages"
                        onClick={() => setShowDropdown(false)}
                        className="px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-neutral-400" />
                        Messages Hub
                      </Link>

                      {(role === "admin" || role === "moderator") && (
                        <Link
                          href="/moderator"
                          onClick={() => setShowDropdown(false)}
                          className="px-4 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 flex items-center gap-2"
                        >
                          <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                          Moderator Center
                        </Link>
                      )}

                      {role === "admin" && (
                        <Link
                          href="/admin"
                          onClick={() => setShowDropdown(false)}
                          className="px-4 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-50 flex items-center gap-2"
                        >
                          <ShieldCheck className="h-3.5 w-3.5 text-primary-600" />
                          Admin Portal
                        </Link>
                      )}

                      <Link
                        href="/my-items"
                        onClick={() => setShowDropdown(false)}
                        className="px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                      >
                        <Package className="h-3.5 w-3.5 text-neutral-400" />
                        My Items
                      </Link>
                      <Link
                        href="/saved"
                        onClick={() => setShowDropdown(false)}
                        className="px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                      >
                        <Bookmark className="h-3.5 w-3.5 text-neutral-400" />
                        Saved Items
                      </Link>
                      <Link
                        href="/profile"
                        onClick={() => setShowDropdown(false)}
                        className="px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                      >
                        <UserIcon className="h-3.5 w-3.5 text-neutral-400" />
                        Profile
                      </Link>
                    </div>

                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-xs text-danger-600 hover:bg-danger-50 font-semibold flex items-center gap-2 transition-colors mt-1"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
                </div>
              </div>
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="sm" className="gap-2 text-neutral-700">
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
              </Link>
            )}

            <div className="h-4 w-px bg-neutral-200 mx-1"></div>

            <Link href="/report/found">
              <Button
                variant="outline"
                size="sm"
                className="border-neutral-200 text-neutral-700 text-xs font-semibold rounded-xl"
              >
                Report Found
              </Button>
            </Link>

            <Link href="/report/lost">
              <Button
                variant="primary"
                size="sm"
                className="gap-1.5 text-xs font-semibold rounded-xl"
              >
                <PlusCircle className="h-4 w-4" />
                Report Lost
              </Button>
            </Link>
          </div>

          {/* Mobile Hamburger menu button */}
          <div className="flex md:hidden items-center gap-2">
            <Link href="/search">
              <Button variant="ghost" size="sm" className="h-9 w-9 !p-0 rounded-full">
                <Search className="h-4 w-4 text-neutral-600" />
              </Button>
            </Link>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 focus:outline-none transition-colors"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Dropdown Panel */}
      {isOpen && (
        <div className="md:hidden border-t border-neutral-100 bg-white px-4 py-4 space-y-3 shadow-lg animate-slide-down">
          {user && (
            <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-100/50">
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-700 text-sm">
                {getInitials(user.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-neutral-800 truncate">{user.name}</p>
                <p className="text-[10px] text-neutral-400 font-semibold uppercase">Role: {role}</p>
              </div>
            </div>
          )}

          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-base font-medium transition-colors ${
                  isActive(link.href)
                    ? "text-primary-600 bg-primary-50/50"
                    : "text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                {link.name}
              </Link>
            ))}

            {user && (
              <>
                <Link
                  href="/messages"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-2.5 rounded-xl text-base font-medium text-neutral-600 hover:bg-neutral-50"
                >
                  Messages Hub
                </Link>
                {(role === "admin" || role === "moderator") && (
                  <Link
                    href="/moderator"
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-2.5 rounded-xl text-base font-semibold text-amber-700 hover:bg-amber-50"
                  >
                    Moderator Center
                  </Link>
                )}
                {role === "admin" && (
                  <Link
                    href="/admin"
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-2.5 rounded-xl text-base font-semibold text-primary-700 hover:bg-primary-50"
                  >
                    Admin Portal
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-2.5 rounded-xl text-base font-medium text-neutral-600 hover:bg-neutral-50"
                >
                  Dashboard
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Notification Drawer Panel */}
      <NotificationDrawer
        isOpen={showNotifDrawer}
        onClose={() => setShowNotifDrawer(false)}
      />
    </header>
  );
};

export default Navbar;
