import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { DetailView } from "@/components/detail-view";
import { getDetailPage } from "@/lib/music.functions";

const artistQuery = (artistId: string) =>
  queryOptions({
    queryKey: ["artist", artistId],
    queryFn: () => getDetailPage({ data: { browseId: artistId, fallbackTitle: "Artist" } }),
    staleTime: 30 * 60 * 1000,
  });

export const Route = createFileRoute("/artist/$artistId")({
  head: () => ({
    meta: [
      { title: "Artist — flex-web" },
      {
        name: "description",
        content: "Artist top songs, albums and singles with one-tap playback.",
      },
      { property: "og:title", content: "Artist — flex-web" },
      {
        property: "og:description",
        content: "Artist top songs, albums and singles with one-tap playback.",
      },
    ],
  }),
  loader: ({ context, params }) => {
    void context.queryClient.ensureQueryData(artistQuery(params.artistId));
  },
  component: ArtistPage,
  errorComponent: ({ error }) => (
    <p role="alert" className="p-8 text-sm text-muted-foreground">
      {error.message}
    </p>
  ),
});

function ArtistPage() {
  const { artistId } = Route.useParams();
  const { data } = useSuspenseQuery(artistQuery(artistId));
  return <DetailView page={data} round />;
}
