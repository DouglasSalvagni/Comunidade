import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PostSkeleton() {
  return (
    <Card className="overflow-hidden border-muted/50 shadow-sm">
      <CardHeader className="p-4 sm:p-6 pb-2">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-2 space-y-4">
        <Skeleton className="h-6 w-3/4" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[90%]" />
          <Skeleton className="h-4 w-[80%]" />
        </div>
      </CardContent>
      <CardFooter className="p-4 sm:p-6 pt-0 flex gap-4">
        <Skeleton className="h-8 w-20 rounded-md" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </CardFooter>
    </Card>
  );
}
