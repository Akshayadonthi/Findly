import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase, isSupabaseConfigured } from "./supabase";
import {
  Item,
  ItemType,
  ItemState,
  ItemImage,
  SavedItem,
  FilterState,
  User,
  Conversation,
  Message,
  UserRole
} from "../types";
import { calculateDistanceKm } from "./geo";

export interface DBClaim {
  id: string;
  item_id: string;
  claimant_id: string;
  description: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

const getStorageData = async <T>(key: string, defaultValue: T): Promise<T> => {
  try {
    const item = await AsyncStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setStorageData = async <T>(key: string, value: T): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {}
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
    whatsappNumber: row.whatsapp_number ? String(row.whatsapp_number) : (row.phone_number ? String(row.phone_number) : undefined),
    phoneNumber: row.phone_number ? String(row.phone_number) : undefined,
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

export const mobileDbService = {
  async getLocalStorageItems(filters?: FilterState): Promise<Item[]> {
    let items: Item[] = await getStorageData("findly_items", []);
    const allImages: ItemImage[] = await getStorageData("findly_item_images", []);

    // Filter out dummy / demo items completely
    items = items.filter(item => item && item.id && !item.id.startsWith("lost-") && !item.id.startsWith("found-") && !item.id.startsWith("demo-"));

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

  async getItems(filters?: FilterState): Promise<Item[]> {
    let remoteItems: Item[] = [];

    if (isSupabaseConfigured && supabase) {
      try {
        const client = supabase!;
        let q = client.from("items").select("*, reporter:profiles(*), images:item_images(*)");
        
        if (filters) {
          if (filters.searchQuery && filters.searchQuery.trim() !== "") {
            const searchTerm = filters.searchQuery.trim();
            q = q.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%,color.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`);
          }

          if (filters.type && filters.type !== "all") {
            q = q.or(`type.eq.${filters.type},status.eq.${filters.type}`);
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
          const isOldest = filters.sortBy === "oldest";
          q = q.order("created_at", { ascending: isOldest });
        } else {
          q = q.order("created_at", { ascending: false });
        }

        const { data, error } = await q;
        if (!error && data) {
          remoteItems = (data as unknown as Record<string, unknown>[]).map(mapDbRowToItem);
        }
      } catch (e) {
        console.warn("Supabase fetch error:", e);
      }
    }

    const localItems = await this.getLocalStorageItems(filters);
    
    // Merge local items and remote items cleanly
    const itemMap = new Map<string, Item>();
    localItems.forEach(i => itemMap.set(i.id, i));
    remoteItems.forEach(i => {
      if (!itemMap.has(i.id)) itemMap.set(i.id, i);
    });

    let mergedItems = Array.from(itemMap.values());

    if (filters) {
      if (filters.type && filters.type !== "all") {
        mergedItems = mergedItems.filter(i => (i.type || i.status) === filters.type);
      }
      if (filters.status && filters.status !== "all") {
        if (filters.status === "active") {
          mergedItems = mergedItems.filter(i => i.status !== "returned" && i.status !== "closed");
        } else {
          mergedItems = mergedItems.filter(i => i.status === filters.status);
        }
      }
      if (filters.category && filters.category !== "") {
        mergedItems = mergedItems.filter(i => i.category.toLowerCase() === filters.category.toLowerCase());
      }
    }

    return mergedItems;
  },

  async getItemById(id: string): Promise<Item | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase!
          .from("items")
          .select(`*, reporter:profiles(*), images:item_images(*)`)
          .eq("id", id)
          .single();

        if (!error && data) {
          return mapDbRowToItem(data as Record<string, unknown>);
        }
      } catch {}
    }
    const localItems = await this.getLocalStorageItems();
    return localItems.find((i) => i.id === id) || null;
  },

  async createItem(itemData: Omit<Item, "id" | "reporter" | "images">, reporter: User): Promise<Item> {
    const itemId = "item-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);

    let createdItem: Item = {
      ...itemData,
      id: itemId,
      type: itemData.type || (itemData.status === "found" ? "found" : "lost"),
      status: itemData.status || "active",
      city: itemData.city || "Chennai",
      area: itemData.area || itemData.location || "General Area",
      location: itemData.location || `${itemData.area || ''}, ${itemData.city || ''}`.trim(),
      reporter: reporter,
      createdAt: new Date().toISOString(),
      images: [],
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const client = supabase!;
        const fullPayload: Record<string, unknown> = {
          id: itemId,
          title: itemData.title,
          description: itemData.description,
          category: itemData.category,
          location: itemData.location,
          date: itemData.date,
          color: itemData.color || null,
          brand: itemData.brand || null,
          reporter_id: reporter.id,
          type: itemData.type || itemData.status || "lost",
          status: itemData.status || "active",
          city: itemData.city || "Chennai",
          area: itemData.area || itemData.location || "General Area",
          whatsapp_number: itemData.whatsappNumber || null,
          phone_number: itemData.phoneNumber || itemData.whatsappNumber || null,
        };

        const { data } = await client.from("items").insert(fullPayload).select(`*, reporter:profiles(*)`).single();
        if (data) {
          const mapped = mapDbRowToItem(data as Record<string, unknown>);
          createdItem = { ...createdItem, ...mapped };
        }
      } catch (e) {
        console.warn("Supabase remote item creation notice:", e);
      }
    }

    const localItems: Item[] = await getStorageData("findly_items", []);
    const updatedItems = [createdItem, ...localItems.filter(i => i.id !== createdItem.id)];
    await setStorageData("findly_items", updatedItems);

    return createdItem;
  },

  async getUserItems(userId: string): Promise<Item[]> {
    const allItems = await this.getItems();
    return allItems.filter(i => i.reporter.id === userId);
  }
};
