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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Album — flex-web" },
      { name: "description", content: "Album tracklist with instant playback and synced lyrics." },
      { property: "og:title", content: "Album — flex-web" },
      {
        property: "og:description",
        content: "Album tracklist with instant playback and synced lyrics.",
      },
    ],
  }),
  loader: ({ context, params }) => {
    void context.queryClient.ensureQueryData(albumQuery(params.browseId));
  },
  component: AlbumPage,
  errorComponent: ({ error }) => (
    <p role="alert" className="p-8 text-sm text-muted-foreground">
      {error instanceof Error ? error.message : "This album could not be loaded."}
    </p>
  ),
});

function AlbumPage() {
  const { browseId } = Route.useParams();
  const { data } = useSuspenseQuery(albumQuery(browseId));
  return <DetailView page={data} />;
}
