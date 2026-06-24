import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Clear my data",
  description: "Request deletion of your Kinmel account and associated data.",
};

export default function ClearMyDataPage() {
  return (
    <LegalPageShell title="Clear my data" updated="June 13, 2026">
      <section className="space-y-3">
        <h2>Your right to delete</h2>
        <p>
          You may request that Kinmel delete your account and the personal data we hold about you.
          This applies to data collected through the Kinmel mobile app and website, including
          catalog, orders, connected Instagram/Facebook authorization, and usage records tied to
          your account.
        </p>
      </section>

      <section className="space-y-3">
        <h2>How to request deletion</h2>
        <p>
          Email us at{" "}
          <a href="mailto:nishan@kinmel.shop" className="font-medium text-violet-700 hover:underline">
            nishan@kinmel.shop
          </a>{" "}
          from the email address linked to your Kinmel account (or explain in the message if you no
          longer have access to it).
        </p>
        <p>Please include the following in your email:</p>
        <ul>
          <li>
            <strong>Account username</strong> — the phone number or login identifier you use for
            Kinmel.
          </li>
          <li>
            <strong>Instagram name</strong> — your connected Instagram username (@handle).
          </li>
          <li>A clear statement that you want your Kinmel data deleted.</li>
        </ul>
        <p className="rounded-xl border border-violet-100 bg-violet-50/50 px-4 py-3 text-zinc-600">
          Example subject: <em>Kinmel data deletion request</em>
          <br />
          Example body: &quot;Please delete all data associated with my Kinmel account. Username:
          +97798XXXXXXXX. Instagram: @myshop.&quot;
        </p>
      </section>

      <section className="space-y-3">
        <h2>What happens next</h2>
        <ul>
          <li>
            We will review your request and respond within <strong>5 business days</strong>.
          </li>
          <li>
            When deletion is complete, we will reply with <strong>concrete evidence</strong> that
            your data has been removed (for example, confirmation of account closure and deletion
            from our primary systems).
          </li>
          <li>
            If we need more information to verify your identity or locate your account, we will
            contact you at the email address you used to send the request.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2>What may be retained</h2>
        <p>
          We may keep limited records where required by law (for example, tax or payment records) or
          for legitimate security purposes (such as fraud-prevention logs), but we will not use
          retained data for marketing or to restore your seller account without a new registration.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Disconnect Instagram &amp; Facebook</h2>
        <p>
          You can also revoke Kinmel&apos;s access in your Meta account settings at any time. Data
          deletion through Kinmel is separate from revoking Meta permissions; for full removal from
          Kinmel systems, please use the email process above.
        </p>
      </section>

      <section className="space-y-3">
        <h2>More information</h2>
        <p>
          See our{" "}
          <a href="/privacy-policy" className="font-medium text-violet-700 hover:underline">
            Privacy Policy
          </a>{" "}
          for details on what we collect and how we use it.
        </p>
      </section>
    </LegalPageShell>
  );
}
