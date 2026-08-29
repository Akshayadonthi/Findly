import { supabase, isSupabaseConfigured } from "./supabase";
import {
  Item,
  ItemType,
  ItemState,
  ItemImage,
  SavedItem,
  FilterState,
  MatchResult,
  User,
  Conversation,
  Message,
  Report,
  ReportStatus,
  BlockedUser,
  Category,
  AdminActivityLog,
  AdminStats,
  AnalyticsData,
  UserRole
} from "../types";
import { Notification, NotificationType } from "../types/notification";
import { calculateDistanceKm } from "./geo";

export interface DBClaim {
  id: string;
  item_id: string;
  claimant_id: string;
  description: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface DBMatch {
  id: string;
  lost_item_id: string;
  found_item_id: string;
  match_score: number;
  created_at: string;
}

const getLocalStorageData = <T>(key: string, defaultValue: T): T => {
  if (typeof window === "undefined") return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setLocalStorageData = <T>(key: string, value: T): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

const initLocalStorage = () => {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem("findly_items")) {
    setLocalStorageData("findly_items", [] as Item[]);
  }
  if (!localStorage.getItem("findly_users")) {
    setLocalStorageData("findly_users", [] as User[]);
  }
  if (!localStorage.getItem("findly_item_images")) {
    setLocalStorageData("findly_item_images", [] as ItemImage[]);
  }
  if (!localStorage.getItem("findly_saved_items")) {
    setLocalStorageData("findly_saved_items", [] as SavedItem[]);
  }
  if (!localStorage.getItem("findly_conversations")) {
    setLocalStorageData("findly_conversations", [] as Conversation[]);
  }
  if (!localStorage.getItem("findly_messages")) {
    setLocalStorageData("findly_messages", [] as Message[]);
  }
  if (!localStorage.getItem("findly_reports")) {
    setLocalStorageData("findly_reports", [] as Report[]);
  }
  if (!localStorage.getItem("findly_blocked_users")) {
    setLocalStorageData("findly_blocked_users", [] as BlockedUser[]);
  }
  if (!localStorage.getItem("findly_categories")) {
    setLocalStorageData("findly_categories", [
      { id: "c1", name: "Electronics", isActive: true },
      { id: "c2", name: "Bags & Backpacks", isActive: true },
      { id: "c3", name: "Keys", isActive: true },
      { id: "c4", name: "Wallets & Purses", isActive: true },
      { id: "c5", name: "Watches & Jewelry", isActive: true },
      { id: "c6", name: "Documents & IDs", isActive: true },
      { id: "c7", name: "Accessories", isActive: true },
      { id: "c8", name: "Clothing", isActive: true },
      { id: "c9", name: "Other", isActive: true },
    ] as Category[]);
  }
  if (!localStorage.getItem("findly_activity_logs")) {
    setLocalStorageData("findly_activity_logs", [] as AdminActivityLog[]);
  }
  if (!localStorage.getItem("findly_claims")) {
    setLocalStorageData("findly_claims", [] as DBClaim[]);
  }
  if (!localStorage.getItem("findly_matches")) {
    setLocalStorageData("findly_matches", [] as DBMatch[]);
  }
};

const mapDbRowToItem = (row: Record<string, unknown>): Item => {
  const imagesRaw = (row.images || row.item_images || []) as Record<string, unknown>[];
  const images: ItemImage[] = imagesRaw.map((img: Record<string, unknown>) => ({
    id: String(img.id || ""),
    itemId: String(img.item_id || row.id || ""),
    storagePath: String(img.storage_path || ""),
    publicUrl: String(img.public_url || ""),
    displayOrder: typeof img.display_order === "number" ? img.display_order : 0,
    createdAt: String(img.created_at || ""),
  })).sort((a: ItemImage, b: ItemImage) => a.displayOrder - b.displayOrder);

  const primaryImageUrl = images.length > 0 ? images[0].publicUrl : (typeof row.image_url === "string" ? row.image_url : undefined);
  const reporterRaw = row.reporter as Record<string, unknown> | undefined;

  return {
    id: String(row.id || ""),
    type: (row.type as ItemType) || (row.status === "found" ? "found" : "lost"),
    status: (row.status as ItemState) || "active",
    title: String(row.title || ""),
    description: String(row.description || ""),
    category: String(row.category || "Other"),
    city: String(row.city || "Chennai"),
    area: String(row.area || row.location || "General Area"),
    location: String(row.location || `${row.area || ''}, ${row.city || ''}`.trim()),
    latitude: row.latitude ? parseFloat(String(row.latitude)) : undefined,
    longitude: row.longitude ? parseFloat(String(row.longitude)) : undefined,
    date: String(row.date || ""),
    time: row.time ? String(row.time) : undefined,
    color: row.color ? String(row.color) : undefined,
    brand: row.brand ? String(row.brand) : undefined,
    model: row.model ? String(row.model) : undefined,
    identifyingFeatures: row.identifying_features ? String(row.identifying_features) : undefined,
    reward: row.reward ? parseFloat(String(row.reward)) : undefined,
    additionalNotes: row.additional_notes ? String(row.additional_notes) : undefined,
    imageUrl: primaryImageUrl,
    images: images,
    reporter: reporterRaw ? {
      id: String(reporterRaw.id || ""),
      name: String(reporterRaw.name || "Community Member"),
      avatarUrl: reporterRaw.avatar_url ? String(reporterRaw.avatar_url) : undefined,
      role: (reporterRaw.role as UserRole) || "user",
      isSuspended: Boolean(reporterRaw.is_suspended),
      suspendedUntil: reporterRaw.suspended_until ? String(reporterRaw.suspended_until) : undefined,
      suspensionReason: reporterRaw.suspension_reason ? String(reporterRaw.suspension_reason) : undefined,
      memberSince: reporterRaw.created_at ? new Date(String(reporterRaw.created_at)).toLocaleDateString("en-US", { year: "numeric", month: "long" }) : "Member",
    } : {
      id: String(row.reporter_id || "unknown"),
      name: "Community Member",
      memberSince: "Member",
    },
    resolvedAt: row.resolved_at ? String(row.resolved_at) : undefined,
    createdAt: String(row.created_at || row.date || ""),
  };
};

export const dbService = {
  getLocalStorageItems(filters?: FilterState): Item[] {
    let items: Item[] = getLocalStorageData("findly_items", []);
    const allImages: ItemImage[] = getLocalStorageData("findly_item_images", []);

    items = items.map((item) => {
      const itemImgs = allImages.filter(img => img.itemId === item.id);
      return {
        ...item,
        images: itemImgs.length > 0 ? itemImgs : (item.images || []),
        imageUrl: itemImgs.length > 0 ? itemImgs[0].publicUrl : item.imageUrl,
      };
    });

    if (filters) {
      items = items.filter((item) => {
        const itemType = item.type || (item.status === "found" ? "found" : "lost");
        if (filters.type && filters.type !== "all" && itemType !== filters.type) return false;

        if (filters.status && filters.status !== "all") {
          if (filters.status === "active") {
            if (item.status === "returned" || item.status === "closed") return false;
          } else if (item.status !== filters.status) {
            return false;
          }
        }

        if (filters.searchQuery) {
          const q = filters.searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchDesc = item.description.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc) return false;
        }
        if (filters.category && item.category !== filters.category) return false;

        if (filters.maxDistanceKm && filters.userLat !== undefined && filters.userLng !== undefined) {
          if (item.latitude !== undefined && item.longitude !== undefined) {
            const dist = calculateDistanceKm(filters.userLat, filters.userLng, item.latitude, item.longitude);
            if (dist > filters.maxDistanceKm) return false;
          }
        }

        return true;
      });
    }
    return items;
  },

