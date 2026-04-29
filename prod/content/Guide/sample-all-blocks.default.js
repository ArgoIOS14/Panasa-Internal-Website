window.DEFAULT_GUIDE_CONTENT = {
    "meta": {
        "title": "Sample Guide: All Block Types",
        "description": "A test guide exercising intro, numbered sections, callouts, notes (3 variants), subheadings, and YouTube.",
        "canonical": "https://www.panasatech.com/guides/sample-all-blocks",
        "ogImage": "https://www.panasatech.com/assets/blog-hero-desktop.webp"
    },
    "slug": "sample-all-blocks",
    "category": "Guide",
    "tag": "GUIDE",
    "title": "Sample Guide to Block Types",
    "titleHighlight": "Block Types",
    "description": "A comprehensive walkthrough of every supported body block in the new admin CMS.",
    "tocHeading": "On this page",
    "date": "27 APR 2026",
    "datePublished": "2026-04-27",
    "dateModified": "2026-04-27",
    "readTime": "8 MINS READ",
    "author": "Panasa Team",
    "tags": [
        "Guide",
        "Blocks",
        "Reference"
    ],
    "heroImage": "../assets/blog-hero-desktop.webp",
    "heroImageTablet": "../assets/blog-hero-tablet.webp",
    "heroImageMobile": "../assets/blog-hero-mobile.webp",
    "heroImageAlt": "Sample guide hero",
    "introduction": {
        "heading": "Introduction",
        "blocks": [
            {
                "type": "html",
                "content": "<p>This is the introduction. Below are numbered sections with every block kind a guide can host.</p>"
            },
            {
                "type": "callout",
                "title": "Quick reminder",
                "text": "Guides also support intro callouts.",
                "cta": {
                    "label": "Talk to us",
                    "href": "../contact",
                    "variant": "dark"
                }
            }
        ]
    },
    "sections": [
        {
            "slug": "foundation",
            "number": 1,
            "title": "Foundation",
            "blocks": [
                {
                    "type": "subheading",
                    "text": "Subheading inside section 1"
                },
                {
                    "type": "html",
                    "content": "<p>Plain prose for section 1, with a <strong>bold</strong> emphasis.</p>"
                },
                {
                    "type": "note",
                    "variant": "key-insight",
                    "label": "KEY INSIGHT",
                    "text": "A pinned takeaway that the reader should remember."
                },
                {
                    "type": "note",
                    "variant": "practitioner",
                    "label": "PRACTITIONER NOTE",
                    "text": "A note from someone shipping this in production."
                },
                {
                    "type": "note",
                    "variant": "field",
                    "label": "FROM THE FIELD",
                    "text": "An anecdote pulled from a real engagement."
                }
            ]
        },
        {
            "slug": "in-practice",
            "number": 2,
            "title": "In Practice",
            "blocks": [
                {
                    "type": "html",
                    "content": "<p>How this looks day-to-day for a fintech operator.</p><h3>Step-by-step</h3><ol><li>Capture the requirement.</li><li>Architect the change.</li><li>Ship and observe.</li></ol>"
                },
                {
                    "type": "callout",
                    "title": "Want a live demo?",
                    "text": "Book a 30-min walk-through with our engineering team.",
                    "cta": {
                        "label": "Book a meeting",
                        "href": "../contact",
                        "variant": "dark"
                    }
                },
                {
                    "type": "youtube",
                    "videoId": "dQw4w9WgXcQ",
                    "caption": "Walk-through video"
                }
            ]
        }
    ],
    "relatedSlugs": []
};
