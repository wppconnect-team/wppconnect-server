// Identifier suffixes the server is able to produce. A suffix supplied by the
// caller is authoritative: WhatsApp already resolves LID identifiers, so
// dropping it and re-deriving the domain rewrites them as phone numbers.
const CONTACT_DOMAINS = ['c.us', 'g.us', 'lid', 'newsletter'];

/**
 * Splits an identifier into its local part and, when recognized, its domain.
 */
function splitContact(contact: string) {
  const [local, domain] = contact.split('@');
  return { local, domain: CONTACT_DOMAINS.includes(domain) ? domain : '' };
}

export function contactToArray(
  number: any,
  isGroup?: boolean,
  isNewsletter?: boolean,
  isLid?: boolean
) {
  const localArr: any = [];
  const arrContacts = Array.isArray(number)
    ? number
    : number.split(/\s*[,;]\s*/g);

  for (const contact of arrContacts) {
    const { local, domain } = splitContact(contact);
    // Group and newsletter identifiers are numeric-only; other contacts also
    // accept formatted numbers such as "+55 (11) 99999-9999".
    const normalized =
      isGroup || isNewsletter ? local : local?.replace(/[^\w ]/g, '');
    if (normalized !== '') {
      // An explicit flag wins, then a suffix the caller already provided, and
      // only then the length heuristic that guesses LID from a bare number.
      const suffix = isGroup
        ? 'g.us'
        : isNewsletter
        ? 'newsletter'
        : isLid
        ? 'lid'
        : domain || (normalized.length > 14 ? 'lid' : 'c.us');
      localArr.push(`${normalized}@${suffix}`);
    }
  }

  return localArr;
}
