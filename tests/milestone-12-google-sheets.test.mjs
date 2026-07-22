/**
 * Milestone 12 tests — Google Sheets CSV datasource + PUBLIC mapping policy.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { getConfig } from '../src/config/config.js';
import { PHC_PUBLIC_CPD_CSV_URL } from '../src/config/phc-public-cpd.js';
import { resolvePublicAcquisitionUrl } from '../src/data/google-sheets.js';
import { parseCsvObjects } from '../src/data/parse-csv.js';
import { fetchPublic } from '../src/data/source.js';
import {
  coerceNextStartIso,
  isPublishedPublicRow,
  mapPublicRowsToCpdCourses,
  normalizePublicUrl,
} from '../src/specializations/cpd/index.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

console.log('Running Milestone 12 Google Sheets integration tests…');

// --- production source wiring ---
{
  const config = getConfig();
  assert(
    config.publicSource === PHC_PUBLIC_CPD_CSV_URL,
    'config defaults to published Sheets CSV',
  );
  assert(
    resolvePublicAcquisitionUrl(PHC_PUBLIC_CPD_CSV_URL) === PHC_PUBLIC_CPD_CSV_URL,
    'published CSV URL left unchanged',
  );
  assert(
    PHC_PUBLIC_CPD_CSV_URL.includes('output=csv'),
    'production source is CSV publish URL',
  );
}

// --- CSV section header + mapping ---
{
  const csv = `ANBIETER,,,WEITERBILDUNG
Name des Anbieters,Website des Anbieters,Logo des Anbieters,PHC-CPD-ID,Vollständiger Titel,Kurztitel,Kurzbeschreibung,Ausführliche Beschreibung,Veranstaltungsort,Anrechenbare Weiterbildungsstunden (CPD),Bild der Weiterbildung,QR-Code (optional),Primärkategorie,Weitere Kategorien,Unterrichtssprache,Durchführungsformat,Terminart,Nächster Start,Durchführung / Zeitplan,Kursseite / Anmeldung,Veröffentlicht
Provider A,example.org,,PHC-CPD-100,Title A,Short A,Summary A,Desc A,Zürich,8,,,Coaching,Stress,DE,Präsenz,Einmalig,16.10.2026,One day,https://example.org/a,Ja
Provider B,https://example.org/b,,PHC-CPD-101,Title B,Short B,Summary B,Desc B,Bern,bad,,,Kommunikation,,EN,Online,Einmalig,03.08.2026 / 29.08.2026,,https://example.org/b,Nein
,, ,PHC-CPD-102,,,,,, ,,,,,,,,
Provider C,fuehren-und-folgen.ch,https://drive.google.com/open?id=abc123,PHC-CPD-103,Title C,Short C,Summary C,Desc C,Basel,2,,,Unknown Domain,,,Präsenz,Einmalig,01.09.2026,,fuehren-und-folgen.ch/course,Yes
`;

  const rows = parseCsvObjects(csv);
  assert(rows.length === 4, 'four data rows after section header');
  assert(rows[0]['PHC-CPD-ID'] === 'PHC-CPD-100', 'first id');
  assert(rows[0]['Name des Anbieters'] === 'Provider A', 'provider mapped');

  assert(isPublishedPublicRow(rows[0]) === true, 'explicit Ja published');
  assert(isPublishedPublicRow(rows[1]) === false, 'explicit Nein unpublished');
  assert(isPublishedPublicRow(rows[3]) === true, 'Yes published');

  const courses = mapPublicRowsToCpdCourses(rows);
  assert(courses.length === 2, 'unpublished and incomplete skipped');
  assert(courses[0].course.id === 'PHC-CPD-100', 'first kept');
  assert(courses[1].course.id === 'PHC-CPD-103', 'third incomplete skipped, Yes kept');
  assert(courses[0].delivery.nextStart === '2026-10-16', 'German date coerced');
  assert(
    courses[0].provider.websiteUrl === 'https://example.org',
    'bare domain normalized',
  );
  assert(
    courses[1].provider.logoUrl ===
      'https://lh3.googleusercontent.com/d/abc123=w1000',
    'drive logo normalized',
  );
  assert(courses[0].course.languages.join('|') === 'DE', 'language mapped');
  assert(courses[1].course.cpdHours === 2, 'hours ok');
  assert(
    courses.find((course) => course.course.id === 'PHC-CPD-101') == null,
    'unpublished excluded',
  );
}

// --- helpers ---
{
  assert(coerceNextStartIso('03.08.2026 / 29.08.2026') === '2026-08-03', 'earliest');
  assert(coerceNextStartIso('2026-09-01') === '2026-09-01', 'iso passthrough');
  assert(
    normalizePublicUrl('https://drive.google.com/open?id=xyz') ===
      'https://lh3.googleusercontent.com/d/xyz=w1000',
    'drive open',
  );
  assert(
    normalizePublicUrl('drive.google.com/open?id=xyz') ===
      'https://lh3.googleusercontent.com/d/xyz=w1000',
    'drive open without scheme',
  );
}

// --- fetchPublic JSON still works; CSV decode works ---
{
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url) => {
      const target = String(url);
      if (target.includes('sample-public.json')) {
        const body = readFileSync(
          join(root, 'examples/public/sample-public.json'),
          'utf8',
        );
        return {
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          text: async () => body,
          json: async () => JSON.parse(body),
        };
      }
      if (target.includes('output=csv') || target.includes('fake-sheet.csv')) {
        return {
          ok: true,
          status: 200,
          headers: { get: () => 'text/csv' },
          text: async () =>
            'Name des Anbieters,PHC-CPD-ID,Vollständiger Titel\nA,PHC-CPD-9,Title Nine\n',
        };
      }
      if (target.includes('network-fail')) {
        throw new Error('offline');
      }
      return { ok: false, status: 500, headers: { get: () => '' }, text: async () => '' };
    };

    const jsonResult = await fetchPublic({
      publicSource: 'https://example.test/sample-public.json',
    });
    assert(jsonResult.ok === true, 'json acquisition');
    assert(Array.isArray(jsonResult.payload) && jsonResult.payload.length >= 1, 'json rows');

    const csvResult = await fetchPublic({
      publicSource: PHC_PUBLIC_CPD_CSV_URL,
    });
    assert(csvResult.ok === true, 'csv acquisition via sheets url');
    assert(csvResult.payload[0]['PHC-CPD-ID'] === 'PHC-CPD-9', 'csv objects');

    const failed = await fetchPublic({ publicSource: 'https://example.test/network-fail' });
    assert(failed.ok === false, 'friendly failure without cache');
    assert(
      String(failed.message).includes('konnte derzeit nicht geladen werden'),
      'friendly message',
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
}

// --- fixture regression path still maps ---
{
  const fixture = JSON.parse(
    readFileSync(join(root, 'examples/public/sample-public.json'), 'utf8'),
  );
  const courses = mapPublicRowsToCpdCourses(fixture);
  assert(courses.length === fixture.length, 'fixture rows still map');
}

console.log('All Milestone 12 Google Sheets integration tests passed.');
