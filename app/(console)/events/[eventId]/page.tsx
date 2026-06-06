import { redirect } from "next/navigation";

export default async function LegacyEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  redirect(`/live-selling/${eventId}/live`);
}

