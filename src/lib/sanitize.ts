import sanitizeHtml from 'sanitize-html';

/**
 * Sanitizes rich-text HTML (Tiptap output) before it is stored and later
 * rendered with dangerouslySetInnerHTML on the public site. Even though only
 * admins author content, this is defense-in-depth against stored XSS.
 */
const options: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'a', 'h2', 'h3', 'h4',
    'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'img', 'hr', 'span',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    span: ['style'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  // Only allow https images (Cloudinary) — blocks javascript:/data: payloads.
  allowedSchemesByTag: { img: ['https'] },
  transformTags: {
    // Force safe rel on links that open new tabs.
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        ...(attribs.target === '_blank' ? { rel: 'noopener noreferrer' } : {}),
      },
    }),
  },
  allowedStyles: {
    span: { 'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/] },
  },
};

export function sanitizeRichText(html: string | undefined | null): string {
  if (!html) return '';
  return sanitizeHtml(html, options);
}
