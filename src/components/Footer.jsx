import { Link } from 'react-router-dom'

const YEAR = new Date().getFullYear()

const policies = [
  { label: 'Terms & Conditions', to: '/policies/terms' },
  { label: 'Privacy Policy', to: '/policies/privacy' },
  { label: 'Cancellation & Refunds', to: '/policies/cancellation-refunds' },
  { label: 'Shipping & Delivery', to: '/policies/shipping' },
  { label: 'Contact Us', to: '/contact' },
]

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <span className="site-footer__logo-icon material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            magic_button
          </span>
          <span className="site-footer__logo-text">Place to Page</span>
        </div>

        <nav className="site-footer__links" aria-label="Policy links">
          {policies.map(({ label, to }) => (
            <Link key={to} to={to} className="site-footer__link">
              {label}
            </Link>
          ))}
        </nav>

        <p className="site-footer__copy">
          © {YEAR} Place to Page. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
