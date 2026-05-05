/**
 * Shared "Structured Data (Schema.org)" section spread into every page schema.
 *
 * Backend: `dev/api/rebuild/StructuredDataApplier.php` consumes
 * `data.structuredData = { faq: [...], customJsonLd: '...' }` and emits
 * matching JSON-LD blocks in the page <head>. The Article + BreadcrumbList
 * shapes are auto-derived (the article rebuild populates structuredData.article
 * from title/author/dates; BreadcrumbList comes from the canonical URL path).
 *
 * Section structure: data.structuredData is the parent object. faq and
 * customJsonLd are nested fields.
 */
export const STRUCTURED_DATA_SECTION = {
  key: 'structuredData',
  label: 'Structured Data (Schema.org)',
  fields: [
    { key: 'faq', label: 'FAQPage entries', type: 'faq-pairs',
      help: 'Q&A pairs that get exposed to Google as a FAQPage block. If you add at least one entry, the page may show "rich results" in Google search with expandable Q&A previews. Leave empty if the page is not Q&A-focused.' },

    { key: 'customJsonLd', label: 'Custom JSON-LD (advanced)', type: 'json-ld-textarea',
      advancedOnly: true,
      help: 'Paste any valid JSON-LD object here for Schema.org shapes not covered by the form (HowTo, Product, JobPosting, Event, etc.). The block is emitted verbatim into <head>. Validation: must parse as JSON; otherwise it is silently dropped on save.' },
  ],
};
