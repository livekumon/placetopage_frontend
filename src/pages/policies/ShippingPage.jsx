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
            <h2>100% Digital — No Physical Shipping</h2>
            <p>
              Place to Page is a fully digital platform. We do not sell or ship any physical
              products. There are no couriers, packaging, customs duties, or delivery
              timelines to worry about. Everything we offer — website generation, live
              publishing, and account credits — is delivered electronically over the internet.
            </p>

            <h2>Website Credits — Instant Delivery</h2>
            <p>
              When you purchase a credit pack (Starter, Builder, Growth, Studio, or Agency),
              the credits are added to your Place to Page account <strong>immediately and
              automatically</strong> as soon as your payment is confirmed by PayPal or
              Razorpay. You can verify your updated credit balance by checking the{' '}
              <strong>"websites remaining"</strong> indicator in the top bar or on the
              Purchase Websites page.
            </p>
            <p>
              There is no manual approval step. Credits are available to use the moment
              payment succeeds — day or night, weekday or weekend.
            </p>

            <h2>Generated Websites — Delivered in Seconds</h2>
            <p>
              Once you enter a Google Maps URL and click <strong>Generate</strong>, our
              AI engine fetches your business data and produces a complete website in
              under 30 seconds. The generated site is immediately available for you to
              preview and edit in our site editor — no waiting, no email confirmation.
            </p>

            <h2>Published Sites — Live in Under 2 Minutes</h2>
            <p>
              When you click <strong>Publish</strong> and confirm your chosen subdomain
              (e.g. <strong>yourbusiness.placetopage.com</strong>), your site is deployed to
              Vercel's global edge network. Typical deployment time is{' '}
              <strong>60–120 seconds</strong>. Once deployment is complete, your site is
              accessible worldwide with a free SSL certificate (HTTPS).
            </p>
            <p>
              You will see your live site URL on screen the moment deployment succeeds.
              Your dashboard will update to reflect the site's "Live" status.
            </p>

            <h2>What Affects Delivery Speed?</h2>
            <p>
              In rare cases, delivery may take slightly longer due to:
            </p>
            <ul>
              <li>High traffic on Vercel's deployment platform</li>
              <li>DNS propagation delays (usually under 5 minutes for placetopage.com subdomains)</li>
              <li>Payment gateway processing delays during peak hours</li>
            </ul>
            <p>
              If your credits have not appeared within <strong>10 minutes</strong> of a
              successful payment, or your site has not gone live within{' '}
              <strong>5 minutes</strong> of publishing, please contact us — we will
              investigate and resolve the issue promptly.
            </p>

            <h2>Reporting a Delivery Issue</h2>
            <div className="policy-contact-card">
              <p><strong>Email:</strong> <a href="mailto:support@placetopage.com">support@placetopage.com</a></p>
              <p><strong>Phone:</strong> <a href="tel:+918309341208">+91 83093 41208</a></p>
              <p><strong>Response time:</strong> Within 1–2 business days</p>
            </div>
            <p>
              Please include your registered email address, the name of the site or the
              transaction ID, and a brief description of the issue. See also our{' '}
              <Link to="/policies/cancellation-refunds">Cancellation &amp; Refunds Policy</Link>{' '}
              if a credit was incorrectly consumed.
            </p>
          </div>
        </article>
      </div>
      <Footer />
    </div>
  )
}
