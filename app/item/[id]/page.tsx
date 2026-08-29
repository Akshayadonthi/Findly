"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  MapPin,
  Calendar,
  Bookmark,
  BookmarkCheck,
  Share2,
  AlertTriangle,
  UserCheck,
  ChevronLeft,
  Info,
  DollarSign,
  Tag,
  ShieldCheck,
  CheckCircle2,
  MessageSquare,
  Phone,
  X
} from "lucide-react";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import ImageGallery from "@/components/items/ImageGallery";
import { ItemDetailsSkeleton } from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";
import { dbService } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { formatDate, getInitials } from "@/lib/utils";
import { Item } from "@/types";
import ShareModal from "@/components/items/ShareModal";

export default function DynamicItemPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user } = useAuth();

  const [item, setItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);

  const [showClaimNoticeModal, setShowClaimNoticeModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    const fetchItemData = async () => {
      setIsLoading(true);
      try {
        const itemData = await dbService.getItemById(id, user?.id);
        if (itemData) {
          setItem(itemData);
          setIsSaved(itemData.isSaved || false);
        }
      } catch (err) {
        console.error("Error loading item details:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItemData();
  }, [id, user]);

  const handleSaveToggle = async () => {
    if (!user) {
      router.push(`/login?redirect=/item/${id}`);
      return;
    }
    if (!item) return;

    const nextState = !isSaved;
    setIsSaved(nextState);
    setIsSaving(true);
    try {
      if (nextState) {
        await dbService.saveItem(item.id, user.id);
      } else {
        await dbService.unsaveItem(item.id, user.id);
      }
    } catch (err) {
      console.error("Save error:", err);
      setIsSaved(!nextState);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleStartChat = async () => {
    if (!user) {
      router.push(`/login?redirect=/item/${id}`);
      return;
    }
    if (!item) return;
    setIsStartingChat(true);
    try {
      const conv = await dbService.getOrCreateConversation(item.id, user.id, item.reporter.id);
      router.push(`/messages/${conv.id}`);
    } catch (err: unknown) {
      console.error("Error starting chat:", err);
    } finally {
      setIsStartingChat(false);
    }
  };

  const handleWhatsAppChat = () => {
    if (!item) return;
    const itemType = item.type || (item.status === "found" ? "found" : "lost");
    const currentUrl = typeof window !== "undefined" ? window.location.href : "";
    const text = encodeURIComponent(
      `Hi ${item.reporter.name.split(" ")[0]}! I saw your ${itemType} item listing for "${item.title}" on Findly: ${currentUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  if (isLoading) {
    return (
      <div className="py-8 md:py-12 bg-neutral-50 min-h-screen">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <ItemDetailsSkeleton />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="py-12 bg-neutral-50 min-h-screen">
        <EmptyState
          title="Item not found"
          description="The listing you are looking for does not exist or may have been deleted."
          actionLabel="Back to Browse"
          onAction={() => router.push("/lost")}
        />
      </div>
    );
  }

  const itemType = item.type || (item.status === "found" ? "found" : "lost");
  const isReporter = user?.id === item.reporter.id;
  const isReturned = item.status === "returned";

  return (
    <div className="py-8 md:py-12 bg-neutral-50 min-h-screen pb-24 md:pb-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Back Link */}
        <div>
          <Link
            href={itemType === "lost" ? "/lost" : "/found"}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to {itemType === "lost" ? "Lost Feed" : "Found Feed"}
          </Link>
        </div>

        {/* Details Card */}
        <div className="bg-white border border-neutral-100 rounded-3xl p-6 md:p-8 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Column 1: Image Gallery */}
          <div className="md:col-span-5 space-y-4">
            <ImageGallery
              images={item.images}
              fallbackCategory={item.category}
              title={item.title}
            />

            {/* Status indicators */}
            <div className="flex flex-wrap gap-2">
              <Badge variant={itemType === "lost" ? "lost" : "found"}>
                {itemType === "lost" ? "Lost Item" : "Found Item"}
              </Badge>
              {isReturned && (
                <span className="bg-success-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Item Returned
                </span>
              )}
            </div>
          </div>

          {/* Column 2: Details & Actions */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default">{item.category}</Badge>
                {item.color && <Badge variant="outline">Color: {item.color}</Badge>}
                {item.brand && <Badge variant="outline">Brand: {item.brand}</Badge>}
                {item.model && <Badge variant="outline">Model: {item.model}</Badge>}
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 leading-tight">
                {item.title}
              </h1>

              {/* Reward pill if available */}
              {item.reward && item.reward > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold">
                  <DollarSign className="h-4 w-4 text-amber-600" />
                  <span>Finder Reward Offered: ₹{item.reward}</span>
                </div>
              )}

              {/* Location and Date Specs */}
              <div className="grid grid-cols-2 gap-4 bg-neutral-50 p-4 border border-neutral-100 rounded-2xl text-xs font-semibold text-neutral-600">
                <div className="space-y-1">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Approximate Location</span>
                  <div className="flex items-center gap-1.5 text-neutral-800">
                    <MapPin className="h-4 w-4 text-primary-500 shrink-0" />
                    <span>{item.city ? `${item.city}, ${item.area}` : item.location}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Date Reported</span>
                  <div className="flex items-center gap-1.5 text-neutral-800">
                    <Calendar className="h-4 w-4 text-primary-500 shrink-0" />
                    <span>{formatDate(item.date)}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-neutral-900">Description</h4>
                <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-line">
                  {item.description}
                </p>
              </div>

              {/* Additional Specs */}
              {(item.identifyingFeatures || item.additionalNotes) && (
                <div className="space-y-2 border-t border-neutral-100 pt-3 text-xs text-neutral-600">
                  {item.identifyingFeatures && (
                    <div>
                      <strong className="text-neutral-800">Identifying Features: </strong>
                      {item.identifyingFeatures}
                    </div>
                  )}
                  {item.additionalNotes && (
                    <div>
                      <strong className="text-neutral-800">Additional Notes: </strong>
                      {item.additionalNotes}
                    </div>
                  )}
                </div>
              )}

              {/* Reporter Information */}
              <div className="flex items-center gap-3 pt-4 border-t border-neutral-100">
                <div className="h-10 w-10 rounded-full bg-primary-100 border border-primary-200/50 flex items-center justify-center font-bold text-primary-700 text-sm">
                  {getInitials(item.reporter.name)}
                </div>
                <div>
                  <h5 className="text-sm font-bold text-neutral-800">
                    {item.reporter.name}
                  </h5>
                  <p className="text-xs text-neutral-400">
                    {isReporter ? "You (Reporter)" : "Reporter"} &bull; {item.reporter.memberSince}
                  </p>
                </div>
              </div>

            </div>

            {/* Actions & Contact Buttons */}
            <div className="pt-6 border-t border-neutral-100 flex flex-col gap-3">
              
              {/* Prominent Contact Grid: Chat In-App + Chat on WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Primary In-App Messaging */}
                <Button
                  variant="primary"
                  className="gap-2 rounded-xl text-xs font-bold shadow-sm py-3"
                  isLoading={isStartingChat}
                  onClick={handleStartChat}
                >
                  <MessageSquare className="h-4.5 w-4.5" />
                  Chat In-App
                </Button>

                {/* Direct WhatsApp Contact */}
                <button
                  type="button"
                  onClick={handleWhatsAppChat}
                  className="inline-flex items-center justify-center gap-2 py-3 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-98"
                >
                  <Phone className="h-4.5 w-4.5 fill-white" />
                  Chat on WhatsApp
                </button>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  className="flex-1 gap-2 rounded-xl text-xs font-semibold border-neutral-200"
                  onClick={() => setShowClaimNoticeModal(true)}
                >
                  <UserCheck className="h-4 w-4 text-neutral-600" />
                  {itemType === "lost" ? "I Found This Item" : "This Might Be Mine"}
                </Button>

                <Button
                  variant="outline"
                  className="rounded-xl !p-2.5 border-neutral-200"
                  onClick={handleSaveToggle}
                  disabled={isSaving}
                  title="Save Item"
                >
                  {isSaved ? (
                    <BookmarkCheck className="h-5 w-5 text-primary-600 fill-primary-600" />
                  ) : (
                    <Bookmark className="h-5 w-5 text-neutral-600" />
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="rounded-xl !p-2.5 relative border-neutral-200"
                  onClick={handleShare}
                  title="Share Listing"
                >
                  <Share2 className="h-5 w-5 text-neutral-600" />
                  {copiedLink && (
                    <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[10px] px-2 py-1 rounded-md animate-scale-in">
                      Copied Link!
                    </span>
                  )}
                </Button>
              </div>

            </div>

          </div>
        </div>

      </div>

      {/* Verification Claim Modal */}
      {showClaimNoticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scale-in text-center">
            <div className="p-3 bg-primary-50 text-primary-600 rounded-full w-fit mx-auto border border-primary-100">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900">
              Handover Verification Claim
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Use the <strong>Chat In-App</strong> or <strong>Chat on WhatsApp</strong> buttons to communicate with the reporter and verify details.
            </p>
            <Button variant="primary" className="w-full" onClick={() => setShowClaimNoticeModal(false)}>
              Got It
            </Button>
          </div>
        </div>
      )}

      {/* Social Share Modal */}
      {item && (
        <ShareModal
          item={item}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}

    </div>
  );
}
