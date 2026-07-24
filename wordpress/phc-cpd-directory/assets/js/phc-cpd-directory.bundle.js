(() => {
  // src/config/phc-public-cpd.js
  var PHC_PUBLIC_CPD_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRBPgalMWq6fNZXfT-FhP-U-ais1GIT2Cx6gtUOX4eWlaaaZCioon8YoeNQDnxhtsCeQpDpO5PRoCWD/pub?gid=0&single=true&output=csv";
  function getPhcPublicCpdSource() {
    return PHC_PUBLIC_CPD_CSV_URL;
  }

  // src/config/config.js
  function getConfig() {
    return Object.freeze({
      mountSelector: "#phc-cpd-directory",
      publicSource: getPhcPublicCpdSource()
    });
  }

  // src/host/mount.js
  function getMountRoot(selector) {
    if (typeof selector !== "string" || selector.trim() === "") {
      return {
        ok: false,
        message: "Host Contract: mount selector is missing or invalid."
      };
    }
    const root = document.querySelector(selector);
    if (!root) {
      return {
        ok: false,
        message: `Host Contract: mount root not found for selector "${selector}". The directory application will not start.`
      };
    }
    return { ok: true, root };
  }

  // src/domain/accessors.js
  function createRecordAccessors(accessors) {
    if (typeof (accessors == null ? void 0 : accessors.getId) !== "function" || typeof (accessors == null ? void 0 : accessors.getTitle) !== "function") {
      throw new Error("Record accessors require getId and getTitle functions.");
    }
    const created = {
      getId: accessors.getId,
      getTitle: accessors.getTitle
    };
    if (typeof accessors.getSearchableText === "function") {
      created.getSearchableText = accessors.getSearchableText;
    }
    if (typeof accessors.getPrimaryCategoryId === "function") {
      created.getPrimaryCategoryId = accessors.getPrimaryCategoryId;
    }
    if (typeof accessors.getCategoryIds === "function") {
      created.getCategoryIds = accessors.getCategoryIds;
    }
    return Object.freeze(created);
  }
  var flatRecordAccessors = createRecordAccessors({
    getId(entry) {
      if (entry === null || typeof entry !== "object" || typeof entry.id !== "string") {
        throw new Error("Flat record accessor expected entry.id string.");
      }
      return entry.id;
    },
    getTitle(entry) {
      if (entry === null || typeof entry !== "object" || typeof entry.title !== "string") {
        throw new Error("Flat record accessor expected entry.title string.");
      }
      return entry.title;
    }
  });
  function projectIdTitleResults(searchResult, accessors) {
    return Object.freeze(
      searchResult.getAll().map(
        (entry) => Object.freeze({
          id: accessors.getId(entry),
          title: accessors.getTitle(entry)
        })
      )
    );
  }

  // src/search/result.js
  function createSearchResult(entries) {
    if (!Array.isArray(entries)) {
      throw new Error("SearchResult creation failed: expected an array of Domain Entries.");
    }
    const ordered = [];
    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index];
      if (entry === null || typeof entry !== "object") {
        throw new Error(
          `SearchResult creation failed at entry ${index + 1}: expected a Domain Entry.`
        );
      }
      ordered.push(entry);
    }
    const frozenEntries = Object.freeze(ordered.slice());
    return Object.freeze({
      get size() {
        return frozenEntries.length;
      },
      getAll() {
        return frozenEntries;
      }
    });
  }

  // src/search/search.js
  function normalizeSearchText(text) {
    if (typeof text !== "string") {
      return "";
    }
    return text.trim();
  }
  function normalizeCategoryId(categoryId) {
    if (typeof categoryId !== "string") {
      return "";
    }
    return categoryId.trim();
  }
  function assertCatalog(catalog) {
    if (catalog === null || typeof catalog !== "object" || typeof catalog.getAll !== "function" || typeof catalog.size !== "number") {
      throw new Error("searchCatalog failed: expected a Catalog.");
    }
  }
  function searchableTextFor(entry, accessors) {
    if (typeof accessors.getSearchableText === "function") {
      const text = accessors.getSearchableText(entry);
      return typeof text === "string" ? text : "";
    }
    const title = accessors.getTitle(entry);
    return typeof title === "string" ? title : "";
  }
  function entryMatchesCategory(entry, categoryId, accessors) {
    if (typeof accessors.getCategoryIds === "function") {
      const ids = accessors.getCategoryIds(entry);
      return Array.isArray(ids) && ids.includes(categoryId);
    }
    if (typeof accessors.getPrimaryCategoryId === "function") {
      return accessors.getPrimaryCategoryId(entry) === categoryId;
    }
    return false;
  }
  function searchCatalog(catalog, criteria = {}, accessors = flatRecordAccessors) {
    assertCatalog(catalog);
    if (accessors === null || typeof accessors !== "object" || typeof accessors.getTitle !== "function") {
      throw new Error("searchCatalog failed: expected record accessors.");
    }
    const source = catalog.getAll();
    if (!Array.isArray(source)) {
      throw new Error("searchCatalog failed: Catalog.getAll() must return an array.");
    }
    const text = normalizeSearchText(criteria == null ? void 0 : criteria.text);
    const categoryId = normalizeCategoryId(criteria == null ? void 0 : criteria.categoryId);
    const needle = text === "" ? "" : text.toLowerCase();
    if (categoryId !== "" && typeof accessors.getCategoryIds !== "function" && typeof accessors.getPrimaryCategoryId !== "function") {
      throw new Error(
        "searchCatalog failed: category filtering requires getCategoryIds or getPrimaryCategoryId accessor."
      );
    }
    const matched = [];
    for (const entry of source) {
      if (categoryId !== "" && !entryMatchesCategory(entry, categoryId, accessors)) {
        continue;
      }
      if (needle !== "") {
        const haystack = searchableTextFor(entry, accessors).toLowerCase();
        if (!haystack.includes(needle)) {
          continue;
        }
      }
      matched.push(entry);
    }
    return createSearchResult(matched);
  }

  // src/state/state.js
  function retainValidationResult(result) {
    return Object.freeze({
      valid: result.valid,
      errors: Object.freeze(
        result.errors.map(
          (error) => Object.freeze({
            row: error.row,
            field: error.field,
            code: error.code,
            message: error.message
          })
        )
      )
    });
  }
  function retainEntries(nextEntries) {
    return Object.freeze(nextEntries.slice());
  }
  function emptySnapshotExtras() {
    return {
      resultCount: null,
      searchText: "",
      categoryId: "",
      viewMode: "calendar",
      results: Object.freeze([])
    };
  }
  function createState() {
    return createStateApi();
  }
  function createStateApi() {
    let snapshot = Object.freeze({
      lifecycle: "loading",
      errorMessage: null,
      rowCount: null,
      ...emptySnapshotExtras()
    });
    let acquiredRows = null;
    let validationResult = null;
    let entries = null;
    let catalog = null;
    let searchResult = null;
    let recordAccessors = null;
    let projectResults = null;
    const listeners = /* @__PURE__ */ new Set();
    function emit() {
      const current = snapshot;
      listeners.forEach((listener) => {
        listener(current);
      });
    }
    function retainRows(rows) {
      return Object.freeze(rows.slice());
    }
    function buildResults(nextSearchResult, accessors) {
      if (typeof projectResults === "function") {
        return projectResults(nextSearchResult, accessors);
      }
      return projectIdTitleResults(nextSearchResult, accessors);
    }
    function applyDiscovery(text, categoryId) {
      if (!catalog || !recordAccessors) {
        return;
      }
      searchResult = searchCatalog(
        catalog,
        { text, categoryId },
        recordAccessors
      );
      const results = buildResults(searchResult, recordAccessors);
      snapshot = Object.freeze({
        lifecycle: snapshot.lifecycle,
        errorMessage: null,
        rowCount: catalog.size,
        resultCount: searchResult.size,
        searchText: text,
        categoryId,
        viewMode: snapshot.viewMode,
        results
      });
      emit();
    }
    return {
      getSnapshot() {
        return snapshot;
      },
      getAcquiredRows() {
        return acquiredRows;
      },
      getValidationResult() {
        return validationResult;
      },
      getEntries() {
        return entries;
      },
      getCatalog() {
        return catalog;
      },
      getSearchResult() {
        return searchResult;
      },
      getRecordAccessors() {
        return recordAccessors;
      },
      subscribe(listener) {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
      setLoading() {
        acquiredRows = null;
        validationResult = null;
        entries = null;
        catalog = null;
        searchResult = null;
        recordAccessors = null;
        projectResults = null;
        snapshot = Object.freeze({
          lifecycle: "loading",
          errorMessage: null,
          rowCount: null,
          ...emptySnapshotExtras()
        });
        emit();
      },
      setEmpty(details) {
        var _a, _b, _c, _d;
        const text = normalizeSearchText((_a = details.searchText) != null ? _a : "");
        const categoryId = normalizeCategoryId((_b = details.categoryId) != null ? _b : "");
        const viewMode = typeof details.viewMode === "string" && details.viewMode.trim() !== "" ? details.viewMode.trim() : snapshot.viewMode || "calendar";
        const accessors = details.recordAccessors;
        projectResults = typeof details.projectResults === "function" ? details.projectResults : null;
        const results = buildResults(details.searchResult, accessors);
        acquiredRows = null;
        validationResult = retainValidationResult(
          (_c = details.validationResult) != null ? _c : { valid: true, errors: [] }
        );
        entries = retainEntries((_d = details.entries) != null ? _d : []);
        catalog = details.catalog;
        searchResult = details.searchResult;
        recordAccessors = accessors;
        snapshot = Object.freeze({
          lifecycle: "empty",
          errorMessage: null,
          rowCount: details.catalog.size,
          resultCount: details.searchResult.size,
          searchText: text,
          categoryId,
          viewMode,
          results
        });
        emit();
      },
      setReady(details) {
        var _a, _b;
        const text = normalizeSearchText((_a = details.searchText) != null ? _a : "");
        const categoryId = normalizeCategoryId((_b = details.categoryId) != null ? _b : "");
        const viewMode = typeof details.viewMode === "string" && details.viewMode.trim() !== "" ? details.viewMode.trim() : snapshot.viewMode || "calendar";
        const accessors = details.recordAccessors;
        projectResults = typeof details.projectResults === "function" ? details.projectResults : null;
        const results = buildResults(details.searchResult, accessors);
        acquiredRows = null;
        validationResult = retainValidationResult(details.validationResult);
        entries = retainEntries(details.entries);
        catalog = details.catalog;
        searchResult = details.searchResult;
        recordAccessors = accessors;
        snapshot = Object.freeze({
          lifecycle: "ready",
          errorMessage: null,
          rowCount: details.catalog.size,
          resultCount: details.searchResult.size,
          searchText: text,
          categoryId,
          viewMode,
          results
        });
        emit();
      },
      setSearchText(rawText) {
        if (!catalog || !recordAccessors || snapshot.lifecycle !== "ready" && snapshot.lifecycle !== "empty") {
          return;
        }
        applyDiscovery(normalizeSearchText(rawText), snapshot.categoryId);
      },
      setCategoryId(rawCategoryId) {
        if (!catalog || !recordAccessors || snapshot.lifecycle !== "ready" && snapshot.lifecycle !== "empty") {
          return;
        }
        applyDiscovery(snapshot.searchText, normalizeCategoryId(rawCategoryId));
      },
      setViewMode(rawViewMode) {
        if (snapshot.lifecycle !== "ready" && snapshot.lifecycle !== "empty") {
          return;
        }
        const viewMode = typeof rawViewMode === "string" && rawViewMode.trim() !== "" ? rawViewMode.trim() : "calendar";
        if (viewMode === snapshot.viewMode) {
          return;
        }
        snapshot = Object.freeze({
          ...snapshot,
          viewMode
        });
        emit();
      },
      setSchemaError(details) {
        acquiredRows = retainRows(details.rows);
        validationResult = retainValidationResult(details.validationResult);
        entries = null;
        catalog = null;
        searchResult = null;
        recordAccessors = null;
        projectResults = null;
        snapshot = Object.freeze({
          lifecycle: "error",
          errorMessage: details.message,
          rowCount: null,
          ...emptySnapshotExtras()
        });
        emit();
      },
      setTransformError(details) {
        var _a;
        acquiredRows = retainRows((_a = details.rows) != null ? _a : []);
        validationResult = details.validationResult ? retainValidationResult(details.validationResult) : null;
        entries = null;
        catalog = null;
        searchResult = null;
        recordAccessors = null;
        projectResults = null;
        snapshot = Object.freeze({
          lifecycle: "error",
          errorMessage: details.message,
          rowCount: null,
          ...emptySnapshotExtras()
        });
        emit();
      },
      setCatalogError(details) {
        acquiredRows = null;
        validationResult = details.validationResult ? retainValidationResult(details.validationResult) : null;
        entries = retainEntries(details.entries);
        catalog = null;
        searchResult = null;
        recordAccessors = null;
        projectResults = null;
        snapshot = Object.freeze({
          lifecycle: "error",
          errorMessage: details.message,
          rowCount: null,
          ...emptySnapshotExtras()
        });
        emit();
      },
      setError(message) {
        acquiredRows = null;
        validationResult = null;
        entries = null;
        catalog = null;
        searchResult = null;
        recordAccessors = null;
        projectResults = null;
        snapshot = Object.freeze({
          lifecycle: "error",
          errorMessage: message,
          rowCount: null,
          ...emptySnapshotExtras()
        });
        emit();
      }
    };
  }

  // src/errors/errors.js
  function report(failure, stateApi) {
    let message = "Beim Laden des Verzeichnisses ist etwas schiefgelaufen.";
    if (typeof failure === "string" && failure.trim() !== "") {
      message = failure.trim();
    } else if (failure && typeof failure === "object" && typeof failure.message === "string" && failure.message.trim() !== "") {
      message = failure.message.trim();
    }
    stateApi.setError(message);
  }

  // src/data/cache.js
  var CACHE_PREFIX = "phc-directory:public-cache:v1:";
  function getStorage() {
    try {
      if (typeof globalThis === "undefined") {
        return null;
      }
      const storage = (
        /** @type {{ localStorage?: Storage }} */
        globalThis.localStorage
      );
      if (!storage || typeof storage.getItem !== "function") {
        return null;
      }
      return storage;
    } catch (e) {
      return null;
    }
  }
  function cacheKey(source) {
    return `${CACHE_PREFIX}${source}`;
  }
  function readCachedPublicPayload(source) {
    const storage = getStorage();
    if (!storage || typeof source !== "string" || source.trim() === "") {
      return null;
    }
    try {
      const raw = storage.getItem(cacheKey(source));
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.payload)) {
        return null;
      }
      return parsed.payload;
    } catch (e) {
      return null;
    }
  }
  function writeCachedPublicPayload(source, payload) {
    const storage = getStorage();
    if (!storage || typeof source !== "string" || source.trim() === "") {
      return;
    }
    if (!Array.isArray(payload)) {
      return;
    }
    try {
      storage.setItem(
        cacheKey(source),
        JSON.stringify({
          savedAt: (/* @__PURE__ */ new Date()).toISOString(),
          payload
        })
      );
    } catch (e) {
    }
  }

  // src/data/google-sheets.js
  function isGoogleSheetsUrl(value) {
    if (typeof value !== "string" || value.trim() === "") {
      return false;
    }
    try {
      const url = new URL(value);
      return url.hostname === "docs.google.com" && url.pathname.includes("/spreadsheets/");
    } catch (e) {
      return false;
    }
  }
  function resolvePublicAcquisitionUrl(source) {
    const text = String(source || "").trim();
    if (text === "") {
      return text;
    }
    if (!isGoogleSheetsUrl(text)) {
      return text;
    }
    try {
      const url = new URL(text);
      const output = url.searchParams.get("output");
      const format = url.searchParams.get("format");
      if (url.pathname.includes("/pub") && (output === "csv" || format === "csv")) {
        return text;
      }
      if (url.pathname.includes("/export") && format === "csv") {
        return text;
      }
      return text;
    } catch (e) {
      return text;
    }
  }

  // src/data/parse-csv.js
  function parseCsvRecords(text) {
    const source = String(text != null ? text : "").replace(/^\uFEFF/, "");
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;
    for (let i = 0; i < source.length; i += 1) {
      const char = source[i];
      const next = source[i + 1];
      if (inQuotes) {
        if (char === '"' && next === '"') {
          field += '"';
          i += 1;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          field += char;
        }
        continue;
      }
      if (char === '"') {
        inQuotes = true;
        continue;
      }
      if (char === ",") {
        row.push(field);
        field = "";
        continue;
      }
      if (char === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
        continue;
      }
      if (char === "\r") {
        continue;
      }
      field += char;
    }
    if (field !== "" || row.length > 0) {
      row.push(field);
      rows.push(row);
    }
    return rows.filter((record) => record.some((cell) => String(cell).trim() !== ""));
  }
  function findHeaderRowIndex(records) {
    let bestIndex = 0;
    let bestScore = -1;
    const limit = Math.min(records.length, 5);
    for (let i = 0; i < limit; i += 1) {
      const score = records[i].filter((cell) => String(cell).trim() !== "").length;
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }
    return bestIndex;
  }
  function parseCsvObjects(text) {
    const records = parseCsvRecords(text);
    if (records.length === 0) {
      return [];
    }
    const headerIndex = findHeaderRowIndex(records);
    const headers = records[headerIndex].map((header) => String(header).trim());
    const objects = [];
    for (let i = headerIndex + 1; i < records.length; i += 1) {
      const cells = records[i];
      const object = /* @__PURE__ */ Object.create(null);
      let hasValue = false;
      headers.forEach((header, index) => {
        if (!header) {
          return;
        }
        const value = cells[index] == null ? "" : String(cells[index]).trim();
        object[header] = value;
        if (value !== "") {
          hasValue = true;
        }
      });
      if (hasValue) {
        objects.push(object);
      }
    }
    return objects;
  }

  // src/data/source.js
  function parseJsonValue(text) {
    return JSON.parse(text);
  }
  function decodePayload(text, sourceUrl, headers) {
    var _a, _b, _c;
    const trimmed = String(text != null ? text : "").trim();
    if (trimmed === "") {
      return [];
    }
    const contentType = (_c = (_b = (_a = headers == null ? void 0 : headers.get) == null ? void 0 : _a.call(headers, "content-type")) == null ? void 0 : _b.toLowerCase()) != null ? _c : "";
    const looksJson = trimmed.startsWith("[") || trimmed.startsWith("{") || contentType.includes("application/json") || /\.json(\?|#|$)/i.test(sourceUrl);
    if (looksJson) {
      const parsed = parseJsonValue(trimmed);
      if (!Array.isArray(parsed)) {
        throw Object.assign(new Error("not_array"), { kind: "not_array" });
      }
      return parsed;
    }
    const looksCsv = contentType.includes("text/csv") || contentType.includes("application/vnd.ms-excel") || /export\?format=csv/i.test(sourceUrl) || /[,\n]/.test(trimmed);
    if (looksCsv) {
      return parseCsvObjects(trimmed);
    }
    try {
      const parsed = parseJsonValue(trimmed);
      if (!Array.isArray(parsed)) {
        throw Object.assign(new Error("not_array"), { kind: "not_array" });
      }
      return parsed;
    } catch (failure) {
      if (failure && typeof failure === "object" && "kind" in failure) {
        throw failure;
      }
      return parseCsvObjects(trimmed);
    }
  }
  function withCacheFallback(resolvedSource, failure) {
    const cached = readCachedPublicPayload(resolvedSource);
    if (cached) {
      return {
        ok: true,
        payload: cached,
        fromCache: true
      };
    }
    return failure;
  }
  async function fetchPublic(config) {
    const configured = config.publicSource;
    if (typeof configured !== "string" || configured.trim() === "") {
      return {
        ok: false,
        kind: "not_configured",
        message: "Die PUBLIC-Datenquelle ist nicht konfiguriert."
      };
    }
    const source = resolvePublicAcquisitionUrl(configured.trim());
    let response;
    try {
      response = await fetch(source);
    } catch (e) {
      return withCacheFallback(source, {
        ok: false,
        kind: "network",
        message: "Das CPD-Verzeichnis konnte derzeit nicht geladen werden. Bitte versuchen Sie es später erneut."
      });
    }
    if (!response.ok) {
      return withCacheFallback(source, {
        ok: false,
        kind: "http",
        message: "Das CPD-Verzeichnis konnte derzeit nicht geladen werden. Bitte versuchen Sie es später erneut."
      });
    }
    let text;
    try {
      text = await response.text();
    } catch (e) {
      return withCacheFallback(source, {
        ok: false,
        kind: "invalid_payload",
        message: "Das CPD-Verzeichnis konnte derzeit nicht geladen werden. Bitte versuchen Sie es später erneut."
      });
    }
    let payload;
    try {
      payload = decodePayload(text, source, response.headers);
    } catch (failure) {
      if (failure && typeof failure === "object" && /** @type {{ kind?: string }} */
      failure.kind === "not_array") {
        return withCacheFallback(source, {
          ok: false,
          kind: "not_array",
          message: "Das CPD-Verzeichnis konnte derzeit nicht geladen werden. Bitte versuchen Sie es später erneut."
        });
      }
      return withCacheFallback(source, {
        ok: false,
        kind: "invalid_payload",
        message: "Das CPD-Verzeichnis konnte derzeit nicht geladen werden. Bitte versuchen Sie es später erneut."
      });
    }
    if (!Array.isArray(payload)) {
      return withCacheFallback(source, {
        ok: false,
        kind: "not_array",
        message: "Das CPD-Verzeichnis konnte derzeit nicht geladen werden. Bitte versuchen Sie es später erneut."
      });
    }
    writeCachedPublicPayload(source, payload);
    return {
      ok: true,
      payload
    };
  }

  // src/schema/transport.js
  function validateTransportRows(rows) {
    const errors = [];
    if (!Array.isArray(rows)) {
      return {
        valid: false,
        errors: [
          {
            row: 0,
            field: "",
            code: "not_array",
            message: "PUBLIC payload must be a JSON array."
          }
        ]
      };
    }
    rows.forEach((row, index) => {
      if (row === null || typeof row !== "object" || Array.isArray(row)) {
        errors.push({
          row: index,
          field: "",
          code: "not_object",
          message: `Row ${index + 1} must be an object.`
        });
      }
    });
    return {
      valid: errors.length === 0,
      errors
    };
  }

  // src/schema/validate.js
  function summarizeValidationErrors(result) {
    const count = result.errors.length;
    if (count === 0) {
      return "PUBLIC schema validation failed.";
    }
    const first = result.errors[0];
    const suffix = count === 1 ? "" : ` (+${count - 1} more)`;
    return `PUBLIC schema validation failed: ${first.message}${suffix}`;
  }

  // src/catalog/catalog.js
  function createCatalog(entries, accessors = flatRecordAccessors) {
    if (!Array.isArray(entries)) {
      throw new Error("Catalog creation failed: expected an array of Domain Entries.");
    }
    if (accessors === null || typeof accessors !== "object" || typeof accessors.getId !== "function" || typeof accessors.getTitle !== "function") {
      throw new Error("Catalog creation failed: expected record accessors.");
    }
    const ordered = [];
    const byId = /* @__PURE__ */ new Map();
    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index];
      if (entry === null || typeof entry !== "object") {
        throw new Error(
          `Catalog creation failed at entry ${index + 1}: expected a Domain Entry.`
        );
      }
      let id;
      let title;
      try {
        id = accessors.getId(entry);
        title = accessors.getTitle(entry);
      } catch (failure) {
        const detail = failure instanceof Error && failure.message ? failure.message : "invalid record accessors";
        throw new Error(
          `Catalog creation failed at entry ${index + 1}: ${detail}`
        );
      }
      if (typeof id !== "string" || id.trim() === "") {
        throw new Error(
          `Catalog creation failed at entry ${index + 1}: expected a non-empty id.`
        );
      }
      if (typeof title !== "string") {
        throw new Error(
          `Catalog creation failed at entry ${index + 1}: expected a title string.`
        );
      }
      if (byId.has(id)) {
        throw new Error(
          `Catalog creation failed: unexpected duplicate id "${id}".`
        );
      }
      ordered.push(entry);
      byId.set(id, entry);
    }
    const frozenEntries = Object.freeze(ordered.slice());
    return Object.freeze({
      get size() {
        return frozenEntries.length;
      },
      getAll() {
        return frozenEntries;
      },
      /**
       * @param {string} id
       * @returns {unknown | null}
       */
      getById(id) {
        var _a;
        if (typeof id !== "string") {
          return null;
        }
        return (_a = byId.get(id)) != null ? _a : null;
      }
    });
  }

  // src/interaction/interaction.js
  function bind(root, handlers) {
    function onInput(event) {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) {
        return;
      }
      if (!target.matches("[data-phc-search]")) {
        return;
      }
      handlers.onSearchInput(target.value);
    }
    function onChange(event) {
      const target = event.target;
      if (!(target instanceof HTMLSelectElement)) {
        return;
      }
      if (target.matches("[data-phc-category]")) {
        if (typeof handlers.onCategoryChange === "function") {
          handlers.onCategoryChange(target.value);
        }
        return;
      }
      if (target.matches("[data-phc-view]")) {
        if (typeof handlers.onViewModeChange === "function") {
          handlers.onViewModeChange(target.value);
        }
      }
    }
    root.addEventListener("input", onInput);
    root.addEventListener("change", onChange);
    return () => {
      root.removeEventListener("input", onInput);
      root.removeEventListener("change", onChange);
    };
  }

  // src/render/states.js
  var defaultDirectoryCopy = Object.freeze({
    loading: "Wird geladen…",
    empty: "Keine Einträge verfügbar.",
    searchLabel: "Suche",
    categoryLabel: "Kategorie",
    allCategoriesLabel: "Alle Kategorien",
    viewLabel: "Ansicht",
    resultStatusNone: "Keine passenden Ergebnisse",
    resultStatusOne: "1 Ergebnis",
    resultStatusMany(count) {
      return `${count} Ergebnisse`;
    },
    noResults: "Keine Ergebnisse entsprechen Ihrer aktuellen Suche und Kategorie. Versuchen Sie einen anderen Suchbegriff, wählen Sie eine andere Kategorie oder setzen Sie die Filter zurück.",
    errorFallback: "Beim Laden des Verzeichnisses ist etwas schiefgelaufen."
  });
  function resolveCopy(overrides) {
    return {
      ...defaultDirectoryCopy,
      ...overrides && typeof overrides === "object" ? overrides : {}
    };
  }
  function createLifecycleView(snapshot, options = {}) {
    var _a, _b;
    const copy = resolveCopy(options.copy);
    const region = document.createElement("div");
    region.className = "phc-directory__lifecycle";
    if (snapshot.lifecycle === "loading") {
      const status2 = document.createElement("p");
      status2.className = "phc-directory__status phc-directory__status--loading";
      status2.setAttribute("role", "status");
      status2.textContent = copy.loading;
      region.appendChild(status2);
      return region;
    }
    if (snapshot.lifecycle === "empty") {
      const status2 = document.createElement("div");
      status2.className = "phc-directory__status phc-directory__status--empty";
      status2.setAttribute("role", "status");
      const message = document.createElement("p");
      message.className = "phc-directory__status-title";
      message.textContent = copy.empty;
      status2.appendChild(message);
      region.appendChild(status2);
      return region;
    }
    if (snapshot.lifecycle === "ready") {
      const status2 = document.createElement("div");
      status2.className = "phc-directory__status phc-directory__status--ready";
      status2.appendChild(
        createDiscoveryControls(
          snapshot,
          copy,
          (_a = options.categoryOptions) != null ? _a : [],
          (_b = options.viewModeOptions) != null ? _b : []
        )
      );
      status2.appendChild(createResultStatus(snapshot, copy));
      const resultCount = snapshot.resultCount == null ? 0 : snapshot.resultCount;
      if (resultCount === 0) {
        status2.appendChild(createNoResultsMessage(copy));
      } else if (typeof options.renderResults === "function") {
        const resultsView = options.renderResults(snapshot);
        if (resultsView) {
          status2.appendChild(resultsView);
        }
      } else {
        status2.appendChild(createFallbackResultList(snapshot));
      }
      region.appendChild(status2);
      return region;
    }
    const status = document.createElement("p");
    status.className = "phc-directory__status phc-directory__status--error";
    status.setAttribute("role", "alert");
    status.textContent = snapshot.errorMessage || copy.errorFallback;
    region.appendChild(status);
    return region;
  }
  function createDiscoveryControls(snapshot, copy, categoryOptions2, viewModeOptions2) {
    var _a, _b, _c;
    const controls = document.createElement("div");
    controls.className = "phc-directory__discovery";
    const search = document.createElement("div");
    search.className = "phc-directory__search";
    const searchLabel = document.createElement("label");
    searchLabel.className = "phc-directory__search-label";
    searchLabel.setAttribute("for", "phc-directory-search");
    searchLabel.textContent = copy.searchLabel;
    const input = document.createElement("input");
    input.id = "phc-directory-search";
    input.className = "phc-directory__search-input";
    input.type = "search";
    input.setAttribute("data-phc-search", "");
    input.setAttribute("autocomplete", "off");
    input.setAttribute("spellcheck", "false");
    input.setAttribute("aria-controls", "phc-directory-result-status");
    input.value = (_a = snapshot.searchText) != null ? _a : "";
    search.appendChild(searchLabel);
    search.appendChild(input);
    controls.appendChild(search);
    if (categoryOptions2.length > 0) {
      const category = document.createElement("div");
      category.className = "phc-directory__category";
      const categoryLabel = document.createElement("label");
      categoryLabel.className = "phc-directory__category-label";
      categoryLabel.setAttribute("for", "phc-directory-category");
      categoryLabel.textContent = copy.categoryLabel;
      const select = document.createElement("select");
      select.id = "phc-directory-category";
      select.className = "phc-directory__category-select";
      select.setAttribute("data-phc-category", "");
      select.setAttribute("aria-controls", "phc-directory-result-status");
      const allOption = document.createElement("option");
      allOption.value = "";
      allOption.textContent = copy.allCategoriesLabel;
      select.appendChild(allOption);
      const selected = (_b = snapshot.categoryId) != null ? _b : "";
      categoryOptions2.forEach((option) => {
        const node = document.createElement("option");
        node.value = option.id;
        node.textContent = option.label;
        if (option.id === selected) {
          node.selected = true;
        }
        select.appendChild(node);
      });
      if (selected === "") {
        allOption.selected = true;
      }
      category.appendChild(categoryLabel);
      category.appendChild(select);
      controls.appendChild(category);
    }
    if (viewModeOptions2.length > 0) {
      const view = document.createElement("div");
      view.className = "phc-directory__view";
      const viewLabel = document.createElement("label");
      viewLabel.className = "phc-directory__view-label";
      viewLabel.setAttribute("for", "phc-directory-view");
      viewLabel.textContent = copy.viewLabel;
      const select = document.createElement("select");
      select.id = "phc-directory-view";
      select.className = "phc-directory__view-select";
      select.setAttribute("data-phc-view", "");
      select.setAttribute("aria-controls", "phc-directory-results-heading");
      const selected = (_c = snapshot.viewMode) != null ? _c : "";
      let matched = false;
      viewModeOptions2.forEach((option) => {
        const node = document.createElement("option");
        node.value = option.id;
        node.textContent = option.label;
        if (option.id === selected) {
          node.selected = true;
          matched = true;
        }
        select.appendChild(node);
      });
      if (!matched && select.options.length > 0) {
        select.options[0].selected = true;
      }
      view.appendChild(viewLabel);
      view.appendChild(select);
      controls.appendChild(view);
    }
    return controls;
  }
  function createResultStatus(snapshot, copy) {
    var _a, _b;
    const status = document.createElement("p");
    status.id = "phc-directory-result-status";
    status.className = "phc-directory__result-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    const resultCount = snapshot.resultCount == null ? 0 : snapshot.resultCount;
    const rowCount = snapshot.rowCount == null ? 0 : snapshot.rowCount;
    const searchText = (_a = snapshot.searchText) != null ? _a : "";
    const categoryId = (_b = snapshot.categoryId) != null ? _b : "";
    const filtersActive = searchText !== "" || categoryId !== "";
    if (resultCount === 0 && rowCount > 0 && filtersActive) {
      status.textContent = copy.resultStatusNone;
    } else if (resultCount === 1) {
      status.textContent = copy.resultStatusOne;
    } else {
      status.textContent = copy.resultStatusMany(resultCount);
    }
    return status;
  }
  function createNoResultsMessage(copy) {
    const message = document.createElement("div");
    message.className = "phc-directory__no-results";
    message.setAttribute("role", "status");
    const paragraph = document.createElement("p");
    paragraph.className = "phc-directory__no-results-text";
    paragraph.textContent = copy.noResults;
    message.appendChild(paragraph);
    return message;
  }
  function createFallbackResultList(snapshot) {
    const list = document.createElement("ul");
    list.className = "phc-directory__result-list";
    const results = Array.isArray(snapshot.results) ? snapshot.results : [];
    results.forEach((item) => {
      if (item === null || typeof item !== "object" || typeof /** @type {{ id?: unknown }} */
      item.id !== "string" || typeof /** @type {{ title?: unknown }} */
      item.title !== "string") {
        return;
      }
      const li = document.createElement("li");
      li.className = "phc-directory__result-item";
      li.textContent = `${/** @type {{ id: string }} */
      item.id} — ${/** @type {{ title: string }} */
      item.title}`;
      list.appendChild(li);
    });
    return list;
  }

  // src/render/render.js
  function matchesSelector(node, selector) {
    return Boolean(
      node && typeof node === "object" && typeof /** @type {{ matches?: unknown }} */
      node.matches === "function" && /** @type {{ matches: (selector: string) => boolean }} */
      node.matches(
        selector
      )
    );
  }
  function captureControlFocus(root) {
    const active = typeof document !== "undefined" ? document.activeElement : null;
    if (!active || typeof root.contains !== "function" || !root.contains(
      /** @type {Node} */
      active
    )) {
      return {
        kind: null,
        selectionStart: null,
        selectionEnd: null,
        value: null
      };
    }
    if (matchesSelector(active, "[data-phc-search]")) {
      const input = (
        /** @type {{ selectionStart?: number | null, selectionEnd?: number | null, value?: string }} */
        active
      );
      return {
        kind: "search",
        selectionStart: typeof input.selectionStart === "number" ? input.selectionStart : null,
        selectionEnd: typeof input.selectionEnd === "number" ? input.selectionEnd : null,
        value: typeof input.value === "string" ? input.value : null
      };
    }
    if (matchesSelector(active, "[data-phc-category]")) {
      const select = (
        /** @type {{ value?: string }} */
        active
      );
      return {
        kind: "category",
        selectionStart: null,
        selectionEnd: null,
        value: typeof select.value === "string" ? select.value : null
      };
    }
    if (matchesSelector(active, "[data-phc-view]")) {
      const select = (
        /** @type {{ value?: string }} */
        active
      );
      return {
        kind: "view",
        selectionStart: null,
        selectionEnd: null,
        value: typeof select.value === "string" ? select.value : null
      };
    }
    return {
      kind: null,
      selectionStart: null,
      selectionEnd: null,
      value: null
    };
  }
  function restoreControlFocus(root, focus) {
    if (!focus.kind || typeof root.querySelector !== "function") {
      return;
    }
    const selector = focus.kind === "search" ? "[data-phc-search]" : focus.kind === "category" ? "[data-phc-category]" : "[data-phc-view]";
    const control = root.querySelector(selector);
    if (!matchesSelector(control, selector)) {
      return;
    }
    const field = (
      /** @type {{
      *   focus?: () => void,
      *   setSelectionRange?: (start: number, end: number) => void,
      * }} */
      control
    );
    if (typeof field.focus === "function") {
      field.focus();
    }
    if (focus.kind === "search" && focus.selectionStart != null && focus.selectionEnd != null && typeof field.setSelectionRange === "function") {
      try {
        field.setSelectionRange(focus.selectionStart, focus.selectionEnd);
      } catch (e) {
      }
    }
  }
  function render(root, snapshot, options = {}) {
    const focus = captureControlFocus(root);
    root.replaceChildren();
    const app = document.createElement("div");
    app.className = "phc-directory";
    app.appendChild(createLifecycleView(snapshot, options));
    root.appendChild(app);
    restoreControlFocus(root, focus);
  }

  // src/specializations/cpd/normalize.js
  function normalizeText(value) {
    if (value === null || value === void 0) {
      return "";
    }
    return String(value).trim();
  }
  function parseStringList(value) {
    let items = [];
    if (value === null || value === void 0 || value === "") {
      items = [];
    } else if (Array.isArray(value)) {
      items = value.map((item) => normalizeText(item));
    } else {
      items = String(value).split(",").map((item) => normalizeText(item));
    }
    return Object.freeze(items.filter((item) => item !== ""));
  }
  function normalizeCpdHours(value) {
    if (value === null || value === void 0) {
      return null;
    }
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : null;
    }
    const text = normalizeText(value);
    if (text === "") {
      return null;
    }
    const normalized = text.replace(",", ".");
    if (!/^[+-]?\d+(\.\d+)?$/.test(normalized)) {
      return null;
    }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  function coerceNextStartIso(value) {
    const text = normalizeText(value);
    if (text === "") {
      return null;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      return text;
    }
    const parts = text.split(/[/|;]/).map((part) => part.trim()).filter(Boolean);
    const dates = [];
    for (const part of parts) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(part)) {
        dates.push(part);
        continue;
      }
      const match = part.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
      if (match) {
        const day = match[1].padStart(2, "0");
        const month = match[2].padStart(2, "0");
        dates.push(`${match[3]}-${month}-${day}`);
      }
    }
    if (dates.length === 0) {
      return null;
    }
    dates.sort();
    return dates[0];
  }
  var SWISS_DATE_LONG = new Intl.DateTimeFormat("de-CH", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  var SWISS_DATE_SHORT = new Intl.DateTimeFormat("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
  function dateFromIsoDay(iso) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      return null;
    }
    const [year, month, day] = iso.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
      return null;
    }
    return date;
  }
  function formatSwissDateLong(value) {
    const iso = coerceNextStartIso(value);
    if (!iso) {
      return normalizeText(value);
    }
    const date = dateFromIsoDay(iso);
    if (!date) {
      return normalizeText(value);
    }
    return SWISS_DATE_LONG.format(date);
  }
  function formatSwissDateShort(value) {
    const iso = coerceNextStartIso(value);
    if (!iso) {
      return normalizeText(value);
    }
    const date = dateFromIsoDay(iso);
    if (!date) {
      return normalizeText(value);
    }
    return SWISS_DATE_SHORT.format(date);
  }
  function normalizePublicUrl(value) {
    const text = normalizeText(value);
    if (text === "") {
      return "";
    }
    const driveId = extractGoogleDriveFileId(text);
    if (driveId) {
      return `https://lh3.googleusercontent.com/d/${driveId}=w1000`;
    }
    if (/^https?:\/\//i.test(text) || text.startsWith("/")) {
      return text;
    }
    if (/^[a-z0-9.-]+\.[a-z]{2,}([/?#].*)?$/i.test(text)) {
      return `https://${text}`;
    }
    return text;
  }
  function extractGoogleDriveFileId(text) {
    const patterns = [
      /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i,
      /drive\.google\.com\/open\?[^#]*\bid=([a-zA-Z0-9_-]+)/i,
      /drive\.google\.com\/uc\?[^#]*\bid=([a-zA-Z0-9_-]+)/i,
      /drive\.google\.com\/thumbnail\?[^#]*\bid=([a-zA-Z0-9_-]+)/i,
      /drive\.usercontent\.google\.com\/(?:download|uc)\?[^#]*\bid=([a-zA-Z0-9_-]+)/i,
      /lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/i
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  }

  // src/specializations/cpd/course.js
  function createCpdCourse(input) {
    const providerName = normalizeText(input == null ? void 0 : input.providerName);
    const courseId = normalizeText(input == null ? void 0 : input.courseId);
    const title = normalizeText(input == null ? void 0 : input.title);
    if (courseId === "") {
      throw new Error("CPD course requires course.id.");
    }
    if (title === "") {
      throw new Error("CPD course requires course.title.");
    }
    if (providerName === "") {
      throw new Error("CPD course requires provider.name.");
    }
    let cpdHours;
    try {
      cpdHours = normalizeCpdHours(input == null ? void 0 : input.cpdHours);
    } catch (e) {
      cpdHours = null;
    }
    const categories = parseStringList(input == null ? void 0 : input.additionalCategories);
    const formats = parseStringList(input == null ? void 0 : input.formats);
    const languages = parseStringList(input == null ? void 0 : input.languages);
    const provider = Object.freeze({
      type: normalizeText(input == null ? void 0 : input.providerType),
      name: providerName,
      websiteUrl: normalizeText(input == null ? void 0 : input.providerWebsiteUrl),
      logoUrl: normalizeText(input == null ? void 0 : input.providerLogoUrl)
    });
    const course = Object.freeze({
      id: courseId,
      title,
      shortTitle: normalizeText(input == null ? void 0 : input.shortTitle),
      summary: normalizeText(input == null ? void 0 : input.summary),
      description: normalizeText(input == null ? void 0 : input.description),
      location: normalizeText(input == null ? void 0 : input.location),
      cpdHours,
      imageUrl: normalizeText(input == null ? void 0 : input.imageUrl),
      qrCodeUrl: normalizeText(input == null ? void 0 : input.qrCodeUrl),
      languages
    });
    const classification = Object.freeze({
      primaryCategory: normalizeText(input == null ? void 0 : input.primaryCategory),
      categories
    });
    const delivery = Object.freeze({
      formats,
      scheduleType: normalizeText(input == null ? void 0 : input.scheduleType),
      nextStart: normalizeText(input == null ? void 0 : input.nextStart),
      scheduleDescription: normalizeText(input == null ? void 0 : input.scheduleDescription),
      courseUrl: normalizeText(input == null ? void 0 : input.courseUrl)
    });
    return Object.freeze({
      provider,
      course,
      classification,
      delivery
    });
  }

  // src/specializations/cpd/published.js
  function interpretPublishedFlag(value) {
    if (value === null || value === void 0) {
      return null;
    }
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value === "number") {
      if (value === 1) return true;
      if (value === 0) return false;
      return null;
    }
    const text = String(value).trim().toLowerCase();
    if (text === "") {
      return null;
    }
    if (text === "ja" || text === "yes" || text === "true" || text === "1" || text === "x" || text === "published" || text === "y") {
      return true;
    }
    if (text === "nein" || text === "no" || text === "false" || text === "0" || text === "n" || text === "unpublished" || text === "draft") {
      return false;
    }
    return null;
  }

  // src/specializations/cpd/map-public-row.js
  var PUBLIC_COLUMNS = Object.freeze({
    providerType: "Anbietertyp",
    providerName: "Name des Anbieters",
    providerWebsiteUrl: "Website des Anbieters",
    providerLogoUrl: "Logo des Anbieters",
    courseId: "PHC-CPD-ID",
    title: "Vollständiger Titel",
    shortTitle: "Kurztitel",
    summary: "Kurzbeschreibung",
    description: "Ausführliche Beschreibung",
    location: "Veranstaltungsort",
    cpdHours: "Anrechenbare Weiterbildungsstunden (CPD)",
    imageUrl: "Bild der Weiterbildung",
    qrCodeUrl: "QR-Code (optional)",
    primaryCategory: "Primärkategorie",
    additionalCategories: "Weitere Kategorien",
    languages: "Unterrichtssprache",
    formats: "Durchführungsformat",
    scheduleType: "Terminart",
    nextStart: "Nächster Start",
    scheduleDescription: "Durchführung / Zeitplan",
    courseUrl: "Kursseite / Anmeldung",
    published: "Veröffentlicht"
  });
  var PUBLISHED_COLUMN_ALIASES = Object.freeze([
    PUBLIC_COLUMNS.published,
    "Published",
    "Freigegeben"
  ]);
  function readColumn(row, column) {
    if (Object.prototype.hasOwnProperty.call(row, column)) {
      return row[column];
    }
    return void 0;
  }
  function isPublishedPublicRow(row) {
    if (row === null || typeof row !== "object" || Array.isArray(row)) {
      return false;
    }
    const record = (
      /** @type {Record<string, unknown>} */
      row
    );
    for (const column of PUBLISHED_COLUMN_ALIASES) {
      if (!Object.prototype.hasOwnProperty.call(record, column)) {
        continue;
      }
      const interpreted = interpretPublishedFlag(record[column]);
      if (interpreted === false) {
        return false;
      }
      if (interpreted === true) {
        return true;
      }
    }
    return true;
  }
  function mapPublicRowToCpdCourse(row) {
    if (row === null || typeof row !== "object" || Array.isArray(row)) {
      throw new Error("PUBLIC mapper expected a plain object row.");
    }
    const record = (
      /** @type {Record<string, unknown>} */
      row
    );
    const rawNextStart = readColumn(record, PUBLIC_COLUMNS.nextStart);
    const nextStartIso = coerceNextStartIso(rawNextStart);
    const nextStart = nextStartIso || (typeof rawNextStart === "string" || typeof rawNextStart === "number" ? normalizeText(rawNextStart) : "");
    return createCpdCourse({
      providerType: readColumn(record, PUBLIC_COLUMNS.providerType),
      providerName: readColumn(record, PUBLIC_COLUMNS.providerName),
      providerWebsiteUrl: normalizePublicUrl(
        readColumn(record, PUBLIC_COLUMNS.providerWebsiteUrl)
      ),
      providerLogoUrl: normalizePublicUrl(
        readColumn(record, PUBLIC_COLUMNS.providerLogoUrl)
      ),
      courseId: readColumn(record, PUBLIC_COLUMNS.courseId),
      title: readColumn(record, PUBLIC_COLUMNS.title),
      shortTitle: readColumn(record, PUBLIC_COLUMNS.shortTitle),
      summary: readColumn(record, PUBLIC_COLUMNS.summary),
      description: readColumn(record, PUBLIC_COLUMNS.description),
      location: readColumn(record, PUBLIC_COLUMNS.location),
      cpdHours: readColumn(record, PUBLIC_COLUMNS.cpdHours),
      imageUrl: normalizePublicUrl(readColumn(record, PUBLIC_COLUMNS.imageUrl)),
      qrCodeUrl: normalizePublicUrl(readColumn(record, PUBLIC_COLUMNS.qrCodeUrl)),
      primaryCategory: readColumn(record, PUBLIC_COLUMNS.primaryCategory),
      additionalCategories: readColumn(
        record,
        PUBLIC_COLUMNS.additionalCategories
      ),
      languages: readColumn(record, PUBLIC_COLUMNS.languages),
      formats: readColumn(record, PUBLIC_COLUMNS.formats),
      scheduleType: readColumn(record, PUBLIC_COLUMNS.scheduleType),
      nextStart,
      scheduleDescription: readColumn(
        record,
        PUBLIC_COLUMNS.scheduleDescription
      ),
      courseUrl: normalizePublicUrl(readColumn(record, PUBLIC_COLUMNS.courseUrl))
    });
  }
  function mapPublicRowsToCpdCourses(rows) {
    if (!Array.isArray(rows)) {
      throw new Error("PUBLIC mapper expected an array of rows.");
    }
    const courses = [];
    rows.forEach((row) => {
      if (!isPublishedPublicRow(row)) {
        return;
      }
      try {
        courses.push(mapPublicRowToCpdCourse(row));
      } catch (e) {
      }
    });
    return courses;
  }

  // src/specializations/cpd/taxonomy.js
  var CPD_PRIMARY_CATEGORIES = Object.freeze([
    Object.freeze({ id: "lifestyle-medicine", label: "Lifestyle Medicine" }),
    Object.freeze({
      id: "mental-health-wellbeing",
      label: "Mentale Gesundheit & Wohlbefinden"
    }),
    Object.freeze({ id: "womens-health", label: "Frauengesundheit" }),
    Object.freeze({ id: "mens-health", label: "Männergesundheit" }),
    Object.freeze({ id: "healthy-ageing", label: "Gesund altern" }),
    Object.freeze({
      id: "prevention-health-promotion",
      label: "Prävention & Gesundheitsförderung"
    }),
    Object.freeze({
      id: "health-coaching-communication",
      label: "Health Coaching & Kommunikation"
    }),
    Object.freeze({ id: "integrative-health", label: "Integrative Gesundheit" }),
    Object.freeze({
      id: "professional-development",
      label: "Berufliche Entwicklung"
    })
  ]);
  var LABEL_ALIASES = Object.freeze([
    Object.freeze(["Mental Health & Wellbeing", "mental-health-wellbeing"]),
    Object.freeze(["Women's Health", "womens-health"]),
    Object.freeze(["Men's Health", "mens-health"]),
    Object.freeze(["Healthy Ageing", "healthy-ageing"]),
    Object.freeze([
      "Prevention & Health Promotion",
      "prevention-health-promotion"
    ]),
    Object.freeze([
      "Health Coaching & Communication",
      "health-coaching-communication"
    ]),
    Object.freeze(["Integrative Health", "integrative-health"]),
    Object.freeze(["Professional Development", "professional-development"])
  ]);
  var BY_ID = new Map(CPD_PRIMARY_CATEGORIES.map((item) => [item.id, item]));
  var BY_LABEL = /* @__PURE__ */ new Map();
  for (const item of CPD_PRIMARY_CATEGORIES) {
    BY_LABEL.set(normalizeKey(item.label), item);
  }
  for (const [alias, id] of LABEL_ALIASES) {
    const item = BY_ID.get(id);
    if (item) {
      BY_LABEL.set(normalizeKey(alias), item);
    }
  }
  function normalizeKey(value) {
    if (typeof value !== "string") {
      return "";
    }
    return value.trim().toLowerCase().replace(/\s+/g, " ");
  }
  function listPrimaryCategories() {
    return CPD_PRIMARY_CATEGORIES;
  }
  function resolvePrimaryCategory(value) {
    if (typeof value !== "string") {
      return Object.freeze({ id: null, label: "", supported: false });
    }
    const raw = value.trim();
    if (raw === "") {
      return Object.freeze({ id: null, label: "", supported: false });
    }
    const byId = BY_ID.get(raw);
    if (byId) {
      return Object.freeze({
        id: byId.id,
        label: byId.label,
        supported: true
      });
    }
    const byLabel = BY_LABEL.get(normalizeKey(raw));
    if (byLabel) {
      return Object.freeze({
        id: byLabel.id,
        label: byLabel.label,
        supported: true
      });
    }
    return Object.freeze({
      id: null,
      label: raw,
      supported: false
    });
  }

  // src/specializations/cpd/accessors.js
  function asCourse(entry) {
    return (
      /** @type {import('./course.js').CpdCourse} */
      entry
    );
  }
  function collectCpdCategoryIds(course) {
    var _a, _b;
    const ids = [];
    const seen = /* @__PURE__ */ new Set();
    function addResolved(value) {
      const resolved = resolvePrimaryCategory(value);
      if (resolved.supported && resolved.id && !seen.has(resolved.id)) {
        seen.add(resolved.id);
        ids.push(resolved.id);
      }
    }
    addResolved((_a = course.classification) == null ? void 0 : _a.primaryCategory);
    if (Array.isArray((_b = course.classification) == null ? void 0 : _b.categories)) {
      for (const item of course.classification.categories) {
        addResolved(item);
      }
    }
    return Object.freeze(ids);
  }
  function buildCpdSearchableText(course) {
    var _a, _b, _c, _d, _e, _f, _g;
    const primaryRaw = typeof ((_a = course.classification) == null ? void 0 : _a.primaryCategory) === "string" ? course.classification.primaryCategory : "";
    const primary = resolvePrimaryCategory(primaryRaw);
    const secondaryRaw = Array.isArray((_b = course.classification) == null ? void 0 : _b.categories) ? course.classification.categories : [];
    const secondaryResolved = secondaryRaw.map((item) => resolvePrimaryCategory(item).label).filter((label) => label !== "");
    return [
      (_c = course.course) == null ? void 0 : _c.title,
      (_d = course.provider) == null ? void 0 : _d.name,
      (_e = course.course) == null ? void 0 : _e.summary,
      (_f = course.course) == null ? void 0 : _f.description,
      primaryRaw,
      primary.label,
      ...secondaryRaw,
      ...secondaryResolved,
      Array.isArray((_g = course.course) == null ? void 0 : _g.languages) ? course.course.languages.join(" ") : ""
    ].filter((part) => typeof part === "string" && part.trim() !== "").join(" ");
  }
  var cpdRecordAccessors = createRecordAccessors({
    getId(entry) {
      var _a, _b;
      const id = (_b = (_a = asCourse(entry)) == null ? void 0 : _a.course) == null ? void 0 : _b.id;
      if (typeof id !== "string" || id.trim() === "") {
        throw new Error("CPD accessor expected course.id string.");
      }
      return id;
    },
    getTitle(entry) {
      var _a, _b;
      const title = (_b = (_a = asCourse(entry)) == null ? void 0 : _a.course) == null ? void 0 : _b.title;
      if (typeof title !== "string") {
        throw new Error("CPD accessor expected course.title string.");
      }
      return title;
    },
    getSearchableText(entry) {
      return buildCpdSearchableText(asCourse(entry));
    },
    getPrimaryCategoryId(entry) {
      var _a, _b;
      const resolved = resolvePrimaryCategory(
        (_b = (_a = asCourse(entry)) == null ? void 0 : _a.classification) == null ? void 0 : _b.primaryCategory
      );
      return resolved.supported ? resolved.id : null;
    },
    getCategoryIds(entry) {
      return collectCpdCategoryIds(asCourse(entry));
    }
  });

  // src/specializations/cpd/copy.js
  var cpdDirectoryCopy = Object.freeze({
    loading: "Weiterbildungen werden geladen…",
    empty: "Zurzeit sind keine Weiterbildungen verfügbar.",
    searchLabel: "Weiterbildungen suchen",
    categoryLabel: "Kategorie",
    allCategoriesLabel: "Alle Kategorien",
    viewLabel: "Ansicht",
    resultStatusNone: "Keine passenden Weiterbildungen",
    resultStatusOne: "1 Weiterbildung",
    /**
     * @param {number} count
     * @returns {string}
     */
    resultStatusMany(count) {
      return `${count} Weiterbildungen`;
    },
    noResults: "Keine Weiterbildung entspricht Ihrer aktuellen Suche und Kategorie. Versuchen Sie einen anderen Suchbegriff, wählen Sie eine andere Kategorie oder setzen Sie die Filter zurück.",
    errorFallback: "Beim Laden des Verzeichnisses ist etwas schiefgelaufen.",
    // Card / list presentation labels
    resultsHeading: "Weiterbildungen",
    scheduleHeading: "CPD-Terminplan",
    readMore: "Mehr lesen",
    location: "Ort",
    category: "Kategorie",
    alsoListedUnder: "Auch gelistet unter",
    cpdHours: "WB-Stunden*",
    wbHoursFootnote: "* Weiterbildungsstunden",
    format: "Format",
    scheduleType: "Art des Termins",
    nextStart: "Nächster Termin",
    schedule: "Durchführung",
    courseCta: "Kursinformationen & Anmeldung",
    /**
     * Display the course id exactly as supplied by PUBLIC (no prefix).
     * @param {string} id
     * @returns {string}
     */
    courseRef(id) {
      return id;
    },
    /**
     * @param {string} title
     * @returns {string}
     */
    courseImageAlt(title) {
      return `Kursbild für ${title}`;
    },
    /**
     * @param {string} title
     * @returns {string}
     */
    qrCodeAlt(title) {
      return `QR-Code für ${title}`;
    },
    scheduleColumns: Object.freeze([
      "Datum",
      "Weiterbildung",
      "PHC-CPD-Nummer",
      "Kategorie",
      "CPD-Credits"
    ]),
    emptyCell: "—"
  });

  // src/specializations/cpd/presentation.js
  function isNonEmptyString(value) {
    return typeof value === "string" && value.trim() !== "";
  }
  function safeMediaUrl(value) {
    if (!isNonEmptyString(value)) {
      return void 0;
    }
    const text = value.trim();
    if (text.startsWith("/") && !text.startsWith("//")) {
      return text;
    }
    try {
      const parsed = new URL(text);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return void 0;
      }
      return parsed.href;
    } catch (e) {
      return void 0;
    }
  }
  function optionalStringList(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return void 0;
    }
    return Object.freeze(items.slice());
  }
  function projectShortDescription(course) {
    if (isNonEmptyString(course.course.summary)) {
      return course.course.summary;
    }
    return void 0;
  }
  function projectFullDescription(course) {
    if (isNonEmptyString(course.course.description)) {
      return course.course.description;
    }
    return void 0;
  }
  function projectCpdCourseToCard(course) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    if (course === null || typeof course !== "object") {
      throw new Error("CPD card projection expected a CPD course entity.");
    }
    if (course.course === null || typeof course.course !== "object" || course.provider === null || typeof course.provider !== "object") {
      throw new Error("CPD card projection expected nested course and provider.");
    }
    const provider = (
      /** @type {CpdCardProvider} */
      {
        name: course.provider.name
      }
    );
    const providerWebsiteUrl = safeMediaUrl(course.provider.websiteUrl);
    if (providerWebsiteUrl && /^https?:/i.test(providerWebsiteUrl)) {
      provider.websiteUrl = providerWebsiteUrl;
    }
    const logoUrl = safeMediaUrl(course.provider.logoUrl);
    if (logoUrl) {
      provider.logoUrl = logoUrl;
    }
    const model = {
      id: course.course.id,
      title: course.course.title,
      provider: Object.freeze(provider)
    };
    const description = projectShortDescription(course);
    if (description) {
      model.description = description;
    }
    const fullDescription = projectFullDescription(course);
    if (fullDescription) {
      model.fullDescription = fullDescription;
    }
    const imageUrl = safeMediaUrl(course.course.imageUrl);
    if (imageUrl) {
      model.imageUrl = imageUrl;
    }
    const qrCodeUrl = safeMediaUrl(course.course.qrCodeUrl);
    if (qrCodeUrl) {
      model.qrCodeUrl = qrCodeUrl;
    }
    if (isNonEmptyString(course.course.location)) {
      model.location = course.course.location;
    }
    const classification = {};
    const primary = resolvePrimaryCategory((_a = course.classification) == null ? void 0 : _a.primaryCategory);
    if (primary.label !== "") {
      classification.primaryCategory = primary.label;
      classification.primaryCategorySupported = primary.supported;
      if (primary.id) {
        classification.primaryCategoryId = primary.id;
      }
    }
    const alsoListedUnderRaw = (_c = (_b = course.classification) == null ? void 0 : _b.categories) != null ? _c : [];
    if (Array.isArray(alsoListedUnderRaw) && alsoListedUnderRaw.length > 0) {
      const alsoListedUnder = optionalStringList(
        alsoListedUnderRaw.map((item) => {
          const resolved = resolvePrimaryCategory(item);
          return resolved.label !== "" ? resolved.label : String(item);
        })
      );
      if (alsoListedUnder) {
        classification.alsoListedUnder = alsoListedUnder;
      }
    }
    if (typeof course.course.cpdHours === "number" && Number.isFinite(course.course.cpdHours)) {
      classification.cpdHours = course.course.cpdHours;
    }
    if (Object.keys(classification).length > 0) {
      model.classification = Object.freeze(classification);
    }
    const delivery = {};
    const formats = optionalStringList((_e = (_d = course.delivery) == null ? void 0 : _d.formats) != null ? _e : []);
    if (formats) {
      delivery.formats = formats;
    }
    if (isNonEmptyString((_f = course.delivery) == null ? void 0 : _f.scheduleType)) {
      delivery.scheduleType = course.delivery.scheduleType;
    }
    if (isNonEmptyString((_g = course.delivery) == null ? void 0 : _g.nextStart)) {
      delivery.nextStart = course.delivery.nextStart;
    }
    if (isNonEmptyString((_h = course.delivery) == null ? void 0 : _h.scheduleDescription)) {
      delivery.scheduleDescription = course.delivery.scheduleDescription;
    }
    if (Object.keys(delivery).length > 0) {
      model.delivery = Object.freeze(delivery);
    }
    const courseUrl = safeMediaUrl((_i = course.delivery) == null ? void 0 : _i.courseUrl);
    if (courseUrl && /^https?:/i.test(courseUrl)) {
      model.courseUrl = courseUrl;
    }
    return Object.freeze(model);
  }
  function projectCpdCoursesToCards(courses) {
    if (!Array.isArray(courses)) {
      throw new Error("CPD card collection projection expected an array.");
    }
    return Object.freeze(courses.map((course) => projectCpdCourseToCard(course)));
  }
  function projectCpdSearchResultToCards(searchResult) {
    return projectCpdCoursesToCards(
      /** @type {readonly CpdCourse[]} */
      searchResult.getAll()
    );
  }

  // src/specializations/cpd/render-cards.js
  function el(tag, className) {
    const node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    return node;
  }
  function isoDateAttribute(value) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }
    return null;
  }
  function formatCpdHoursValue(hours) {
    return Number.isInteger(hours) ? String(hours) : String(hours);
  }
  function createMetaItem(term, description) {
    const item = el("div", "phc-directory__card-meta-item");
    const dt = el("dt", "phc-directory__card-meta-term");
    dt.textContent = term;
    const dd = el("dd", "phc-directory__card-meta-value");
    if (typeof description === "string") {
      dd.textContent = description;
    } else {
      dd.appendChild(description);
    }
    item.appendChild(dt);
    item.appendChild(dd);
    return item;
  }
  function createImage(src, alt, className) {
    const img = el("img", className);
    img.setAttribute("src", src);
    img.setAttribute("alt", alt);
    img.setAttribute("loading", "lazy");
    img.setAttribute("decoding", "async");
    return img;
  }
  function createProviderRow(card) {
    const row = el("div", "phc-directory__card-provider-row");
    if (card.provider.logoUrl) {
      row.appendChild(
        createImage(
          card.provider.logoUrl,
          "",
          "phc-directory__card-provider-logo"
        )
      );
    }
    const name = el("p", "phc-directory__card-provider-name");
    if (card.provider.websiteUrl) {
      const link = el("a", "phc-directory__card-provider-link");
      link.setAttribute("href", card.provider.websiteUrl);
      link.textContent = card.provider.name;
      name.appendChild(link);
    } else {
      name.textContent = card.provider.name;
    }
    row.appendChild(name);
    return row;
  }
  function createMediaDescriptionRow(card) {
    const row = el("div", "phc-directory__card-media-row");
    const media = el("figure", "phc-directory__card-media");
    if (card.imageUrl) {
      media.appendChild(
        createImage(card.imageUrl, card.title, "phc-directory__card-photo")
      );
    } else {
      const placeholder = el("div", "phc-directory__card-photo-placeholder");
      placeholder.setAttribute("role", "img");
      placeholder.setAttribute(
        "aria-label",
        cpdDirectoryCopy.courseImageAlt(card.title)
      );
      media.appendChild(placeholder);
    }
    row.appendChild(media);
    const description = el("div", "phc-directory__card-description");
    if (card.description) {
      const text = el("p", "phc-directory__card-description-text");
      text.textContent = card.description;
      description.appendChild(text);
    }
    if (card.fullDescription) {
      const details = el("details", "phc-directory__card-full-description");
      const summary = el("summary", "phc-directory__card-full-description-toggle");
      summary.textContent = cpdDirectoryCopy.readMore;
      details.appendChild(summary);
      const full = el("p", "phc-directory__card-full-description-text");
      full.textContent = card.fullDescription;
      details.appendChild(full);
      description.appendChild(details);
    }
    row.appendChild(description);
    return row;
  }
  function createIdentityMeta(card) {
    var _a, _b, _c;
    const meta = el(
      "dl",
      "phc-directory__card-meta phc-directory__card-meta--identity"
    );
    let hasMeta = false;
    if (card.location) {
      meta.appendChild(createMetaItem(cpdDirectoryCopy.location, card.location));
      hasMeta = true;
    }
    if ((_a = card.classification) == null ? void 0 : _a.primaryCategory) {
      meta.appendChild(
        createMetaItem(
          cpdDirectoryCopy.category,
          card.classification.primaryCategory
        )
      );
      hasMeta = true;
    }
    if (((_b = card.classification) == null ? void 0 : _b.alsoListedUnder) && card.classification.alsoListedUnder.length > 0) {
      meta.appendChild(
        createMetaItem(
          cpdDirectoryCopy.alsoListedUnder,
          card.classification.alsoListedUnder.join(", ")
        )
      );
      hasMeta = true;
    }
    if ((_c = card.delivery) == null ? void 0 : _c.nextStart) {
      const iso = isoDateAttribute(card.delivery.nextStart);
      const display = formatSwissDateLong(card.delivery.nextStart);
      if (iso) {
        const time = el("time");
        time.setAttribute("datetime", iso);
        time.textContent = display;
        meta.appendChild(createMetaItem(cpdDirectoryCopy.nextStart, time));
      } else {
        meta.appendChild(createMetaItem(cpdDirectoryCopy.nextStart, display));
      }
      hasMeta = true;
    }
    return hasMeta ? meta : null;
  }
  function createDeliveryColumn(card) {
    var _a, _b, _c, _d;
    const column = el("div", "phc-directory__card-delivery");
    let hasContent = false;
    const meta = el(
      "dl",
      "phc-directory__card-meta phc-directory__card-meta--delivery"
    );
    let hasMeta = false;
    if (((_a = card.delivery) == null ? void 0 : _a.formats) && card.delivery.formats.length > 0) {
      meta.appendChild(
        createMetaItem(
          cpdDirectoryCopy.format,
          card.delivery.formats.join(", ")
        )
      );
      hasMeta = true;
    }
    if ((_b = card.delivery) == null ? void 0 : _b.scheduleDescription) {
      meta.appendChild(
        createMetaItem(
          cpdDirectoryCopy.schedule,
          card.delivery.scheduleDescription
        )
      );
      hasMeta = true;
    }
    if ((_c = card.delivery) == null ? void 0 : _c.scheduleType) {
      meta.appendChild(
        createMetaItem(cpdDirectoryCopy.scheduleType, card.delivery.scheduleType)
      );
      hasMeta = true;
    }
    if (hasMeta) {
      column.appendChild(meta);
      hasContent = true;
    }
    if (typeof ((_d = card.classification) == null ? void 0 : _d.cpdHours) === "number") {
      const hours = el("div", "phc-directory__card-hours");
      const term = el("p", "phc-directory__card-hours-label");
      term.textContent = cpdDirectoryCopy.cpdHours;
      const value = el("p", "phc-directory__card-hours-value");
      value.textContent = formatCpdHoursValue(card.classification.cpdHours);
      hours.appendChild(term);
      hours.appendChild(value);
      column.appendChild(hours);
      hasContent = true;
    }
    if (card.qrCodeUrl) {
      const qr = el("figure", "phc-directory__card-qr");
      qr.appendChild(
        createImage(
          card.qrCodeUrl,
          cpdDirectoryCopy.qrCodeAlt(card.title),
          "phc-directory__card-qr-image"
        )
      );
      column.appendChild(qr);
      hasContent = true;
    }
    return hasContent ? column : null;
  }
  function createCourseCta(card) {
    if (!card.courseUrl) {
      return null;
    }
    const link = el("a", "phc-directory__card-cta");
    link.setAttribute("href", card.courseUrl);
    link.textContent = cpdDirectoryCopy.courseCta;
    return link;
  }
  function createCardDetails(card) {
    const identity = createIdentityMeta(card);
    const delivery = createDeliveryColumn(card);
    const cta = createCourseCta(card);
    if (!identity && !delivery && !cta) {
      return null;
    }
    const details = el("div", "phc-directory__card-details");
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
  function createFooter(card) {
    var _a;
    const footer = el("div", "phc-directory__card-footer");
    const idRef = el("p", "phc-directory__card-id");
    idRef.textContent = cpdDirectoryCopy.courseRef(card.id);
    footer.appendChild(idRef);
    const footnote = el("p", "phc-directory__card-hours-footnote");
    if (typeof ((_a = card.classification) == null ? void 0 : _a.cpdHours) === "number") {
      footnote.textContent = cpdDirectoryCopy.wbHoursFootnote;
    } else {
      footnote.textContent = "";
    }
    footer.appendChild(footnote);
    return footer;
  }
  function createCpdCourseCard(card) {
    const article = el("article", "phc-directory__card");
    article.setAttribute("data-phc-course-id", card.id);
    article.appendChild(createProviderRow(card));
    const title = el("h3", "phc-directory__card-title");
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
  function createCpdCourseCardList(cards) {
    const section = el("section", "phc-directory__results");
    section.setAttribute("aria-labelledby", "phc-directory-results-heading");
    const heading = el("h2", "phc-directory__results-heading");
    heading.id = "phc-directory-results-heading";
    heading.textContent = cpdDirectoryCopy.resultsHeading;
    section.appendChild(heading);
    const list = el("ul", "phc-directory__card-list");
    cards.forEach((card) => {
      const item = el("li", "phc-directory__card-item");
      item.appendChild(createCpdCourseCard(card));
      list.appendChild(item);
    });
    section.appendChild(list);
    return section;
  }

  // src/specializations/cpd/view-modes.js
  var DEFAULT_CPD_VIEW_MODE = "calendar";
  var CPD_VIEW_MODE_OPTIONS = Object.freeze([
    Object.freeze({ id: "calendar", label: "Nach Datum" }),
    Object.freeze({ id: "catalogue", label: "Katalog" }),
    Object.freeze({ id: "chronological", label: "Chronologische Liste" })
  ]);
  function normalizeViewMode(value) {
    if (value === "catalogue" || value === "chronological" || value === "calendar") {
      return value;
    }
    return DEFAULT_CPD_VIEW_MODE;
  }

  // src/specializations/cpd/sort.js
  function nextStartKey(card) {
    var _a;
    const iso = coerceNextStartIso((_a = card.delivery) == null ? void 0 : _a.nextStart);
    return iso || "9999-12-31";
  }
  function sortCardsByNextStart(cards) {
    if (!Array.isArray(cards)) {
      return Object.freeze([]);
    }
    const indexed = cards.map((card, index) => ({ card, index }));
    indexed.sort((left, right) => {
      const byDate = nextStartKey(left.card).localeCompare(nextStartKey(right.card));
      if (byDate !== 0) {
        return byDate;
      }
      return left.index - right.index;
    });
    return Object.freeze(indexed.map((item) => item.card));
  }

  // src/specializations/cpd/render-list.js
  function el2(tag, className) {
    const node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    return node;
  }
  function formatCredits(hours) {
    if (typeof hours !== "number" || !Number.isFinite(hours)) {
      return cpdDirectoryCopy.emptyCell;
    }
    return Number.isInteger(hours) ? String(hours) : String(hours);
  }
  function displayOrDash(value) {
    return typeof value === "string" && value.trim() !== "" ? value : cpdDirectoryCopy.emptyCell;
  }
  function createCourseCell(card) {
    var _a;
    const cell = el2("td", "phc-directory__schedule-course");
    if (card.courseUrl) {
      const link = el2("a", "phc-directory__schedule-course-link");
      link.setAttribute("href", card.courseUrl);
      link.textContent = card.title;
      cell.appendChild(link);
    } else {
      cell.textContent = card.title;
    }
    if ((_a = card.provider) == null ? void 0 : _a.name) {
      const provider = el2("div", "phc-directory__schedule-provider");
      provider.textContent = card.provider.name;
      cell.appendChild(provider);
    }
    return cell;
  }
  function createCpdChronologicalList(cards) {
    const section = el2("section", "phc-directory__results phc-directory__results--schedule");
    section.setAttribute("aria-labelledby", "phc-directory-results-heading");
    const heading = el2("h2", "phc-directory__results-heading");
    heading.id = "phc-directory-results-heading";
    heading.textContent = cpdDirectoryCopy.scheduleHeading;
    section.appendChild(heading);
    const wrapper = el2("div", "phc-directory__schedule-wrap");
    const table = el2("table", "phc-directory__schedule");
    table.setAttribute("role", "table");
    const thead = el2("thead");
    const headerRow = el2("tr");
    cpdDirectoryCopy.scheduleColumns.forEach((label) => {
      const th = el2("th", "phc-directory__schedule-heading");
      th.setAttribute("scope", "col");
      th.textContent = label;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
    const tbody = el2("tbody");
    cards.forEach((card) => {
      var _a, _b, _c;
      const row = el2("tr", "phc-directory__schedule-row");
      row.setAttribute("data-phc-course-id", card.id);
      const dateCell = el2("td", "phc-directory__schedule-date");
      const nextStart = (_a = card.delivery) == null ? void 0 : _a.nextStart;
      if (typeof nextStart === "string" && /^\d{4}-\d{2}-\d{2}$/.test(nextStart)) {
        const time = el2("time");
        time.setAttribute("datetime", nextStart);
        time.textContent = formatSwissDateShort(nextStart);
        dateCell.appendChild(time);
      } else {
        dateCell.textContent = displayOrDash(
          typeof nextStart === "string" ? formatSwissDateShort(nextStart) : nextStart
        );
      }
      row.appendChild(dateCell);
      row.appendChild(createCourseCell(card));
      const idCell = el2("td", "phc-directory__schedule-id");
      idCell.textContent = card.id;
      row.appendChild(idCell);
      const categoryCell = el2("td", "phc-directory__schedule-category");
      categoryCell.textContent = displayOrDash((_b = card.classification) == null ? void 0 : _b.primaryCategory);
      row.appendChild(categoryCell);
      const creditsCell = el2("td", "phc-directory__schedule-credits");
      creditsCell.textContent = formatCredits((_c = card.classification) == null ? void 0 : _c.cpdHours);
      row.appendChild(creditsCell);
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    wrapper.appendChild(table);
    section.appendChild(wrapper);
    return section;
  }

  // src/specializations/cpd/render-views.js
  function createCpdResultsView(cards, viewMode) {
    const mode = normalizeViewMode(viewMode);
    const source = Array.isArray(cards) ? cards : [];
    if (mode === "chronological") {
      return createCpdChronologicalList(sortCardsByNextStart(source));
    }
    if (mode === "calendar") {
      return createCpdCourseCardList(sortCardsByNextStart(source));
    }
    return createCpdCourseCardList(source);
  }

  // src/bootstrap.js
  var hasStarted = false;
  var categoryOptions = listPrimaryCategories().map(
    (item) => Object.freeze({ id: item.id, label: item.label })
  );
  var viewModeOptions = CPD_VIEW_MODE_OPTIONS.map(
    (item) => Object.freeze({ id: item.id, label: item.label })
  );
  async function loadPublic(config, state) {
    state.setLoading();
    const result = await fetchPublic(config);
    if (!result.ok) {
      report(result, state);
      return;
    }
    const rows = result.payload;
    const transport = validateTransportRows(rows);
    if (!transport.valid) {
      state.setSchemaError({
        rows: Array.isArray(rows) ? rows : [],
        validationResult: transport,
        message: summarizeValidationErrors(transport)
      });
      return;
    }
    let courses;
    try {
      courses = mapPublicRowsToCpdCourses(rows);
    } catch (failure) {
      const message = failure instanceof Error && failure.message ? failure.message : "PUBLIC mapping failed.";
      state.setTransformError({
        rows,
        validationResult: transport,
        message
      });
      return;
    }
    let catalog;
    try {
      catalog = createCatalog(courses, cpdRecordAccessors);
    } catch (failure) {
      const message = failure instanceof Error && failure.message ? failure.message : "Catalog creation failed.";
      state.setCatalogError({
        entries: courses,
        validationResult: transport,
        message
      });
      return;
    }
    const searchText = "";
    const categoryId = "";
    const viewMode = DEFAULT_CPD_VIEW_MODE;
    const searchResult = searchCatalog(
      catalog,
      { text: searchText, categoryId },
      cpdRecordAccessors
    );
    const projectResults = (nextSearchResult) => projectCpdSearchResultToCards(nextSearchResult);
    if (catalog.size === 0) {
      state.setEmpty({
        validationResult: transport,
        entries: courses,
        catalog,
        searchResult,
        searchText,
        categoryId,
        viewMode,
        recordAccessors: cpdRecordAccessors,
        projectResults
      });
      return;
    }
    state.setReady({
      validationResult: transport,
      entries: courses,
      catalog,
      searchResult,
      searchText,
      categoryId,
      viewMode,
      recordAccessors: cpdRecordAccessors,
      projectResults
    });
  }
  function start(hostOptions = {}) {
    var _a, _b;
    if (hasStarted) {
      return;
    }
    hasStarted = true;
    const base = getConfig();
    const config = Object.freeze({
      mountSelector: (_a = hostOptions.mountSelector) != null ? _a : base.mountSelector,
      publicSource: (_b = hostOptions.publicSource) != null ? _b : base.publicSource
    });
    const mount = getMountRoot(config.mountSelector);
    if (!mount.ok) {
      return;
    }
    const state = createState();
    const renderSnapshot = (snapshot) => {
      render(mount.root, snapshot, {
        copy: cpdDirectoryCopy,
        categoryOptions,
        viewModeOptions,
        renderResults(current) {
          const cards = Array.isArray(current.results) ? current.results : [];
          return createCpdResultsView(
            /** @type {import('./specializations/cpd/presentation.js').CpdCourseCardModel[]} */
            cards,
            current.viewMode
          );
        }
      });
    };
    state.subscribe(renderSnapshot);
    renderSnapshot(state.getSnapshot());
    bind(mount.root, {
      onSearchInput(value) {
        state.setSearchText(value);
      },
      onCategoryChange(value) {
        state.setCategoryId(value);
      },
      onViewModeChange(value) {
        state.setViewMode(normalizeViewMode(value));
      }
    });
    loadPublic(config, state).catch((failure) => {
      report(failure, state);
    });
  }

  // scripts/wordpress-bundle-entry.js
  start();
})();
