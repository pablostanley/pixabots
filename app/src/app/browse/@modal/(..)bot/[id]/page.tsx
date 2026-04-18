import { notFound } from "next/navigation";
import { isValidId } from "@pixabots/core";
import { BotDialog } from "@/components/bot-dialog";

export default async function InterceptedBotPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isValidId(id)) notFound();
  return <BotDialog id={id} />;
}
