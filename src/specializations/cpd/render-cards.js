/**
 * CPD course card rendering — Milestone 18
 * Builds semantic DOM from immutable card display models only.
 * Presentation hierarchy: title → description → metadata → CTA → WB metric → footer.
 */

import { cpdDirectoryCopy } from './copy.js';
import { formatSwissDateLong } from './normalize.js';

/**
 * @typedef {import('./presentation.js').CpdCourseCardModel} CpdCourseCardModel
 */

/**
 * @param {string} tag
 * @param {string} [className]
 * @returns {HTMLElement}
 */
function el(tag, className) {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  return node;
}

/**
 * @param {string} value
 * @returns {string | null}
 */
function isoDateAttribute(value) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  return null;
}

/**
 * @param {number} hours
 * @returns {string}
 */
function formatCpdHoursValue(hours) {
  return Number.isInteger(hours) ? String(hours) : String(hours);
}

/**
 * @param {string} term
 * @param {HTMLElement | string} description
 * @returns {HTMLElement}
 */
function createMetaItem(term, description) {
  const item = el('div', 'phc-directory__card-meta-item');
  const dt = el('dt', 'phc-directory__card-meta-term');
  dt.textContent = term;
  const dd = el('dd', 'phc-directory__card-meta-value');
  if (typeof description === 'string') {
    dd.textContent = description;
  } else {
    dd.appendChild(description);
  }
  item.appendChild(dt);
  item.appendChild(dd);
  return item;
}

/**
 * @param {string} src
 * @param {string} alt
 * @param {string} className
 * @returns {HTMLElement}
 */
function createImage(src, alt, className) {
  const img = el('img', className);
  img.setAttribute('src', src);
  img.setAttribute('alt', alt);
  img.setAttribute('loading', 'lazy');
  img.setAttribute('decoding', 'async');
  return img;
}

/**
 * @param {Readonly<CpdCourseCardModel>} card
 * @returns {HTMLElement}
 */
function createProviderRow(card) {
  const row = el('div', 'phc-directory__card-provider-row');

  if (card.provider.logoUrl) {
    row.appendChild(
      createImage(
        card.provider.logoUrl,
        '',
        'phc-directory__card-provider-logo',
      ),
    );
  }

  const name = el('p', 'phc-directory__card-provider-name');
  if (card.provider.websiteUrl) {
    const link = el('a', 'phc-directory__card-provider-link');
    link.setAttribute('href', card.provider.websiteUrl);
    link.textContent = card.provider.name;
    name.appendChild(link);
  } else {
    name.textContent = card.provider.name;
  }
  row.appendChild(name);

  return row;
}

/**
 * @param {Readonly<CpdCourseCardModel>} card
 * @returns {HTMLElement}
 */
function createMediaDescriptionRow(card) {
  const row = el('div', 'phc-directory__card-media-row');

  const media = el('figure', 'phc-directory__card-media');
  if (card.imageUrl) {
    media.appendChild(
      createImage(card.imageUrl, card.title, 'phc-directory__card-photo'),
    );
  } else {
    const placeholder = el('div', 'phc-directory__card-photo-placeholder');
    placeholder.setAttribute('role', 'img');
    placeholder.setAttribute(
      'aria-label',
      cpdDirectoryCopy.courseImageAlt(card.title),
    );
    media.appendChild(placeholder);
  }
  row.appendChild(media);

  const description = el('div', 'phc-directory__card-description');

  if (card.description) {
    const text = el('p', 'phc-directory__card-description-text');
    text.textContent = card.description;
    description.appendChild(text);
  }

  if (card.fullDescription) {
    const details = el('details', 'phc-directory__card-full-description');
    const summary = el('summary', 'phc-directory__card-full-description-toggle');
    summary.textContent = cpdDirectoryCopy.readMore;
    details.appendChild(summary);

    const full = el('p', 'phc-directory__card-full-description-text');
    full.textContent = card.fullDescription;
    details.appendChild(full);
    description.appendChild(details);
  }

  row.appendChild(description);

  return row;
}

/**
 * Identity column: what / where the course belongs.
 * @param {Readonly<CpdCourseCardModel>} card
 * @returns {HTMLElement | null}
 */
function createIdentityMeta(card) {
  const meta = el(
    'dl',
    'phc-directory__card-meta phc-directory__card-meta--identity',
  );
  let hasMeta = false;

  if (card.location) {
    meta.appendChild(createMetaItem(cpdDirectoryCopy.location, card.location));
    hasMeta = true;
  }

  if (card.classification?.primaryCategory) {
    meta.appendChild(
      createMetaItem(
        cpdDirectoryCopy.category,
        card.classification.primaryCategory,
      ),
    );
    hasMeta = true;
  }

  if (
    card.classification?.alsoListedUnder &&
    card.classification.alsoListedUnder.length > 0
  ) {
    meta.appendChild(
      createMetaItem(
        cpdDirectoryCopy.alsoListedUnder,
        card.classification.alsoListedUnder.join(', '),
      ),
    );
    hasMeta = true;
  }

  if (card.delivery?.nextStart) {
    const iso = isoDateAttribute(card.delivery.nextStart);
    const display = formatSwissDateLong(card.delivery.nextStart);
    if (iso) {
      const time = el('time');
      time.setAttribute('datetime', iso);
      time.textContent = display;
      meta.appendChild(createMetaItem(cpdDirectoryCopy.nextStart, time));
    } else {
      meta.appendChild(createMetaItem(cpdDirectoryCopy.nextStart, display));
    }
    hasMeta = true;
  }

  return hasMeta ? meta : null;
}

