"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function ItemsGridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="border">
          <CardContent className="pt-0">
            <div className="w-full aspect-square">
              <Skeleton className="w-full h-full rounded-md" />
            </div>
            <div className="mt-2 space-y-2 text-center">
              <Skeleton className="h-4 w-24 mx-auto" />
              <Skeleton className="h-3 w-20 mx-auto" />
              <Skeleton className="h-3 w-16 mx-auto" />
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Skeleton className="h-3 w-28 mx-auto" />
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
