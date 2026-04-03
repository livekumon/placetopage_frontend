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
            <h2>Cancellation Policy</h2>
            <p>
              You may cancel your website purchase before the payment is processed. Once
              payment is completed and website credits are added to your account, the purchase
              cannot be cancelled.
            </p>

            <h2>Refund Policy</h2>

            <h3>Website Purchases</h3>
            <p>
              All website credit purchases are final. Once credits are added to your account,
              refunds are not available. Website credits are non-transferable and
              non-refundable.
            </p>

            <h3>Published Sites</h3>
            <p>
              Once a website credit is consumed to publish a site live on placetopage.com,
              the service is considered rendered and no refund will be provided for that
              credit.
            </p>

            <h2>Exceptional Circumstances</h2>
            <p>
              In exceptional circumstances where a technical error results in incorrect
              credit deduction or a failed publish, you may contact our support team at{' '}
              <a href="mailto:support@placetopage.com">support@placetopage.com</a> with
              the following information:
            </p>
            <ul>
              <li>Your account details (email address)</li>
              <li>Transaction ID or order ID</li>
              <li>Description of the issue</li>
              <li>Screenshots or evidence of the problem</li>
            </ul>
            <p>
              Refund requests will be reviewed within <strong>5–7 business days</strong>.
              Approved refunds will be processed to the original payment method within{' '}
              <strong>10–15 business days</strong>.
            </p>

            <h2>Contact for Refunds</h2>
            <p>For refund inquiries, please contact us at:</p>
            <div className="policy-contact-card">
              <p>
                <strong>Email:</strong>{' '}
                <a href="mailto:support@placetopage.com">support@placetopage.com</a>
              </p>
              <p>
                <strong>Phone:</strong>{' '}
                <a href="tel:+918309341208">+91 83093 41208</a>
              </p>
              <p>
                <strong>Response time:</strong> Within 5–7 business days
              </p>
            </div>
          </div>
        </article>
      </div>
      <Footer />
    </div>
  )
}
