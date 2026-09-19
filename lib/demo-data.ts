import { Item, User } from "../types";

export const CATEGORIES = [
  "Electronics",
  "Bags & Backpacks",
  "Keys",
  "Wallets & Purses",
  "Watches & Jewelry",
  "Documents & IDs",
  "Accessories",
  "Clothing",
  "Other",
];

export const LOCATIONS = [
  "Campus Quad",
  "Central Library",
  "Science Hall",
  "Downtown Station",
  "City Park",
  "North Cafeteria",
  "Sports Complex",
  "Main Street Bus Stop",
];

export const DEMO_USERS: Record<string, User> = {
  alex: {
    id: "u1",
    name: "Alex Rivera",
    avatarUrl: undefined,
    memberSince: "May 2026",
  },
  sarah: {
    id: "u2",
    name: "Sarah Chen",
    avatarUrl: undefined,
    memberSince: "February 2026",
  },
};

// Zero dummy items - Only real items reported by users will be listed across the app
export const DEMO_ITEMS: Item[] = [];

export const DEMO_STATS = {
  reported: 120,
  matches: 85,
  reunited: 64,
  members: 140,
};

export const DEMO_MATCH = {
  lostItem: {
    title: "MacBook Laptop",
    category: "Electronics",
    status: "lost" as const,
    location: "Library",
    date: "2026-09-19",
  },
  foundItem: {
    id: "match-found-1",
    title: "Apple Laptop Silver",
    description: "Found silver laptop in library.",
    category: "Electronics",
    status: "found" as const,
    location: "Library",
    date: "2026-09-19",
    color: "Silver",
    brand: "Apple",
    reporter: DEMO_USERS.sarah,
  },
  matchScore: 87,
  factors: [
    { name: "Category Match", score: 25, matched: true, value: "Electronics" },
    { name: "Location Match", score: 25, matched: true, value: "Library" },
    { name: "Date Range Match", score: 20, matched: true, value: "Same Day" },
    { name: "Color Match", score: 12, matched: true, value: "Silver" },
  ],
};
