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
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using Place to Page ("the Service"), you agree to be bound by
              these Terms &amp; Conditions. If you do not agree, please do not use the Service.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              Place to Page is a platform that allows users to generate professional websites
              from Google Maps place data using AI, and to publish those websites live on the
              placetopage.com domain. Each publish consumes one website credit from your
              account.
            </p>

            <h2>3. Account Registration</h2>
            <p>
              You must create an account to use the Service. You are responsible for
              maintaining the confidentiality of your account credentials and for all
              activities that occur under your account. You agree to notify us immediately of
              any unauthorised use of your account.
            </p>

            <h2>4. Website Credits</h2>
            <p>
              Website credits are purchased through our payment gateways (PayPal or Razorpay)
              and allow you to publish generated sites live. Credits are non-transferable and
              non-refundable once consumed. Unused credits remain valid until used.
            </p>

            <h2>5. Intellectual Property</h2>
            <p>
              You retain ownership of the business information, photos, and content you
              provide. Place to Page retains ownership of the platform, AI generation engine,
              and all associated software. By using the Service, you grant Place to Page a
              licence to use your content solely to provide and improve the Service.
            </p>

            <h2>6. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the Service for any unlawful purpose</li>
              <li>Publish content that is defamatory, obscene, or infringes third-party rights</li>
              <li>Attempt to reverse-engineer or disrupt the platform</li>
              <li>Create accounts for automated or bulk abuse of the Service</li>
            </ul>

            <h2>7. Third-Party Services</h2>
            <p>
              The Service integrates with Google Maps, Vercel, PayPal, and Razorpay. Your use
              of these integrations is also subject to their respective terms of service.
            </p>

            <h2>8. Disclaimers</h2>
            <p>
              The Service is provided "as is" without warranties of any kind. We do not
              guarantee that generated sites will meet your specific requirements or that the
              Service will be uninterrupted or error-free.
            </p>

            <h2>9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Place to Page shall not be liable for
              any indirect, incidental, special, or consequential damages arising from your
              use of the Service.
            </p>

            <h2>10. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. Continued use of the
              Service after changes constitutes acceptance of the revised Terms.
            </p>

            <h2>11. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with applicable law.
              Any disputes shall be subject to the exclusive jurisdiction of the competent
              courts.
            </p>

            <h2>12. Contact</h2>
            <p>
              For questions about these Terms, contact us at{' '}
              <a href="mailto:support@placetopage.com">support@placetopage.com</a>.
            </p>
          </div>
        </article>
      </div>
      <Footer />
    </div>
  )
}
