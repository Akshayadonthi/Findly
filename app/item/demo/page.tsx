"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MapPin, Calendar, Bookmark, BookmarkCheck, Share2, AlertTriangle, UserCheck, MessageSquare, ChevronLeft, Laptop, ShieldCheck, Sparkles, Check, CheckCircle2, ArrowRight } from "lucide-react";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { DEMO_ITEMS, DEMO_MATCH, CATEGORIES } from "@/lib/demo-data";
import { formatDate, getInitials } from "@/lib/utils";

export default function ItemDemoPage() {
  const [demoType, setDemoType] = useState<"lost" | "found">("lost");
  const [isSaved, setIsSaved] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimText, setClaimText] = useState("");
  const [claimSubmitted, setClaimSubmitted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const sampleItem = {
    id: "sample-1",
    title: "Sample Laptop Listing",
    description: "Sample listing preview for testing item details.",
    category: "Electronics",
    type: demoType,
    status: demoType,
    location: "Campus Area",
    city: "Chennai",
    area: "Campus Area",
    date: "2026-09-19",
    color: "Silver",
    brand: "Apple",
    reporter: { id: "u1", name: "Community Reporter", memberSince: "2026" },
  };

  // Toggle between lost item demo and found item demo with safety fallback
  const item = (demoType === "lost" ? DEMO_ITEMS[0] : DEMO_ITEMS[5]) || sampleItem;

  const handleShare = () => {
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (claimText.trim()) {
      setClaimSubmitted(true);
    }
  };

  const getCategoryIcon = (category: string) => {
    const props = { className: "h-16 w-16 text-white" };
    return <Laptop {...props} />;
  };

  const getCategoryGradient = (category: string) => {
    return item.status === "lost"
      ? "from-blue-600 to-indigo-500 shadow-blue-500/10"
      : "from-emerald-600 to-teal-500 shadow-emerald-500/10";
  };

  return (
    <div className="py-8 md:py-12 bg-neutral-50 min-h-screen">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Back Link and Demo Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link href={item.status === "lost" ? "/lost" : "/found"} className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-900 transition-colors">
            <ChevronLeft className="h-4 w-4" />
            Back to feed
          </Link>

          {/* Toggle between Lost & Found item demo */}
          <div className="flex bg-neutral-200/60 p-1 rounded-xl w-fit border border-neutral-300/40 text-xs">
            <span className="self-center px-2 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Demo Item:</span>
            <button
              onClick={() => {
                setDemoType("lost");
                setClaimSubmitted(false);
                setClaimText("");
              }}
              className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
                demoType === "lost" ? "bg-white text-neutral-900 shadow-xs" : "text-neutral-500"
              }`}
            >
              Lost AirPods
            </button>
            <button
              onClick={() => {
                setDemoType("found");
                setClaimSubmitted(false);
                setClaimText("");
              }}
              className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
                demoType === "found" ? "bg-white text-neutral-900 shadow-xs" : "text-neutral-500"
              }`}
            >
              Found Wallet
            </button>
          </div>
        </div>

        {/* Main Details Card Layout */}
        <div className="bg-white border border-neutral-100 rounded-3xl p-6 md:p-8 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Column 1: Image Showcase (md:col-span-5) */}
          <div className="md:col-span-5 space-y-4">
            <div className={`aspect-square w-full rounded-2xl bg-gradient-to-br flex flex-col items-center justify-center relative shadow-inner overflow-hidden ${getCategoryGradient(item.category)}`}>
              <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]"></div>
              {getCategoryIcon(item.category)}
              <span className="text-xs font-bold text-white/70 uppercase tracking-wider mt-2">{item.category}</span>
              
              <div className="absolute top-4 left-4">
                <Badge variant={item.status === "lost" ? "lost" : "found"}>
                  {item.status === "lost" ? "Lost" : "Found"}
                </Badge>
              </div>
            </div>
            
            {/* Image Gallery placeholders */}
            <div className="grid grid-cols-3 gap-2">
              <div className="aspect-square rounded-xl bg-neutral-100 border border-neutral-200/50 flex items-center justify-center text-xs font-bold text-neutral-400 select-none">
                Photo 1
              </div>
              <div className="aspect-square rounded-xl bg-neutral-100 border border-neutral-200/50 flex items-center justify-center text-xs font-bold text-neutral-400 select-none">
                Photo 2
              </div>
              <div className="aspect-square rounded-xl bg-neutral-100 border border-neutral-200/50 flex items-center justify-center text-xs font-bold text-neutral-400 select-none">
                Photo 3
              </div>
            </div>
          </div>

          {/* Column 2: Specs & Description (md:col-span-7) */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Badges & Date */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default">{item.category}</Badge>
                {item.color && <Badge variant="outline">Color: {item.color}</Badge>}
                {item.brand && <Badge variant="outline">Brand: {item.brand}</Badge>}
              </div>

              {/* Title */}
              <h2 className="text-2xl md:text-3xl font-extrabold text-neutral-900 leading-tight">
                {item.title}
              </h2>

              {/* Location and Date */}
              <div className="grid grid-cols-2 gap-4 bg-neutral-50 p-4 border border-neutral-100 rounded-2xl text-xs font-semibold text-neutral-600">
                <div className="space-y-1">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Approximate Location</span>
                  <div className="flex items-center gap-1.5 text-neutral-800">
                    <MapPin className="h-4 w-4 text-primary-500" />
                    <span>{item.location}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Date Reported</span>
                  <div className="flex items-center gap-1.5 text-neutral-800">
                    <Calendar className="h-4 w-4 text-primary-500" />
                    <span>{formatDate(item.date)}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-neutral-900">Description</h4>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Poster info */}
              <div className="flex items-center gap-3 pt-4 border-t border-neutral-100">
                <div className="h-10 w-10 rounded-full bg-primary-100 border border-primary-200/50 flex items-center justify-center font-bold text-primary-700 text-sm">
                  {getInitials(item.reporter.name)}
                </div>
                <div>
                  <h5 className="text-sm font-bold text-neutral-800">{item.reporter.name}</h5>
                  <p className="text-xs text-neutral-400">Reporter &bull; Member since 2026</p>
                </div>
              </div>
            </div>

            {/* Actions Grid */}
            <div className="pt-6 border-t border-neutral-100 flex flex-col gap-3">
              <div className="flex gap-2">
                {item.status === "lost" ? (
                  <Button
                    variant="primary"
                    className="flex-1 gap-2 rounded-xl"
                    onClick={() => setShowClaimModal(true)}
                  >
                    <UserCheck className="h-4.5 w-4.5" />
                    This Might Be Mine
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    className="flex-1 gap-2 rounded-xl"
                    onClick={() => setShowClaimModal(true)}
                  >
                    <UserCheck className="h-4.5 w-4.5" />
                    I Found This Item
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  className="rounded-xl !p-2.5"
                  onClick={() => setIsSaved(!isSaved)}
                >
                  {isSaved ? (
                    <BookmarkCheck className="h-5 w-5 text-primary-600 fill-primary-600" />
                  ) : (
                    <Bookmark className="h-5 w-5 text-neutral-600" />
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="rounded-xl !p-2.5 relative"
                  onClick={handleShare}
                >
                  <Share2 className="h-5 w-5 text-neutral-600" />
                  {copiedLink && (
                    <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[10px] px-2 py-1 rounded-md animate-scale-in">
                      Copied!
                    </span>
                  )}
                </Button>
              </div>

              <div className="flex justify-center">
                <Button variant="link" className="text-xs text-danger-600 hover:text-danger-700 font-semibold gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Report Listing
                </Button>
              </div>
            </div>

          </div>
        </div>

        {/* Smart Matching Box: Displayed only for AirPods Pro Demo (Lost mode) */}
        {demoType === "lost" && (
          <div className="bg-gradient-to-r from-primary-50 to-indigo-50/50 border border-primary-100/60 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-lg">
              <div className="inline-flex items-center gap-1 bg-primary-100 border border-primary-200 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold text-primary-800 uppercase tracking-wider">
                <Sparkles className="h-3 w-3 fill-primary-800/10" />
                <span>Smart Match Alert</span>
              </div>
              <h4 className="text-base font-bold text-neutral-900">
                Potential match detected (87% match score)
              </h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                A finder reported a pair of &quot;Black wireless earbuds&quot; at the Central Library on the same day you lost yours. The items share the same category, location, and color attributes.
              </p>
            </div>
            
            <button 
              onClick={() => setShowClaimModal(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl shadow-md shadow-primary-500/10 shrink-0 transition-all active:scale-95"
            >
              Verify Match Details
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

      </div>

      {/* Claim / Ownership Verification Modal overlay */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-scale-in">
            {/* Header */}
            <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-neutral-900">
                {item.status === "lost" ? "Claim Ownership" : "Provide Found Location"}
              </h3>
              <button onClick={() => { setShowClaimModal(false); setClaimSubmitted(false); }} className="p-1 text-neutral-400 hover:text-neutral-600 rounded-full">
                <ChevronLeft className="h-5 w-5 rotate-180" />
              </button>
            </div>

            {/* Content */}
            {!claimSubmitted ? (
              <form onSubmit={handleClaimSubmit} className="p-6 space-y-4">
                <div className="flex gap-2.5 p-3.5 bg-primary-50 border border-primary-100 rounded-2xl text-xs text-primary-700 leading-relaxed">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-primary-600" />
                  <p>
                    <strong>Safety First:</strong> For security, do not guess. Provide specific proof of ownership such as serial numbers, screen locks, or custom markings.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-neutral-700">
                    {item.status === "lost"
                      ? "Describe unique descriptors only you would know: *"
                      : "Describe exactly where/how you found this or who you left it with: *"}
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder={
                      item.status === "lost"
                        ? "e.g. Serial number ends in XY7, there is a small blue marker dot on the bottom inside case, it has a custom name on bluetooth..."
                        : "e.g. I found this card on the bench near Quad science entry at 3 PM and handed it to Professor Miller in Room 204..."
                    }
                    className="w-full px-4 py-2.5 bg-white border border-neutral-200 focus:border-primary-500 focus:ring-primary-500/10 text-neutral-900 rounded-xl text-sm placeholder-neutral-400 focus:outline-none focus:ring-2"
                    value={claimText}
                    onChange={(e) => setClaimText(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowClaimModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    Submit Verification
                  </Button>
                </div>
              </form>
            ) : (
              <div className="p-6 text-center space-y-4">
                <div className="p-3 bg-success-50 rounded-full text-success-600 w-fit mx-auto border border-success-100">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h4 className="text-xl font-bold text-neutral-900">Verification Submitted!</h4>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Your verification details have been received. In Phase 2, this will send a high-priority match request notification directly to <strong>{item.reporter.name}</strong> to initiate a secure connection.
                </p>
                <Button variant="primary" className="w-full pt-1" onClick={() => { setShowClaimModal(false); setClaimSubmitted(false); }}>
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
