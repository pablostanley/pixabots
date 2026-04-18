import Link from "next/link";
import { randomId } from "@pixabots/core";

export default function NotFound() {
  const id = randomId();
  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="border border-border p-3">
        <img
          src={`/api/pixabot/${id}?size=240&animated=true`}
          alt="Lost pixabot"
          width={240}
          height={240}
          className="block"
          style={{ imageRendering: "pixelated" }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">404</h1>
        <p className="text-muted-foreground">
          This pixabot got lost. Try another route.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Link
          href="/"
          className="px-3 py-2 border border-border hover:bg-muted transition-colors text-sm"
        >
          Home
        </Link>
        <Link
          href="/browse"
          className="px-3 py-2 border border-border hover:bg-muted transition-colors text-sm"
        >
          Browse
        </Link>
        <Link
          href={`/bot/${id}`}
          className="px-3 py-2 border border-border hover:bg-muted transition-colors text-sm font-mono"
        >
          #{id}
        </Link>
      </div>
    </main>
  );
}
