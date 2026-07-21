/**
 * CPD course card rendering — Milestone 9
 * Builds semantic DOM from immutable card display models only.
 */

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
    placeholder.setAttribute('aria-label', `Course image for ${card.title}`);
    media.appendChild(placeholder);
  }
  row.appendChild(media);

  const description = el('div', 'phc-directory__card-description');
  const text = el('p', 'phc-directory__card-description-text');
  text.textContent = card.description || '';
  description.appendChild(text);
  row.appendChild(description);

  return row;
}

/**
 * @param {Readonly<CpdCourseCardModel>} card
 * @returns {HTMLElement | null}
 */
function createMeta(card) {
  const meta = el('dl', 'phc-directory__card-meta');
  let hasMeta = false;

  if (card.location) {
    meta.appendChild(createMetaItem('Location', card.location));
    hasMeta = true;
  }

  if (card.classification?.primaryCategory) {
    meta.appendChild(createMetaItem('Category', card.classification.primaryCategory));
    hasMeta = true;
  }

  if (
    card.classification?.categories &&
    card.classification.categories.length > 0
  ) {
    meta.appendChild(
      createMetaItem(
        'Also listed under',
        card.classification.categories.join(', '),
      ),
    );
    hasMeta = true;
  }

  if (typeof card.classification?.cpdHours === 'number') {
    meta.appendChild(
      createMetaItem(
        'CPD hours',
        formatCpdHoursValue(card.classification.cpdHours),
      ),
    );
    hasMeta = true;
  }

  if (card.delivery?.formats && card.delivery.formats.length > 0) {
    meta.appendChild(
      createMetaItem('Format', card.delivery.formats.join(', ')),
    );
    hasMeta = true;
  }

  if (card.delivery?.scheduleType) {
    meta.appendChild(createMetaItem('Schedule type', card.delivery.scheduleType));
    hasMeta = true;
  }

  if (card.delivery?.nextStart) {
    const iso = isoDateAttribute(card.delivery.nextStart);
    if (iso) {
      const time = el('time');
      time.setAttribute('datetime', iso);
      time.textContent = card.delivery.nextStart;
      meta.appendChild(createMetaItem('Next start', time));
    } else {
      meta.appendChild(createMetaItem('Next start', card.delivery.nextStart));
    }
    hasMeta = true;
  }

  if (card.delivery?.scheduleDescription) {
    meta.appendChild(
      createMetaItem('Schedule', card.delivery.scheduleDescription),
    );
    hasMeta = true;
  }

  return hasMeta ? meta : null;
}

/**
 * @param {Readonly<CpdCourseCardModel>} card
 * @returns {HTMLElement}
 */
function createFooter(card) {
  const footer = el('div', 'phc-directory__card-footer');

  const actions = el('div', 'phc-directory__card-actions');
  if (card.courseUrl) {
    const link = el('a', 'phc-directory__card-link');
    link.setAttribute('href', card.courseUrl);
    link.textContent = 'Course information and registration';
    actions.appendChild(link);
  }

  const idRef = el('p', 'phc-directory__card-id');
  idRef.textContent = `Ref. ${card.id}`;
  actions.appendChild(idRef);
  footer.appendChild(actions);

  if (card.qrCodeUrl) {
    const qr = el('figure', 'phc-directory__card-qr');
    qr.appendChild(
      createImage(
        card.qrCodeUrl,
        `QR code for ${card.title}`,
        'phc-directory__card-qr-image',
      ),
    );
    footer.appendChild(qr);
  }

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

  const meta = createMeta(card);
  if (meta) {
    article.appendChild(meta);
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
  heading.textContent = 'CPD courses';
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
