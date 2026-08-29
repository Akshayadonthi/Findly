"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, CheckCheck, X, Sparkles, FileCheck, MessageSquare, Info } from "lucide-react";
import { Notification, NotificationType } from "@/types/notification";
import { dbService } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { formatDate } from "@/lib/utils";
import Button from "@/components/ui/button";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) return;

    const fetchNotifs = async () => {
      setIsLoading(true);
      try {
        const notifs = await dbService.getNotifications(user.id);
        setNotifications(notifs);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifs();
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleMarkAsRead = async (id: string) => {
    if (!user) return;
    try {
      await dbService.markNotificationAsRead(user.id, id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      await dbService.markAllNotificationsAsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filterType === "all") return true;
    if (filterType === "unread") return !n.isRead;
    return n.type === filterType;
  });

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "match":
        return <Sparkles className="h-4 w-4 text-purple-600" />;
      case "claim":
        return <FileCheck className="h-4 w-4 text-emerald-600" />;
      case "message":
        return <MessageSquare className="h-4 w-4 text-primary-600" />;
      default:
        return <Info className="h-4 w-4 text-amber-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-neutral-900/50 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-left">
        
        {/* Drawer Header */}
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary-50 rounded-xl text-primary-600">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 text-base">Notifications</h3>
              <p className="text-xs text-neutral-500">Stay updated on matches, claims, and messages</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter Controls & Mark All Read */}
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between gap-2 bg-white">
          <div className="flex bg-neutral-100 p-1 rounded-xl text-xs font-semibold gap-1">
            {["all", "unread", "match", "claim"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilterType(tab)}
                className={`px-2.5 py-1 rounded-lg capitalize transition-all ${
                  filterType === tab ? "bg-white text-neutral-900 shadow-sm font-bold" : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleMarkAllRead}
            className="text-xs text-primary-600 hover:text-primary-800 font-semibold flex items-center gap-1 shrink-0"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        </div>

        {/* Notification Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 p-2">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-neutral-400">Loading notifications...</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-16 text-center text-neutral-400 space-y-2">
              <Bell className="h-8 w-8 mx-auto opacity-30" />
              <p className="text-xs font-semibold">No notifications found.</p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              return (
                <div
                  key={notif.id}
                  className={`p-3.5 rounded-2xl transition-all flex gap-3 items-start ${
                    !notif.isRead ? "bg-primary-50/30 border border-primary-100/50" : "hover:bg-neutral-50"
                  }`}
                >
                  <div className="p-2 bg-white rounded-xl shadow-xs border border-neutral-100 shrink-0 mt-0.5">
                    {getIcon(notif.type)}
                  </div>

                  {notif.link ? (
                    <Link
                      href={notif.link}
                      onClick={() => { handleMarkAsRead(notif.id); onClose(); }}
                      className="flex-1 min-w-0"
                    >
                      <div className="flex justify-between items-start gap-1">
                        <h4 className={`text-xs font-bold ${!notif.isRead ? "text-neutral-900" : "text-neutral-700"}`}>
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-neutral-400 shrink-0">{formatDate(notif.createdAt)}</span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                    </Link>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-1">
                        <h4 className={`text-xs font-bold ${!notif.isRead ? "text-neutral-900" : "text-neutral-700"}`}>
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-neutral-400 shrink-0">{formatDate(notif.createdAt)}</span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  )}

                  {!notif.isRead && (
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(notif.id)}
                      title="Mark as read"
                      className="h-2 w-2 rounded-full bg-primary-600 shrink-0 mt-2 hover:scale-125 transition-transform"
                    />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100 text-center bg-neutral-50/50">
          <Button variant="ghost" size="sm" className="text-xs font-semibold text-neutral-500" onClick={onClose}>
            Close Notifications
          </Button>
        </div>

      </div>
    </div>
  );
};

export default NotificationDrawer;
