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
    <LegalPageShell title="Terms of Service" updated="August 24, 2026">
      <section className="space-y-3">
        <h2>Agreement</h2>
        <p>
          By creating an account or using the Kinmel mobile app or website, you agree to these Terms
          of Service. If you do not agree, do not use Kinmel. <strong>Kinmel</strong> is the product
          operated by <strong>Naman Technologies Private Limited</strong> (“Kinmel,” “we,” “us”),
          registered in Nepal.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Sellers and buyers</h2>
        <p>
          In these Terms, <strong>sellers</strong> (also called clients or merchants) are people or
          businesses who use the Kinmel app and website to list and sell products online through
          Instagram and Facebook. <strong>Buyers</strong> are people who purchase from sellers
          through <strong>kinmel.shop</strong> and the Kinmel app.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Service</h2>
        <p>
          Kinmel is a live shopping and social selling platform for merchants and creators. Sellers
          connect their own Instagram professional accounts and Facebook Pages inside Kinmel so they
          can run selling, customer conversations, and content publishing from one place. Sellers use
          the Kinmel app to go live or record shoppable video with product overlays, manage a catalog,
          and send buyers to a hosted checkout page. Viewers comment buy codes on Instagram or
          Facebook; Kinmel may help the seller respond with order and product information (including
          checkout links) through Instagram or Messenger when connected and authorized. When the
          seller chooses to post from Kinmel, we may publish product videos and Reels to that
          seller’s Instagram account and/or Facebook Page. Kinmel also partners with logistics
          providers so sellers can use in-house logistics integration to book and manage deliveries.
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
          Certain features require you to connect your Instagram professional account and/or Facebook
          Page and grant Kinmel third-party access through Meta. By connecting, you authorize Kinmel
          to use Meta Platform Data only on your behalf and only to provide your service, including
          to:
        </p>
        <ul>
          <li>
            <strong>Customer conversations:</strong> Read comments on your posts and live videos and
            show them in Kinmel so you can respond to buyers quickly; when a buyer comments with a
            product buy code, help you send order and product information through Instagram or
            Messenger messages.
          </li>
          <li>
            <strong>Content publishing:</strong> When you choose to post from Kinmel, publish product
            videos and Reels to your Instagram account and/or Facebook Page.
          </li>
          <li>
            <strong>Account connection:</strong> Use basic profile and account information (such as
            account identity and username) to confirm the correct Instagram/Facebook account is
            connected and to keep the connection working so the features above continue to function.
          </li>
        </ul>
        <p>
          Access is limited to what is needed to operate the live shopping and comment-to-buy
          features you requested. Kinmel does not use Platform Data to build unrelated products, does
          not sell Platform Data, and does not access your Instagram or Facebook data unless you have
          connected your account and granted permission.
        </p>
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
        <h2>Payments, fees &amp; sales</h2>
        <p>
          Kinmel processes buyer payments through third-party payment providers. Kinmel charges a
          sales commission of <strong>2.9% to 8%</strong> on each qualifying sale, unless we notify
          you of a different rate in advance. Pricing may change; we will give reasonable notice
          before changes affect your account.
        </p>
        <p>
          An order is counted as a <strong>sale</strong> only when delivery to the buyer has been
          completed successfully. Orders that are not yet fulfilled, or that are still in the
          delivery process, are not considered sales yet.
        </p>
        <p>
          Payment settlement to sellers may take up to <strong>one week</strong>. In some cases,
          settlement may take longer than one week.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Logistics</h2>
        <p>
          Kinmel partners with logistics providers to offer in-house logistics integration. When a
          seller books delivery through Kinmel, buyer information required for shipping is shared
          with the logistics provider so the order can be delivered.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Buyer privacy &amp; data use</h2>
        <p>
          Kinmel treats customer data with the utmost importance. Buyer personal data such as phone
          number and full address is abstracted from sellers to protect buyer privacy. That data may
          be shared with the logistics provider when the seller books delivery.
        </p>
        <p>
          Seller and buyer information may be shared with third parties such as logistics providers
          and payment providers as required to operate checkout, payments, and delivery. We use
          seller and buyer information, and Meta Platform Data where applicable, only as needed to
          operate, improve, secure, and enforce the Kinmel service for the features you use —
          including live shopping, comment-to-buy, customer conversations, content publishing,
          checkout, payments, and delivery — subject to applicable law, Meta’s Platform Terms, and
          our{" "}
          <a href="/privacy-policy" className="font-medium text-violet-700 hover:underline">
            Privacy Policy
          </a>
          . We do not sell Platform Data or personal information, and we do not use Meta Platform
          Data to build unrelated products.
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
          the service (including publishing to Instagram and/or your Facebook Page when you request
          it).
        </p>
      </section>

      <section className="space-y-3">
        <h2>Disclaimer</h2>
        <p>
          Kinmel is provided &quot;as is&quot; and &quot;as available.&quot; We do not guarantee
          uninterrupted live streaming, Instagram or Facebook API availability, payment or logistics
          partner availability, or specific sales results. To the fullest extent permitted by law, we
          disclaim warranties of merchantability, fitness for a particular purpose, and
          non-infringement.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, Naman Technologies Private Limited and Kinmel are
          not liable for indirect, incidental, special, or consequential damages, lost profits, or
          loss of data arising from your use of the service, Instagram/Facebook/Meta outages, payment
          or logistics partner issues, or buyer disputes. Our total liability for any claim related
          to the service is limited to the fees you paid to Kinmel in the twelve (12) months before
          the claim, or NPR 10,000 if no fees were paid, whichever is greater.
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
          explains how we handle personal data and Meta Platform Data, including analytics used to
          improve the app and website.
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
          Kinmel is the product operated by <strong>Naman Technologies Private Limited</strong>,
          registered in Nepal.
        </p>
        <p>
          Address: Pokhara Metropolitan City Ward No. 17, Balodaya Marg, Kaski, Gandaki, Nepal
        </p>
        <p>
          Phone:{" "}
          <a
            href="tel:+9779714535269"
            className="font-medium text-violet-700 hover:underline"
          >
            +977 9714535269
          </a>
          ,{" "}
          <a
            href="tel:+9779769498715"
            className="font-medium text-violet-700 hover:underline"
          >
            +977 9769498715
          </a>
        </p>
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
