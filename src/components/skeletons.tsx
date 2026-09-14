import { Disc3, Music2 } from "lucide-react";

export function SongSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl px-2 py-2 neu-inset-sm">
      <div className="size-11 shrink-0 rounded-lg bg-border/50" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-4 w-3/4 rounded bg-border/50" />
        <div className="h-3 w-1/2 rounded bg-border/50" />
      </div>
    </div>
  );
}

export function SongRowSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl px-2 py-2 neu-inset-sm">
          <div className="w-6 text-center text-xs tabular-nums text-muted-foreground">
            <div className="h-4 w-6 rounded bg-border/50" />
          </div>
          <div className="size-11 shrink-0 rounded-lg bg-border/50" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-2/3 rounded bg-border/50" />
            <div className="h-3 w-1/3 rounded bg-border/50" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ItemCardSkeleton() {
  return (
    <div className="w-40 shrink-0 sm:w-44 space-y-2">
      <div className="aspect-square w-full rounded-xl neu-raised-sm" />
      <div className="h-4 w-full rounded bg-border/50" />
      <div className="h-3 w-2/3 rounded bg-border/50" />
    </div>
  );
}

export function ShelfRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <section className="space-y-3">
      <div className="h-6 w-40 rounded bg-border/50" />
      <div className="flex gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <ItemCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

export function HomeSkeleton() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-10 px-4 py-8 sm:px-8">
      <div className="space-y-3">
        <div className="h-4 w-32 rounded bg-border/50" />
        <div className="h-10 w-2/3 rounded bg-border/50" />
        <div className="h-4 w-1/2 rounded bg-border/50" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="neu-raised rounded-2xl p-6 space-y-3">
            <div className="h-6 w-20 rounded bg-border/50" />
            <div className="h-4 w-full rounded bg-border/50" />
            <div className="h-3 w-2/3 rounded bg-border/50" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DetailViewSkeleton() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-10 px-4 py-8 sm:px-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
        <div className="size-48 shrink-0 rounded-2xl neu-raised sm:size-60" />
        <div className="min-w-0 space-y-3">
          <div className="h-10 w-2/3 rounded bg-border/50" />
          <div className="h-4 w-1/3 rounded bg-border/50" />
          <div className="h-4 w-full rounded bg-border/50" />
        </div>
      </div>
      <SongRowSkeleton count={8} />
    </div>
  );
}

export function PlayerBarSkeleton() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 neu-raised">
      <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-3 py-2 sm:gap-5 sm:px-6 sm:py-3">
        <div className="size-12 rounded-xl bg-border/50" />
        <div className="min-w-0 space-y-2">
          <div className="h-4 w-32 rounded bg-border/50" />
          <div className="h-3 w-24 rounded bg-border/50" />
        </div>
        <div className="ml-auto flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="size-8 rounded-full bg-border/50" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function MusicIcon({ className }: { className?: string }) {
  return <Music2 className={className} />;
}
