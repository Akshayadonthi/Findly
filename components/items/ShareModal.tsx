"use client";

import React, { useState } from "react";
import { X, Copy, Check, Share2, Phone, Send, Globe, MessageCircle } from "lucide-react";
import { Item } from "@/types";
import Button from "@/components/ui/button";

interface ShareModalProps {
  item: Item;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ item, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const itemType = item.type || (item.status === "found" ? "found" : "lost");
  const pageUrl = typeof window !== "undefined" ? window.location.href : `https://findly.app/item/${item.id}`;

  const shareText = `🚨 ${itemType.toUpperCase()} ITEM: "${item.title}" reported in ${item.city || item.location}.\nHave you seen it? Check details on Findly:\n${pageUrl}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const sharePlatforms = [
    {
      name: "WhatsApp",
      icon: Phone,
      bgColor: "bg-[#25D366] text-white hover:bg-[#20bd5a]",
      url: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
    },
    {
      name: "X (Twitter)",
      icon: MessageCircle,
      bgColor: "bg-black text-white hover:bg-neutral-800",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
    },
    {
      name: "Telegram",
      icon: Send,
      bgColor: "bg-[#0088cc] text-white hover:bg-[#0077b3]",
      url: `https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(`🚨 ${itemType.toUpperCase()} ITEM: "${item.title}"`)}`,
    },
    {
      name: "Facebook",
      icon: Globe,
      bgColor: "bg-[#1877F2] text-white hover:bg-[#166fe5]",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-5 animate-scale-in border border-neutral-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary-50 rounded-xl text-primary-600">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900">Share Listing</h3>
              <p className="text-xs text-neutral-500">Help increase visibility by sharing with others</p>
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

        {/* Formatted Preview Card */}
        <div className="p-4 bg-neutral-50 border border-neutral-100 rounded-2xl space-y-1.5 text-xs">
          <span className="font-bold text-primary-600 uppercase tracking-wider text-[10px]">
            {itemType === "lost" ? "Lost Item Listing" : "Found Item Listing"}
          </span>
          <h4 className="font-extrabold text-neutral-900 text-sm truncate">{item.title}</h4>
          <p className="text-neutral-500 line-clamp-2">{item.description}</p>
          <p className="text-neutral-400 text-[10px]">📍 {item.city ? `${item.city}, ${item.area}` : item.location}</p>
        </div>

        {/* Platform Share Buttons */}
        <div className="grid grid-cols-2 gap-3">
          {sharePlatforms.map((platform) => {
            const Icon = platform.icon;
            return (
              <a
                key={platform.name}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 ${platform.bgColor}`}
              >
                <Icon className="h-4 w-4" />
                <span>{platform.name}</span>
              </a>
            );
          })}
        </div>

        {/* Copy Direct Link */}
        <div className="space-y-2 pt-2 border-t border-neutral-100">
          <label className="text-xs font-bold text-neutral-700">Copy Direct Link</label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={pageUrl}
              className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-neutral-600 truncate focus:outline-none"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="gap-1.5 text-xs font-bold shrink-0 border-neutral-200"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-success-600" />
                  <span className="text-success-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-neutral-600" />
                  <span>Copy</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Close action */}
        <Button variant="ghost" className="w-full text-xs font-bold" onClick={onClose}>
          Done
        </Button>

      </div>
    </div>
  );
};

export default ShareModal;
