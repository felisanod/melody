import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { DetailView } from "@/components/detail-view";
import { getDetailPage } from "@/lib/music.functions";

const albumQuery = (browseId: string) =>
  queryOptions({
    queryKey: ["album", browseId],
    queryFn: () => getDetailPage({ data: { browseId, fallbackTitle: "Album" } }),
    staleTime: 30 * 60 * 1000,
  });

export const Route = createFileRoute("/album/$browseId")({
  head: () => ({
    meta: [
      { title: "Album — Metrolist" },
      { name: "description", content: "Album tracklist with instant playback and synced lyrics." },
      { property: "og:title", content: "Album — Metrolist" },
      { property: "og:description", content: "Album tracklist with instant playback and synced lyrics." },
    ],
  }),
  loader: ({ context, params }) => {
    void context.queryClient.ensureQueryData(albumQuery(params.browseId));
  },
  component: AlbumPage,
  errorComponent: ({ error }) => (
    <p role="alert" className="p-8 text-sm text-muted-foreground">
      {error.message}
    </p>
  ),
});

function AlbumPage() {
  const { browseId } = Route.useParams();
  const { data } = useSuspenseQuery(albumQuery(browseId));
  return <DetailView page={data} />;
}
