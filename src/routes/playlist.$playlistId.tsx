import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { DetailView } from "@/components/detail-view";
import { getDetailPage } from "@/lib/music.functions";

const playlistQuery = (playlistId: string) =>
  queryOptions({
    queryKey: ["playlist", playlistId],
    queryFn: () =>
      getDetailPage({
        data: {
          browseId: playlistId.startsWith("VL") ? playlistId : `VL${playlistId}`,
          fallbackTitle: "Playlist",
        },
      }),
    staleTime: 30 * 60 * 1000,
  });

export const Route = createFileRoute("/playlist/$playlistId")({
  head: () => ({
    meta: [
      { title: "Playlist — Metrolist" },
      { name: "description", content: "Playlist tracklist with queue control and synced lyrics." },
      { property: "og:title", content: "Playlist — Metrolist" },
      { property: "og:description", content: "Playlist tracklist with queue control and synced lyrics." },
    ],
  }),
  loader: ({ context, params }) => {
    void context.queryClient.ensureQueryData(playlistQuery(params.playlistId));
  },
  component: PlaylistPage,
  errorComponent: ({ error }) => (
    <p role="alert" className="p-8 text-sm text-muted-foreground">
      {error.message}
    </p>
  ),
});

function PlaylistPage() {
  const { playlistId } = Route.useParams();
  const { data } = useSuspenseQuery(playlistQuery(playlistId));
  return <DetailView page={data} />;
}
