import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { FINALPOST_BRAND, finalpostPageMetadata } from "@/lib/finalpostLegal";

export const metadata: Metadata = finalpostPageMetadata(
  "/finalpost/privacy",
  "Privacy Policy",
  "How FinalPost collects, uses, and protects your data."
);

export default function FinalPostPrivacyPolicyPage() {
  return (
    <LegalPageShell title="Privacy Policy" updated="September 19, 2026" brand={FINALPOST_BRAND}>
      <section className="space-y-3">
        <h2>Who we are</h2>
        <p>
          <strong>FinalPost</strong> is the live shopping and social selling product operated by{" "}
          <strong>Naman Technologies Private Limited</strong> (“FinalPost,” “we,” “us”), a company
          registered in Nepal. This Privacy Policy explains how we collect, use, and protect
          information when you use the FinalPost mobile app and website.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Overview</h2>
        <p>
          FinalPost is a live shopping and social selling platform for merchants and creators. Our
          clients are businesses that sell products through Instagram and Facebook. They connect
          their own Instagram professional accounts and Facebook Pages inside FinalPost so they can
          run selling, customer conversations, and content publishing from one place. Buyers can
          comment product buy codes and complete checkout on the web. This policy explains what
          information we collect and how we use it.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Information we collect</h2>
        <ul>
          <li>Account details you provide (e.g. phone number, email, business name).</li>
          <li>
            Product catalog, prices, images, orders, and live-event data you create in FinalPost.
          </li>
          <li>
            Instagram and Facebook account information when you connect those accounts, including
            account identity, username/profile identifiers, and the permissions you grant — used to
            confirm the correct account is connected and to keep the connection working.
          </li>
          <li>
            Comments and related metadata on your Instagram and Facebook posts and live videos
            (including Meta webhooks and related APIs) when viewers interact with your content.
          </li>
          <li>
            Message-related context needed to help you send order and product information through
            Instagram or Messenger on your behalf, when you have authorized FinalPost to do so.
          </li>
          <li>
            Usage and analytics data from the FinalPost app and website (e.g. pages viewed, features
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
            <strong>Customer conversations:</strong> Read comments on your posts and live videos and
            show them in FinalPost so you can respond to buyers quickly. When a buyer comments with a
            product buy code, help you send order and product information through Instagram or
            Messenger messages.
          </li>
          <li>
            <strong>Content publishing:</strong> When you choose to post from FinalPost, publish
            product videos and Reels to your connected Instagram account and/or Facebook Page.
          </li>
          <li>
            <strong>Account connection:</strong> Use basic profile and account information to confirm
            the correct Instagram/Facebook account is connected and to keep that connection working
            so the features above continue to function.
          </li>
          <li>Process payments and fulfil orders placed through FinalPost checkout.</li>
          <li>
            Measure usage patterns with analytics tools so we can improve performance, reliability,
            and product design.
          </li>
          <li>Provide support, security, fraud prevention, and legal compliance.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2>Instagram &amp; Facebook (Meta) Platform Data</h2>
        <p>
          To use live shopping, comment-to-buy, customer conversations, and content publishing, you
          must connect your Instagram professional account and/or Facebook Page and grant FinalPost
          the permissions Meta requires. We use Meta Platform Data (any information we obtain from
          Meta) only on behalf of the client who authorized FinalPost, and only to provide that
          client’s service.
        </p>
        <p>Specifically, Platform Data is used to:</p>
        <ul>
          <li>
            Show you comments from your Instagram/Facebook posts and live videos so you can manage
            buyer conversations in FinalPost.
          </li>
          <li>
            Send Instagram direct messages or Messenger messages on your behalf (for example,
            checkout links or product information after a buy-code comment), when you have authorized
            FinalPost to do so.
          </li>
          <li>
            Publish Reels and related product videos you create or schedule in FinalPost to your
            Instagram account and/or Facebook Page, when you choose to post.
          </li>
          <li>
            Confirm account identity (such as account IDs and usernames) and maintain a working
            connection for the features you requested.
          </li>
        </ul>
        <p>
          Access is limited to what is needed to operate the live shopping and comment-to-buy
          features you requested. We do <strong>not</strong> use Platform Data to build unrelated
          products, we do <strong>not</strong> sell Platform Data, and we do <strong>not</strong>{" "}
          access a client’s Instagram or Facebook data unless that client has connected their account
          and granted permission. Meta’s own policies also apply to data handled through their
          platforms.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Sharing with third parties</h2>
        <p>
          We do <strong>not</strong> sell your personal information or Meta Platform Data. We do{" "}
          <strong>not</strong> share your data with unrelated third parties for their marketing or
          advertising.
        </p>
        <p>We only disclose information where necessary to run the service, such as:</p>
        <ul>
          <li>
            Meta (Instagram/Facebook), when you connect your account and use integrated features on
            your behalf.
          </li>
          <li>Payment providers (e.g. eSewa, Khalti) to process buyer payments.</li>
          <li>Infrastructure providers (hosting, storage) that process data strictly on our behalf.</li>
          <li>Analytics tools used to measure app and website usage and improve FinalPost.</li>
          <li>When required by law or to protect rights, safety, and security.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2>Requests from public authorities</h2>
        <p>
          Naman Technologies Private Limited (“FinalPost,” “we”) may receive requests from public
          authorities, courts, or law enforcement for personal data or personal information of users
          (including data obtained via Meta Platform APIs, where applicable).
        </p>
        <p>We handle such requests as follows:</p>
        <ul>
          <li>
            <strong>Legal review.</strong> Before disclosing any personal data, we review whether the
            request is legally valid and binding under applicable law (including that it is issued by
            a competent authority, identifies the data sought with reasonable specificity, and has an
            appropriate legal basis).
          </li>
          <li>
            <strong>Challenging unlawful requests.</strong> If we believe a request is unlawful,
            overbroad, or otherwise improper, we may challenge it, seek clarification, narrow its
            scope, or refuse disclosure where permitted by law, including with advice from legal
            counsel when appropriate.
          </li>
          <li>
            <strong>Data minimization.</strong> When we are required to respond, we disclose only the
            minimum personal data necessary to satisfy the lawful request, and not more.
          </li>
          <li>
            <strong>Documentation.</strong> We document such requests and our responses, including
            what was requested, what (if anything) was disclosed, the legal basis we relied on, and
            the internal people involved in handling the request, except where we are legally
            prohibited from keeping or sharing such records.
          </li>
        </ul>
        <p>
          We do not voluntarily sell or provide Meta Platform Data or user personal information to
          public authorities for marketing or unrelated commercial purposes. The data controller for
          this processing is <strong>Naman Technologies Private Limited</strong> (Nepal).
        </p>
      </section>

      <section className="space-y-3">
        <h2>Data retention &amp; deletion</h2>
        <p>
          We keep your data while your account is active and as needed to provide the service, meet
          legal obligations, and resolve disputes. You may request deletion of your data by contacting
          us (see Contact below). You may also disconnect Instagram or Facebook in FinalPost or
          revoke access in Meta settings; related Platform Data access for those features will stop.
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
          FinalPost is intended for sellers who are at least 18 years old. We do not knowingly collect
          personal information from children.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Changes</h2>
        <p>
          We may update this policy from time to time. We will post the revised version on this page
          and update the &quot;Last updated&quot; date. Continued use of FinalPost after changes means
          you accept the updated policy.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Contact</h2>
        <p>
          FinalPost is the product operated by <strong>Naman Technologies Private Limited</strong>,
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
          Questions about this policy:{" "}
          <a href="mailto:nishan@kinmel.shop" className="font-medium text-violet-700 hover:underline">
            nishan@kinmel.shop
          </a>
        </p>
      </section>
    </LegalPageShell>
  );
}
