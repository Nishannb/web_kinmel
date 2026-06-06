import { redirect } from "next/navigation";

export default async function LiveSellingEventIndexPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  redirect(`/live-selling/${eventId}/stream`);
}

