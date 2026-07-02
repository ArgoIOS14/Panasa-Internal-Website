window.DEFAULT_BLOG_CONTENT = {
  "meta": {
    "title": "A Guide to Card Controls in Modern Payment Fraud Prevention | Panasa",
    "description": "How card controls prevent fraud before authorisation completes — MCC, velocity, geographic, MID, spend, channel, and time-based rules — and what they mean for card programs.",
    "canonical": "https://www.panasatech.com/blog/card-controls-fraud-prevention",
    "ogImage": "https://www.panasatech.com/assets/cover-card-controls-fraud-prevention.webp"
  },
  "slug": "card-controls-fraud-prevention",
  "tag": "BLOG",
  "title": "A Guide to Card Controls in Modern Payment Fraud Prevention",
  "date": "15 MAY 2026",
  "readTime": "9 MINS READ",
  "author": "Fathima Roshni",
  "heroImage": "../assets/cover-card-controls-fraud-prevention.webp",
  "heroImageTablet": "../assets/cover-card-controls-fraud-prevention.webp",
  "heroImageMobile": "../assets/cover-card-controls-fraud-prevention.webp",
  "heroImageAlt": "Card controls in the authorisation flow illustration",
  "body": [
    {
      "type": "html",
      "content": "<p>Card fraud follows predictable patterns. The same merchant categories, the same geographies and the same transaction behaviours appear repeatedly. Card controls are built around those patterns. They sit in the authorisation flow and stop fraud before it completes, not after.</p><p>Every time a cardholder uses their card, an authorisation request passes from the merchant&rsquo;s terminal through the card network to the issuer processor. This system has to make one decision: approve the transaction or decline it.</p><p>Card controls are the one of the gating items which influence this decision. They are pre-authorisation rules that evaluate the transaction against a set of defined criteria and either allow it or block it entirely before any money moves.</p><h2>What Card Controls Actually Are</h2><p>Card controls are configurable rules that define how, when, and where a payment card can be used. Unlike fraud detection tools that flag suspicious transactions after/during the transaction, controls work preventively. Since the transaction is not complete in the first place. There is no dispute to raise, no chargeback to process, no loss to absorb.</p><p>Card controls operate at three levels &mdash; program level (applies to every card, cannot be overridden by the cardholder), card product level (applies to a specific product within the program), and individual card level (applies to a specific cardholder&rsquo;s card). A transaction has to pass every active rule at every level to be approved.</p><h2>Where Card Controls Sit in the Authorisation Flow</h2><p>When a cardholder taps their card, the transaction request travels from the merchant terminal through the acquiring bank, then the card network, and arrives at the issuer processor. Card controls live here, inside the issuer processor. When a transaction arrives, the processor runs it through every active control on that card simultaneously. The transaction is approved only if it passes every one of them. If any single rule fails, then it is declined before transaction gets authorised.</p>"
    },
    {
      "type": "callout",
      "title": "Building a new card platform?",
      "text": "Our engineering team has done it for a dozen+ issuer processors. Let's compare notes.",
      "cta": {
        "label": "Talk to our team",
        "href": "../contact",
        "variant": "dark"
      }
    },
    {
      "type": "html",
      "content": "<h2>Types of Card Controls</h2><p>Each control type targets a different fraud pattern, and most programs use several of them in combination. The common types are:</p><h3>MCC Controls (Merchant Category Code Blocking)</h3><p>Every merchant is assigned a four-digit code categorising what type of business they are. MCC 7995 is gambling. MCC 6051 is cryptocurrency. Card programs use these codes to allow or block entire merchant categories.</p><h3>Velocity Controls</h3><p>Velocity controls limit how much a card can spend, or how many transactions it can make, within a defined time window which can be by transaction count, spend amount, or both. These are particularly effective against card testing, where fraudsters validate stolen credentials by running many small transactions in rapid succession.</p><h3>Geographic Controls</h3><p>Geographic controls restrict where in the world a card can be used, typically restricting to the cardholder&rsquo;s home country by default, with explicit opt-in required for international use.</p><h3>MID Controls (Merchant ID Controls)</h3><p>While MCC controls block a category, MID controls block or allow a specific merchant. These are commonly used in B2B programs where cards are tied to specific supplier relationships.</p><h3>Spend Amount Controls</h3><p>Spend amount controls cap the value of a single transaction above a defined threshold. Transaction limits prevent a single large fraudulent purchase.</p><h3>Channel Controls</h3><p>Channel controls determine which payment channels the card is active on such as card-present, card-not-present, ATM, contactless, or digital wallets. Each can be enabled or disabled independently.</p><h3>Time-Based Controls</h3><p>Time-based controls restrict when a card can be used by time of day or day of week. Usage outside defined hours on a purpose-built card is almost always misuse.</p>"
    },
    {
      "type": "callout",
      "title": "Struggling with transaction latency?",
      "text": "We've cut online processing pipelines from 900ms to under 120ms, here's how.",
      "cta": {
        "label": "View Case Study",
        "href": "../case-studies/flexible-card-issuance-platform-issuer-processor",
        "variant": "ghost"
      }
    },
    {
      "type": "html",
      "content": "<h2>Why Card Controls Work</h2><p>Card controls do not identify fraud. They prevent it from happening in the first place. They sit in the authorisation flow alongside 3DS authentication, risk scoring, and behavioural signals. Each layer covers what the others miss. Controls narrow the attack surface. A card testing attack stopped by a velocity limit never reaches the risk model. A stolen card declined at a blocked merchant never triggers a chargeback. The damage never happens because the transaction was never completed.</p><h2>The Cardholder Angle for Card Controls</h2><p>Card controls are not only a fraud tool. Neobanks across the UK and EU set the baseline expectation as cardholders can freeze their card, set their own spend limits, turn off international transactions, or restrict contactless from the app in real time. When cardholders have visibility over their card, they catch anomalies faster, freeze the card before a second fraudulent transaction appears, and raise disputes earlier. The program absorbs fewer losses and handles fewer support calls. Both outcomes reinforce each other.</p><h2>Conclusion</h2><p>Payments infrastructure tends to get complicated fast. More vendors, more integrations, more models to tune. Card controls are a reminder that some of the most effective fraud prevention does not come from adding more, but rather it comes from defining boundaries clearly at the start. A well-configured card is not just a fraud tool. It is a product decision that pays for itself.</p>"
    }
  ],
  "relatedSlugs": [
    "3d-secure-authentication-card-program",
    "anatomy-of-a-swipe",
    "lifecycle-of-a-payment"
  ],
  "category": "Blog",
  "datePublished": "2026-05-15",
  "dateModified": "2026-05-15",
  "tags": [
    "Card controls",
    "Fraud prevention",
    "Card programs",
    "Authorisation"
  ]
};
