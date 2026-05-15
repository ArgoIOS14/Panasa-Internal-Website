window.DEFAULT_BLOG_CONTENT = {
  "meta": {
    "title": "The Lifecycle of a Payment: From Tap to Everything That Follows | Panasa",
    "description": "A payment is not a moment — it is a lifecycle. Authorisation, clearing, settlement, interchange, fraud, chargebacks, digital wallets, open banking and embedded finance, explained end-to-end.",
    "canonical": "https://www.panasatech.com/blog/lifecycle-of-a-payment",
    "ogImage": "https://www.panasatech.com/assets/og-image.png"
  },
  "slug": "lifecycle-of-a-payment",
  "category": "Insights",
  "tag": "INSIGHTS",
  "title": "The Lifecycle of a Payment: From Tap to Everything That Follows",
  "date": "17 APR 2026",
  "readTime": "13 MINS READ",
  "datePublished": "2026-04-17",
  "dateModified": "2026-04-17",
  "author": "Panasa Team",
  "tags": [
    "Payment lifecycle",
    "Authorisation",
    "Settlement",
    "Interchange",
    "Open banking",
    "Embedded finance"
  ],
  "heroImage": "../assets/blog-hero-desktop.webp",
  "heroImageTablet": "../assets/blog-hero-tablet.webp",
  "heroImageMobile": "../assets/blog-hero-mobile.webp",
  "heroImageAlt": "Payment lifecycle illustration",
  "body": [
    {
      "type": "html",
      "content": "<p>Most explanations of payments stop too early.</p><p>They focus on the moment a card is tapped, the terminal responds, and the transaction appears complete. It is neat, quick, and easy to understand. But it is also incomplete.</p><p>A payment is not a moment. It is a system that begins with a request, moves through layers of decision-making, and continues long after the customer has left. Approval is only the first checkpoint. What follows is where every issuer, risk team, compliance team, and product team operates in reality.</p><p>If you want to understand payments properly, you need to look at the full lifecycle. Not as isolated steps, but as a connected system where each part reinforces the others.</p><h2>Authorisation: the two-second decision that sets everything in motion</h2><p>Every payment begins with a question.</p><p>Should this transaction be approved?</p><p>When a customer taps their card or enters their details online, a structured message is sent through the acquiring side to the card network, and then to the issuing bank. This message follows a standard built for speed and consistency, allowing systems across the world to communicate in milliseconds.</p><p>The issuing bank evaluates the request almost instantly.</p><p>Is the card active?</p><p>Are there sufficient funds or credit?</p><p>Does the transaction look suspicious?</p><p>If the answer is yes, the bank approves the transaction and places a hold on the amount. If not, it declines.</p><p>From the customer's perspective, that is the entire payment.</p><p>In reality, this is only a pause. It is a promise, not a resolution. The system has simply agreed that the payment can proceed.</p><h2>Clearing and settlement: where the system catches up with reality</h2><p>After authorisation, the transaction enters a quieter but more consequential phase.</p><p>Later in the day, the merchant submits all captured transactions in a batch. This step, known as clearing, confirms what should actually be charged. It accounts for adjustments such as tips, partial fulfilment, or cancelled items.</p><p>Once clearing is complete, settlement begins.</p><p>This is when funds move between banks. Rather than transferring money for each transaction individually, the system calculates net balances across participants and settles the differences. This allows billions of transactions to be processed efficiently at scale.</p><p>For the customer, the transaction is already in their rear-view mirror.</p><p>For the merchant, this is when the money actually arrives.</p><h2>Interchange fees: the economics hidden inside every payment</h2><p>Every transaction carries a cost that most customers never see.</p><p>The largest component is interchange. This is paid by the acquiring side to the issuing bank and is a reward for issuing risk, funding, and the overall cost of running a card programme. It also underpins rewards, from cashback to airline miles.</p><p>On top of that, card networks charge a small fee for operating the infrastructure. The acquiring side collects its own margin for enabling acceptance and processing the transaction.</p><p>In most cases, these combined fees total between 2 and 3 percent of the transaction value.</p><p>For merchants, this is a cost of doing business.</p><p>For the ecosystem, it is the invisible structure that keeps the system functioning.</p><h2>Card networks: the system that connects everything</h2><p>Card networks are often overlooked.</p><p>Companies like Visa, Mastercard, and American Express do not hold your money. They do not issue your card. They do not decide whether your transaction is approved.</p><p>What they do is set the messaging and routing rules.</p><p>They ensure that a transaction initiated at a small café in Europe can be routed to an issuing bank in a different country. They operate the infrastructure that allows the system to function globally.</p><p>Without them, there is no international reach. Every bank would need to connect directly with every other bank, which does not scale.</p>"
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
      "content": "<h2>Issuer processors: the invisible systems behind every decision</h2><p>While issuing banks make the decisions, they often do not run the technology themselves.</p><p>That work is handled by issuer processors.</p><p>These systems receive authorisation requests from the network, apply the bank's rules, check balances, run fraud models, and return a response in milliseconds. They are built for reliability, speed, and accuracy because they are handling thousands of transactions per second.</p><p>Most customers will never hear of them, but they sit behind nearly every card interaction, quietly executing the logic that determines whether a payment succeeds.</p><h2>Fraud and risk: where the system is constantly tested</h2><p>Fraud is not a single problem. It shows up in different forms across the lifecycle.</p><p>Card-present fraud involves physical cards, often lost or stolen.</p><p>Card-not-present fraud happens online, where the card details are valid but the person using them is not.</p><p>First-party fraud involves legitimate cardholders disputing transactions they actually did authorise.</p><p>The system is designed to catch these in one of several ways:</p><p>Authentication adds a checkpoint where customers confirm the transaction is genuine.</p><p>Real-time machine monitoring continues after approval, identifying patterns that may not have been known previously.</p><p>Chargebacks kick in when cardholders dispute transactions that have already settled.</p><p>No system eliminates fraud entirely. The goal is to manage it without disrupting legitimate transactions.</p><h2>Chargebacks and disputes: when the system runs in reverse</h2><p>Sometimes, a customer looks at a transaction and believes it is not legitimate.</p><p>That is when a dispute begins.</p><p>The issuing bank investigates the claim. If valid, it initiates a chargeback. Funds are pulled back through the system, moving from the acquiring side to the issuer, and ultimately back to the customer.</p><p>For merchants, this is more than a refund. It carries additional fees, operational overhead, and potential penalties if disputes become frequent.</p><p>Chargebacks are not just an accounting mechanism. They are a visible part of how much the payment lifecycle runs in reverse.</p><h2>Digital wallets: the same system, with a different interface</h2><p>Digital wallets such as Apple Pay and Google Pay feel like a departure from cards.</p><p>In reality, they sit on top of the same infrastructure.</p><p>When a customer uses a digital wallet, the underlying card is tokenised. Instead of sending the actual card number, the system uses a disposable token which is different for each transaction.</p><p>Each transaction is still paired with a dynamic cryptographic code.</p><p>This improves security without changing the fundamental flow.</p><p>The transaction still moves through the same network, reaches the same issuing bank, and follows the same lifecycle.</p><p>What changes is the interface at the start of the journey.</p><h2>Open banking and pay-by-bank: a different set of rails</h2><p>For merchants, it offers lower costs.</p><p>For the existing issuer ecosystem, it represents a credible challenge if too many payments shift away from the card model.</p><p>Open banking introduces an alternative: one where money is pushed by bank. Instead of moving through card networks, payments move directly from the customer's bank account to the merchant account.</p><p>There is no interchange. Fewer intermediaries are involved. Settlement can be faster.</p><p>This model is gaining traction, particularly in regions where real-time payment systems are more established.</p>"
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
      "content": "<h2>Embedded finance and BaaS: payments becoming a feature, not a product</h2><p>One of the most significant shifts in recent years is where financial services are becoming embedded into products that are not overtly financial.</p><p>With embedded finance and Banking as a Service, companies that are not banks can offer payment tools, wallets, issuing, and other financial products directly within their platforms.</p><p>A retailer can issue branded cards.</p><p>A software platform can enable payments natively.</p><p>A marketplace can manage payouts without relying entirely on external providers.</p><p>Underneath, the same infrastructure still exists; issuers, processors, and networks continue to do the work.</p><p>What has changed is who controls the customer experience.</p><h2>Conclusion</h2><p>A payment is not a single action. It is a lifecycle.</p><p>It begins with authorisation, where a decision is made in seconds.</p><p>It moves through clearing and settlement, where money actually changes hands.</p><p>It carries fees that sustain the system.</p><p>It includes mechanisms for fraud checks, chargebacks, risk, and recovery.</p><p>It is evolving through digital wallets, alternative rails, and embedded financial services.</p><p>Each part is connected. Each part impacts how the next one operates. Each part of the system is a standard.</p><p>For businesses operating in payments, understanding this lifecycle is essential. It shapes how products are built, how costs are managed, and how trust is maintained.</p><p>For everyone else, it remains invisible by design.</p><p>You make a payment and move on.</p><p>The system continues working after you.</p>"
    }
  ],
  "relatedSlugs": [
    "anatomy-of-a-swipe",
    "card-controls-fraud-prevention",
    "3d-secure-authentication-card-program"
  ]
};
