"use client";

import React, { useState } from "react";
import { Search, X, MapPin, Compass } from "lucide-react";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Button from "@/components/ui/button";
import { CATEGORIES, LOCATIONS } from "@/lib/demo-data";
import { FilterState } from "@/types";
import { getCurrentUserLocation } from "@/lib/geo";

interface ItemFiltersProps {
  filters: FilterState;
  onChange: (updates: Partial<FilterState>) => void;
  onClear: () => void;
}

export const ItemFilters: React.FC<ItemFiltersProps> = ({
  filters,
  onChange,
  onClear,
}) => {
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const hasActiveFilters =
    filters.searchQuery ||
    filters.category ||
    filters.location ||
    filters.date ||
    filters.maxDistanceKm !== undefined ||
    filters.sortBy !== "newest";

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
  ];

  const handleUseMyLocation = async () => {
    setIsLocating(true);
    setLocationError(null);
    try {
      const coords = await getCurrentUserLocation();
      onChange({
        userLat: coords.latitude,
        userLng: coords.longitude,
        maxDistanceKm: filters.maxDistanceKm || 10,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Location access denied.";
      setLocationError(msg);
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <div className="bg-white border border-neutral-100 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
      {/* Row 1: Search Query & Location Trigger */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Input
            placeholder="Search by keywords (e.g. AirPods, keys, wallet)..."
            value={filters.searchQuery}
            onChange={(e) => onChange({ searchQuery: e.target.value })}
            leftIcon={<Search className="h-5 w-5 text-neutral-400" />}
            className="bg-neutral-50/50 border-neutral-200/80 focus:bg-white"
          />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleUseMyLocation}
          isLoading={isLocating}
          className="shrink-0 gap-1.5 border-neutral-200 text-xs font-bold text-neutral-700 bg-neutral-50 hover:bg-neutral-100"
        >
          <Compass className="h-4 w-4 text-primary-600" />
          <span>{filters.userLat !== undefined ? "Location Active" : "Use My Location"}</span>
        </Button>
      </div>

      {locationError && (
        <p className="text-xs text-danger-600 font-medium px-1">{locationError}</p>
      )}

      {/* Row 2: Select Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Category Filter */}
        <div className="flex flex-col">
          <Select
            placeholder="All Categories"
            options={CATEGORIES}
            value={filters.category}
            onChange={(e) => onChange({ category: e.target.value })}
            className="bg-neutral-50/50"
          />
        </div>

        {/* Location Filter */}
        <div className="flex flex-col">
          <Select
            placeholder="All Locations"
            options={LOCATIONS}
            value={filters.location}
            onChange={(e) => onChange({ location: e.target.value })}
            className="bg-neutral-50/50"
          />
        </div>

        {/* Date Filter */}
        <div className="flex flex-col">
          <Input
            type="date"
            placeholder="Filter by date"
            value={filters.date}
            onChange={(e) => onChange({ date: e.target.value })}
            className="bg-neutral-50/50 h-[46px] text-sm py-2"
          />
        </div>

        {/* Sort Dropdown */}
        <div className="flex flex-col">
          <Select
            options={sortOptions}
            value={filters.sortBy}
            onChange={(e) => onChange({ sortBy: e.target.value })}
            className="bg-neutral-50/50"
          />
        </div>
      </div>

      {/* Distance Slider (Only active when coordinates are set) */}
      {filters.userLat !== undefined && (
        <div className="p-4 bg-primary-50/40 border border-primary-100/60 rounded-2xl space-y-2 animate-scale-in">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-neutral-800 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-primary-600" />
              Maximum Search Radius:
            </span>
            <span className="font-extrabold text-primary-700 bg-white px-2 py-0.5 rounded-md border border-primary-200">
              {filters.maxDistanceKm || 10} km
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="50"
            step="1"
            value={filters.maxDistanceKm || 10}
            onChange={(e) => onChange({ maxDistanceKm: parseInt(e.target.value, 10) })}
            className="w-full accent-primary-600 cursor-pointer"
          />
        </div>
      )}

      {/* Row 3: Filter indicators & Clear action */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-50">
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-500 font-medium">
            <span>Active filters:</span>
            {filters.searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-100 rounded-full">
                &quot;{filters.searchQuery}&quot;
              </span>
            )}
            {filters.category && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-100 rounded-full">
                Category: {filters.category}
              </span>
            )}
            {filters.location && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-100 rounded-full">
                Location: {filters.location}
              </span>
            )}
            {filters.date && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-100 rounded-full">
                Date: {filters.date}
              </span>
            )}
            {filters.maxDistanceKm !== undefined && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-100 text-primary-800 font-semibold rounded-full">
                Within {filters.maxDistanceKm} km
              </span>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-8 text-xs font-semibold text-danger-600 hover:bg-danger-50 hover:text-danger-700 gap-1 rounded-lg px-2.5"
          >
            <X className="h-3.5 w-3.5" />
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default ItemFilters;
