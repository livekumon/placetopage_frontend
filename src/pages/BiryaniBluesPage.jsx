import { Link } from 'react-router-dom'

const menu = [
  {
    title: 'Hyderabadi Dum Biryani',
    price: '₹425',
    desc: 'Saffron-infused basmati rice, tender farm-reared chicken, and our secret 32-spice blend.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDIjT9UfAADed6wSJgkwk0UCqQb-H0wIWDZSx6BRIct79Yhrb-iBO3Lwy4ozVncR6f6kLZfTEBsnTl5SN68KVIabWA_o2vxnOX_A7aLjGguewZVYDEGVbs03ZW1FQPmiV4IdmfBEX7910wZdYNITeb-YD5JPQQL2wZpuFjaAJCkrxSte0Iahz5GezenjnlJf90na2e-TUJNPzeQqnAsN2_vXD_YI5tmvGskHBae8OcO_BxUc_YUasdH_nMIm4tf9dFd8YMdRjpw_B4',
  },
  {
    title: 'Royal Mutton Biryani',
    price: '₹595',
    desc: 'Slow-cooked for 6 hours with premium bone-in mutton and caramelized onions.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAHVZw8uAUG6syIkXt6JAd9XsU7LtukNi20aEEsxp97f6eFU3BaExZsGN7bmt4ttp0MiN4gYGxPiR32o2s8DfXmxORrVYI0IVto88kvFJFwh_nyZubOBy2fUVOCcupI3fjCx625UAoN7Fkmac1vRuif50wINWrV7333xl4JWRlVQ42HFUYhDl3MUzkrM7Tv4rHW_RpZQL6NwnD9Tlz7ZDSkcRQlf84mr84qNzAh4ckcIK5rdSuy7yTko4uKpB6WlSlz_Xf1llOfers',
  },
  {
    title: 'Paneer Peshawari',
    price: '₹375',
    desc: 'Marinated malai paneer layered with mint and long-grain aromatic basmati.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC0fdUtoXRTBGZweMKSP6WaRkPDSQnDv6wFyQ2A2edEqcp2igJBS15fCcuNVmhS-yWaYgcjvYmgheE_V-TvbaJfVNRnuXGsSR4s3RYu1R8Z2KOKkbj-PPbMdTPcaQnSntMN5s7Rc8ciHIxgbc4LYgxqSk46nWLe7aOumu-ujffUrhEqMMLE7AOOkrl9r4WmjOxDN5_EB3bFfixYch-23MqPt_iiAp2kybpZzO4gm9RRzXEoBwOJgfkHnpAjD-NID05O8ycbKm88V08',
  },
  {
    title: 'Classic Chicken 65',
    price: '₹285',
    desc: 'Spicy, tempered with curry leaves and yogurt. The perfect biryani companion.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIQp5GhCS1hX7DJks6AB2MvEmuhE84gQDvKeiCUaTr3R6U-cP9BpRIVt-zxhHQKGNv3q1RSIrok1PqaXZ0HCCVC0gMNzwVodZumADJOFrxRGXGT5Wdun8Sh2ZgK19lcZUKCAUrOFaSdvoMZ_Mo9jUNhpD3mfA0k6cT4djEwkYBYzRBxhk6im1HKcyDIG7WdfVCoc8AVJKUL0DecIWQBhjHcIOa0Jv6AaBI8zAMqdU3bAeCbsIVIb25_wVsxCskICbWyESrFru6jaQ',
  },
  {
    title: 'Galouti Kebab',
    price: '₹445',
    desc: 'Minced lamb smoked with cloves and herbs, served on ulte tawa ka paratha.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAgjdsaVaD1YK7FlfdPJ9ykFEuIu5IkOyONjro2C0U9cDwqsGd9APXCLwjT4x4NVI6iSc2K76lXYnXL6BDMxL1LRD_Nzbe_d5wsLP0WkJWtLnuu2O-VUlB2zvLozgILekY5h3myDhqWv0LdyH1lrWyEURpB9sp_TJiR31vmiRugm0wIjzYL0zxPhq0daRiIcbRoMFrRFGDH4O3EnoaV2RiYUh09VEfW7_Bl26vNxSh_u2BQmedj6E5Yivpu6Ugf7x-svZqiszEGYVM',
  },
  {
    title: 'Shahi Tukda',
    price: '₹225',
    desc: 'Ghee-fried bread soaked in cardamom rabri, topped with silver leaf and nuts.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDK2gExTExftgudAxhurtcNxjGP-DjMWub6zQAL_6asc1f66qNEQe957mZleTxzr5KhU5kR4F53Y0E07RQQ53Dcpkl9-Ju6hSXtIAycs191PLMZ_aHnbfwCrCHFgJigpSpveSc-DH_KBnxz5MrEiR9EQPEWVgGStPbqJZnqid5hxSEUNigm2CI_JX1H9yqCrvESFnj3OhHWYlcyXay0zqBTS-rWFrmJfikad8Uj1kCx8p-E8MiOZLVXFJBHPfyJFlPkAlABaVo-XmU',
  },
]

