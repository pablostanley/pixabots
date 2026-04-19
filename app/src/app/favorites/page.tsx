"use client";

import { useMemo, useRef } from "react";
import Link from "next/link";
import { useFavorites } from "@/lib/use-favorites";
import { FavoriteButton } from "@/components/favorite-button";

export default function FavoritesPage() {
  const { ids, exportJson, importJson, clear } = useFavorites();
  // Insertion order is chronological (oldest first); reverse so the grid
  // shows the most recently starred bot in the top-left.
  const displayIds = useMemo(() => [...ids].reverse(), [ids]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const blob = new Blob([exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pixabots-favorites-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const text = await file.text();
    const { added, invalid, malformed } = importJson(text);
    if (malformed) {
      alert("Couldn't read that file — expected a JSON array of IDs or the export envelope.");
      return;
    }
    const skipped = invalid > 0 ? ` (${invalid} skipped)` : "";
    alert(`Imported ${added} new favorite${added === 1 ? "" : "s"}${skipped}.`);
  };

  return (
    <main className="flex-1 p-2 sm:p-4">
      <header className="flex items-center gap-2 mb-3 sm:mb-4 px-2 flex-wrap">
        <h1 className="text-lg font-bold">Favorites</h1>
        <span className="text-sm text-muted-foreground">{ids.length}</span>
        <div className="ml-auto flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFile}
            className="sr-only"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="px-3 py-1.5 border border-border hover:bg-muted transition-colors text-sm cursor-pointer"
          >
            Import
          </button>
          {ids.length > 0 && (
            <button
              type="button"
              onClick={handleExport}
              className="px-3 py-1.5 border border-border hover:bg-muted transition-colors text-sm cursor-pointer"
            >
              Export
            </button>
          )}
          {ids.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (confirm(`Remove all ${ids.length} favorite${ids.length === 1 ? "" : "s"}? This cannot be undone.`)) {
                  clear();
                }
              }}
              className="px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm cursor-pointer"
            >
              Clear all
            </button>
          )}
          {ids.length >= 2 && (
            <Link
              href={`/compare?ids=${displayIds.slice(0, 6).join(",")}`}
              className="px-3 py-1.5 border border-border hover:bg-muted transition-colors text-sm"
            >
              Compare
            </Link>
          )}
        </div>
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
          {displayIds.map((id) => (
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
