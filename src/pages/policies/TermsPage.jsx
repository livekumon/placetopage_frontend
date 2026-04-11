import { Link } from 'react-router-dom'
import Footer from '../../components/Footer'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="flex-1">
        <article className="policy-page">
          <Link to="/" className="policy-page__back">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back to home
          </Link>

          <h1 className="policy-page__title">Terms &amp; Conditions</h1>
          <p className="policy-page__updated">Last updated: April 2026</p>

          <div className="policy-page__body">
            <h2>1. Who We Are</h2>
            <p>
              placetopage.com (<strong>"we"</strong>, <strong>"our"</strong>, or{' '}
              <strong>"the Platform"</strong>) is a web application that helps small
              businesses, restaurants, shops, and service providers create and publish
              professional websites in minutes. We do this by pulling real business data from
              Google Maps, generating polished website copy and layouts using AI, and
              deploying the finished site live on the <strong>placetopage.com</strong> domain.
            </p>

            <h2>2. Acceptance of Terms</h2>
            <p>
              By creating an account, generating a site, or purchasing website credits on
              placetopage.com, you confirm that you have read, understood, and agree to be
              bound by these Terms &amp; Conditions and our{' '}
              <Link to="/policies/privacy">Privacy Policy</Link>. If you do not agree, please
              do not use the Platform.
            </p>

            <h2>3. The Service — What We Provide</h2>
            <h3>Website Generation</h3>
            <p>
              You provide a Google Maps URL for your business. Our platform fetches the
              publicly available business information (name, address, phone number, photos,
              reviews, opening hours, and category) and uses AI to generate a complete,
              ready-to-publish website tailored to your brand.
            </p>
            <h3>Site Editor</h3>
            <p>
              Before publishing, you can preview and customise your generated site —
              including editing the subdomain, adjusting content, and uploading a hero image.
              All edits are saved automatically and no credits are consumed during editing.
            </p>
            <h3>Live Publishing</h3>
            <p>
              When you are satisfied with your site, you can publish it live on a custom
              subdomain such as <strong>yourbusiness.placetopage.com</strong>. Publishing
              consumes one website credit. Your site is deployed via Vercel and is immediately
              accessible on the public internet with a free SSL certificate.
            </p>
            <h3>Dashboard</h3>
            <p>
              Your account dashboard lists all your generated and published sites. You can
              manage multiple sites, archive old ones, restore deleted ones from the recycle
              bin, and purchase additional website credits at any time.
            </p>

            <h2>4. Account Registration</h2>
            <p>
              You must register an account to use the Platform. You can sign in using Google
              (OAuth) or with an email address and password. You are responsible for keeping
              your login credentials secure and for all activity that occurs under your
              account. Notify us immediately at{' '}
              <a href="mailto:support@place2page.com">support@place2page.com</a> if you
              suspect unauthorised access.
            </p>
            <p>
              Each account is personal and may not be shared or transferred to another
              individual or business without our prior consent.
            </p>

            <h2>5. Website Credits</h2>
            <p>
              Website credits are purchased in packs through PayPal (international, charged
              in USD) or Razorpay (India, charged in INR). One credit = one live site
              publish. Credits are:
            </p>
            <ul>
              <li>Added to your account instantly upon successful payment</li>
              <li>Valid indefinitely — they never expire</li>
              <li>Non-transferable — they cannot be gifted, sold, or moved to another account</li>
              <li>Non-refundable once a publish has been completed (see our <Link to="/policies/cancellation-refunds">Refund Policy</Link>)</li>
            </ul>

            <h2>6. Your Content &amp; Licences</h2>
            <p>
              The business information you provide (Google Maps URL, uploaded photos, and
              any edits you make in the editor) remains yours. You represent that you have
              the right to use all content you submit, including photos and business
              information associated with the Google Maps listing.
            </p>
            <p>
              By using the Platform, you grant placetopage.com a limited, non-exclusive licence
              to store, process, and display your content solely for the purpose of generating
              and hosting your website. We do not claim ownership over your business data or
              generated sites.
            </p>

            <h2>7. Acceptable Use</h2>
            <p>You agree not to use placetopage.com to:</p>
            <ul>
              <li>Generate or publish websites for fictitious or fraudulent businesses</li>
              <li>Publish content that is defamatory, harassing, obscene, or illegal</li>
              <li>Infringe any third-party intellectual property rights</li>
              <li>Scrape, copy, or redistribute our platform or its generated output at scale</li>
              <li>Attempt to reverse-engineer, hack, or disrupt the Platform</li>
              <li>Create multiple accounts to abuse free-tier features or referral programmes</li>
            </ul>
            <p>
              We reserve the right to suspend or terminate accounts that violate these
              conditions without prior notice.
            </p>

            <h2>8. Third-Party Services</h2>
            <p>
              placetopage.com integrates with and relies on the following third-party services:
            </p>
            <ul>
              <li><strong>Google Maps / Places API</strong> — for fetching public business data</li>
              <li><strong>Anthropic Claude</strong> — for AI-powered website copy generation</li>
              <li><strong>Vercel</strong> — for hosting and deploying published websites</li>
              <li><strong>PayPal</strong> — for international payment processing</li>
              <li><strong>Razorpay</strong> — for India-based payment processing</li>
              <li><strong>Google Sign-In</strong> — for OAuth-based authentication</li>
            </ul>
            <p>
              Your use of these integrations is subject to their respective terms and privacy
              policies. We are not responsible for changes or interruptions in these
              third-party services.
            </p>

            <h2>9. Site Takedown &amp; Archiving</h2>
            <p>
              You can archive or delete any site you have published at any time from your
              dashboard. Archiving a live site will pause the Vercel project, making the
              public URL inactive. Deleted sites move to the Recycle Bin and can be restored
              within your account. We reserve the right to remove any published site that
              violates these Terms without notice or refund.
            </p>

            <h2>10. Service Availability</h2>
            <p>
              We aim to keep placetopage.com available 24/7 but do not guarantee uninterrupted
              access. Scheduled maintenance, Vercel outages, or unexpected issues may
              occasionally affect availability. We will communicate planned downtime through
              our platform where possible.
            </p>

            <h2>11. Disclaimers</h2>
            <p>
              The Platform is provided "as is". While we use advanced AI to generate
              high-quality website content, we do not guarantee that every generated site
              will perfectly match your expectations or requirements. You are responsible for
              reviewing and editing your site before publishing. AI-generated content may
              occasionally contain inaccuracies — always verify the final output.
            </p>

            <h2>12. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, placetopage.com shall not be
              liable for any indirect, incidental, consequential, or punitive damages arising
              from your use of the Platform, including but not limited to loss of revenue,
              loss of data, or reputational harm. Our total liability to you in any
              circumstance shall not exceed the amount you paid to us in the 3 months
              preceding the claim.
            </p>

            <h2>13. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. When we do, we will revise the
              "Last updated" date above. Continued use of the Platform after changes are
              posted constitutes your acceptance of the revised Terms. For material changes,
              we will notify you via email or an in-app banner.
            </p>

            <h2>14. Governing Law</h2>
            <p>
              These Terms shall be governed by the laws of India. Any disputes arising from
              the use of placetopage.com shall be subject to the exclusive jurisdiction of the
              courts of Hyderabad, Telangana, India.
            </p>

            <h2>15. Contact</h2>
            <p>Questions about these Terms? Reach us at:</p>
            <div className="policy-contact-card">
              <p><strong>Email:</strong> <a href="mailto:support@place2page.com">support@place2page.com</a></p>
            </div>
          </div>
        </article>
      </div>
      <Footer />
    </div>
  )
}
