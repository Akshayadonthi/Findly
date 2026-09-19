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
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  sortBy: "newest" | "oldest" | string;
  maxDistanceKm?: number;
  userLat?: number;
  userLng?: number;
  page?: number;
  limit?: number;
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

export type ReportReason =
  | "Fake listing"
  | "Spam"
  | "Incorrect information"
  | "Suspicious activity"
  | "Inappropriate content"
  | "Scam"
  | "Harassment"
  | "Fake identity"
  | "Other";

export type ReportStatus = "pending" | "under_review" | "resolved" | "dismissed";

export interface Report {
  id: string;
  reporterId: string;
  itemId?: string;
  reportedUserId?: string;
  reason: ReportReason | string;
  description?: string;
  status: ReportStatus;
  reviewerId?: string;
  createdAt: string;
  resolvedAt?: string;
  item?: Item;
  reporter?: User;
  reportedUser?: User;
}

export interface BlockedUser {
  id: string;
  blockerId: string;
  blockedUserId: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface AdminActivityLog {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  admin?: User;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalListings: number;
  itemsLost: number;
  itemsFound: number;
  itemsReturned: number;
  pendingClaims: number;
  pendingReports: number;
  potentialMatches: number;
  successfulReturns: number;
  matchSuccessRate: number;
}

export interface AnalyticsChartPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

export interface AnalyticsData {
  userGrowth: AnalyticsChartPoint[];
  listingsOverTime: AnalyticsChartPoint[];
  lostVsFound: { lost: number; found: number };
  itemsReturnedOverTime: AnalyticsChartPoint[];
  topCategories: AnalyticsChartPoint[];
  claimOutcomes: { pending: number; approved: number; rejected: number };
  reportsByType: AnalyticsChartPoint[];
}

export interface MatchFactor {
  name: string;
  score: number;
  matched: boolean;
  value: string;
}

export interface MatchResult {
  lostItem: Partial<Item>;
  foundItem: Partial<Item>;
  matchScore: number;
  factors: MatchFactor[];
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
