import { Link } from 'react-router-dom'
import Footer from '../../components/Footer'

export default function CancellationRefundPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="flex-1">
        <article className="policy-page">
          <Link to="/" className="policy-page__back">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back to home
          </Link>

          <h1 className="policy-page__title">Cancellation &amp; Refunds</h1>
          <p className="policy-page__updated">Last updated: April 2026</p>

          <div className="policy-page__body">
            <h2>Overview</h2>
            <p>
              Place to Page provides an AI-powered website generation and publishing service.
              Because our product is entirely digital — website credits are delivered
              instantly and published sites go live immediately — our cancellation and refund
              policy reflects the nature of digital services where value is delivered at the
              moment of purchase or use.
            </p>

            <h2>Cancellation Policy</h2>
            <p>
              You may abandon a payment at any point <em>before</em> it is confirmed by
              PayPal or Razorpay. Once a payment is successfully processed and website
              credits appear in your account, the transaction is complete and cannot be
              cancelled.
            </p>
            <p>
              Generating a website preview is completely free and does not consume any
              credits. Credits are only deducted when you actively click <strong>Publish</strong>{' '}
              and a live site is successfully deployed to placetopage.com. You are always shown
              the full public URL and given a final confirmation step before publishing.
            </p>

            <h2>Refund Policy</h2>

            <h3>Website Credit Purchases</h3>
            <p>
              All purchases of website credits are final. Once credits are added to your
              Place to Page account — whether you purchased 1, 5, 10, 20, or 40 credits —
              refunds are not available. Credits do not expire and can be used at any time to
              publish a site.
            </p>

            <h3>Published Websites</h3>
            <p>
              When you publish a site, one website credit is consumed and your site is
              deployed live. Because the service (AI generation, domain provisioning, SSL
              certificate, and Vercel hosting) is rendered at the moment of publishing, the
              consumed credit cannot be refunded or reversed.
            </p>

            <h3>Unused Credits</h3>
            <p>
              Credits that have not been used to publish a site are non-refundable but remain
              valid in your account indefinitely. You can use them to publish additional sites
              whenever you are ready.
            </p>

            <h2>Technical Error Exceptions</h2>
            <p>
              We take technical reliability seriously. If a credit is deducted but the site
              fails to go live due to a fault on our side (for example, a Vercel deployment
              error or a platform outage), the credit will be reinstated to your account
              promptly.
            </p>
            <p>
              If you believe a credit was incorrectly deducted or your published site is not
              accessible, contact our support team with:
            </p>
            <ul>
              <li>Your registered email address</li>
              <li>The name of the site that failed to publish</li>
              <li>Your PayPal or Razorpay transaction ID</li>
              <li>A screenshot or description of the error you encountered</li>
            </ul>
            <p>
              We will investigate within <strong>2–3 business days</strong> and restore any
              credits that were lost due to a verified technical fault. In cases where a
              monetary refund is warranted, it will be processed to the original payment method
              within <strong>10–15 business days</strong>.
            </p>

            <h2>How to Request a Refund</h2>
            <p>
              Email us at{' '}
              <a href="mailto:support@placetopage.com">support@placetopage.com</a> with the
              subject line <em>"Refund Request — [your email]"</em>. All refund requests are
              reviewed manually and we aim to respond within 5–7 business days.
            </p>

            <div className="policy-contact-card">
              <p><strong>Support email:</strong> <a href="mailto:support@placetopage.com">support@placetopage.com</a></p>
              <p><strong>Phone:</strong> <a href="tel:+918309341208">+91 83093 41208</a></p>
              <p><strong>Response time:</strong> 5–7 business days for refund decisions</p>
              <p><strong>Refund processing:</strong> 10–15 business days after approval</p>
            </div>
          </div>
        </article>
      </div>
      <Footer />
    </div>
  )
}
