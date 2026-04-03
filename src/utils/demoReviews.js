/** Placeholder reviews for editor preview only — not from Google. */
const AUTHORS = [
  'Alex M.',
  'Jordan K.',
  'Sam R.',
  'Taylor P.',
  'Casey L.',
  'Morgan D.',
  'Riley S.',
  'Quinn B.',
]

const SNIPPETS = [
  'Really impressed with the service and atmosphere. Staff were attentive without being overbearing. Will be back soon.',
  'Solid spot — great value and the quality was better than expected. Parking was easy on a weekday.',
  'We stopped in on a whim and ended up staying for hours. The vibe is welcoming and the details matter here.',
  'Five stars for consistency. I have visited a few times now and every experience has been smooth.',
  'Lovely place for a casual meet-up. Portions were generous and everything arrived quickly.',
  'Not my first visit and it will not be my last. Recommend booking ahead if you are going on a weekend.',
  'Friendly team, clean space, and fair prices. Exactly what we were looking for in the neighborhood.',
  'The highlights for me were the warm welcome and the little touches that show they care.',
  'Great for families — plenty of options and they accommodated our dietary requests without fuss.',
  'A hidden gem. I had heard good things and it lived up to the hype. Try whatever the staff suggests.',
  'Comfortable seating, good music at a sensible volume, and no rush to leave. Highly recommend.',
  'We celebrated a small occasion here and they made it feel special without any extra stress.',
  'Quick service, tasty food, and easy to find. I have already told a few friends to check it out.',
  'Reliable quality every time. It is nice to have a go-to place where you know what you are getting.',
  'Charming spot with attention to detail. The photos online do not quite do it justice — visit in person.',
]

/**
 * @param {number} count How many demo rows to append (e.g. 5).
 * @param {number} offset Use list length so new batches differ from previous.
 */
export function makeDemoReviews(count, offset = 0) {
  const out = []
  for (let i = 0; i < count; i++) {
    const n = offset + i
    const text = SNIPPETS[n % SNIPPETS.length]
    const rating = 3 + (n % 3) // 3, 4, or 5
    out.push({
      author: AUTHORS[n % AUTHORS.length],
      text,
      relativeTime: n % 2 === 0 ? `${1 + (n % 4)} weeks ago` : `${2 + (n % 5)} months ago`,
      rating,
      isDemo: true,
    })
  }
  return out
}
