window.DEFAULT_BLOG_CONTENT = {
  "meta": {
    "title": "What Does 3D Secure Authentication Actually Mean for Your Card Program? | Panasa",
    "description": "How 3D Secure (3DS) works, the frictionless vs challenge decision, the liability shift, PSD2 SCA implications, and what card programs should actually be tuning.",
    "canonical": "https://www.panasatech.com/blog/3d-secure-authentication-card-program",
    "ogImage": "https://www.panasatech.com/assets/blog-hero-desktop.webp"
  },
  "slug": "3d-secure-authentication-card-program",
  "tag": "BLOG",
  "title": "What Does 3D Secure Authentication Actually Mean for Your Card Program?",
  "date": "15 MAY 2026",
  "readTime": "8 MINS READ",
  "author": "Panasa Team",
  "heroImage": "../assets/blog-hero-desktop.webp",
  "heroImageTablet": "../assets/blog-hero-tablet.webp",
  "heroImageMobile": "../assets/blog-hero-mobile.webp",
  "heroImageAlt": "3D Secure authentication illustration",
  "body": [
    {
      "type": "html",
      "content": "<p>The growth of e-commerce and online shopping has brought a parallel growth in online fraud. Unlike in-person payments, online transactions offer no physical card to inspect and no person to verify. That gap has become the primary attack surface for fraudsters. To combat this problem, 3D Secure authentication was introduced wherein businesses trigger it in online checkout flows and the card issuing bank run authentication before the transaction is completed.</p><h2>What is 3D Secure?</h2><p>3D Secure (3DS) is an authentication process used by merchants to verify the cardholder before processing the transaction. It uses multi-factor authentication such as OTPs, biometrics, or push notifications to verify the cardholder&rsquo;s identity. 3DS provides an additional security layer and critically, it helps merchants shift the liability for fraud to the card issuer.</p><p>The &ldquo;3D&rdquo; in 3D Secure stands for the three domains involved in the authentication process:</p><ul><li>The Acquirer &mdash; the merchant&rsquo;s bank or payment processor</li><li>The Issuer &mdash; the cardholder&rsquo;s bank or fintech</li><li>The Interoperability Domain &mdash; the card network (Visa, Mastercard, etc.)</li></ul><h2>How Does 3D Secure Authentication Work?</h2><p>When a customer initiates a checkout or an online transaction, the merchant sends a request to an Access Control Server (ACS) which is a component on the issuer&rsquo;s side of the transaction. The ACS evaluates data points related to the cardholder, their device, and the purchase, then makes one of two decisions:</p><ul><li>Approve the transaction silently, or</li><li>Step the cardholder up to a challenge.</li></ul><p>If the transaction is considered low risk, it proceeds without any cardholder intervention. This is the frictionless flow. If it is considered high risk, the customer is redirected to an authentication page where they complete either a fingerprint scan, face ID, OTP, or push notification confirmation. Once authentication is completed, the issuer approves the payment.</p><p>How the ACS handles that decision directly shapes how much fraud your card program absorbs and how often your cardholders get interrupted at checkout.</p>"
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
      "content": "<h2>What is Frictionless and Challenge Authentication in 3D Secure and What it Means for Your Card Program?</h2><p>The ACS decides frictionless or challenge mode of customer authentication based on the data it receives from the merchant. The more signals available, the more confident it can be in approving the transaction silently. Common data points include:</p><ul><li>Cardholder identity &mdash; name, phone number, email, billing and shipping address</li><li>Account history &mdash; account age, number of transactions, prior chargebacks</li><li>Device information &mdash; device ID, channel, IP address, browser time zone</li><li>Order context &mdash; shipping method, digital vs. physical goods, same-day shipping flag</li></ul><p>3DS2, which is the upgraded version of the original 3D Secure protocol introduced by EMVCo in 2016, expanded this to 130+ data attributes &mdash; roughly 10 times more than the original &mdash; which is what makes the frictionless authentication path possible at scale. The original 3DS relied on static passwords and challenged every transaction. Most 3DS2 transactions now pass silently. When cardholders are challenged too often, they abandon purchases. When they are almost never challenged, fraud slips through. Getting this balance right is one of the core design decisions in running a card program.</p><h2>3DS Liability Shift Explained: Why Card Issuers Carry the Fraud Risk</h2><p>When a merchant triggers 3D Secure authentication and it succeeds, fraud liability shifts away from the merchant and onto the issuer, irrespective of whether the transaction was frictionless or challenged. If the authentication is completed, the issuer is on the hook for any resulting fraud dispute.</p><p>This means your card program is accepting financial responsibility with every successful 3DS authentication. A card program without intelligent ACS rules is silently accumulating liability it does not need to carry. In a recent case, a neobank saw a near 35% reduction in fraud losses simply by implementing proper 3DS decisioning. One nuance: if an exemption is claimed and the cardholder is never authenticated, the liability shift does not apply. Programs that claim exemptions indiscriminately trade short-term friction reduction for long-term fraud exposure.</p>"
    },
    {
      "type": "callout",
      "title": "Struggling with transaction latency?",
      "text": "We've cut online processing pipelines from 900ms to under 120ms, here's how.",
      "cta": {
        "label": "View Case Study",
        "href": "../case-studies/3d-secure-authentication-issuer-processor",
        "variant": "ghost"
      }
    },
    {
      "type": "html",
      "content": "<h2>What 3D Secure Authentication Means When You&rsquo;re Building a Card Program</h2><p>Card programs often treat 3DS as something that &ldquo;just runs.&rdquo; It does not. It runs according to the rules you set and if you have not set them deliberately, you are running on defaults that were not designed for your program.</p><p>A few decisions matter more than others. Enrol your BINs in 3DS at the start of your program&rsquo;s lifecycle, not after fraud appears. Keep cardholder contact data current; a challenge that cannot reach the cardholder fails, and that is a worse experience than no challenge at all. And understand what your processor actually gives you &mdash; some let you own the authentication decision entirely, others make it on your behalf. That distinction matters more than most card programs realise.</p><h2>PSD2 Strong Customer Authentication Requirements: What Card Programs Need to Know</h2><p>In Europe, 3D Secure authentication is not optional. Under PSD2&rsquo;s Strong Customer Authentication (SCA) requirements, card programs in the EU and UK must apply 3DS to online transactions. However, some cases like low-value transactions under &euro;30, low fraud-rate issuers, and whitelisted merchants are exempted but the liability still remains with the issuer. Programs that rely on them heavily are trading friction reduction for fraud exposure.</p><p>The regulation is expanding beyond Europe with regulatory requirements coming up across APAC and the Middle East.</p><h2>The Real Question for Card Programs</h2><p>3D Secure authentication is not a feature your processor switches on. It is an authentication architecture your card program designs and maintains. Programs that run it will see meaningful fraud reduction and fewer disputes. Programs that treat it as a checkbox are absorbing losses that were entirely preventable.</p><p>The question then, is not whether your card program has 3DS. The question is whether your 3DS authentication is actually working for your program.</p>"
    }
  ],
  "relatedSlugs": [
    "card-controls-fraud-prevention",
    "anatomy-of-a-swipe",
    "lifecycle-of-a-payment"
  ],
  "category": "Blog",
  "datePublished": "2026-05-15",
  "dateModified": "2026-05-15",
  "tags": [
    "3D Secure",
    "Authentication",
    "PSD2 SCA",
    "Card programs",
    "Fraud prevention"
  ]
};
