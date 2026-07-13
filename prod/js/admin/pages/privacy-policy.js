import { SEO_META_EXTRAS } from './seoMetaFields.js';
import { STRUCTURED_DATA_SECTION } from './structuredDataSection.js';

export const fbPath = 'pages/privacyPolicy';

export const defaults = {
  meta: {
    title: 'Privacy & Cookies Policy | Panasa',
    description: 'How we collect, use, and protect your data. Your privacy matters to us.',
    keywords: [],
    canonical: '',
    robots: 'index,follow',
    ogImage: '',
    ogType: 'website',
    twitterCard: 'summary_large_image',
    includeInSitemap: true,
    sitemapPriority: '',
    sitemapChangefreq: '',
    hreflang: [],
  },
  hero: {
    pill: 'Legal',
    title: 'Privacy & Cookies',
    titleEmphasis: 'Policy',
    subtitle: 'How we collect, use, and protect your data. Your privacy matters to us.',
  },
  contactCard: {
    heading: 'Have Questions About Your Data?',
    text: 'Contact our team for any privacy-related queries, data subject access requests, or to exercise any of your rights.',
    email: 'info@panasatech.com',
  },
  websitePrivacy: {
    intro: 'This Privacy Policy describes our policies and procedures on the collection, use and disclosure of your information when you use the Service and tells you about your privacy rights and how the law protects you.',
    intro2: 'We use your personal data to provide and improve the Service. By using the Service, you agree to the collection and use of information in accordance with this Privacy Policy.',
    whoWeAre: { heading: 'Who We Are', body: 'Panasa is a management and technology consultancy for digital strategy and innovation. We bring together the capabilities and competencies Fintechs need to grow, innovate and thrive in the digital age. We are here to empower you.' },
    whatWeDo: { heading: 'What We Do', body: 'We provide Fintech solutions to customers like payment processing companies, banks and similar financial institutions.' },
    legalBasis: { heading: 'Legal Basis for Processing', body: 'We use data to carry out direct B2C marketing and depend on 3rd party lead generation campaigns. The lawful basis we use for this processing is "Legitimate Interest" in accordance with Data Protection Rules & legislation.', body2: 'The regulatory authorities recommend that companies using this basis conduct an interests assessment and we have done this in regards to the data processing we undertake on our own behalf. Panasa Technologies fully complies with all key principles laid out in the Data Protection legislation as outlined and enforced. These are:', principles: ['Lawfulness, fairness and transparency', 'Purpose limitation', 'Data minimisation', 'Accuracy', 'Storage limitation', 'Integrity and confidentiality (security)', 'Accountability'] },
    glossary: { intro: 'The words of which the initial letter is capitalised have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.' },
    personalData: { heading: 'Personal Data', body: 'While using our Service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you. Personally identifiable information may include, but is not limited to:', items: ['Email address', 'First name and last name', 'Phone number', 'Usage Data'] },
    usageData: { heading: 'Usage Data', body: "Usage Data is collected automatically when using the Service. Usage Data may include information such as your Device's Internet Protocol address (e.g. IP address), browser type, browser version, the pages of our Service that you visit, the time and date of your visit, the time spent on those pages, unique device identifiers and other diagnostic data.", body2: 'When you access the Service by or through a mobile device, we may collect certain information automatically, including, but not limited to, the type of mobile device you use, your mobile device unique ID, the IP address of your mobile device, your mobile operating system, the type of mobile Internet browser you use, unique device identifiers and other diagnostic data.' },
    useOfData: { heading: 'Use of Your Personal Data', items: ['To provide and maintain our Service', 'To manage your account', 'For the performance of a contract', 'To contact you', 'To provide you with news and general information', 'To manage your requests', 'For business transfers', 'For other purposes such as data analysis and evaluation'] },
    retention: { heading: 'Retention of Your Personal Data', body: 'The Company will retain your Personal Data only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your Personal Data to the extent necessary to comply with our legal obligations, resolve disputes, and enforce our legal agreements and policies.', body2: 'The Company will also retain Usage Data for internal analysis purposes. Usage Data is generally retained for a shorter period of time, except when this data is used to strengthen the security or to improve the functionality of our Service, or we are legally obligated to retain this data for longer time periods.' },
    transfer: { heading: 'Transfer of Your Personal Data', body: "Your information, including Personal Data, is processed at the Company's operating offices and in any other places where the parties involved in the processing are located. It means that this information may be transferred to and maintained on computers located outside of your state, province, country or other governmental jurisdiction where the data protection laws may differ from those of your jurisdiction.", body2: 'The Company will take all steps reasonably necessary to ensure that your data is treated securely and in accordance with this Privacy Policy and no transfer of your Personal Data will take place to an organisation or a country unless there are adequate controls in place including the security of your data and other personal information.' },
    disclosureTransactions: { heading: 'Business Transactions', body: 'If the Company is involved in a merger, acquisition or asset sale, your Personal Data may be transferred. We will provide notice before your Personal Data is transferred and becomes subject to a different Privacy Policy.' },
    disclosureLawEnforcement: { heading: 'Law Enforcement', body: 'Under certain circumstances, the Company may be required to disclose your Personal Data if required to do so by law or in response to valid requests by public authorities (e.g. a court or a government agency).' },
    disclosureOtherLegal: { heading: 'Other Legal Requirements', body: 'The Company may disclose your Personal Data in the good faith belief that such action is necessary to:', items: ['Comply with a legal obligation', 'Protect and defend the rights or property of the Company', 'Prevent or investigate possible wrongdoing in connection with the Service', 'Protect the personal safety of Users of the Service or the public', 'Protect against legal liability'] },
    security: { heading: 'Security of Your Personal Data', body: 'The security of your Personal Data is important to us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.' },
    rights: { heading: 'Your Rights (Data Subject Rights)', items: ['Right to be informed about how their Personal Data is used', 'Right to access Personal Data (including Data Subject Access Requests)', 'Right to have inaccurate Personal Data rectified', 'Right to have Personal Data erased (conditional)', 'Right to restrict processing of Personal Data (conditional)', 'Right to data portability (in a commonly used electronic format)', 'Right to object to processing of Personal Data in certain circumstances, including where Personal Data is used for marketing purposes', 'Right not to be subject to automated decisions where the decision produces a legal effect or a similarly significant effect'] },
    honourRights: { intro: 'To honour data subject rights:', items: ['We have an Individuals Rights Guidelines which explains the procedures that must be followed if any rights are exercised by individuals.', "We provide mandatory and frequent training to all staff on data protection matters, including training on individuals' rights.", 'Our internal audit team carries out reviews to check that statutory deadlines are being met and that requests are being responded to in the correct manner.', 'We have appointed a Data Protection Officer to ensure high-levels of compliance and to correspond with regulatory authorities.'] },
    children: { heading: "Children's Privacy", body: 'Our Service does not address anyone under the age of 13. We do not knowingly collect personally identifiable information from anyone under the age of 13. If you are a parent or guardian and you are aware that your child has provided us with Personal Data, please contact us. If we become aware that we have collected Personal Data from anyone under the age of 13 without verification of parental consent, we take steps to remove that information from our servers.' },
    thirdPartyLinks: { heading: 'Links to Other Websites', body: "Our Service may contain links to other websites that are not operated by us. If you click on a third party link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every site you visit.", body2: 'We have no control over and assume no responsibility for the content, privacy policies or practices of any third party sites or services.' },
    changes: { heading: 'Changes to this Privacy Policy', body: 'We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. We will let you know via email and/or a prominent notice on our Service, prior to the change becoming effective and update the "Last updated" date at the top of this Privacy Policy.', body2: 'You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.' },
    contact: { heading: 'Contact Us', body: 'If you have any questions about this Privacy Policy, you can contact us:' },
  },
  cookies: {
    overview: { heading: 'Tracking Technologies and Cookies', body: 'We use Cookies and similar tracking technologies to track the activity on our Service and store certain information. Tracking technologies used are beacons, tags, and scripts to collect and track information and to improve and analyse our Service.' },
    cookieTypes: [
      { name: 'Necessary / Essential Cookies', meta: 'Type: Session Cookies · Administered by: Us', description: 'These Cookies are essential to provide you with services available through the Website and to enable you to use some of its features. They help to authenticate users and prevent fraudulent use of user accounts. Without these Cookies, the services that you have asked for cannot be provided, and we only use these Cookies to provide you with those services.' },
      { name: 'Cookies Policy / Notice Acceptance Cookies', meta: 'Type: Persistent Cookies · Administered by: Us', description: 'These Cookies identify if users have accepted the use of cookies on the Website.' },
      { name: 'Functionality Cookies', meta: 'Type: Persistent Cookies · Administered by: Us', description: 'These Cookies allow us to remember choices you make when you use the Website, such as remembering your login details or language preference. The purpose of these Cookies is to provide you with a more personal experience and to avoid you having to re-enter your preferences every time you use the Website.' },
    ],
    banner: { heading: 'Cookie Banner', body: 'When you first visit our website, a cookie consent banner is displayed at the bottom of the page. You can choose to accept or refuse cookies. Your preference is stored for one month before being asked again.' },
    managing: { heading: 'Managing Cookies', body: 'You can manage your cookie preferences through your browser settings. Most web browsers allow you to control cookies through their settings preferences. To find out more about cookies, including how to see what cookies have been set, visit aboutcookies.org.' },
  },
  gdpr: {
    whoWeAre: { heading: 'Who We Are', body: 'Panasa Technologies Private Limited is a management and technology consultancy for digital strategy and innovation. We bring together the capabilities and competencies Fintechs need to grow, innovate and thrive in the digital age. We are here to empower you.' },
    legalBasis: { heading: 'GDPR Legal Basis for Processing', body: 'We and our joint data controller/third party data processor (Neptik LTD) use data to carry out direct B2B marketing and lead generation campaigns. The lawful basis we use for this processing is "Commissioner\'s Legitimate Interest" in accordance with recital 47 of the GDPR.', body2: 'The United Kingdom\'s Information Commissioner\'s Office (ICO) recommends that companies using this basis conduct a "Legitimate Interests Assessment" (LIA) and we have done this in regards to the data processing we undertake. Panasa Technologies Private Limited and our joint data controller/third party data processor (Neptik LTD) fully complies with all key principles laid out in the GDPR legislation as outlined and enforced by the ICO. These are:', principles: ['Lawfulness, fairness and transparency', 'Purpose limitation', 'Data minimisation', 'Accuracy', 'Storage limitation', 'Integrity and confidentiality (security)', 'Accountability'] },
    dataSharing: { heading: 'Data Sharing', body: 'We and our joint data controller/third party data processor (Neptik LTD) use a number of third party cloud based software platforms to process and store personal data in our daily business operations. We do not resell or share this data with any other party other than in the circumstances below:', items: ['Where we are legally required by law to disclose your personal information.', 'To further fraud protection and reduce the risk of fraud.', 'In the event that we sell any or all of our business to the buyer.'] },
    transfer: { heading: 'International Transfer of Data', body: 'Many of the third party cloud based software platforms we and our joint data controller/third party data processor (Neptik LTD) use are owned by companies based outside the UK and EEA. We only transfer personal data to countries that have been identified as being able to provide an adequate level of data protection security by the UK and European Commission, and we only use cloud based software providers which deliver the same level of data protection security as required in the UK and the European Union.' },
    dataSource: { heading: 'Where Does the Data Come From?', body: 'The data we process is obtained from several sources. These include GDPR compliant data providers and online resources. Our processing is based principally on the use of publicly available data to identify sales prospects. Your privacy is important to us, we take our responsibilities seriously and will always respond quickly and courteously to any request.' },
    rights: { heading: 'Your GDPR Rights', items: ['Right to rectification', 'Right to object', 'Right to access', 'Right to erasure', 'Right to restrict processing', 'Right to data portability', 'Right to withdraw consent', 'Right to complain to a supervisory authority'], rectificationHeading: 'Right to Rectification', objectHeading: 'Right to Object', accessHeading: 'Access to Information' },
    infoCollect: { heading: 'Information We Collect', body: 'B2B data is only collected in relation to Panasa Technologies Private Limited\'s services. This information will be processed under either "Legitimate Interest" in accordance with recital 47 of the GDPR or on a consent basis depending on our clients\' GDPR policy.', items: ['Information about your use of our site including details of your visits such as pages viewed and the resources that you access.', 'Information provided voluntarily by you. For example, when you download content or register for information.', 'Information that you provide when you communicate with us by any means.', 'Name and job title', 'Professional contact information including business email address'] },
    ico: { heading: "Information Commissioner's Office", body: "Panasa Technologies Private Limited protects client data in the same way it protects all sensitive and personal data, in accordance with the rules and regulations stated in the General Data Protection Act. The Information Commissioner's Office registration number of the third party company (Neptik LTD) that we contract to source, store and manage our prospective customer data is: ZA795453." },
    storing: { heading: 'Storing Your Personal Data', body: 'We and our joint controller/third party data processor (Neptik LTD) do our utmost to ensure that all reasonable steps are taken to make sure that your data is treated and stored securely.' },
    disclosing: { heading: 'Disclosing Your Information', body: 'We will not disclose your personal information to any other party other than in accordance with this Privacy Policy and in the circumstances detailed below:', items: ['In the event that we sell any or all of our business to the buyer.', 'Where we are legally required by law to disclose your personal information.', 'To further fraud protection and reduce the risk of fraud.'] },
    contact: { heading: 'Contact Us', body: 'Please do not hesitate to contact us regarding any matter relating to this Privacy Policy. To opt-out of receiving email marketing communications from us, please email us at info@panasatech.com.' },
  },
  campaign: {
    intro: 'Panasa Technology Pvt Ltd is a private limited company that provides Fintech services.',
    legalBasis: { heading: 'GDPR Legal Basis for Processing', body: 'We and our joint data controller/third party data processor (Neptik LTD) use data to carry out direct B2B marketing and lead generation campaigns. The lawful basis we use for this processing is "Legitimate Interest" in accordance with recital 47 of the GDPR.', principles: ['Lawfulness, fairness and transparency', 'Purpose limitation', 'Data minimisation', 'Accuracy', 'Storage limitation', 'Integrity and confidentiality (security)', 'Accountability'] },
    dataSharing: { heading: 'Data Sharing', body: 'We and our joint data controller/third party data processor (Neptik LTD) use a number of third party cloud based software platforms to process and store personal data in our daily business operations. We do not resell or share this data with any other party other than in the circumstances below:', items: ['Where we are legally required by law to disclose your personal information.', 'To further fraud protection and reduce the risk of fraud.', 'In the event that we sell any or all of our business to the buyer.'] },
    transfer: { heading: 'International Transfer of Data', body: 'Many of the third party cloud based software platforms we and our joint data controller/third party data processor (Neptik LTD) use are owned by companies based outside the UK and EEA. We only transfer personal data to countries that have been identified as being able to provide an adequate level of data protection security by the UK and European Commission, and we only use cloud based software providers which deliver the same level of data protection security as required in the UK and the European Union.' },
    dataSource: { heading: 'Where Does the Data Come From?', body: 'The data we process is obtained from several sources. These include GDPR compliant data providers and online resources. Our processing is based principally on the use of publicly available data to identify sales prospects. Your privacy is important to us, we take our responsibilities seriously and will always respond quickly and courteously to any request.' },
    rights: { heading: 'Your Rights', items: ['The right to be informed', 'The right to access', 'The right to erasure', 'The right to restrict processing', 'The right to data portability', 'Rights related to automated decision-making including profiling', 'The right to complain to a supervisory authority', 'The right to withdraw consent'], rectificationHeading: 'Right to Rectification', objectHeading: 'Right to Object', accessHeading: 'Access to Information' },
    infoCollect: { heading: 'Information We Collect', body: "B2B data is only collected in relation to Panasa Technology Pvt Ltd's services. In running and maintaining our website and during the course of our day to day business we may collect and process the following data about you:", items: ['Information about your use of our site including details of your visits such as pages viewed and the resources that you access.', 'Information provided voluntarily by you. For example, when you download content or register for information.', 'Information that you provide when you communicate with us by any means.', 'Name and job title', 'Professional contact information including business email address'] },
    ico: { heading: "Information Commissioner's Office", body: "Panasa Technology Pvt Ltd protects client data in the same way it protects all sensitive and personal data, in accordance with the rules and regulations stated in the General Data Protection Act. The Information Commissioner's Office registration number of the third party company (Neptik LTD) that we contract to source, store and manage our prospective customer data is: ZA795453." },
    storing: { heading: 'Storing Your Personal Data', body: 'We and our joint controller/third party data processor (Neptik LTD) do our utmost to ensure that all reasonable steps are taken to make sure that your data is treated and stored securely. Unfortunately the sending of information via the internet is not totally secure and on occasion such information can be intercepted. We cannot guarantee the security of data that you choose to send us electronically. Sending such information is entirely at your own risk.' },
    thirdParty: { heading: 'Third Party Links', body: "On occasion we include links to third parties on this website. Where we provide a link it does not mean that we endorse or approve that site's policy towards visitor privacy. You should review their privacy policy before sending them any personal data." },
    contact: { heading: 'Contact Us', body: 'Please do not hesitate to contact us regarding any matter relating to this Privacy Policy. To opt-out of receiving email marketing communications from us, please email us at info@panasatech.com.' },
  },
};

