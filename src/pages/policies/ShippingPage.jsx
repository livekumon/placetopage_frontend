import { Link } from 'react-router-dom'
import Footer from '../../components/Footer'

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="flex-1">
        <article className="policy-page">
          <Link to="/" className="policy-page__back">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back to home
          </Link>

          <h1 className="policy-page__title">Shipping &amp; Delivery</h1>
          <p className="policy-page__updated">Last updated: April 2026</p>

          <div className="policy-page__body">
            <h2>Digital Delivery</h2>
            <p>
              Place to Page is an entirely digital service. There are no physical goods,
              shipments, or courier deliveries of any kind. All products and services
              are delivered electronically.
            </p>

            <h2>Website Credits</h2>
            <p>
              Upon successful payment through PayPal or Razorpay, website credits are
              credited to your account <strong>instantly and automatically</strong>. You
              do not need to wait or take any additional action — the credits will reflect
              on your dashboard immediately after payment confirmation.
            </p>

            <h2>Published Websites</h2>
            <p>
              When you publish a site using a website credit, your generated site is
              deployed live on <strong>placetopage.com</strong> (or your chosen subdomain)
              within minutes. Typical deployment time is under 2 minutes, subject to
              Vercel platform availability.
            </p>

            <h2>Delivery Failures</h2>
            <p>
              In the rare event that your payment is confirmed but credits are not
              reflected in your account, or a publish fails after a credit is consumed,
              please contact us immediately:
            </p>
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
            <p>
              We will investigate and resolve delivery issues within{' '}
              <strong>1–2 business days</strong>.
            </p>

            <h2>No Physical Shipping</h2>
            <p>
              Since all services are digital, no shipping charges, customs duties, or
              delivery timelines apply to any purchase made on Place to Page.
            </p>
          </div>
        </article>
      </div>
      <Footer />
    </div>
  )
}