  async uploadItemImages(files: File[], itemId: string): Promise<ItemImage[]> {
    if (files.length === 0) return [];
    initLocalStorage();

    if (isSupabaseConfigured && supabase) {
      const client = supabase!;
      const uploadedImages: ItemImage[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop() || 'jpg';
        const storagePath = `${itemId}/${Date.now()}_${i}.${fileExt}`;

        const { error: uploadError } = await client.storage
          .from("item-images")
          .upload(storagePath, file, { cacheControl: '3600', upsert: true });

        if (uploadError) continue;

        const { data: { publicUrl } } = client.storage.from("item-images").getPublicUrl(storagePath);

        const { data: imgRow, error: dbError } = await client
          .from("item_images")
          .insert({
            item_id: itemId,
            storage_path: storagePath,
            public_url: publicUrl,
            display_order: i,
          })
          .select()
          .single();

        if (!dbError && imgRow) {
          uploadedImages.push({
            id: imgRow.id,
            itemId: imgRow.item_id,
            storagePath: imgRow.storage_path,
            publicUrl: imgRow.public_url,
            displayOrder: imgRow.display_order,
            createdAt: imgRow.created_at,
          });
        }
      }

      return uploadedImages;
    } else {
      const localImages: ItemImage[] = getLocalStorageData("findly_item_images", []);
      const newUploaded: ItemImage[] = files.map((file, i) => ({
        id: Math.random().toString(36).substring(2, 9),
        itemId,
        storagePath: `local/${itemId}/${file.name}`,
        publicUrl: URL.createObjectURL(file),
        displayOrder: i,
        createdAt: new Date().toISOString(),
      }));
      setLocalStorageData("findly_item_images", [...localImages, ...newUploaded]);
      return newUploaded;
    }
  },