// Helper to build section fields for a policy tab
function policySections(tabKey, sections) {
  return sections.map(s => {
    const fields = [];
    if (s.hasHeading !== false) fields.push({ key: 'heading', label: 'Heading', type: 'text', nestedPath: `${tabKey}.${s.key}.heading` });
    if (s.hasBody !== false) fields.push({ key: 'body', label: 'Body text', type: 'textarea', nestedPath: `${tabKey}.${s.key}.body` });
    if (s.hasItems) fields.push({ key: s.itemsKey || 'items', label: s.itemsLabel || 'List items', type: 'string-list', nestedPath: `${tabKey}.${s.key}.${s.itemsKey || 'items'}` });
    if (s.hasPrinciples) fields.push({ key: 'principles', label: 'Principles', type: 'string-list', nestedPath: `${tabKey}.${s.key}.principles` });
    if (s.hasCookieTypes) fields.push({ key: 'cookieTypes', label: 'Cookie types', type: 'cookie-types', nestedPath: `${tabKey}.cookieTypes` });
    return { key: `${tabKey}_${s.key}`, label: s.label, parentKey: tabKey, nestedKey: s.key, fields };
  });
}

export const sections = [
  { key: 'meta', label: 'SEO Meta', fields: [
    { key: 'title', label: 'Meta title', type: 'text' },
    { key: 'description', label: 'Meta description', type: 'textarea' },
    ...SEO_META_EXTRAS,
  ]},
  // Hero
  { key: 'hero', label: 'Hero Section', fields: [
    { key: 'pill', label: 'Pill badge', type: 'text' },
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'titleEmphasis', label: 'Title emphasis', type: 'text' },
    { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
  ]},
  // Contact Card
  { key: 'contactCard', label: 'Contact Card (bottom)', fields: [
    { key: 'heading', label: 'Heading', type: 'text' },
    { key: 'text', label: 'Description', type: 'textarea' },
    { key: 'email', label: 'Email', type: 'text' },
  ]},
  // Website Privacy tab sections
  { key: 'websitePrivacy', label: 'Tab: Website Privacy', fields: [
    { key: 'intro', label: 'Introduction text', type: 'textarea' },
    { key: 'intro2', label: 'Introduction text (2nd paragraph)', type: 'textarea' },
  ]},
  { key: 'wp_glossary', label: 'WP: Interpretation & Definitions (intro)', parentKey: 'websitePrivacy', nestedKey: 'glossary', fields: [
    { key: 'intro', label: 'Intro text', type: 'textarea' },
  ]},
  { key: 'wp_whoWeAre', label: 'WP: Who We Are', parentKey: 'websitePrivacy', nestedKey: 'whoWeAre', fields: [
    { key: 'heading', label: 'Heading', type: 'text' },
    { key: 'body', label: 'Body', type: 'textarea' },
  ]},
  { key: 'wp_whatWeDo', label: 'WP: What We Do', parentKey: 'websitePrivacy', nestedKey: 'whatWeDo', fields: [
    { key: 'heading', label: 'Heading', type: 'text' },
    { key: 'body', label: 'Body', type: 'textarea' },
  ]},
  { key: 'wp_legalBasis', label: 'WP: Legal Basis', parentKey: 'websitePrivacy', nestedKey: 'legalBasis', fields: [
    { key: 'heading', label: 'Heading', type: 'text' },
    { key: 'body', label: 'Body', type: 'textarea' },
    { key: 'body2', label: 'Body (2nd paragraph, LIA note)', type: 'textarea' },
    { key: 'principles', label: 'Principles', type: 'string-list' },
  ]},
  { key: 'wp_personalData', label: 'WP: Personal Data', parentKey: 'websitePrivacy', nestedKey: 'personalData', fields: [
    { key: 'heading', label: 'Heading', type: 'text' },
    { key: 'body', label: 'Body', type: 'textarea' },
    { key: 'items', label: 'Data types', type: 'string-list' },
  ]},
  { key: 'wp_useOfData', label: 'WP: Use of Data', parentKey: 'websitePrivacy', nestedKey: 'useOfData', fields: [
    { key: 'heading', label: 'Heading', type: 'text' },
    { key: 'items', label: 'Uses', type: 'string-list' },
  ]},
  { key: 'wp_usageData', label: 'WP: Usage Data', parentKey: 'websitePrivacy', nestedKey: 'usageData', fields: [{ key: 'heading', label: 'Heading', type: 'text' }, { key: 'body', label: 'Body', type: 'textarea' }, { key: 'body2', label: 'Body (2nd paragraph, mobile devices)', type: 'textarea' }] },
  { key: 'wp_rights', label: 'WP: Your Rights', parentKey: 'websitePrivacy', nestedKey: 'rights', fields: [
    { key: 'heading', label: 'Heading', type: 'text' },
    { key: 'items', label: 'Rights', type: 'string-list' },
  ]},
  { key: 'wp_retention', label: 'WP: Retention', parentKey: 'websitePrivacy', nestedKey: 'retention', fields: [{ key: 'heading', label: 'Heading', type: 'text' }, { key: 'body', label: 'Body', type: 'textarea' }, { key: 'body2', label: 'Body (2nd paragraph)', type: 'textarea' }] },
  { key: 'wp_transfer', label: 'WP: Transfer', parentKey: 'websitePrivacy', nestedKey: 'transfer', fields: [{ key: 'heading', label: 'Heading', type: 'text' }, { key: 'body', label: 'Body', type: 'textarea' }, { key: 'body2', label: 'Body (2nd paragraph)', type: 'textarea' }] },
  { key: 'wp_disclosure_transactions', label: 'WP: Disclosure — Business Transactions', parentKey: 'websitePrivacy', nestedKey: 'disclosureTransactions', fields: [{ key: 'heading', label: 'Heading', type: 'text' }, { key: 'body', label: 'Body', type: 'textarea' }] },
  { key: 'wp_disclosure_enforcement', label: 'WP: Disclosure — Law Enforcement', parentKey: 'websitePrivacy', nestedKey: 'disclosureLawEnforcement', fields: [{ key: 'heading', label: 'Heading', type: 'text' }, { key: 'body', label: 'Body', type: 'textarea' }] },
  { key: 'wp_disclosure_legal', label: 'WP: Disclosure — Other Legal Requirements', parentKey: 'websitePrivacy', nestedKey: 'disclosureOtherLegal', fields: [{ key: 'heading', label: 'Heading', type: 'text' }, { key: 'body', label: 'Body', type: 'textarea' }, { key: 'items', label: 'Reasons list', type: 'string-list' }] },
  { key: 'wp_security', label: 'WP: Security', parentKey: 'websitePrivacy', nestedKey: 'security', fields: [{ key: 'heading', label: 'Heading', type: 'text' }, { key: 'body', label: 'Body', type: 'textarea' }] },
  { key: 'wp_honourRights', label: 'WP: To Honour Data Subject Rights', parentKey: 'websitePrivacy', nestedKey: 'honourRights', fields: [{ key: 'intro', label: 'Intro text', type: 'text' }, { key: 'items', label: 'Commitments list', type: 'string-list' }] },
  { key: 'wp_children', label: "WP: Children's Privacy", parentKey: 'websitePrivacy', nestedKey: 'children', fields: [{ key: 'heading', label: 'Heading', type: 'text' }, { key: 'body', label: 'Body', type: 'textarea' }] },
  { key: 'wp_thirdPartyLinks', label: 'WP: Links to Other Websites', parentKey: 'websitePrivacy', nestedKey: 'thirdPartyLinks', fields: [{ key: 'heading', label: 'Heading', type: 'text' }, { key: 'body', label: 'Body', type: 'textarea' }, { key: 'body2', label: 'Body (2nd paragraph)', type: 'textarea' }] },
  { key: 'wp_changes', label: 'WP: Changes', parentKey: 'websitePrivacy', nestedKey: 'changes', fields: [{ key: 'heading', label: 'Heading', type: 'text' }, { key: 'body', label: 'Body', type: 'textarea' }, { key: 'body2', label: 'Body (2nd paragraph)', type: 'textarea' }] },
  { key: 'wp_contact', label: 'WP: Contact', parentKey: 'websitePrivacy', nestedKey: 'contact', fields: [{ key: 'heading', label: 'Heading', type: 'text' }, { key: 'body', label: 'Body', type: 'textarea' }] },
  // Cookies tab
  { key: 'cookies', label: 'Tab: Cookies', fields: [
    { key: 'heading', label: 'Overview heading', type: 'text', nestedPath: 'cookies.overview.heading' },
    { key: 'overview', label: 'Overview', type: 'textarea', nestedPath: 'cookies.overview.body' },
  ]},
  { key: 'ck_banner', label: 'CK: Cookie Banner', parentKey: 'cookies', nestedKey: 'banner', fields: [{ key: 'heading', label: 'Heading', type: 'text' }, { key: 'body', label: 'Body', type: 'textarea' }] },
  { key: 'ck_managing', label: 'CK: Managing Cookies', parentKey: 'cookies', nestedKey: 'managing', fields: [{ key: 'heading', label: 'Heading', type: 'text' }, { key: 'body', label: 'Body', type: 'textarea' }] },
  // GDPR tab
  { key: 'gdpr', label: 'Tab: GDPR & B2B', fields: [] },
  { key: 'gd_whoWeAre', label: 'GDPR: Who We Are', parentKey: 'gdpr', nestedKey: 'whoWeAre', fields: [{ key: 'heading', label: 'Heading', type: 'text' }, { key: 'body', label: 'Body', type: 'textarea' }] },
  { key: 'gd_legalBasis', label: 'GDPR: Legal Basis', parentKey: 'gdpr', nestedKey: 'legalBasis', fields: [{ key: 'heading', label: 'Heading', type: 'text' }, { key: 'body', label: 'Body', type: 'textarea' }, { key: 'body2', label: 'Body (2nd paragraph, LIA note)', type: 'textarea' }, { key: 'principles', label: 'Principles', type: 'string-list' }] },
  { key: 'gd_dataSharing', label: 'GDPR: Data Sharing', parentKey: 'gdpr', nestedKey: 'dataSharing', fields: [{ key: 'heading', label: 'Heading', type: 'text' }, { key: 'body', label: 'Body', type: 'textarea' }, { key: 'items', label: 'Sharing scenarios', type: 'string-list' }] },
  { key: 'gd_transfer', label: 'GDPR: International Transfer of Data', parentKey: 'gdpr', nestedKey: 'transfer', fields: [{ key: 'heading', label: 'Heading', type: 'text' }, { key: 'body', label: 'Body', type: 'textarea' }] },
  { key: 'gd_dataSource', label: 'GDPR: Where Does the Data Come From', parentKey: 'gdpr', nestedKey: 'dataSource', fields: [{ key: 'heading', label: 'Heading', type: 'text' }, { key: 'body', label: 'Body', type: 'textarea' }] },
  { key: 'gd_rights', label: 'GDPR: Your Rights', parentKey: 'gdpr', nestedKey: 'rights', fields: [
    { key: 'heading', label: 'Heading', type: 'text' },
    { key: 'items', label: 'Rights', type: 'string-list' },
    { key: 'rectificationHeading', label: 'Right to Rectification: Heading', type: 'text' },
    { key: 'objectHeading', label: 'Right to Object: Heading', type: 'text' },
    { key: 'accessHeading', label: 'Access to Information: Heading', type: 'text' },
  ]},
  { key: 'gd_infoCollect', label: 'GDPR: Info We Collect', parentKey: 'gdpr', nestedKey: 'infoCollect', fields: [{ key: 'heading', label: 'Heading', type: 'text' }, { key: 'body', label: 'Body', type: 'textarea' }, { key: 'items', label: 'Data types', type: 'string-list' }] },
  { key: 'gd_ico', label: 'GDPR: ICO', parentKey: 'gdpr', nestedKey: 'ico', fields: [{ key: 'heading', label: 'Heading', type: 'text' }, { key: 'body', label: 'Body', type: 'textarea' }] },
  { key: 'gd_storing', label: 'GDPR: Storing Data', parentKey: 'gdpr', nestedKey: 'storing', fields: [{ key: 'heading', label: 'Heading', type: 'text' }, { key: 'body', label: 'Body', type: 'textarea' }] },
  { key: 'gd_disclosing', label: 'GDPR: Disclosing', parentKey: 'gdpr', nestedKey: 'disclosing', fields: [{ key: 'heading', label: 'Heading', type: 'text' }, { key: 'body', label: 'Body', type: 'textarea' }, { key: 'items', label: 'Circumstances', type: 'string-list' }] },
  { key: 'gd_contact', label: 'GDPR: Contact', parentKey: 'gdpr', nestedKey: 'contact', fields: [{ key: 'heading', label: 'Heading', type: 'text' }, { key: 'body', label: 'Body', type: 'textarea' }] },
  // Campaign tab
  { key: 'campaign', label: 'Tab: Campaign Policy', fields: [
    { key: 'intro', label: 'Introduction text', type: 'textarea' },
  ]},
  { key: 'cp_legalBasis', label: 'CP: Legal Basis', parentKey: 'campaign', nestedKey: 'legalBasis', fields: [{ key: 'heading', label: 'Heading', type: 'text' }, { key: 'body', label: 'Body', type: 'textarea' }, { key: 'principles', label: 'Principles', type: 'string-list' }] },
  { key: 'cp_dataSharing', label: 'CP: Data Sharing', parentKey: 'campaign', nestedKey: 'dataSharing', fields: [{ key: 'heading', label: 'Heading', type: 'text' }, { key: 'body', label: 'Body', type: 'textarea' }, { key: 'items', label: 'Sharing with', type: 'string-list' }] },
  { key: 'cp_transfer', label: 'CP: Transfer', parentKey: 'campaign', nestedKey: 'transfer', fields: [{ key: 'heading', label: 'Heading', type: 'text' }, { key: 'body', label: 'Body', type: 'textarea' }] },
  { key: 'cp_dataSource', label: 'CP: Data Source', parentKey: 'campaign', nestedKey: 'dataSource', fields: [{ key: 'heading', label: 'Heading', type: 'text' }, { key: 'body', label: 'Body', type: 'textarea' }] },
  { key: 'cp_rights', label: 'CP: Your Rights', parentKey: 'campaign', nestedKey: 'rights', fields: [
    { key: 'heading', label: 'Heading', type: 'text' },
    { key: 'items', label: 'Rights', type: 'string-list' },
    { key: 'rectificationHeading', label: 'Right to Rectification: Heading', type: 'text' },
    { key: 'objectHeading', label: 'Right to Object: Heading', type: 'text' },
    { key: 'accessHeading', label: 'Access to Information: Heading', type: 'text' },
  ]},
  { key: 'cp_infoCollect', label: 'CP: Info Collected', parentKey: 'campaign', nestedKey: 'infoCollect', fields: [{ key: 'heading', label: 'Heading', type: 'text' }, { key: 'body', label: 'Body', type: 'textarea' }, { key: 'items', label: 'Data types', type: 'string-list' }] },
  { key: 'cp_ico', label: 'CP: ICO', parentKey: 'campaign', nestedKey: 'ico', fields: [{ key: 'heading', label: 'Heading', type: 'text' }, { key: 'body', label: 'Body', type: 'textarea' }] },
  { key: 'cp_storing', label: 'CP: Storing Data', parentKey: 'campaign', nestedKey: 'storing', fields: [{ key: 'heading', label: 'Heading', type: 'text' }, { key: 'body', label: 'Body', type: 'textarea' }] },
  { key: 'cp_thirdParty', label: 'CP: Third Party Links', parentKey: 'campaign', nestedKey: 'thirdParty', fields: [{ key: 'heading', label: 'Heading', type: 'text' }, { key: 'body', label: 'Body', type: 'textarea' }] },
  { key: 'cp_contact', label: 'CP: Contact', parentKey: 'campaign', nestedKey: 'contact', fields: [{ key: 'heading', label: 'Heading', type: 'text' }, { key: 'body', label: 'Body', type: 'textarea' }] },
  STRUCTURED_DATA_SECTION,
];
