import { notFound, redirect } from "next/navigation";
import { SellerShopCatalog } from "@/components/storefront/SellerShopCatalog";
import { isReservedStorefrontUsername } from "@/lib/reservedUsernames";
import { fetchSellerRelay } from "@/lib/sellerRelayClient";
import { buyPagePath } from "@/lib/sellerShop";

type PageProps = {
  params: Promise<{ username: string }>;
};

export default async function SellerUsernameRelayPage({ params }: PageProps) {
  const { username } = await params;
  const slug = (username || "").trim();

  if (isReservedStorefrontUsername(slug)) {
    notFound();
  }

  const relay = await fetchSellerRelay(slug);
  if (!relay.ok) {
    notFound();
  }

  // Live + product on overlay → snapshot redirect (refresh stays on /buy/{id}).
  if (relay.live_active && relay.product_id) {
    redirect(
      buyPagePath(relay.product_id, {
        fromLive: true,
        seller: relay.seller_username || slug,
      })
    );
  }

  return <SellerShopCatalog relay={relay} />;
}