/**
 * Delivery column: how the course is delivered, plus WB metric.
 * @param {Readonly<CpdCourseCardModel>} card
 * @returns {HTMLElement | null}
 */
function createDeliveryColumn(card) {
  const column = el('div', 'phc-directory__card-delivery');
  let hasContent = false;

  const meta = el(
    'dl',
    'phc-directory__card-meta phc-directory__card-meta--delivery',
  );
  let hasMeta = false;

  if (card.delivery?.formats && card.delivery.formats.length > 0) {
    meta.appendChild(
      createMetaItem(
        cpdDirectoryCopy.format,
        card.delivery.formats.join(', '),
      ),
    );
    hasMeta = true;
  }

  if (card.delivery?.scheduleDescription) {
    meta.appendChild(
      createMetaItem(
        cpdDirectoryCopy.schedule,
        card.delivery.scheduleDescription,
      ),
    );
    hasMeta = true;
  }

  if (card.delivery?.scheduleType) {
    meta.appendChild(
      createMetaItem(cpdDirectoryCopy.scheduleType, card.delivery.scheduleType),
    );
    hasMeta = true;
  }

  if (hasMeta) {
    column.appendChild(meta);
    hasContent = true;
  }

  if (typeof card.classification?.cpdHours === 'number') {
    const hours = el('div', 'phc-directory__card-hours');
    const term = el('p', 'phc-directory__card-hours-label');
    term.textContent = cpdDirectoryCopy.cpdHours;
    const value = el('p', 'phc-directory__card-hours-value');
    value.textContent = formatCpdHoursValue(card.classification.cpdHours);
    hours.appendChild(term);
    hours.appendChild(value);
    column.appendChild(hours);
    hasContent = true;
  }

  if (card.qrCodeUrl) {
    const qr = el('figure', 'phc-directory__card-qr');
    qr.appendChild(
      createImage(
        card.qrCodeUrl,
        cpdDirectoryCopy.qrCodeAlt(card.title),
        'phc-directory__card-qr-image',
      ),
    );
    column.appendChild(qr);
    hasContent = true;
  }

  return hasContent ? column : null;
}

/**
 * @param {Readonly<CpdCourseCardModel>} card
 * @returns {HTMLElement | null}
 */
function createCourseCta(card) {
  if (!card.courseUrl) {
    return null;
  }
  const link = el('a', 'phc-directory__card-cta');
  link.setAttribute('href', card.courseUrl);
  link.textContent = cpdDirectoryCopy.courseCta;
  return link;
}

/**
 * Details grid: identity | delivery, with CTA as a separate cell so desktop
 * can pin it under the left column and mobile can place it after both groups.
 * @param {Readonly<CpdCourseCardModel>} card
 * @returns {HTMLElement | null}
 */
function createCardDetails(card) {
  const identity = createIdentityMeta(card);
  const delivery = createDeliveryColumn(card);
  const cta = createCourseCta(card);

  if (!identity && !delivery && !cta) {
    return null;
  }

  const details = el('div', 'phc-directory__card-details');
  if (identity) {
    details.appendChild(identity);
  }
  if (delivery) {
    details.appendChild(delivery);
  }
  if (cta) {
    details.appendChild(cta);
  }
  return details;
}

/**
 * Quiet administrative footer: sheet reference + WB footnote when hours exist.
 * @param {Readonly<CpdCourseCardModel>} card
 * @returns {HTMLElement}
 */
function createFooter(card) {
  const footer = el('div', 'phc-directory__card-footer');

  const idRef = el('p', 'phc-directory__card-id');
  idRef.textContent = cpdDirectoryCopy.courseRef(card.id);
  footer.appendChild(idRef);

  const footnote = el('p', 'phc-directory__card-hours-footnote');
  if (typeof card.classification?.cpdHours === 'number') {
    footnote.textContent = cpdDirectoryCopy.wbHoursFootnote;
  } else {
    footnote.textContent = '';
  }
  footer.appendChild(footnote);

  return footer;
}

/**
 * @param {Readonly<CpdCourseCardModel>} card
 * @returns {HTMLElement}
 */
export function createCpdCourseCard(card) {
  const article = el('article', 'phc-directory__card');
  article.setAttribute('data-phc-course-id', card.id);

  article.appendChild(createProviderRow(card));

  const title = el('h3', 'phc-directory__card-title');
  title.textContent = card.title;
  article.appendChild(title);

  article.appendChild(createMediaDescriptionRow(card));

  const details = createCardDetails(card);
  if (details) {
    article.appendChild(details);
  }

  article.appendChild(createFooter(card));

  return article;
}

/**
 * @param {readonly Readonly<CpdCourseCardModel>[]} cards
 * @returns {HTMLElement}
 */
export function createCpdCourseCardList(cards) {
  const section = el('section', 'phc-directory__results');
  section.setAttribute('aria-labelledby', 'phc-directory-results-heading');

  const heading = el('h2', 'phc-directory__results-heading');
  heading.id = 'phc-directory-results-heading';
  heading.textContent = cpdDirectoryCopy.resultsHeading;
  section.appendChild(heading);

  const list = el('ul', 'phc-directory__card-list');

  cards.forEach((card) => {
    const item = el('li', 'phc-directory__card-item');
    item.appendChild(createCpdCourseCard(card));
    list.appendChild(item);
  });

  section.appendChild(list);
  return section;
}
