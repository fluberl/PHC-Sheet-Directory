/**
 * CPD chronological list rendering — Milestone 11
 * Compact schedule view from card display models only.
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
 * @param {number | undefined} hours
 * @returns {string}
 */
function formatCredits(hours) {
  if (typeof hours !== 'number' || !Number.isFinite(hours)) {
    return '—';
  }
  return Number.isInteger(hours) ? String(hours) : String(hours);
}

/**
 * @param {string | undefined} value
 * @returns {string}
 */
function displayOrDash(value) {
  return typeof value === 'string' && value.trim() !== '' ? value : '—';
}

/**
 * @param {Readonly<CpdCourseCardModel>} card
 * @returns {HTMLElement}
 */
function createCourseCell(card) {
  const cell = el('td', 'phc-directory__schedule-course');
  if (card.courseUrl) {
    const link = el('a', 'phc-directory__schedule-course-link');
    link.setAttribute('href', card.courseUrl);
    link.textContent = card.title;
    cell.appendChild(link);
  } else {
    cell.textContent = card.title;
  }

  if (card.provider?.name) {
    const provider = el('div', 'phc-directory__schedule-provider');
    provider.textContent = card.provider.name;
    cell.appendChild(provider);
  }

  return cell;
}

/**
 * @param {readonly Readonly<CpdCourseCardModel>[]} cards
 * @returns {HTMLElement}
 */
export function createCpdChronologicalList(cards) {
  const section = el('section', 'phc-directory__results phc-directory__results--schedule');
  section.setAttribute('aria-labelledby', 'phc-directory-results-heading');

  const heading = el('h2', 'phc-directory__results-heading');
  heading.id = 'phc-directory-results-heading';
  heading.textContent = 'CPD schedule';
  section.appendChild(heading);

  const wrapper = el('div', 'phc-directory__schedule-wrap');
  const table = el('table', 'phc-directory__schedule');
  table.setAttribute('role', 'table');

  const thead = el('thead');
  const headerRow = el('tr');
  ['Date', 'Course', 'PHC-CPD Number', 'Category', 'CPD Credits'].forEach((label) => {
    const th = el('th', 'phc-directory__schedule-heading');
    th.setAttribute('scope', 'col');
    th.textContent = label;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = el('tbody');
  cards.forEach((card) => {
    const row = el('tr', 'phc-directory__schedule-row');
    row.setAttribute('data-phc-course-id', card.id);

    const dateCell = el('td', 'phc-directory__schedule-date');
    const nextStart = card.delivery?.nextStart;
    if (typeof nextStart === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(nextStart)) {
      const time = el('time');
      time.setAttribute('datetime', nextStart);
      time.textContent = nextStart;
      dateCell.appendChild(time);
    } else {
      dateCell.textContent = displayOrDash(nextStart);
    }
    row.appendChild(dateCell);
    row.appendChild(createCourseCell(card));

    const idCell = el('td', 'phc-directory__schedule-id');
    idCell.textContent = card.id;
    row.appendChild(idCell);

    const categoryCell = el('td', 'phc-directory__schedule-category');
    categoryCell.textContent = displayOrDash(card.classification?.primaryCategory);
    row.appendChild(categoryCell);

    const creditsCell = el('td', 'phc-directory__schedule-credits');
    creditsCell.textContent = formatCredits(card.classification?.cpdHours);
    row.appendChild(creditsCell);

    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  wrapper.appendChild(table);
  section.appendChild(wrapper);
  return section;
}