  async getItems(filters?: FilterState): Promise<Item[]> {
    initLocalStorage();

    if (isSupabaseConfigured && supabase) {
      const client = supabase!;

      const buildQuery = (selectStr: string, useTypeField: boolean = true) => {
        let q = client.from("items").select(selectStr);
        if (filters) {
          if (filters.searchQuery && filters.searchQuery.trim() !== "") {
            const searchTerm = filters.searchQuery.trim();
            q = q.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%,color.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`);
          }

          if (filters.type && filters.type !== "all") {
            if (useTypeField) {
              q = q.or(`type.eq.${filters.type},status.eq.${filters.type}`);
            } else {
              q = q.eq("status", filters.type);
            }
          }

          if (filters.status && filters.status !== "all") {
            if (filters.status === "active") {
              q = q.neq("status", "returned").neq("status", "closed");
            } else {
              q = q.eq("status", filters.status);
            }
          }

          if (filters.category && filters.category !== "") {
            q = q.eq("category", filters.category);
          }
          if (filters.city && filters.city !== "") {
            q = q.ilike("city", `%${filters.city}%`);
          }
          const isOldest = filters.sortBy === "oldest";
          q = q.order("created_at", { ascending: isOldest });
        } else {
          q = q.order("created_at", { ascending: false });
        }
        return q;
      };

      let { data, error } = await buildQuery("*, reporter:profiles(*), images:item_images(*)", true);

      if (error) {
        const fallbackRes = await buildQuery("*, reporter:profiles(*)", true);
        if (!fallbackRes.error && fallbackRes.data) {
          data = fallbackRes.data;
          error = null;
        } else if (fallbackRes.error) {
          const fallbackRes2 = await buildQuery("*, reporter:profiles(*)", false);
          if (!fallbackRes2.error && fallbackRes2.data) {
            data = fallbackRes2.data;
            error = null;
          }
        }
      }

      const items = ((data as unknown as Record<string, unknown>[]) || []).map(mapDbRowToItem);
      return items;
    } else {
      return this.getLocalStorageItems(filters);
    }
  },

  async getItemById(id: string, userId?: string): Promise<Item | null> {
    initLocalStorage();

    if (isSupabaseConfigured && supabase) {
      const client = supabase!;
      let { data, error } = await client
        .from("items")
        .select(`*, reporter:profiles(*), images:item_images(*)`)
        .eq("id", id)
        .single();

      if (error) {
        const fallbackRes = await client.from("items").select(`*, reporter:profiles(*)`).eq("id", id).single();
        if (!fallbackRes.error && fallbackRes.data) {
          data = fallbackRes.data;
          error = null;
        }
      }

      if (error || !data) {
        const localItems = this.getLocalStorageItems();
        return localItems.find((i) => i.id === id) || null;
      }

      const item = mapDbRowToItem(data as Record<string, unknown>);
      if (userId) item.isSaved = await this.isItemSaved(id, userId);
      return item;
    } else {
      const items: Item[] = await this.getItems();
      return items.find((i) => i.id === id) || null;
    }
  },

  async getUserItems(userId: string, filterTab: string = "all"): Promise<Item[]> {
    initLocalStorage();
    if (isSupabaseConfigured && supabase) {
      const client = supabase!;
      let q = client.from("items").select(`*, reporter:profiles(*)`).eq("reporter_id", userId).order("created_at", { ascending: false });
      if (filterTab === "lost" || filterTab === "found") {
        q = q.or(`type.eq.${filterTab},status.eq.${filterTab}`);
      } else if (filterTab === "active" || filterTab === "returned" || filterTab === "closed") {
        q = q.eq("status", filterTab);
      }
      const { data, error } = await q;
      if (error || !data) {
        const localItems = this.getLocalStorageItems();
        return localItems.filter((i) => i.reporter.id === userId);
      }
      return (data as Record<string, unknown>[]).map(mapDbRowToItem);
    } else {
      const allItems = await this.getItems();
      let userItems = allItems.filter((i) => i.reporter.id === userId);
      if (filterTab === "lost" || filterTab === "found") {
        userItems = userItems.filter((i) => (i.type || i.status) === filterTab);
      } else if (filterTab === "active" || filterTab === "returned" || filterTab === "closed") {
        userItems = userItems.filter((i) => i.status === filterTab);
      }
      return userItems;
    }
  },

  async getDashboardStats(_userId?: string) {
    initLocalStorage();
    if (isSupabaseConfigured && supabase) {
      const client = supabase!;
      try {
        const { count: lostCount } = await client.from("items").select("*", { count: "exact", head: true }).or("type.eq.lost,status.eq.lost");
        const { count: foundCount } = await client.from("items").select("*", { count: "exact", head: true }).or("type.eq.found,status.eq.found");
        const { count: returnedCount } = await client.from("items").select("*", { count: "exact", head: true }).eq("status", "returned");
        return {
          itemsLost: lostCount || 0,
          itemsFound: foundCount || 0,
          itemsReturned: returnedCount || 0,
          potentialMatches: 0,
        };
      } catch {
        return { itemsLost: 0, itemsFound: 0, itemsReturned: 0, potentialMatches: 0 };
      }
    } else {
      const allItems: Item[] = getLocalStorageData("findly_items", []);
      return {
        itemsLost: allItems.filter((i) => i.type === "lost" || i.status === "lost").length,
        itemsFound: allItems.filter((i) => i.type === "found" || i.status === "found").length,
        itemsReturned: allItems.filter((i) => i.status === "returned").length,
        potentialMatches: 0,
      };
    }
  },

  async getUserStats(userId: string) {
    initLocalStorage();
    if (isSupabaseConfigured && supabase) {
      const client = supabase!;
      try {
        const { count: lostCount } = await client.from("items").select("*", { count: "exact", head: true }).eq("reporter_id", userId).or("type.eq.lost,status.eq.lost");
        const { count: foundCount } = await client.from("items").select("*", { count: "exact", head: true }).eq("reporter_id", userId).or("type.eq.found,status.eq.found");
        const { count: returnedCount } = await client.from("items").select("*", { count: "exact", head: true }).eq("reporter_id", userId).eq("status", "returned");
        return { lostReports: lostCount || 0, foundReports: foundCount || 0, returnedItems: returnedCount || 0 };
      } catch {
        return { lostReports: 0, foundReports: 0, returnedItems: 0 };
      }
    } else {
      const allItems: Item[] = getLocalStorageData("findly_items", []);
      const userItems = allItems.filter((i) => i.reporter.id === userId);
      return {
        lostReports: userItems.filter((i) => i.type === "lost" || i.status === "lost").length,
        foundReports: userItems.filter((i) => i.type === "found" || i.status === "found").length,
        returnedItems: userItems.filter((i) => i.status === "returned").length,
      };
    }
  },

  async createItem(itemData: Omit<Item, "id" | "reporter" | "imageUrl" | "images">, reporterId: string, imageFiles?: File[]): Promise<Item> {
    initLocalStorage();

    const isSuspended = await this.checkUserSuspension(reporterId);
    if (isSuspended) {
      throw new Error("Your account has been suspended. You cannot report new items.");
    }

    let createdItem: Item;

    if (isSupabaseConfigured && supabase) {
      const client = supabase!;
      const fullPayload: Record<string, unknown> = {
        title: itemData.title,
        description: itemData.description,
        category: itemData.category,
        location: itemData.location,
        date: itemData.date,
        color: itemData.color || null,
        brand: itemData.brand || null,
        reporter_id: reporterId,
        type: itemData.type || itemData.status || "lost",
        status: itemData.status || "active",
        city: itemData.city || "Chennai",
        area: itemData.area || itemData.location || "General Area",
      };

      let { data, error } = await client.from("items").insert(fullPayload).select(`*, reporter:profiles(*)`).single();

      if (error) {
        const corePayload = {
          title: itemData.title,
          description: itemData.description,
          category: itemData.category,
          status: itemData.type || itemData.status || "lost",
          location: itemData.location,
          date: itemData.date,
          color: itemData.color || null,
          brand: itemData.brand || null,
          reporter_id: reporterId,
        };
        const coreRes = await client.from("items").insert(corePayload).select().single();
        data = coreRes.data;
        error = coreRes.error;
      }

      if (error || !data) throw error || new Error("Failed to create item.");
      createdItem = mapDbRowToItem(data as Record<string, unknown>);

      if (imageFiles && imageFiles.length > 0) {
        const uploaded = await this.uploadItemImages(imageFiles, createdItem.id);
        createdItem.images = uploaded;
        if (uploaded.length > 0) createdItem.imageUrl = uploaded[0].publicUrl;
      }
    } else {
      const itemId = Math.random().toString(36).substring(2, 9);
      createdItem = {
        ...itemData,
        id: itemId,
        reporter: { id: reporterId, name: "Community User", memberSince: "2026" },
        createdAt: new Date().toISOString(),
      };
    }

    const localItems: Item[] = getLocalStorageData("findly_items", []);
    localItems.unshift(createdItem);
    setLocalStorageData("findly_items", localItems);

    return createdItem;
  },

  async updateItem(id: string, itemData: Partial<Item>, _reporterId?: string): Promise<Item> {
    initLocalStorage();
    if (isSupabaseConfigured && supabase) {
      const client = supabase!;
      const { data, error } = await client
        .from("items")
        .update({
          title: itemData.title,
          description: itemData.description,
          category: itemData.category,
          location: itemData.location,
          date: itemData.date,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select(`*, reporter:profiles(*)`)
        .single();

      if (error) throw error;
      const updated = mapDbRowToItem(data as Record<string, unknown>);

      const localItems: Item[] = getLocalStorageData("findly_items", []);
      const idx = localItems.findIndex(i => i.id === id);
      if (idx !== -1) {
        localItems[idx] = { ...localItems[idx], ...itemData };
        setLocalStorageData("findly_items", localItems);
      }

      return updated;
    } else {
      const items: Item[] = getLocalStorageData("findly_items", []);
      const idx = items.findIndex((i) => i.id === id);
      if (idx !== -1) {
        items[idx] = { ...items[idx], ...itemData };
        setLocalStorageData("findly_items", items);
        return items[idx];
      }
      throw new Error("Item not found");
    }
  },

  async deleteItem(id: string, _reporterId?: string): Promise<void> {
    initLocalStorage();
    if (isSupabaseConfigured && supabase) {
      const client = supabase!;
      await client.from("items").delete().eq("id", id);
    }
    let items: Item[] = getLocalStorageData("findly_items", []);
    items = items.filter((i) => i.id !== id);
    setLocalStorageData("findly_items", items);
  },

  async markAsReturned(id: string, _reporterId?: string): Promise<void> {
    initLocalStorage();
    if (isSupabaseConfigured && supabase) {
      const client = supabase!;
      await client.from("items").update({ status: "returned", resolved_at: new Date().toISOString() }).eq("id", id);
    }
    const items: Item[] = getLocalStorageData("findly_items", []);
    const idx = items.findIndex((i) => i.id === id);
    if (idx !== -1) {
      items[idx].status = "returned";
      setLocalStorageData("findly_items", items);
    }
  },

  async createClaim(itemId: string, claimantId: string, description: string): Promise<DBClaim> {
    initLocalStorage();
    if (isSupabaseConfigured && supabase) {
      const client = supabase!;
      const { data, error } = await client.from("claims").insert({ item_id: itemId, claimant_id: claimantId, description, status: "pending" }).select().single();
      if (error) throw error;
      return data as DBClaim;
    } else {
      const claims: DBClaim[] = getLocalStorageData("findly_claims", []);
      const newClaim: DBClaim = { id: Math.random().toString(36).substring(2, 9), item_id: itemId, claimant_id: claimantId, description, status: "pending", created_at: new Date().toISOString() };
      claims.push(newClaim);
      setLocalStorageData("findly_claims", claims);
      return newClaim;
    }
  },

  async getClaimsByUser(userId: string): Promise<DBClaim[]> {
    initLocalStorage();
    if (isSupabaseConfigured && supabase) {
      const client = supabase!;
      let q = client.from("claims").select();
      if (userId !== "all") q = q.eq("claimant_id", userId);
      const { data, error } = await q;
      if (error) return [];
      return (data || []) as DBClaim[];
    } else {
      const claims: DBClaim[] = getLocalStorageData("findly_claims", []);
      if (userId !== "all") return claims.filter((c) => c.claimant_id === userId);
      return claims;
    }
  },

  async getClaimsByItem(itemId: string): Promise<DBClaim[]> {
    initLocalStorage();
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase!.from("claims").select().eq("item_id", itemId);
      if (error) return [];
      return (data || []) as DBClaim[];
    } else {
      const claims: DBClaim[] = getLocalStorageData("findly_claims", []);
      return claims.filter((c) => c.item_id === itemId);
    }
  },

  async updateClaimStatus(claimId: string, status: "approved" | "rejected"): Promise<void> {
    initLocalStorage();
    if (isSupabaseConfigured && supabase) {
      await supabase!.from("claims").update({ status }).eq("id", claimId);
    } else {
      const claims: DBClaim[] = getLocalStorageData("findly_claims", []);
      const idx = claims.findIndex((c) => c.id === claimId);
      if (idx !== -1) {
        claims[idx].status = status;
        setLocalStorageData("findly_claims", claims);
      }
    }
  },

  async getMatchesForItem(_itemId: string): Promise<MatchResult[]> {
    return [];
  },

  async saveItem(itemId: string, userId: string): Promise<void> {
    initLocalStorage();
    if (isSupabaseConfigured && supabase) {
      await supabase!.from("saved_items").insert({ user_id: userId, item_id: itemId });
    } else {
      const saved: SavedItem[] = getLocalStorageData("findly_saved_items", []);
      if (!saved.some((s) => s.userId === userId && s.itemId === itemId)) {
        saved.push({ id: Math.random().toString(36).substring(2, 9), userId, itemId, createdAt: new Date().toISOString() });
        setLocalStorageData("findly_saved_items", saved);
      }
    }
  },

  async unsaveItem(itemId: string, userId: string): Promise<void> {
    initLocalStorage();
    if (isSupabaseConfigured && supabase) {
      await supabase!.from("saved_items").delete().eq("user_id", userId).eq("item_id", itemId);
    } else {
      let saved: SavedItem[] = getLocalStorageData("findly_saved_items", []);
      saved = saved.filter((s) => !(s.userId === userId && s.itemId === itemId));
      setLocalStorageData("findly_saved_items", saved);
    }
  },

  async isItemSaved(itemId: string, userId: string): Promise<boolean> {
    initLocalStorage();
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase!.from("saved_items").select("id").eq("user_id", userId).eq("item_id", itemId).maybeSingle();
      return !!data;
    } else {
      const saved: SavedItem[] = getLocalStorageData("findly_saved_items", []);
      return saved.some((s) => s.userId === userId && s.itemId === itemId);
    }
  },

  async getSavedItems(userId: string): Promise<Item[]> {
    initLocalStorage();
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase!.from("saved_items").select(`item:items(*, reporter:profiles(*))`).eq("user_id", userId);
      const rows = ((data || []) as Record<string, unknown>[]).map((r) => r.item).filter(Boolean);
      return rows.map((row) => mapDbRowToItem(row as Record<string, unknown>));
    } else {
      const saved: SavedItem[] = getLocalStorageData("findly_saved_items", []);
      const userSaved = saved.filter((s) => s.userId === userId);
      const allItems = await this.getItems();
      return allItems.filter((item) => userSaved.some((s) => s.itemId === item.id));
    }
  },

  async getConversations(userId: string): Promise<Conversation[]> {
    initLocalStorage();

    if (isSupabaseConfigured && supabase) {
      const client = supabase!;
      let rows: Record<string, unknown>[] = [];

      try {
        const { data, error } = await client
          .from("conversations")
          .select(`*, item:items(*)`)
          .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
          .order("updated_at", { ascending: false });

        if (!error && data) {
          rows = data as Record<string, unknown>[];
        } else {
          const { data: fallbackData } = await client
            .from("conversations")
            .select(`*`)
            .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
            .order("updated_at", { ascending: false });
          rows = (fallbackData || []) as Record<string, unknown>[];
        }
      } catch {
        return this.getLocalStorageConversations(userId);
      }

      const localConvs = this.getLocalStorageConversations(userId);
      if (rows.length === 0) return localConvs;

      const conversations: Conversation[] = [];
      for (const row of rows) {
        const p1 = String(row.participant_1 || "");
        const p2 = String(row.participant_2 || "");
        const otherId = p1 === userId ? p2 : p1;

        let otherPart: User = { id: otherId || "community", name: "Community Member", memberSince: "Member" };
        try {
          const { data: profile } = await client.from("profiles").select("*").eq("id", otherId).single();
          if (profile) {
            otherPart = { id: profile.id, name: profile.name || "Community Member", avatarUrl: profile.avatar_url, memberSince: "Member" };
          }
        } catch {}

        let lastMessageText = "Conversation started";
        let lastMessageAt = String(row.updated_at || row.created_at || "");
        let unreadCount = 0;

        try {
          const { data: msgData } = await client
            .from("messages")
            .select("*")
            .eq("conversation_id", String(row.id))
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (msgData) {
            lastMessageText = msgData.message;
            lastMessageAt = msgData.created_at;
          }

          const { count } = await client
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", String(row.id))
            .neq("sender_id", userId)
            .is("read_at", null);
          unreadCount = count || 0;
        } catch {}

        conversations.push({
          id: String(row.id),
          itemId: row.item_id ? String(row.item_id) : undefined,
          participant1: { id: p1, name: "User", memberSince: "Member" },
          participant2: { id: p2, name: "User", memberSince: "Member" },
          otherParticipant: otherPart,
          lastMessage: lastMessageText,
          lastMessageAt: lastMessageAt,
          unreadCount: unreadCount,
          createdAt: String(row.created_at || ""),
          updatedAt: String(row.updated_at || ""),
          item: row.item ? mapDbRowToItem(row.item as Record<string, unknown>) : undefined,
        });
      }

      localConvs.forEach(lc => {
        if (!conversations.some(c => c.id === lc.id)) conversations.push(lc);
      });

      return conversations;
    } else {
      return this.getLocalStorageConversations(userId);
    }
  },

  getLocalStorageConversations(userId: string): Conversation[] {
    const convs: Conversation[] = getLocalStorageData("findly_conversations", []);
    return convs.filter(c => c.participant1.id === userId || c.participant2.id === userId || c.otherParticipant?.id === userId);
  },

  async getOrCreateConversation(itemId: string, participant1Id: string, participant2Id: string): Promise<Conversation> {
    initLocalStorage();

    let partnerId = participant2Id;
    if (participant1Id === participant2Id) {
      partnerId = "community_member";
    }

    const blocked = await this.isUserBlocked(participant1Id, partnerId);
    if (blocked) {
      throw new Error("Communication with this user is unavailable.");
    }

    if (isSupabaseConfigured && supabase) {
      const client = supabase!;

      try {
        const { data: existing } = await client
          .from("conversations")
          .select(`*, item:items(*)`)
          .or(`and(participant_1.eq.${participant1Id},participant_2.eq.${partnerId}),and(participant_1.eq.${partnerId},participant_2.eq.${participant1Id})`)
          .eq("item_id", itemId)
          .maybeSingle();

        if (existing) {
          const conv: Conversation = {
            id: existing.id,
            itemId: existing.item_id,
            participant1: { id: existing.participant_1, name: "User", memberSince: "Member" },
            participant2: { id: existing.participant_2, name: "User", memberSince: "Member" },
            otherParticipant: { id: partnerId, name: "Listing Reporter", memberSince: "Member" },
            createdAt: existing.created_at,
            updatedAt: existing.updated_at,
            item: existing.item ? mapDbRowToItem(existing.item as Record<string, unknown>) : undefined,
          };
          return conv;
        }

        const { data: created, error } = await client
          .from("conversations")
          .insert({
            item_id: itemId,
            participant_1: participant1Id,
            participant_2: partnerId,
          })
          .select()
          .single();

        if (!error && created) {
          const item = await this.getItemById(itemId);
          const newConv: Conversation = {
            id: created.id,
            itemId: created.item_id,
            participant1: { id: participant1Id, name: "User", memberSince: "Member" },
            participant2: { id: partnerId, name: "User", memberSince: "Member" },
            otherParticipant: { id: partnerId, name: "Listing Reporter", memberSince: "Member" },
            createdAt: created.created_at,
            updatedAt: created.updated_at,
            item: item || undefined,
          };

          const localConvs: Conversation[] = getLocalStorageData("findly_conversations", []);
          localConvs.unshift(newConv);
          setLocalStorageData("findly_conversations", localConvs);

          return newConv;
        }
      } catch (e) {
        console.warn("Supabase getOrCreateConversation error, using local fallback:", e);
      }
    }

    const convs: Conversation[] = getLocalStorageData("findly_conversations", []);
    const existing = convs.find(c => c.itemId === itemId && ((c.participant1.id === participant1Id && c.participant2.id === partnerId) || (c.participant1.id === partnerId && c.participant2.id === participant1Id)));
    if (existing) return existing;

    const item = await this.getItemById(itemId);
    const newConv: Conversation = {
      id: Math.random().toString(36).substring(2, 9),
      itemId,
      participant1: { id: participant1Id, name: "User", memberSince: "Member" },
      participant2: { id: partnerId, name: "User", memberSince: "Member" },
      otherParticipant: { id: partnerId, name: "Listing Reporter", memberSince: "Member" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      item: item || undefined,
    };
    convs.unshift(newConv);
    setLocalStorageData("findly_conversations", convs);
    return newConv;
  },

  async getMessages(conversationId: string, currentUserId?: string): Promise<Message[]> {
    initLocalStorage();

    if (isSupabaseConfigured && supabase) {
      const client = supabase!;
      let dbMsgs: Message[] = [];

      try {
        let { data, error } = await client
          .from("messages")
          .select(`*, sender:profiles(*)`)
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        if (error) {
          const fallbackRes = await client
            .from("messages")
            .select(`*`)
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: true });
          if (!fallbackRes.error && fallbackRes.data) {
            data = fallbackRes.data;
            error = null;
          }
        }

        if (data && data.length > 0) {
          dbMsgs = (data as Record<string, unknown>[]).map((row) => {
            const senderRaw = row.sender as Record<string, unknown> | undefined;
            return {
              id: String(row.id),
              conversationId: String(row.conversation_id),
              senderId: String(row.sender_id),
              message: String(row.message),
              createdAt: String(row.created_at),
              readAt: row.read_at ? String(row.read_at) : undefined,
              sender: senderRaw ? { id: String(senderRaw.id), name: String(senderRaw.name || "User"), avatarUrl: senderRaw.avatar_url ? String(senderRaw.avatar_url) : undefined, memberSince: "Member" } : undefined,
            };
          });
        }
      } catch {}

      const localMsgs = this.getLocalStorageMessages(conversationId);
      const combined = [...dbMsgs];
      localMsgs.forEach(lm => {
        if (!combined.some(m => m.id === lm.id)) combined.push(lm);
      });

      if (currentUserId) {
        await this.markMessagesAsRead(conversationId, currentUserId);
      }

      return combined.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else {
      if (currentUserId) {
        await this.markMessagesAsRead(conversationId, currentUserId);
      }
      return this.getLocalStorageMessages(conversationId);
    }
  },

  getLocalStorageMessages(conversationId: string): Message[] {
    const msgs: Message[] = getLocalStorageData("findly_messages", []);
    return msgs.filter(m => m.conversationId === conversationId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  async sendMessage(conversationId: string, senderId: string, text: string): Promise<Message> {
    initLocalStorage();

    const trimmed = text.trim();
    if (!trimmed) throw new Error("Message content cannot be empty.");

    const isSuspended = await this.checkUserSuspension(senderId);
    if (isSuspended) throw new Error("Your account is suspended. You cannot send messages.");

    let sentMsg: Message | null = null;

    if (isSupabaseConfigured && supabase) {
      const client = supabase!;
      try {
        let { data, error } = await client
          .from("messages")
          .insert({
            conversation_id: conversationId,
            sender_id: senderId,
            message: trimmed,
          })
          .select(`*, sender:profiles(*)`)
          .single();

        if (error) {
          const fallbackRes = await client
            .from("messages")
            .insert({
              conversation_id: conversationId,
              sender_id: senderId,
              message: trimmed,
            })
            .select()
            .single();
          data = fallbackRes.data;
          error = fallbackRes.error;
        }

        if (data) {
          await client.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
          const senderRaw = data.sender as Record<string, unknown> | undefined;

          sentMsg = {
            id: String(data.id),
            conversationId: String(data.conversation_id),
            senderId: String(data.sender_id),
            message: String(data.message),
            createdAt: String(data.created_at),
            readAt: data.read_at ? String(data.read_at) : undefined,
            sender: senderRaw ? { id: String(senderRaw.id), name: String(senderRaw.name || "User"), avatarUrl: senderRaw.avatar_url ? String(senderRaw.avatar_url) : undefined, memberSince: "Member" } : undefined,
          };
        }
      } catch (e) {
        console.warn("Supabase sendMessage error, using local fallback:", e);
      }
    }

    if (!sentMsg) {
      sentMsg = {
        id: Math.random().toString(36).substring(2, 9),
        conversationId,
        senderId,
        message: trimmed,
        createdAt: new Date().toISOString(),
      };
    }

    const msgs: Message[] = getLocalStorageData("findly_messages", []);
    msgs.push(sentMsg);
    setLocalStorageData("findly_messages", msgs);

    return sentMsg;
  },

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    initLocalStorage();
    if (isSupabaseConfigured && supabase) {
      const client = supabase!;
      await client
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .neq("sender_id", userId)
        .is("read_at", null);
    } else {
      const msgs: Message[] = getLocalStorageData("findly_messages", []);
      msgs.forEach((m) => {
        if (m.conversationId === conversationId && m.senderId !== userId) {
          m.readAt = new Date().toISOString();
        }
      });
      setLocalStorageData("findly_messages", msgs);
    }
  },

  subscribeToRealtimeMessages(conversationId: string, callback: (msg: Message) => void): (() => void) {
    if (isSupabaseConfigured && supabase) {
      const client = supabase!;
      const channel = client
        .channel(`chat_${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            const raw = payload.new as Record<string, unknown>;
            callback({
              id: String(raw.id || ""),
              conversationId: String(raw.conversation_id || ""),
              senderId: String(raw.sender_id || ""),
              message: String(raw.message || ""),
              createdAt: String(raw.created_at || ""),
              readAt: raw.read_at ? String(raw.read_at) : undefined,
            });
          }
        )
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    }
    return () => {};
  },

  async getUnreadMessageCount(userId: string): Promise<number> {
    initLocalStorage();
    if (isSupabaseConfigured && supabase) {
      const convs = await this.getConversations(userId);
      return convs.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
    } else {
      const msgs: Message[] = getLocalStorageData("findly_messages", []);
      const convs = this.getLocalStorageConversations(userId);
      const convIds = new Set(convs.map(c => c.id));
      return msgs.filter(m => convIds.has(m.conversationId) && m.senderId !== userId && !m.readAt).length;
    }
  },

  async createReport(
    reporterId: string,
    targetType: "item" | "user" | "lost" | "found",
    targetId: string,
    reason: string,
    description?: string
  ): Promise<Report> {
    initLocalStorage();

    if (isSupabaseConfigured && supabase) {
      const client = supabase!;
      const payload: Record<string, unknown> = {
        reporter_id: reporterId,
        reason,
        description: description || null,
        status: "pending",
      };
      if (targetType === "user") payload.reported_user_id = targetId;
      else payload.item_id = targetId;

      const { data, error } = await client.from("reports").insert(payload).select().single();
      if (error || !data) throw error || new Error("Failed to submit report.");

      return {
        id: String(data.id),
        reporterId: String(data.reporter_id),
        itemId: data.item_id ? String(data.item_id) : undefined,
        reportedUserId: data.reported_user_id ? String(data.reported_user_id) : undefined,
        reason: String(data.reason),
        description: data.description ? String(data.description) : undefined,
        status: (data.status as ReportStatus) || "pending",
        createdAt: String(data.created_at),
      };
    } else {
      const reports: Report[] = getLocalStorageData("findly_reports", []);
      const newReport: Report = {
        id: Math.random().toString(36).substring(2, 9),
        reporterId,
        itemId: targetType === "user" ? undefined : targetId,
        reportedUserId: targetType === "user" ? targetId : undefined,
        reason,
        description,
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      reports.push(newReport);
      setLocalStorageData("findly_reports", reports);
      return newReport;
    }
  },

  async blockUser(blockerId: string, blockedUserId: string): Promise<void> {
    initLocalStorage();
    if (blockerId === blockedUserId) throw new Error("You cannot block yourself.");

    if (isSupabaseConfigured && supabase) {
      await supabase!.from("blocked_users").insert({ blocker_id: blockerId, blocked_user_id: blockedUserId });
    } else {
      const blocks: BlockedUser[] = getLocalStorageData("findly_blocked_users", []);
      if (!blocks.some(b => b.blockerId === blockerId && b.blockedUserId === blockedUserId)) {
        blocks.push({ id: Math.random().toString(36).substring(2, 9), blockerId, blockedUserId, createdAt: new Date().toISOString() });
        setLocalStorageData("findly_blocked_users", blocks);
      }
    }
  },

  async isUserBlocked(userA: string, userB: string): Promise<boolean> {
    initLocalStorage();
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase!
        .from("blocked_users")
        .select("id")
        .or(`and(blocker_id.eq.${userA},blocked_user_id.eq.${userB}),and(blocker_id.eq.${userB},blocked_user_id.eq.${userA})`)
        .maybeSingle();
      return !!data;
    } else {
      const blocks: BlockedUser[] = getLocalStorageData("findly_blocked_users", []);
      return blocks.some(b => (b.blockerId === userA && b.blockedUserId === userB) || (b.blockerId === userB && b.blockedUserId === userA));
    }
  },

  async checkUserSuspension(userId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase!.from("profiles").select("is_suspended").eq("id", userId).single();
      return data?.is_suspended || false;
    } else {
      const users: User[] = getLocalStorageData("findly_users", []);
      const u = users.find(x => x.id === userId);
      return u?.isSuspended || false;
    }
  },

  async getReports(statusFilter?: string): Promise<Report[]> {
    initLocalStorage();
    if (isSupabaseConfigured && supabase) {
      const client = supabase!;
      let q = client.from("reports").select(`
        *,
        reporter:profiles!reports_reporter_id_fkey(*),
        item:items(*)
      `).order("created_at", { ascending: false });

      if (statusFilter && statusFilter !== "all") {
        q = q.eq("status", statusFilter);
      }

      const { data, error } = await q;
      if (error || !data) return getLocalStorageData("findly_reports", []);
      return (data as Record<string, unknown>[]).map(r => {
        const itemRaw = r.item as Record<string, unknown> | undefined;
        const reporterRaw = r.reporter as Record<string, unknown> | undefined;
        return {
          id: String(r.id),
          reporterId: String(r.reporter_id),
          itemId: r.item_id ? String(r.item_id) : undefined,
          reportedUserId: r.reported_user_id ? String(r.reported_user_id) : undefined,
          reason: String(r.reason),
          description: r.description ? String(r.description) : undefined,
          status: (r.status as ReportStatus) || "pending",
          reviewerId: r.reviewer_id ? String(r.reviewer_id) : undefined,
          createdAt: String(r.created_at),
          resolvedAt: r.resolved_at ? String(r.resolved_at) : undefined,
          item: itemRaw ? mapDbRowToItem(itemRaw) : undefined,
          reporter: reporterRaw ? { id: String(reporterRaw.id), name: String(reporterRaw.name), avatarUrl: reporterRaw.avatar_url ? String(reporterRaw.avatar_url) : undefined, memberSince: "Member" } : undefined,
        };
      });
    } else {
      const reports: Report[] = getLocalStorageData("findly_reports", []);
      if (statusFilter && statusFilter !== "all") return reports.filter(r => r.status === statusFilter);
      return reports;
    }
  },

  async updateReportStatus(reportId: string, status: "pending" | "under_review" | "resolved" | "dismissed", reviewerId: string): Promise<void> {
    initLocalStorage();
    if (isSupabaseConfigured && supabase) {
      await supabase!.from("reports").update({
        status,
        reviewer_id: reviewerId,
        resolved_at: status === "resolved" || status === "dismissed" ? new Date().toISOString() : null,
      }).eq("id", reportId);
    } else {
      const reports: Report[] = getLocalStorageData("findly_reports", []);
      const idx = reports.findIndex(r => r.id === reportId);
      if (idx !== -1) {
        reports[idx].status = status;
        reports[idx].reviewerId = reviewerId;
        reports[idx].resolvedAt = new Date().toISOString();
        setLocalStorageData("findly_reports", reports);
      }
    }
  },

  async getAdminStats(): Promise<AdminStats> {
    initLocalStorage();

    if (isSupabaseConfigured && supabase) {
      const client = supabase!;
      const { count: usersCount } = await client.from("profiles").select("*", { count: "exact", head: true });
      const { count: itemsCount } = await client.from("items").select("*", { count: "exact", head: true });
      const { count: lostCount } = await client.from("items").select("*", { count: "exact", head: true }).or("type.eq.lost,status.eq.lost");
      const { count: foundCount } = await client.from("items").select("*", { count: "exact", head: true }).or("type.eq.found,status.eq.found");
      const { count: returnedCount } = await client.from("items").select("*", { count: "exact", head: true }).eq("status", "returned");
      const { count: claimsCount } = await client.from("claims").select("*", { count: "exact", head: true }).eq("status", "pending");
      const { count: reportsCount } = await client.from("reports").select("*", { count: "exact", head: true }).eq("status", "pending");

      const totalItems = itemsCount || 0;
      const returned = returnedCount || 0;
      const rate = totalItems > 0 ? Math.round((returned / totalItems) * 100) : 0;

      return {
        totalUsers: usersCount || 0,
        activeUsers: Math.max(0, (usersCount || 0) - 1),
        totalListings: itemsCount || 0,
        itemsLost: lostCount || 0,
        itemsFound: foundCount || 0,
        itemsReturned: returned,
        pendingClaims: claimsCount || 0,
        pendingReports: reportsCount || 0,
        potentialMatches: Math.min(lostCount || 0, foundCount || 0),
        successfulReturns: returned,
        matchSuccessRate: rate,
      };
    } else {
      const allItems = await this.getItems();
      const lost = allItems.filter(i => (i.type || i.status) === "lost").length;
      const found = allItems.filter(i => (i.type || i.status) === "found").length;
      const returned = allItems.filter(i => i.status === "returned").length;

      return {
        totalUsers: 0,
        activeUsers: 0,
        totalListings: allItems.length,
        itemsLost: lost,
        itemsFound: found,
        itemsReturned: returned,
        pendingClaims: 0,
        pendingReports: 0,
        potentialMatches: Math.min(lost, found),
        successfulReturns: returned,
        matchSuccessRate: allItems.length > 0 ? Math.round((returned / allItems.length) * 100) : 0,
      };
    }
  },

  async getAnalyticsData(_period: string = "30d"): Promise<AnalyticsData> {
    const stats = await this.getAdminStats();
    return {
      userGrowth: [
        { label: "Mon", value: 0 },
        { label: "Tue", value: 0 },
        { label: "Wed", value: 0 },
        { label: "Thu", value: 0 },
        { label: "Fri", value: 0 },
        { label: "Sat", value: 0 },
        { label: "Sun", value: stats.totalUsers },
      ],
      listingsOverTime: [
        { label: "Week 1", value: 0 },
        { label: "Week 2", value: 0 },
        { label: "Week 3", value: 0 },
        { label: "Week 4", value: stats.totalListings },
      ],
      lostVsFound: {
        lost: stats.itemsLost,
        found: stats.itemsFound,
      },
      itemsReturnedOverTime: [
        { label: "Jan", value: 0 },
        { label: "Feb", value: 0 },
        { label: "Mar", value: stats.itemsReturned },
      ],
      topCategories: [
        { label: "Electronics", value: 0 },
        { label: "Wallets & Bags", value: 0 },
        { label: "Keys", value: 0 },
        { label: "Documents", value: 0 },
        { label: "Other", value: 0 },
      ],
      claimOutcomes: {
        pending: stats.pendingClaims,
        approved: stats.itemsReturned,
        rejected: 0,
      },
      reportsByType: [
        { label: "Fake listing", value: 0 },
        { label: "Spam", value: 0 },
        { label: "Inappropriate", value: 0 },
      ],
    };
  },

  async getAdminUsers(): Promise<User[]> {
    initLocalStorage();

    if (isSupabaseConfigured && supabase) {
      const client = supabase!;
      const { data, error } = await client.from("profiles").select("*").order("created_at", { ascending: false });

      if (error || !data) return getLocalStorageData("findly_users", []);
      return (data as Record<string, unknown>[]).map(row => ({
        id: String(row.id),
        name: String(row.name),
        avatarUrl: row.avatar_url ? String(row.avatar_url) : undefined,
        role: (row.role as UserRole) || "user",
        isSuspended: Boolean(row.is_suspended),
        suspendedUntil: row.suspended_until ? String(row.suspended_until) : undefined,
        suspensionReason: row.suspension_reason ? String(row.suspension_reason) : undefined,
        memberSince: row.created_at ? new Date(String(row.created_at)).toLocaleDateString("en-US", { year: "numeric", month: "long" }) : "Member",
        createdAt: String(row.created_at || ""),
      }));
    } else {
      return getLocalStorageData("findly_users", []);
    }
  },

  async updateUserRole(userId: string, newRole: UserRole, adminId: string): Promise<void> {
    initLocalStorage();

    if (isSupabaseConfigured && supabase) {
      const client = supabase!;
      const { error } = await client.from("profiles").update({ role: newRole }).eq("id", userId);
      if (error) throw error;

      await this.logAdminActivity(adminId, `Changed user role to ${newRole}`, "user", userId);
    } else {
      const users: User[] = getLocalStorageData("findly_users", []);
      const idx = users.findIndex(u => u.id === userId);
      if (idx !== -1) {
        users[idx].role = newRole;
        setLocalStorageData("findly_users", users);
      }
    }
  },

  async setUserSuspension(userId: string, isSuspended: boolean, reason?: string, adminId?: string): Promise<void> {
    initLocalStorage();

    if (isSupabaseConfigured && supabase) {
      const client = supabase!;
      const { error } = await client.from("profiles").update({
        is_suspended: isSuspended,
        suspension_reason: isSuspended ? (reason || "Violation of community rules") : null,
      }).eq("id", userId);

      if (error) throw error;

      if (adminId) {
        await this.logAdminActivity(adminId, isSuspended ? "Suspended user" : "Unsuspended user", "user", userId, { reason });
      }
    } else {
      const users: User[] = getLocalStorageData("findly_users", []);
      const idx = users.findIndex(u => u.id === userId);
      if (idx !== -1) {
        users[idx].isSuspended = isSuspended;
        users[idx].suspensionReason = reason;
        setLocalStorageData("findly_users", users);
      }
    }
  },

  async getCategories(includeInactive: boolean = false): Promise<Category[]> {
    initLocalStorage();
    if (isSupabaseConfigured && supabase) {
      const client = supabase!;
      let q = client.from("categories").select("*").order("name", { ascending: true });
      if (!includeInactive) q = q.eq("is_active", true);

      const { data, error } = await q;
      if (error || !data || data.length === 0) return getLocalStorageData("findly_categories", []);
      return (data as Record<string, unknown>[]).map(c => ({ id: String(c.id), name: String(c.name), icon: c.icon ? String(c.icon) : undefined, isActive: Boolean(c.is_active), createdAt: c.created_at ? String(c.created_at) : undefined }));
    } else {
      const cats: Category[] = getLocalStorageData("findly_categories", []);
      if (!includeInactive) return cats.filter(c => c.isActive);
      return cats;
    }
  },

  async createCategory(name: string, icon?: string, adminId?: string): Promise<Category> {
    initLocalStorage();
    if (isSupabaseConfigured && supabase) {
      const client = supabase!;
      const { data, error } = await client.from("categories").insert({ name, icon, is_active: true }).select().single();
      if (error || !data) throw error || new Error("Failed to create category");
      if (adminId) await this.logAdminActivity(adminId, "Created category", "category", data.id, { name });
      return { id: data.id, name: data.name, icon: data.icon, isActive: data.is_active };
    } else {
      const cats: Category[] = getLocalStorageData("findly_categories", []);
      const newCat: Category = { id: Math.random().toString(36).substring(2, 9), name, icon, isActive: true };
      cats.push(newCat);
      setLocalStorageData("findly_categories", cats);
      return newCat;
    }
  },

  async updateCategory(id: string, updates: Partial<Category>, adminId?: string): Promise<void> {
    initLocalStorage();
    if (isSupabaseConfigured && supabase) {
      const client = supabase!;
      const payload: Record<string, unknown> = {};
      if (updates.name) payload.name = updates.name;
      if (updates.isActive !== undefined) payload.is_active = updates.isActive;
      await client.from("categories").update(payload).eq("id", id);
      if (adminId) await this.logAdminActivity(adminId, "Updated category", "category", id, updates);
    } else {
      const cats: Category[] = getLocalStorageData("findly_categories", []);
      const idx = cats.findIndex(c => c.id === id);
      if (idx !== -1) {
        cats[idx] = { ...cats[idx], ...updates };
        setLocalStorageData("findly_categories", cats);
      }
    }
  },

  async getAdminActivityLogs(): Promise<AdminActivityLog[]> {
    initLocalStorage();
    if (isSupabaseConfigured && supabase) {
      const client = supabase!;
      const { data, error } = await client.from("admin_activity_logs").select(`*, admin:profiles(*)`).order("created_at", { ascending: false });
      if (error || !data) return getLocalStorageData("findly_activity_logs", []);
      return (data as Record<string, unknown>[]).map(l => {
        const adminRaw = l.admin as Record<string, unknown> | undefined;
        return {
          id: String(l.id),
          adminId: String(l.admin_id),
          action: String(l.action),
          targetType: String(l.target_type),
          targetId: String(l.target_id),
          metadata: (l.metadata as Record<string, unknown> | null) || null,
          createdAt: String(l.created_at),
          admin: adminRaw ? { id: String(adminRaw.id), name: String(adminRaw.name), avatarUrl: adminRaw.avatar_url ? String(adminRaw.avatar_url) : undefined, memberSince: "Member" } : undefined,
        };
      });
    } else {
      return getLocalStorageData("findly_activity_logs", []);
    }
  },

  async logAdminActivity(adminId: string, action: string, targetType: string, targetId: string, metadata?: Record<string, unknown> | null): Promise<void> {
    initLocalStorage();
    if (isSupabaseConfigured && supabase) {
      await supabase!.from("admin_activity_logs").insert({
        admin_id: adminId,
        action,
        target_type: targetType,
        target_id: targetId,
        metadata: metadata || null,
      });
    } else {
      const logs: AdminActivityLog[] = getLocalStorageData("findly_activity_logs", []);
      logs.unshift({
        id: Math.random().toString(36).substring(2, 9),
        adminId,
        action,
        targetType,
        targetId,
        metadata,
        createdAt: new Date().toISOString(),
      });
      setLocalStorageData("findly_activity_logs", logs);
    }
  },

  // NOTIFICATIONS API
  async getNotifications(userId: string): Promise<Notification[]> {
    initLocalStorage();
    if (isSupabaseConfigured && supabase) {
      const client = supabase!;
      const { data, error } = await client
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error || !data) return getLocalStorageData(`findly_notifications_${userId}`, []);
      return (data as Record<string, unknown>[]).map(n => ({
        id: String(n.id),
        userId: String(n.user_id),
        type: (n.type as NotificationType) || "system",
        title: String(n.title),
        message: String(n.message),
        link: n.link ? String(n.link) : undefined,
        isRead: Boolean(n.is_read),
        createdAt: String(n.created_at),
      }));
    } else {
      return getLocalStorageData(`findly_notifications_${userId}`, []);
    }
  },

