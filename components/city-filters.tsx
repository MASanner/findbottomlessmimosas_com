"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PRICE_BUCKETS = [
  { value: "", label: "Any price" },
  { value: "15-20", label: "$15–20" },
  { value: "21-25", label: "$21–25" },
  { value: "26-35", label: "$26–35" },
  { value: "36+", label: "$36+" },
  { value: "unknown", label: "Unknown" },
];

export function CityFilters({
  neighborhoods,
}: {
  neighborhoods: { slug: string; name: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setParams = useCallback(
    (updates: Record<string, string | number | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === "" || value === "all") {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      }
      next.delete("page");
      const q = next.toString();
      router.push(q ? `?${q}` : ".");
    },
    [router, searchParams]
  );

  const search = searchParams.get("search") ?? "";
  const priceBucket = searchParams.get("price") ?? "";
  const neighborhood = searchParams.get("neighborhood") ?? "";
  const showPending = searchParams.get("showPending") === "1";

  return (
    <aside className="w-64 shrink-0 space-y-4">
      <div>
        <Label htmlFor="search">Search</Label>
        <Input
          id="search"
          placeholder="Name or description..."
          defaultValue={search}
          onBlur={(e) => setParams({ search: e.target.value.trim() || undefined })}
          onKeyDown={(e) => e.key === "Enter" && setParams({ search: (e.target as HTMLInputElement).value.trim() || undefined })}
        />
      </div>
      <div>
        <Label>Price</Label>
        <Select value={priceBucket || "all"} onValueChange={(v) => setParams({ price: v === "all" ? undefined : v })}>
          <SelectTrigger>
            <SelectValue placeholder="Any price" />
          </SelectTrigger>
          <SelectContent>
            {PRICE_BUCKETS.map((b) => (
              <SelectItem key={b.value || "any"} value={b.value || "all"}>
                {b.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {neighborhoods.length > 0 && (
        <div>
          <Label>Neighborhood</Label>
          <Select value={neighborhood || "all"} onValueChange={(v) => setParams({ neighborhood: v === "all" ? undefined : v })}>
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {neighborhoods.map((n) => (
                <SelectItem key={n.slug} value={n.slug}>
                  {n.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="showPending"
          checked={showPending}
          onChange={(e) => setParams({ showPending: e.target.checked ? "1" : undefined })}
          className="h-4 w-4"
        />
        <Label htmlFor="showPending">Show pending</Label>
      </div>
      <Button variant="outline" size="sm" onClick={() => router.push(".")}>
        Clear filters
      </Button>
    </aside>
  );
}
