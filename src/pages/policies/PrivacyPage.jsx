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
            <h2>1. Introduction</h2>
            <p>
              Place to Page ("we", "our", or "us") is committed to protecting your personal
              information. This Privacy Policy explains how we collect, use, and safeguard
              your data when you use our platform.
            </p>

            <h2>2. Information We Collect</h2>
            <h3>Account Information</h3>
            <p>
              When you register, we collect your name, email address, and (if using Google
              Sign-In) your Google profile photo.
            </p>

            <h3>Business Information</h3>
            <p>
              When you generate a site, we collect the Google Maps place data you provide
              (business name, address, photos, reviews, hours). This is used solely to
              generate your website.
            </p>

            <h3>Payment Information</h3>
            <p>
              Payments are processed by PayPal and Razorpay. We do not store your card
              number or full payment details. We receive and store transaction IDs, payment
              status, and payer email/name as provided by the payment gateway.
            </p>

            <h3>Usage Data</h3>
            <p>
              We collect anonymised usage data including page views, feature interactions,
              and error logs to improve the Service. This data does not identify you
              personally.
            </p>

            <h3>Analytics</h3>
            <p>
              We use Google Analytics (GA4) to understand how users interact with our
              platform. Google Analytics may collect cookies and usage data subject to
              Google's privacy policy.
            </p>

            <h2>3. How We Use Your Information</h2>
            <ul>
              <li>To create and manage your account</li>
              <li>To generate and publish websites on your behalf</li>
              <li>To process payments and maintain billing records</li>
              <li>To send transactional emails (e.g. payment confirmation)</li>
              <li>To improve and develop the Service</li>
              <li>To comply with legal obligations</li>
            </ul>

            <h2>4. Data Sharing</h2>
            <p>
              We do not sell your personal data. We share data only with:
            </p>
            <ul>
              <li><strong>Google</strong> — for authentication and Maps data</li>
              <li><strong>Vercel</strong> — to host and deploy your generated sites</li>
              <li><strong>PayPal / Razorpay</strong> — to process payments</li>
              <li><strong>Anthropic</strong> — to generate website copy via AI (no personal data is sent)</li>
            </ul>

            <h2>5. Data Retention</h2>
            <p>
              We retain your account and site data for as long as your account is active.
              You may request deletion of your account and associated data by contacting us.
              Payment records may be retained for up to 7 years for accounting and legal
              compliance.
            </p>

            <h2>6. Cookies</h2>
            <p>
              We use essential cookies for authentication (JWT tokens stored in
              localStorage). Google Analytics uses cookies to track sessions. You can
              disable cookies in your browser settings, though this may affect
              functionality.
            </p>

            <h2>7. Your Rights</h2>
            <p>
              Depending on your jurisdiction, you may have the right to access, correct,
              delete, or export your personal data. To exercise these rights, contact us at{' '}
              <a href="mailto:support@placetopage.com">support@placetopage.com</a>.
            </p>

            <h2>8. Security</h2>
            <p>
              We implement industry-standard security measures including HTTPS encryption,
              hashed passwords, and access controls. However, no method of transmission
              over the internet is 100% secure.
            </p>

            <h2>9. Children's Privacy</h2>
            <p>
              The Service is not directed at children under 13. We do not knowingly collect
              personal data from children.
            </p>

            <h2>10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. We will notify you of
              significant changes by posting a notice on our platform.
            </p>

            <h2>11. Contact</h2>
            <p>For privacy inquiries, contact us at:</p>
            <div className="policy-contact-card">
              <p>
                <strong>Email:</strong>{' '}
                <a href="mailto:support@placetopage.com">support@placetopage.com</a>
              </p>
              <p>
                <strong>Phone:</strong>{' '}
                <a href="tel:+918309341208">+91 83093 41208</a>
              </p>
            </div>
          </div>
        </article>
      </div>
      <Footer />
    </div>
  )
}