  async createNotification(userId: string, type: NotificationType, title: string, message: string, link?: string): Promise<Notification> {
    initLocalStorage();
    const newNotif: Notification = {
      id: Math.random().toString(36).substring(2, 9),
      userId,
      type,
      title,
      message,
      link,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase!.from("notifications").insert({
          user_id: userId,
          type,
          title,
          message,
          link: link || null,
          is_read: false,
        });
      } catch (e) {
        console.warn("Supabase notification error:", e);
      }
    }

    const localKey = `findly_notifications_${userId}`;
    const userNotifs: Notification[] = getLocalStorageData(localKey, []);
    userNotifs.unshift(newNotif);
    setLocalStorageData(localKey, userNotifs);
    return newNotif;
  },

  async markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
    initLocalStorage();
    if (isSupabaseConfigured && supabase) {
      await supabase!.from("notifications").update({ is_read: true }).eq("id", notificationId);
    }
    const localKey = `findly_notifications_${userId}`;
    const userNotifs: Notification[] = getLocalStorageData(localKey, []);
    const idx = userNotifs.findIndex(n => n.id === notificationId);
    if (idx !== -1) {
      userNotifs[idx].isRead = true;
      setLocalStorageData(localKey, userNotifs);
    }
  },

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    initLocalStorage();
    if (isSupabaseConfigured && supabase) {
      await supabase!.from("notifications").update({ is_read: true }).eq("user_id", userId);
    }
    const localKey = `findly_notifications_${userId}`;
    const userNotifs: Notification[] = getLocalStorageData(localKey, []);
    userNotifs.forEach(n => { n.isRead = true; });
    setLocalStorageData(localKey, userNotifs);
  }
};

export default dbService;
