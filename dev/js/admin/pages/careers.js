import { SEO_META_EXTRAS } from './seoMetaFields.js';
import { STRUCTURED_DATA_SECTION } from './structuredDataSection.js';

export const fbPath = 'pages/careers';

export const defaults = {
  meta: {
    title: 'Careers | Panasa',
    description: 'Join a team that builds secure, scalable payment infrastructure used by modern fintech platforms. Work on real-world systems and grow your career in fintech.',
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
    title: 'Build the Future of Fintech',
    titleEmphasis: 'with Panasa',
    subtitle: 'Join a team that builds secure, scalable payment infrastructure used by modern fintech platforms. Work on real-world systems, solve complex engineering challenges, and grow your career in fintech.',
    teamPhoto: 'Team Photo.webp',
  },
  roles: {
    heading: 'Careers at Panasa Technology',
    jobs: [
      { title: 'Marketing Manager', jobId: '304330', department: 'Marketing', locationType: 'In-Office', location: 'Kochi, Kerala, India', experience: '4 - 9 years' },
      { title: 'Workforce Planner', jobId: '794330', department: '', locationType: 'Remote', location: 'India', experience: '5 - 8 years' },
      { title: 'Senior AI Artist / AI Generative Production Specialist', jobId: '234557', department: 'Marketing', locationType: 'In-Office', location: 'Kochi, Kerala, India', experience: '3 - 8 years' },
      { title: 'Marketing Intern', jobId: '123558', department: 'Marketing', locationType: '', location: 'Kochi, Kerala, India', experience: '0 - 1 years' },
      { title: 'Jr. Marketing Manager', jobId: '245108', department: 'Marketing', locationType: 'Remote', location: 'India', experience: '1 - 3 years' },
      { title: 'Creative Producer', jobId: '129901', department: 'Marketing', locationType: 'In-Office', location: 'Kochi, Kerala, India', experience: '3 - 8 years' },
    ],
  },
};

export const sections = [
  { key: 'meta', label: 'SEO Meta', fields: [
    { key: 'title', label: 'Meta title', type: 'text' },
    { key: 'description', label: 'Meta description', type: 'textarea' },
    ...SEO_META_EXTRAS,
  ]},
  { key: 'hero', label: 'Hero Section', fields: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'titleEmphasis', label: 'Title emphasis', type: 'text' },
    { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
    { key: 'teamPhoto', label: 'Team photo', type: 'image' },
  ]},
  { key: 'roles', label: 'Open Roles', fields: [
    { key: 'heading', label: 'Section heading', type: 'text' },
    { key: 'jobs', label: 'Job listings', type: 'job-cards' },
  ]},
  STRUCTURED_DATA_SECTION,
];
