import { Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight, Music2, User } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/home")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-8 px-4 py-8 sm:px-8">
      <h1 className="font-display text-4xl font-semibold tracking-tight">Home</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <HomeCard
          title="Explore"
          description="Browse new releases, moods and genres"
          to="/"
          icon={<Music2 className="size-5" />}
        />
        <HomeCard
          title="Charts"
          description="Trending songs and artists"
          to="/charts"
          icon={<User className="size-5" />}
        />
        <HomeCard
          title="Search"
          description="Find songs, albums, artists"
          to="/search"
          icon={<Music2 className="size-5" />}
        />
      </div>
    </div>
  );
}

function HomeCard({
  title,
  description,
  to,
  icon,
}: {
  title: string;
  description: string;
  to: string;
  icon: React.ReactNode;
}) {
  return (
    <Link to={to} className="group neu-raised rounded-2xl p-6 transition hover:neu-inset-sm">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl neu-raised-sm text-accent-foreground">
          {icon}
        </div>
        <h2 className="font-display text-lg font-semibold">{title}</h2>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{description}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent">
        Go there <ChevronRight className="size-4" />
      </span>
    </Link>
  );
}
