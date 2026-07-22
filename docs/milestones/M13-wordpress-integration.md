# Milestone 13 — WordPress Page Integration

**Status:** Implemented (pending commit)
**Date:** 22 July 2026

## Why

Milestone 12 delivered a production-ready CPD directory on the published
Google Sheets CSV. Milestone 13 embeds that same application into WordPress
without redesigning discovery, presentation, or the datasource.

## Chosen integration approach

**Self-contained WordPress plugin** with shortcode `[phc_cpd_directory]`.

### Why this approach

| Option | Verdict |
|--------|---------|
| Inline script/CSS in the WP editor | Rejected — unsafe, unmaintainable, breaks updates |
| Theme `functions.php` edits | Rejected — unnecessary theme coupling |
| iframe embed | Rejected — native mount is safe and already scoped |
| Bundler + single IIFE | Deferred — ADR prefers no bundler; native ESM works |
| **Plugin + synced `src/` + CSS + tiny ESM entry** | **Chosen** — smallest reliable native mount |

The demo host already used the fixed root `#phc-cpd-directory` and bare
`start()`. The plugin mirrors that contract.

## Mount-point contract

Shortcode output is exactly:

```html
<div id="phc-cpd-directory"></div>
```

- Fixed ID only — not configurable
- Application initializes only against `#phc-cpd-directory`
- If the root is absent, `start()` returns without initializing and without
  throwing or logging
- Assets are enqueued only when the shortcode renders (or is detected in
  singular post content)

## Plugin layout

```text
wordpress/phc-cpd-directory/
  phc-cpd-directory.php      Main plugin file
  readme.txt                 Short pointer to M13 docs
  assets/
    css/phc-directory.css    Synced from assets/styles/
    js/phc-cpd-directory.js  ESM entry → start()
    js/src/                  Synced application modules
    DEPLOYED.json            Deploy stamp
```

## Installation steps

1. From the repository root, refresh plugin assets:

   ```bash
   npm run deploy:wordpress
   ```

2. Zip the plugin folder so the archive root is `phc-cpd-directory/`:

   ```bash
   cd wordpress
   zip -r phc-cpd-directory.zip phc-cpd-directory \
     -x "*.DS_Store" -x "*/.git/*"
   ```

3. In WordPress Admin → **Plugins → Add New → Upload Plugin**, upload
   `phc-cpd-directory.zip` and activate **PHC CPD Directory**.

4. Edit the CPD page (Thrive or block editor). Insert a shortcode element:

   ```text
   [phc_cpd_directory]
   ```

5. Publish and view the page. The directory should load live sheet data inside
   the mount root only.

## Asset deployment / update process

After any application change (CSS, JS, datasource config):

1. `npm run deploy:wordpress` — copies `assets/styles/phc-directory.css` and
   `src/` into the plugin.
2. Re-zip and replace the plugin on WordPress (upload new zip, or overwrite
   `wp-content/plugins/phc-cpd-directory/` via SFTP).
3. Hard-refresh the CPD page (asset URLs include `filemtime` cache busting).

Do **not** paste application source into the WordPress editor.

## Cache-busting strategy

`wp_enqueue_style` / `wp_enqueue_script` versions are:

`{pluginVersion}.{filemtime}`

Updating deployed files changes the query string automatically.

## CSS isolation

- All rules remain under `#phc-cpd-directory`
- No `body` / `html` / unscoped element styling
- Provider byline selectors are reinforced so theme `a` rules do not restore
  default underlined link chrome inside the mount

## JavaScript isolation

- Entry module calls `start()` once (`hasStarted` guard in bootstrap)
- No global namespace export
- Interaction remains scoped to the mount root
- Scripts load as `type="module"` only when the shortcode is present
- Datasource URL stays in `src/config/phc-public-cpd.js` — not duplicated in PHP

## Production datasource

Unchanged published Google Sheets CSV from Milestone 12 application config.
WordPress PHP does not contain the Sheets URL.

## Verification checklist

| Check | Result |
|-------|--------|
| Shortcode outputs exact mount div | Pass (plugin source) |
| Assets conditional on shortcode | Pass (enqueue in shortcode + singular detect) |
| No Sheets URL in PHP | Pass |
| CSS scoped under `#phc-cpd-directory` | Pass (`verify:architecture`) |
| Silent no-op without mount root | Pass (bootstrap) |
| Existing app tests | Pass |
| Architecture verification | Pass |
| `git diff --check` | Pass |

Manual WordPress page checks (after upload):

- Live 5-course sheet, search, category, three views, editorial cards,
  images/logos, Mehr lesen, QR, registration links, no theme chrome damage,
  no horizontal overflow, no assets on unrelated pages.

## Rollback / removal

1. Deactivate and delete **PHC CPD Directory** in Plugins.
2. Remove the shortcode from the page.
3. No theme files were modified; nothing else to revert.

## Known limitations

- Page builders that strip shortcodes from `post_content` still work when the
  shortcode executes at render time (enqueue runs inside the shortcode
  callback). Early `has_shortcode($post->post_content)` is a best-effort
  optimization only.
- Native ES modules require a modern browser (acceptable for this product).
- Plugin ships a copy of `src/`; always run `npm run deploy:wordpress` before
  packaging so WordPress receives current assets.

## Commit status

Not committed. Not pushed.
