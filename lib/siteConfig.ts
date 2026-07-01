/** Set true to restore public self-serve registration on the website. */
export const PUBLIC_REGISTRATION_ENABLED = false;

export const KINMEL_ACCESS_WHATSAPP_E164 = "9779769498715";

export function buildKinmelAccessWhatsAppUrl(businessName: string): string {
  const name = businessName.trim();
  const text = [
    "Hello, I would like to use the Kinmel app.",
    "",
    name ? `Business name: ${name}` : "Business name: (not provided)",
    "",
    "Please grant me access to the Kinmel seller workspace and mobile app.",
    "",
    "Thank you. Yo Msg send garnu hos, hami hajur lai contact garxau!",
  ].join("\n");
  const encoded = encodeURIComponent(text);
  return `https://wa.me/${KINMEL_ACCESS_WHATSAPP_E164}?text=${encoded}`;
}
