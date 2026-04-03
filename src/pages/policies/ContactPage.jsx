import { Link } from 'react-router-dom'
import Footer from '../../components/Footer'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="flex-1">
        <article className="policy-page">
          <Link to="/" className="policy-page__back">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back to home
          </Link>

          <h1 className="policy-page__title">Contact Us</h1>
          <p className="policy-page__updated">We typically respond within 1 business day.</p>

          <div className="policy-page__body">
            <h2>Get in Touch</h2>
            <p>
              Have a question, need help with your account, or want to report an issue?
              We're here to help. Reach out to us through any of the channels below.
            </p>

            <h2>Support</h2>
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
                <strong>Hours:</strong> Monday–Friday, 10:00 a.m.–6:00 p.m. IST
              </p>
            </div>

            <h2>Payment &amp; Refund Queries</h2>
            <p>
              For any issues related to payments, credits, or refund requests, please
              include the following in your email:
            </p>
            <ul>
              <li>Your registered email address</li>
              <li>Transaction ID or order ID</li>
              <li>A description of the issue</li>
              <li>Any relevant screenshots or evidence</li>
            </ul>
            <p>
              Refund requests are reviewed within <strong>5–7 business days</strong> and
              approved refunds are processed within <strong>10–15 business days</strong>.
              See our{' '}
              <Link to="/policies/cancellation-refunds">Cancellation &amp; Refunds Policy</Link>{' '}
              for full details.
            </p>

            <h2>Technical Support</h2>
            <p>
              If you are experiencing a technical issue — such as a site failing to publish,
              credits not appearing after payment, or an error during site generation —
              please email us with your account email and a description of the problem. We
              will investigate and respond within <strong>1–2 business days</strong>.
            </p>

            <h2>Business Inquiries</h2>
            <p>
              For partnerships, agency plans, or bulk pricing enquiries, please email{' '}
              <a href="mailto:support@placetopage.com">support@placetopage.com</a> with
              the subject line <em>"Business Inquiry"</em>.
            </p>
          </div>
        </article>
      </div>
      <Footer />
    </div>
  )
}
