"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Flag, Trash2, Ban, Eye, X, CheckCircle2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import Button from "@/components/ui/button";
import { Report } from "@/types";
import { dbService } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { formatDate } from "@/lib/utils";

export default function AdminReportsPage() {
  const { user: activeAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [statusTab, setStatusTab] = useState<string>("all");

  const [actionTarget, setActionTarget] = useState<Report | null>(null);
  const [actionType, setActionType] = useState<"remove" | "suspend" | "dismiss" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      try {
        const data = await dbService.getReports(statusTab);
        setReports(data);
      } catch (err) {
        console.error("Error fetching reports:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, [statusTab]);

  const handleActionConfirm = async () => {
    if (!actionTarget || !actionType || !activeAdmin) return;
    setIsProcessing(true);

    try {
      if (actionType === "remove" && actionTarget.itemId) {
        await dbService.deleteItem(actionTarget.itemId, activeAdmin.id);
        await dbService.updateReportStatus(actionTarget.id, "resolved", activeAdmin.id);
        await dbService.logAdminActivity(activeAdmin.id, "Removed reported listing", "item", actionTarget.itemId);
        
        // Notify reporter
        await dbService.createNotification(
          actionTarget.reporterId,
          "system",
          "Report Resolved",
          "Thank you for helping keep Findly safe. The reported listing has been reviewed and removed."
        );
      } else if (actionType === "suspend" && actionTarget.reportedUserId) {
        await dbService.setUserSuspension(actionTarget.reportedUserId, true, actionTarget.reason, activeAdmin.id);
        await dbService.updateReportStatus(actionTarget.id, "resolved", activeAdmin.id);
        
        await dbService.createNotification(
          actionTarget.reportedUserId,
          "system",
          "Account Status Warning",
          `Your account has been suspended due to policy violation: ${actionTarget.reason}.`
        );
      } else if (actionType === "dismiss") {
        await dbService.updateReportStatus(actionTarget.id, "dismissed", activeAdmin.id);
        await dbService.logAdminActivity(activeAdmin.id, "Dismissed report", "report", actionTarget.id);
      }

      setReports((prev) => prev.filter((r) => r.id !== actionTarget.id));
      setActionTarget(null);
      setActionType(null);
    } catch (err) {
      console.error("Action error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AdminLayout requiredRole="admin">
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-white">Centralized Reports Queue</h1>
            <p className="text-xs text-neutral-400">Review flagged items, reported user behaviors, and policy violations.</p>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs font-bold gap-1 w-fit">
          {["all", "pending", "under_review", "resolved", "dismissed"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusTab(st)}
              className={`px-3.5 py-1.5 rounded-lg capitalize transition-all ${
                statusTab === st ? "bg-primary-600 text-white shadow-sm" : "text-neutral-400 hover:text-white"
              }`}
            >
              {st.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Reports Grid */}
        {isLoading ? (
          <div className="py-12 text-center text-xs text-neutral-500">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="py-12 text-center text-xs text-neutral-500 bg-neutral-950 rounded-2xl border border-neutral-800">
            No reports found in this queue.
          </div>
        ) : (
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden divide-y divide-neutral-800">
            {reports.map((r) => (
              <div key={r.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-500/20 text-amber-300 text-[11px] font-bold px-2 py-0.5 rounded-md">
                      Reason: {r.reason}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-semibold uppercase">
                      Status: {r.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    {r.item ? `Listing: "${r.item.title}"` : "User Behavior Report"}
                  </h4>
                  {r.description && <p className="text-xs text-neutral-400">{r.description}</p>}
                  <p className="text-[10px] text-neutral-500">Reported on {formatDate(r.createdAt)}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {r.itemId && (
                    <Link href={`/item/${r.itemId}`}>
                      <Button variant="ghost" size="sm" className="text-xs text-neutral-300 border border-neutral-800">
                        <Eye className="h-3.5 w-3.5 mr-1" /> View Listing
                      </Button>
                    </Link>
                  )}

                  {r.status === "pending" && (
                    <>
                      {r.itemId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-danger-400 border border-danger-900/40 hover:bg-danger-900/20"
                          onClick={() => {
                            setActionTarget(r);
                            setActionType("remove");
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                        </Button>
                      )}

                      {r.reportedUserId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-danger-400 border border-danger-900/40 hover:bg-danger-900/20"
                          onClick={() => {
                            setActionTarget(r);
                            setActionType("suspend");
                          }}
                        >
                          <Ban className="h-3.5 w-3.5 mr-1" /> Suspend
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-neutral-400 border border-neutral-800"
                        onClick={() => {
                          setActionTarget(r);
                          setActionType("dismiss");
                        }}
                      >
                        Dismiss
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Confirmation Modal */}
      {actionTarget && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/80 backdrop-blur-xs p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-white capitalize">{actionType} Action</h3>
              <button onClick={() => setActionTarget(null)} className="p-1 text-neutral-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Confirm <strong>{actionType}</strong> action on this report?
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button variant="outline" className="border-neutral-800 text-neutral-300" onClick={() => setActionTarget(null)}>
                Cancel
              </Button>
              <Button variant="primary" className="bg-danger-600 hover:bg-danger-700" isLoading={isProcessing} onClick={handleActionConfirm}>
                Confirm Action
              </Button>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
}
