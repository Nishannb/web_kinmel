import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { buildPageMetadata } from "@/lib/siteMetadata";

export const metadata: Metadata = buildPageMetadata({
  path: "/terms",
  title: "Terms of Service",
  description: "Terms for using the Kinmel app and website.",
});

export default function TermsPage() {
  return (
    <LegalPageShell title="Terms of Service" updated="June 13, 2026">
      <section className="space-y-3">
        <h2>Agreement</h2>
        <p>
          By creating an account or using the Kinmel mobile app or website, you agree to these Terms
          of Service. If you do not agree, do not use Kinmel.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Service</h2>
        <p>
          Kinmel helps sellers offer products during Instagram Live streams and Reels. Sellers use
          the Kinmel iOS app to go live or record shoppable video with product overlays, manage a
          catalog on the web, and send buyers to a hosted checkout page. Viewers comment buy codes on
          Instagram; Kinmel may respond with checkout links on the seller&apos;s behalf when
          connected and authorized.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Eligibility &amp; account</h2>
        <ul>
          <li>You must be at least 18 years old and able to enter a binding contract.</li>
          <li>You are responsible for keeping your login credentials secure.</li>
          <li>Information you provide must be accurate and kept up to date.</li>
          <li>One person or business must not share accounts in a way that violates these terms.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2>Instagram &amp; Facebook connection</h2>
        <p>
          Certain features require you to connect your Instagram and Facebook accounts and grant
          Kinmel third-party access through Meta. By connecting, you authorize Kinmel to:
        </p>
        <ul>
          <li>Receive comment and related webhook notifications from Meta for your content.</li>
          <li>Send Instagram direct messages on your behalf (e.g. checkout links to commenters).</li>
          <li>Publish Reels and related media you create in the Kinmel app to your Instagram account.</li>
        </ul>
        <p>
          You must comply with Meta&apos;s Platform Terms, Community Guidelines, and Commerce
          Policies. Kinmel is not responsible for actions Meta takes on your account. You may revoke
          access at any time through Meta or Kinmel settings; some features will stop working.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Seller responsibilities</h2>
        <ul>
          <li>You own or have rights to sell the products you list and the content you publish.</li>
          <li>Product descriptions, prices, stock, and fulfilment are your responsibility.</li>
          <li>You must honour orders placed through Kinmel checkout unless legally entitled to refuse.</li>
          <li>You must not use Kinmel for fraud, counterfeit goods, illegal items, or deceptive practices.</li>
          <li>You are responsible for buyer communication and dispute resolution for your sales.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2>Fees</h2>
        <p>
          Kinmel is free to use for catalog, events, overlays, and checkout links. We charge{" "}
          <strong>4% of each sale</strong> processed through Kinmel, unless we notify you of a
          different rate in advance. Pricing may change; we will give reasonable notice before changes
          affect your account.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Reverse engineer, scrape, or abuse the service or its APIs.</li>
          <li>Interfere with other users, our infrastructure, or Meta&apos;s systems.</li>
          <li>Use Kinmel to distribute malware, spam, or harmful content.</li>
          <li>Misrepresent your identity, products, or affiliation with Kinmel or Meta.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2>Intellectual property</h2>
        <p>
          Kinmel&apos;s software, branding, and documentation are owned by Naman Technologies Private
          Limited. You retain ownership of your product listings, images, and video content. You
          grant us a limited license to host, process, and display your content solely to operate
          the service (including publishing to Instagram when you request it).
        </p>
      </section>

      <section className="space-y-3">
        <h2>Disclaimer</h2>
        <p>
          Kinmel is provided &quot;as is&quot; and &quot;as available.&quot; We do not guarantee
          uninterrupted live streaming, Instagram API availability, or specific sales results. To the
          fullest extent permitted by law, we disclaim warranties of merchantability, fitness for a
          particular purpose, and non-infringement.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, Naman Technologies Private Limited and Kinmel are
          not liable for indirect, incidental, special, or consequential damages, lost profits, or
          loss of data arising from your use of the service, Instagram/Meta outages, or buyer
          disputes. Our total liability for any claim related to the service is limited to the fees
          you paid to Kinmel in the twelve (12) months before the claim, or NPR 10,000 if no fees
          were paid, whichever is greater.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Suspension &amp; termination</h2>
        <p>
          We may suspend or terminate access if you breach these terms, pose a security risk, or if
          required by law or Meta. You may stop using Kinmel at any time. Sections that by nature
          should survive (liability limits, intellectual property, governing law) will survive
          termination.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Privacy</h2>
        <p>
          Our{" "}
          <a href="/privacy-policy" className="font-medium text-violet-700 hover:underline">
            Privacy Policy
          </a>{" "}
          explains how we handle personal data, including analytics used to improve the app and
          website.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Governing law</h2>
        <p>
          These terms are governed by the laws of Nepal. Disputes shall be subject to the courts of
          Pokhara, Nepal, unless mandatory consumer protection law requires otherwise.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Contact</h2>
        <p>
          Questions about these terms:{" "}
          <a href="mailto:nishan@kinmel.shop" className="font-medium text-violet-700 hover:underline">
            nishan@kinmel.shop
          </a>
        </p>
      </section>
    </LegalPageShell>
  );
}
