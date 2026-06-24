import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Kinmel collects, uses, and protects your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell title="Privacy Policy" updated="June 13, 2026">
      <section className="space-y-3">
        <h2>Overview</h2>
        <p>
          Kinmel provides a mobile app and website that help sellers run shoppable Instagram Live
          streams and Reels. Buyers can comment buy codes on Instagram and complete checkout on the
          web. This policy explains what information we collect and how we use it.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Information we collect</h2>
        <ul>
          <li>Account details you provide (e.g. phone number, email, business name).</li>
          <li>Product catalog, prices, images, orders, and live-event data you create in Kinmel.</li>
          <li>
            Instagram and Facebook account information when you connect those accounts, including
            profile identifiers and permissions you grant.
          </li>
          <li>
            Instagram comments and related metadata delivered to us via Meta webhooks when viewers
            interact with your live or recorded content.
          </li>
          <li>
            Usage and analytics data from the Kinmel app and website (e.g. pages viewed, features
            used, device type, approximate location) to understand how the service is used and
            improve it.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2>How we use your information</h2>
        <ul>
          <li>Operate your seller account, catalog, checkout links, and order management.</li>
          <li>
            Receive comment notifications from Meta when viewers comment buy codes on your Instagram
            Live or Reels.
          </li>
          <li>
            Send Instagram direct messages on your behalf (for example, checkout links in response to
            buy-code comments), when you have authorized Kinmel to do so.
          </li>
          <li>
            Publish Reels and related content to Instagram that you create or schedule through the
            Kinmel app, when you have authorized us to do so.
          </li>
          <li>Process payments and fulfil orders placed through Kinmel checkout.</li>
          <li>
            Measure usage patterns with analytics tools so we can improve performance, reliability,
            and product design.
          </li>
          <li>Provide support, security, fraud prevention, and legal compliance.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2>Instagram &amp; Facebook (Meta)</h2>
        <p>
          To use live selling, comment-to-buy, and Reels publishing, you must connect your Instagram
          and Facebook accounts and grant Kinmel the permissions Meta requires. Those permissions
          allow us to receive webhook notifications, send DMs on your behalf, and post content you
          create in Kinmel. Meta&apos;s own policies also apply to data handled through their
          platforms.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Sharing with third parties</h2>
        <p>
          We do <strong>not</strong> sell your personal information. We do <strong>not</strong>{" "}
          share your data with unrelated third parties for their marketing or advertising.
        </p>
        <p>We only disclose information where necessary to run the service, such as:</p>
        <ul>
          <li>Meta (Instagram/Facebook), when you connect your account and use integrated features.</li>
          <li>Payment providers (e.g. eSewa, Khalti) to process buyer payments.</li>
          <li>Infrastructure providers (hosting, storage) that process data strictly on our behalf.</li>
          <li>Analytics tools used to measure app and website usage and improve Kinmel.</li>
          <li>When required by law or to protect rights, safety, and security.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2>Data retention &amp; deletion</h2>
        <p>
          We keep your data while your account is active and as needed to provide the service, meet
          legal obligations, and resolve disputes. You may request deletion of your data — see our{" "}
          <a href="/clearmydata" className="font-medium text-violet-700 hover:underline">
            Clear my data
          </a>{" "}
          page for how to submit a request.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Security</h2>
        <p>
          We use reasonable technical and organizational measures to protect your information.
          No method of transmission or storage is completely secure; we cannot guarantee absolute
          security.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Children</h2>
        <p>
          Kinmel is intended for sellers who are at least 18 years old. We do not knowingly collect
          personal information from children.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Changes</h2>
        <p>
          We may update this policy from time to time. We will post the revised version on this page
          and update the &quot;Last updated&quot; date. Continued use of Kinmel after changes means
          you accept the updated policy.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Contact</h2>
        <p>
          Questions about this policy:{" "}
          <a href="mailto:nishan@kinmel.shop" className="font-medium text-violet-700 hover:underline">
            nishan@kinmel.shop
          </a>
        </p>
        <p className="text-zinc-500">
          Naman Technologies Private Limited · Ward No. 17, Balodaya Marg, Pokhara 33700, Nepal
        </p>
      </section>
    </LegalPageShell>
  );
}
