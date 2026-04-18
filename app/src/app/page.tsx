import { Creator } from "./creator";
import { SpritePreload } from "@/components/sprite-preload";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  return (
    <>
      <SpritePreload />
      <Creator initialId={typeof id === "string" ? id : null} />
    </>
  );
}
