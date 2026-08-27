/** Public self-serve registration on the website (Meta app approved). */
export const PUBLIC_REGISTRATION_ENABLED = true;

export const KINMEL_ACCESS_WHATSAPP_E164 = "9779769498715";

export type KinmelAccessRequest = {
  shopName: string;
  facebookEmail: string;
  instagramEmail: string;
};

export function buildKinmelAccessWhatsAppUrl(request: KinmelAccessRequest): string {
  const shop = request.shopName.trim();
  const facebookEmail = request.facebookEmail.trim();
  const instagramEmail = request.instagramEmail.trim();
  const sameEmail =
    facebookEmail.length > 0 &&
    instagramEmail.toLowerCase() === facebookEmail.toLowerCase();

  const text = [
    "Hello, I would like to use the Kinmel app.",
    "",
    shop ? `Shop name: ${shop}` : "Shop name: (not provided)",
    facebookEmail
      ? `Facebook email: ${facebookEmail}`
      : "Facebook email: (not provided)",
    sameEmail
      ? `Instagram email: ${instagramEmail} (same as Facebook)`
      : instagramEmail
        ? `Instagram email: ${instagramEmail}`
        : "Instagram email: (not provided)",
    "",
    "Please grant me access to the Kinmel seller workspace and mobile app.",
    "",
    "Thank you. Yo Msg send garnu hos, hami hajur lai contact garxau!",
  ].join("\n");
  const encoded = encodeURIComponent(text);
  return `https://wa.me/${KINMEL_ACCESS_WHATSAPP_E164}?text=${encoded}`;
}

/** Public App Store listing (iOS). */
export const KINMEL_APP_STORE_URL =
  "https://apps.apple.com/py/app/kinmel/id6784923606?l=en-GB";

/** Direct Android APK until the Play Store listing is live. */
export const KINMEL_ANDROID_APK_URL = "/apk/kinmel.apk";
export const KINMEL_ANDROID_APK_FILENAME = "kinmel.apk";

export const KINMEL_CONTACT = {
  phonesDisplay: "+977 9714535269, +977 9769498715",
  phones: ["+9779714535269", "+9779769498715"] as const,
  whatsappDisplay: "+977 9769498715",
  address: "Pokhara Metropolitan City Ward No. 17, Balodaya Marg, Kaski, Gandaki, Nepal",
  companyName: "Naman Technologies Private Limited",
  companyUrl: "https://namantechnologies.biz",
} as const;
