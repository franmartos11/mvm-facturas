import { Skeleton } from "@/components/Skeleton";

export default function DashboardSkeleton() {
  return (
    <main className="min-h-screen p-8 bg-zinc-50 dark:bg-black">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Skeleton */}
        <header className="flex items-center justify-between pb-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </header>

        {/* DashboardSummary Skeleton (3 cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm h-32 space-y-4">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <Skeleton className="h-8 w-32" />
            </div>
          ))}
        </div>

        {/* DashboardCharts Skeleton */}
        <div className="w-full h-[380px] bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 space-y-4">
            <div className="flex justify-between">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-24" />
            </div>
            <div className="w-full h-full flex items-end gap-2 pb-8">
                {[...Array(14)].map((_, i) => (
                    <Skeleton key={i} className="w-full h-full" style={{ height: `${Math.random() * 60 + 20}%` }} />
                ))}
            </div>
        </div>

        {/* Main Content Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Upload */}
          <div className="lg:col-span-1">
            <div className="w-full h-64 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 p-8 space-y-6 flex flex-col items-center">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-32 mt-auto" />
            </div>
          </div>

          {/* Right Column: Lists */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
                <div className="flex gap-4 mb-6">
                    <Skeleton className="h-10 w-32 rounded-full" />
                    <Skeleton className="h-10 w-32 rounded-full" />
                </div>
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="w-full h-20 rounded-lg" />
                ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
