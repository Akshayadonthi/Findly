export type ItemType = "lost" | "found";

export type ItemState = "active" | "pending_claim" | "claimed" | "returned" | "closed";

export type ItemStatus = ItemType | ItemState;

export type UserRole = "user" | "moderator" | "admin";

export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
  email?: string;
  role?: UserRole;
  isSuspended?: boolean;
  suspendedUntil?: string;
  suspensionReason?: string;
  memberSince: string;
  createdAt?: string;
}

export interface ItemImage {
  id: string;
  itemId: string;
  storagePath: string;
  publicUrl: string;
  displayOrder: number;
  createdAt?: string;
}

export interface SavedItem {
  id: string;
  userId: string;
  itemId: string;
  createdAt: string;
  item?: Item;
}

export interface Item {
  id: string;
  type?: ItemType;
  status: ItemState | ItemType;
  title: string;
  description: string;
  category: string;
  city?: string;
  area?: string;
  location: string;
  latitude?: number;
  longitude?: number;
  date: string;
  time?: string;
  color?: string;
  brand?: string;
  model?: string;
  identifyingFeatures?: string;
  reward?: number;
  whatsappNumber?: string;
  phoneNumber?: string;
  additionalNotes?: string;
  imageUrl?: string;
  images?: ItemImage[];
  reporter: User;
  isSaved?: boolean;
  resolvedAt?: string;
  createdAt?: string;
}

export interface FilterState {
  searchQuery: string;
  type?: "all" | "lost" | "found";
  category: string;
  city: string;
  area?: string;
  location: string;
  color?: string;
  brand?: string;
  date: string;
  status?: string;
  sortBy: "newest" | "oldest" | string;
  maxDistanceKm?: number;
  userLat?: number;
  userLng?: number;
}

export interface Conversation {
  id: string;
  itemId?: string;
  participant1: User;
  participant2: User;
  otherParticipant?: User;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
  item?: Item;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  message: string;
  createdAt: string;
  readAt?: string;
  sender?: User;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  isActive: boolean;
}
