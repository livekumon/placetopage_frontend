import { Link } from 'react-router-dom'
import Footer from '../../components/Footer'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="flex-1">
        <article className="policy-page">
          <Link to="/" className="policy-page__back">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back to home
          </Link>

          <h1 className="policy-page__title">Privacy Policy</h1>
          <p className="policy-page__updated">Last updated: April 2026</p>

          <div className="policy-page__body">
            <h2>1. Who We Are</h2>
            <p>
              Place to Page ("we", "our", "us") is a platform that helps businesses create
              and publish AI-generated websites from their Google Maps listing. This Privacy
              Policy explains what personal information we collect, how we use it, and your
              rights over it.
            </p>

            <h2>2. What Information We Collect</h2>

            <h3>Account Information</h3>
            <p>
              When you register, we collect your <strong>name</strong> and{' '}
              <strong>email address</strong>. If you sign in with Google, we also receive
              your Google profile picture from Google's OAuth service. If you register with
              email and password, we store your email and a securely hashed version of your
              password — we never store your password in plain text.
            </p>

            <h3>Business Data You Provide</h3>
            <p>
              When you generate a site, you provide a Google Maps URL for a business. We
              fetch that business's publicly available information from Google Maps —
              including its name, address, phone number, opening hours, category, photos, and
              customer reviews. This data is used exclusively to generate your website. We do
              not store this data beyond what is necessary to generate, display, and host
              your site.
            </p>

            <h3>Uploaded Media</h3>
            <p>
              If you choose to upload a custom hero image for your site, the image is stored
              in Google Cloud Storage and associated with your site. You can delete it by
              removing the site from your dashboard.
            </p>

            <h3>Payment Information</h3>
            <p>
              We process payments through <strong>PayPal</strong> (international, USD) and{' '}
              <strong>Razorpay</strong> (India, INR). We do not store your card number,
              bank account details, or full payment credentials. We receive and store:
            </p>
            <ul>
              <li>The PayPal or Razorpay order/payment ID</li>
              <li>The payment amount, currency, and status</li>
              <li>Your payer name and email (as provided by the payment gateway)</li>
              <li>Number of website credits granted</li>
            </ul>
            <p>
              This information is used for billing records, credit allocation, and resolving
              payment disputes.
            </p>

            <h3>Usage and Analytics Data</h3>
            <p>
              We use <strong>Google Analytics 4 (GA4)</strong> to understand how users
              interact with our platform. GA4 collects anonymised data such as pages visited,
              session duration, and device type. This data does not personally identify you
              and is used solely to improve the product.
            </p>
            <p>
              We also log server-side events such as site generation, publish actions, and
              login events to monitor platform health and detect abuse. These logs are
              retained for a limited period and are not shared externally.
            </p>

            <h2>3. How We Use Your Information</h2>
            <ul>
              <li>To create and manage your account</li>
              <li>To generate AI-powered websites from your business data</li>
              <li>To host your published sites on placetopage.com</li>
              <li>To process payments and allocate website credits to your account</li>
              <li>To send transactional communications (e.g. payment confirmation)</li>
              <li>To investigate and resolve support requests</li>
              <li>To improve the platform using aggregated, anonymised usage data</li>
              <li>To detect fraud and prevent misuse of the platform</li>
              <li>To comply with legal obligations</li>
            </ul>

            <h2>4. How We Share Your Information</h2>
            <p>
              We do not sell, rent, or trade your personal data. We share information only
              with the following service providers, and only to the extent necessary to
              deliver the service:
            </p>
            <ul>
              <li>
                <strong>Google</strong> — for authentication (Google Sign-In) and fetching
                public business data from the Places API
              </li>
              <li>
                <strong>Anthropic</strong> — your business name and category are sent to
                Anthropic's Claude API to generate website copy. No personal account data is
                shared.
              </li>
              <li>
                <strong>Vercel</strong> — to deploy and host your published websites on
                their global edge network
              </li>
              <li>
                <strong>Google Cloud Storage</strong> — to store hero images you upload
              </li>
              <li>
                <strong>PayPal</strong> — to process international payments
              </li>
              <li>
                <strong>Razorpay</strong> — to process payments from India
              </li>
              <li>
                <strong>Google Analytics</strong> — to collect anonymised usage statistics
              </li>
            </ul>
            <p>
              We may also disclose your information if required by law, a court order, or
              to protect the rights and safety of Place to Page or its users.
            </p>

            <h2>5. Cookies &amp; Local Storage</h2>
            <p>
              We use <strong>localStorage</strong> in your browser to store your
              authentication token (JWT) so you stay logged in between sessions. We do not
              use tracking cookies for advertising. Google Analytics uses its own cookies to
              measure sessions and page views.
            </p>
            <p>
              You can clear localStorage and cookies at any time via your browser settings.
              Doing so will log you out of Place to Page.
            </p>

            <h2>6. Data Retention</h2>
            <p>
              We retain your account data for as long as your account is active. Site data,
              generated content, and published sites are retained until you delete them from
              your dashboard. Payment records are retained for up to <strong>7 years</strong>{' '}
              to comply with financial and legal obligations.
            </p>
            <p>
              If you wish to delete your account and all associated data, please email us at{' '}
              <a href="mailto:support@placetopage.com">support@placetopage.com</a>. We will
              process the request within 30 days.
            </p>

            <h2>7. Security</h2>
            <p>
              We take reasonable and industry-standard steps to protect your data, including:
            </p>
            <ul>
              <li>HTTPS encryption for all data in transit</li>
              <li>Bcrypt-hashed passwords (we never store plaintext passwords)</li>
              <li>JWT-based authentication with expiry</li>
              <li>Restricted API key access with environment-level secrets</li>
            </ul>
            <p>
              No system is completely immune to breaches. In the unlikely event of a data
              breach affecting your personal information, we will notify you promptly in
              accordance with applicable law.
            </p>

            <h2>8. Your Rights</h2>
            <p>
              Depending on your location, you may have the right to:
            </p>
            <ul>
              <li><strong>Access</strong> — request a copy of the personal data we hold about you</li>
              <li><strong>Correction</strong> — request correction of inaccurate data</li>
              <li><strong>Deletion</strong> — request deletion of your account and data</li>
              <li><strong>Portability</strong> — request your data in a machine-readable format</li>
              <li><strong>Objection</strong> — object to processing of your data in certain circumstances</li>
            </ul>
            <p>
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:support@placetopage.com">support@placetopage.com</a>.
            </p>

            <h2>9. Children's Privacy</h2>
            <p>
              Place to Page is not directed at children under 13 years of age. We do not
              knowingly collect personal information from children. If you believe a child
              has provided us with personal data, please contact us and we will delete it.
            </p>

            <h2>10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy as the platform evolves. When we make
              significant changes, we will update the "Last updated" date at the top of this
              page and, where appropriate, notify you by email or an in-app notification.
            </p>

            <h2>11. Contact</h2>
            <p>For any privacy-related questions or requests:</p>
            <div className="policy-contact-card">
              <p><strong>Email:</strong> <a href="mailto:support@placetopage.com">support@placetopage.com</a></p>
              <p><strong>Phone:</strong> <a href="tel:+918309341208">+91 83093 41208</a></p>
            </div>
          </div>
        </article>
      </div>
      <Footer />
    </div>
  )
}
