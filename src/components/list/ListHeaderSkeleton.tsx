// src/components/list/ListHeaderSkeleton.tsx
"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function ListHeaderSkeleton() {
  return (
    <header className="mb-4">
      <div className="flex flex-wrap items-center gap-4 mb-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-14" />
        <div className="ml-auto flex gap-3">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
      </div>
    </header>
  );
}
