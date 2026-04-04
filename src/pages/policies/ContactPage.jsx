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
            <h2>We're Here to Help</h2>
            <p>
              Whether you have a question about generating your first website, need help
              with your account, or want to report a technical issue — our team is ready to
              assist. Place to Page is built to make professional web presence effortless for
              every business, and great support is part of that promise.
            </p>

            <div className="policy-contact-card">
              <p><strong>Support email:</strong> <a href="mailto:support@place2page.com">support@place2page.com</a></p>
            </div>

            <h2>Getting Started</h2>
            <p>
              If you're new to Place to Page and need help understanding how website
              generation works, please email us with the subject line{' '}
              <em>"Getting started"</em>. We're happy to walk you through how to:
            </p>
            <ul>
              <li>Find and copy your Google Maps business URL</li>
              <li>Generate and preview your site</li>
              <li>Choose a custom subdomain (e.g. yourname.placetopage.com)</li>
              <li>Publish your site live using a website credit</li>
              <li>Manage multiple sites from your dashboard</li>
            </ul>

            <h2>Account &amp; Billing Support</h2>
            <p>
              For issues related to login, password reset, website credits, or payment
              history, email us with:
            </p>
            <ul>
              <li>Your registered email address</li>
              <li>A description of the problem you're experiencing</li>
              <li>Any relevant transaction or order ID (from PayPal or Razorpay)</li>
            </ul>
            <p>
              For payment and refund queries, please also review our{' '}
              <Link to="/policies/cancellation-refunds">Cancellation &amp; Refunds Policy</Link>.
            </p>

            <h2>Technical Issues</h2>
            <p>
              If your site fails to generate, a publish gets stuck, or a credit is deducted
              without your site going live, please reach out with:
            </p>
            <ul>
              <li>The Google Maps URL you used</li>
              <li>The name of the site that encountered the issue</li>
              <li>A screenshot or description of any error message</li>
              <li>Approximate time the issue occurred</li>
            </ul>
            <p>
              Technical issues are typically resolved within <strong>1–2 business days</strong>.
              If a credit was lost due to a technical fault on our end, we will restore it
              promptly.
            </p>

            <h2>Reporting Misuse</h2>
            <p>
              If you believe a site published on placetopage.com contains false information,
              impersonates a real business, or violates our{' '}
              <Link to="/policies/terms">Terms &amp; Conditions</Link>, please email us with
              the subject line <em>"Report a site"</em> and include the full URL of the
              site in question. We take all reports seriously and will investigate within 3
              business days.
            </p>

            <h2>Business &amp; Agency Enquiries</h2>
            <p>
              Are you an agency, freelancer, or business owner looking to generate websites
              for multiple clients? We offer bulk credit packs and are open to discussing
              custom arrangements. Email us at{' '}
              <a href="mailto:support@place2page.com">support@place2page.com</a> with the
              subject line <em>"Agency enquiry"</em> and tell us a bit about your needs.
            </p>
          </div>
        </article>
      </div>
      <Footer />
    </div>
  )
}
