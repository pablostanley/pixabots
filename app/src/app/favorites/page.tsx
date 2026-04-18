"use client";

import Link from "next/link";
import { useFavorites } from "@/lib/use-favorites";
import { FavoriteButton } from "@/components/favorite-button";

export default function FavoritesPage() {
  const { ids } = useFavorites();

  return (
    <main className="flex-1 p-2 sm:p-4">
      <header className="flex items-center gap-2 mb-3 sm:mb-4 px-2">
        <h1 className="text-lg font-bold">Favorites</h1>
        <span className="text-sm text-muted-foreground">{ids.length}</span>
        {ids.length >= 2 && (
          <Link
            href={`/compare?ids=${ids.slice(0, 6).join(",")}`}
            className="ml-auto px-3 py-1.5 border border-border hover:bg-muted transition-colors text-sm"
          >
            Compare
          </Link>
        )}
      </header>

      {ids.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <div className="text-4xl text-muted-foreground">☆</div>
          <p className="text-muted-foreground">
            No favorites yet. Star a pixabot on its detail page or in browse.
          </p>
          <div className="flex gap-2">
            <Link
              href="/browse"
              className="px-3 py-2 border border-border hover:bg-muted transition-colors text-sm"
            >
              Browse
            </Link>
            <Link
              href="/"
              className="px-3 py-2 border border-border hover:bg-muted transition-colors text-sm"
            >
              Create
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
          {ids.map((id) => (
            <Link
              key={id}
              href={`/bot/${id}`}
              className="group relative block bg-card border border-border overflow-hidden"
            >
              <div className="relative aspect-square">
                <img
                  src={`/api/pixabot/${id}?size=240&animated=true`}
                  alt={`Pixabot ${id}`}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ imageRendering: "pixelated" }}
                  loading="lazy"
                />
              </div>
              <div className="flex items-center gap-1 p-1">
                <span className="font-mono text-sm text-muted-foreground mr-auto">{id}</span>
                <FavoriteButton id={id} size="sm" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