const reviews = [
  {
    quote:
      '"The Dum Biryani here is as close to Hyderabad as you can get in Bengaluru. The meat was falling off the bone and the spice level was perfect."',
    name: 'Aditya Rao',
    date: 'March 12, 2024',
    border: true,
  },
  {
    quote:
      '"Exceptional service and the ambience is very modern but cozy. Definitely try the Chicken 65, it\'s the best starter we\'ve had in Indiranagar."',
    name: 'Priya Sharma',
    date: 'Feb 28, 2024',
    border: false,
  },
  {
    quote:
      '"Great place for family dinners. The portions are generous and the Shahi Tukda was a divine end to our meal. Highly recommend booking a table."',
    name: 'Karthik Mani',
    date: 'Jan 15, 2024',
    border: false,
  },
  {
    quote: '"Simply the best Mutton Biryani in the city. The aroma itself tells you it\'s authentic."',
    name: 'Sneha Gupta',
    date: 'Dec 20, 2023',
    border: true,
  },
]

export default function BiryaniBluesPage() {
  return (
    <div className="selection:bg-primary-fixed-dim font-body bg-background text-on-surface">
      <nav className="fixed top-0 z-50 w-full border-b border-slate-100 bg-white/80 font-headline shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full items-center justify-between px-6 md:px-12">
          <span className="text-xl font-bold tracking-tighter text-slate-900">Biryani Blues</span>
          <div className="hidden items-center gap-8 md:flex">
            <a
              className="border-b-2 border-slate-900 pb-1 font-semibold text-slate-900 transition-colors hover:text-slate-900"
              href="#menu"
            >
              Features
            </a>
            <a className="text-slate-500 transition-colors hover:text-slate-900" href="#menu">
              Pricing
            </a>
            <Link to="/dashboard" className="text-slate-500 transition-colors hover:text-slate-900">
              Dashboard
            </Link>
            <Link to="/login" className="text-slate-500 transition-colors hover:text-slate-900">
              Help
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="hidden font-medium text-slate-500 transition-colors hover:text-slate-900 md:block"
            >
              Log In
            </Link>
            <a
              href="#menu"
              className="rounded-full bg-primary px-6 py-2.5 font-semibold text-on-primary transition-all hover:bg-primary-container"
            >
              Reserve
            </a>
          </div>
        </div>
      </nav>

      <main className="pt-16">
        <section className="mx-auto flex max-w-7xl flex-col items-center gap-12 overflow-hidden px-6 py-12 md:flex-row md:px-12 min-h-[921px]">
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary-container px-3 py-1 text-xs font-bold uppercase tracking-widest text-on-secondary-container">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                star
              </span>
              Top Rated in Bengaluru
            </div>
            <h1 className="font-headline text-5xl font-extrabold leading-[0.95] tracking-tighter text-on-surface md:text-7xl">
              Biryani like you&apos;ve <br />
              <span className="text-primary-container opacity-90 italic">never had it.</span>
            </h1>
            <p className="max-w-lg font-body text-lg leading-relaxed text-on-surface-variant md:text-xl">
              A culinary journey through the heart of Hyderabad, served in the soul of Bengaluru. Authentic spices, slow-cooked heritage.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <button
                type="button"
                className="rounded-full bg-gradient-to-br from-primary to-primary-container px-8 py-3.5 text-lg font-semibold text-on-primary shadow-xl shadow-primary/10"
              >
                Order online
              </button>
              <button
                type="button"
                className="rounded-full bg-surface-container-highest px-8 py-3.5 text-lg font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
              >
                View menu
              </button>
            </div>
            <div className="flex items-center gap-4 pt-4">
              <div className="flex -space-x-3">
                {[
                  'https://lh3.googleusercontent.com/aida-public/AB6AXuBAGDs574N2LMyeNN1Jgvw6E1OBSEWDHO_SNo8-rrSmEbCQYsS55FxhonbboxcdWPU02eReT7dv2NcBgOpnsDFgAHvuH6z9MSQv-GGsvesFqhwXOFxbI6lCZ7HnxLhCwdEOryJheAYs9FJoy5DXQ_cvs_rkVBZE7ha8ta2w2Is4mhnUrOpUV3lyVtxB6EDqGFhDZCxyQpE9rN8RCwZHizi8LCW_04WJA86JMUaiTG8U481lGxITPnMFLShFhrkshty3bP0qtbe0m4g',
                  'https://lh3.googleusercontent.com/aida-public/AB6AXuD9XVjkX1Bm4i7at391oO1COhBsgpQRbWzpRv4EwFQ5XZrQ9yQQ3JtLizCpcy9WI_pRnWjVMMbeCoozAJPFxvIJ218aNWfyHNZbFaDW30yhOxQ0nnpi2PobZPXjq-4j6SZyZM5pHIVzeYMXSn5fW1gZ109E9pvNPXWqjvnXmeGp_GWWHAV0AUWi1zc8rOUb2Z3idyWYGNt7a2C0o_g_Xmq5OipijzzyAd3BGOV1noyzqaeBF5a_dLgp1hZMEIe8YYivcT8m4SAUJsc',
                  'https://lh3.googleusercontent.com/aida-public/AB6AXuANXd5fKNn296Xo1ldfGJbVkVXxxd9Z8zxS7awClpP6t-eWXetfLxXXU7KY6Z-_6r5OmUJuTBElZpzSoBpwDjGlLvJBvj9WPYnastOhYTtTFxUEcYRLJGFZJ2WixYm0jlNr76LstG33JXXILsCkIyUTulXIB4G_mmkM_M3IanCzwon13cKIqyMBk43ummlWNNzM3BYwMdA1sw0l7apJwq3j2X8k--7OvvyZj7JFRgbOvyz1CSlBSj-rVhP2u8Fj7gF42bfrsr_N00M',
                ].map((src, i) => (
                  <img key={i} alt="" className="h-10 w-10 rounded-full border-2 border-surface" src={src} />
                ))}
              </div>
              <div className="flex flex-col">
                <div className="flex text-on-tertiary-container">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span key={i} className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                      star
                    </span>
                  ))}
                </div>
                <span className="text-xs font-bold uppercase tracking-tighter text-on-surface-variant">4.9/5 from 2,400+ guests</span>
              </div>
            </div>
          </div>
          <div className="relative w-full flex-1">
            <div className="relative z-10 aspect-square overflow-hidden rounded-xl shadow-2xl">
              <img
                alt="Signature Biryani"
                className="h-full w-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZXfWgU1uVUTCgdniS9KcQh4dXq8Mfj6a3FcWI1Te5l1AABvdrZuHsW1DWXMxIf5qVpc1bl5PXbTGPEGWajmitUU7gxrD6sJ2nUuvtReXimYk8PwaaxxuSIT7hy9D7KdtrTNYgIiLJLIPYyU07V1sMRbREBb1o0nCb9ABooG-HA5PMNX9ceAKld-Z_cLaHpVId27i_6UntEUfvfrqArZSuFCmJDkUWi7jQFFDOFCMTaEfATx1tR121B_N9_5j5bsEI6lKmxTNcAz0"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 z-0 hidden aspect-video w-2/3 rounded-xl bg-surface-container-high lg:block" />
          </div>
        </section>

        <section className="mb-24 bg-surface-container-low py-8">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 md:grid-cols-4 md:px-12">
            {[
              { icon: 'location_on', t1: 'Indiranagar, Bengaluru', t2: '12th Main, 4th Block' },
              { icon: 'schedule', t1: '11:00 AM - 11:30 PM', t2: 'Open daily' },
              { icon: 'call', t1: '+91 80 4567 8901', t2: 'Call for bookings' },
              { icon: 'delivery_dining', t1: 'Delivery Available', t2: 'Zomato, Swiggy, & Direct' },
            ].map((row) => (
              <div key={row.t1} className="flex gap-3">
                <span className="material-symbols-outlined text-on-primary-container">{row.icon}</span>
                <div>
                  <p className="text-sm font-bold text-on-surface">{row.t1}</p>
                  <p className="text-xs text-on-surface-variant">{row.t2}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="menu" className="mx-auto mb-24 max-w-7xl scroll-mt-24 px-6 md:px-12">
          <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">The Selection</span>
              <h2 className="font-headline text-4xl font-extrabold tracking-tighter md:text-5xl">Menu Highlights</h2>
            </div>
            <div className="mx-8 mb-4 hidden h-[1px] flex-1 bg-surface-container md:block" />
            <button type="button" className="self-start border-b-2 border-primary pb-1 font-bold text-primary">
              Full Menu
            </button>
          </div>
          <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-3">
            {menu.map((item) => (
              <div key={item.title} className="group">
                <div className="mb-4 aspect-[4/3] overflow-hidden rounded-xl bg-surface-container-low transition-transform duration-500 group-hover:scale-95">
                  <img alt="" className="h-full w-full object-cover" src={item.img} />
                </div>
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="font-headline text-xl font-bold">{item.title}</h3>
                  <span className="font-bold text-on-primary-container">{item.price}</span>
                </div>
                <p className="text-sm leading-relaxed text-on-surface-variant">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="reviews" className="mx-auto mb-24 max-w-7xl scroll-mt-24 px-6 md:px-12">
          <div className="mb-16 space-y-4 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Testimonials</span>
            <h2 className="font-headline text-4xl font-extrabold tracking-tighter md:text-5xl">Loved by Bengaluru</h2>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {reviews.map((r) => (
              <div
                key={r.name}
                className={`space-y-4 rounded-xl bg-surface-container-lowest p-8 shadow-sm ${r.border ? 'border-l-4 border-primary' : ''}`}
              >
                <div className="flex text-on-tertiary-container">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span key={i} className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                      star
                    </span>
                  ))}
                </div>
                <p className="italic leading-relaxed text-on-surface">{r.quote}</p>
                <div className="flex items-center justify-between border-t border-surface-container pt-4">
                  <span className="text-sm font-bold">{r.name}</span>
                  <span className="text-xs font-medium uppercase text-on-surface-variant">{r.date}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="w-full border-t border-slate-100 bg-white py-12 font-inter text-xs uppercase tracking-widest text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-6 md:flex-row">
          <div>© 2026 Biryani Blues. All rights reserved.</div>
          <nav className="flex flex-wrap justify-center gap-8">
            <a className="transition-colors hover:text-slate-900" href="#menu">
              Terms
            </a>
            <a className="transition-colors hover:text-slate-900" href="#menu">
              Privacy
            </a>
            <a
              className="transition-colors hover:text-slate-900"
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Twitter
            </a>
            <a
              className="transition-colors hover:text-slate-900"
              href="https://www.linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
          </nav>
          <div className="flex items-center gap-2 opacity-80">
            <span>Made with</span>
            <Link to="/" className="font-bold tracking-tighter text-slate-900">
              Place to Page
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
