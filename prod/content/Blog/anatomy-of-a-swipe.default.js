window.DEFAULT_BLOG_CONTENT = {
  "meta": {
    "title": "Anatomy of a Swipe: What Really Happens When You Tap Your Card | Panasa",
    "description": "A deep-dive into the card authorisation, clearing and settlement loop — from the milliseconds of authorisation to the rails that actually move money."
  },
  "slug": "anatomy-of-a-swipe",
  "tag": "BLOG",
  "title": "Anatomy of a Swipe: What Really Happens When You Tap Your Card",
  "date": "16 APR 2026",
  "readTime": "20 MINS READ",
  "author": "Panasa Team",
  "heroImage": "../assets/blog-hero-desktop.webp",
  "heroImageTablet": "../assets/blog-hero-tablet.webp",
  "heroImageMobile": "../assets/blog-hero-mobile.webp",
  "heroImageAlt": "Card transaction flow illustration",
  "body": [
    {
      "type": "html",
      "content": "<p>We have made payments feel invisible.</p><p>You tap your card, the machine responds almost instantly and you move on without thinking twice. That simplicity is deliberate. The system is designed to remove friction, not invite questions.</p><p>But beneath that ease sits one of the most complex systems in modern finance.</p><p>Every card transaction, whether it is a £85 purchase in a clothing store or a large online order, follows the same path. It moves through multiple institutions, triggers real-time risk decisions, and settles across banks that may never directly interact with one another.</p><p>If you are building or working in payments, understanding this flow is not optional. It is the foundation.</p><h2>The illusion of instant payment</h2><p>You walk into a clothing store and pick up a shirt priced at £85.</p><p>You tap your card. The terminal pauses briefly. Then it says Approved.</p><p>You leave with the shirt.</p><p>It feels complete, as though the money has already moved from your account to the store.</p><p>It has not.</p><p>What actually happened is far more subtle. Your bank agreed to set aside £85. The store received a confirmation, not the money itself.</p><p>That distinction explains almost everything that follows in payments.</p><h2>The system behind a single tap</h2><p>Every card payment sits on a structured system often described as the four-party model. In practice, there are additional layers doing the technical work behind the scenes.</p><p>In your £85 purchase, the participants are clearer even if they are invisible to you.</p><p>You, the cardholder.</p><p>The clothing store, the merchant.</p><p>The acquiring side, which connects the store to the network.</p><p>The card network, which routes the transaction.</p><p>Your issuing bank, which makes the decision.</p><p>Behind both sides sit processors that handle the real-time messaging, routing, and execution.</p><p>Each participant has a defined role. No single entity controls the entire flow.</p>"
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
      "content": "<h2>Act one: authorisation, the decision in milliseconds</h2><p>The first step happens instantly.</p><p>The terminal reads your card and creates a structured message. This includes the amount, merchant details, and information about how the card was used.</p><p>That message is sent through the acquiring side to the card network. The network identifies your bank using the first digits of your card number and routes the request accordingly.</p><p>All of this communication follows a standard called ISO 8583, built for speed and reliability rather than readability.</p><p>Your bank now evaluates the request.</p><p>Is the card valid?</p><p>Is there sufficient balance or credit?</p><p>Does the transaction look suspicious?</p><p>Modern systems process these checks in milliseconds, using a combination of rules and predictive models.</p><p>If everything checks out, your bank sends back an approval. The response travels back through the same path.</p><p>The terminal displays Approved.</p><p>At this point, your bank has placed a hold on £85. The funds are reserved, but they have not left your account.</p><h2>Act two: clearing, where the final amount is confirmed</h2><p>Later that day, the store closes its transactions and submits them in a batch.</p><p>This step is called clearing.</p><p>It is where the merchant confirms what should actually be charged.</p><p>In retail, the amount usually remains the same. In many other industries, it does not.</p><p>A restaurant adds a tip.</p><p>A hotel adjusts the bill after checkout.</p><p>An online order may be split across multiple shipments.</p><p>Clearing replaces the temporary hold with the final transaction amount. It is the system agreeing on what the customer actually owes.</p><h2>Act three: settlement, when money actually moves</h2><p>Only after clearing does the system do settlement.</p><p>Instead of transferring funds for each individual transaction, card networks calculate net balances between banks. This allows the system to operate at global scale without unnecessary friction.</p><p>Your bank transfers the required amount to the acquiring side. The store receives its payout, typically within one to two business days.</p><p>What felt instant was, in reality, staged.</p><h2>The economics beneath the surface</h2><p>From the £85 you paid, the store does not receive the full amount.</p><p>A portion is taken as fees.</p><p>Interchange flows to your bank and underpins card rewards and overall economics. A network fee goes to the card network for maintaining the infrastructure. The acquiring side takes a margin for enabling acceptance and processing the transaction.</p><p>In most cases, this totals around 2 to 3 percent of the transaction value.</p><p>For the merchant, this is a cost. For the system, it is the incentive structure that keeps everything running.</p>"
    },
    {
      "type": "callout",
      "title": "Struggling with transaction latency?",
      "text": "We've cut online processing pipelines from 900ms to under 120ms, here's how.",
      "cta": {
        "label": "View Case Study",
        "href": "../contact",
        "variant": "ghost"
      }
    },
    {
      "type": "html",
      "content": "<h2>Why the system looks like this</h2><p>At first glance, the structure can feel unnecessarily complex.</p><p>Why involve so many parties just to move £85?</p><p>Because the system is not designed for simplicity. It is designed for trust, scale, and resilience.</p><p>Risk is distributed across specialised participants. Regulatory responsibilities are separated across layers. The network can support millions of merchants and billions of transactions.</p><p>What appears inefficient is, in fact, highly optimised.</p><h2>Conclusion</h2><p>A card payment is not a single action. It is a sequence.</p><p>A request is made. A decision is returned. The transaction is confirmed. Funds are settled.</p><p>All of it is compressed into an experience that feels immediate.</p><p>For businesses in payments, this flow is not background knowledge. It shapes product design, risk decisions, and revenue models.</p><p>For everyone else, it remains invisible by design.</p><p>You tap your card, collect your purchase, and move on.</p><p>The system, quietly and precisely, does the rest.</p>"
    }
  ],
  "relatedSlugs": [
    "5-common-mistakes-fintech-product-design",
    "fault-tolerant-ledger-systems",
    "ai-customer-onboarding-fintech"
  ]
};
