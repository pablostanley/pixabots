import { Creator } from "./creator";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  return <Creator initialId={typeof id === "string" ? id : null} />;
}
