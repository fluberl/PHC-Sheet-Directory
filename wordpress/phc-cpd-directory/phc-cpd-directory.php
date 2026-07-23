<?php
/**
 * Plugin Name:       PHC CPD Directory
 * Plugin URI:        https://swiss-online-marketing-agentur.ch/
 * Description:       Embeds the PHC Schweiz CPD directory with the shortcode [phc_cpd_directory]. Loads live Google Sheets data via the existing application configuration.
 * Version:           1.0.5
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            Ulf Toelle
 * Author URI:        https://swiss-online-marketing-agentur.ch/about
 * License:           Proprietary
 * Text Domain:       phc-cpd-directory
 */

if (!defined('ABSPATH')) {
	exit;
}

final class PHC_CPD_Directory_Plugin {
	const VERSION = '1.0.5';
	const SHORTCODE = 'phc_cpd_directory';
	const STYLE_HANDLE = 'phc-cpd-directory';
	const SCRIPT_HANDLE = 'phc-cpd-directory';

	/** @var bool */
	private static $assets_enqueued = false;

	/**
	 * Bootstrap WordPress hooks.
	 */
	public static function init() {
		add_shortcode(self::SHORTCODE, array(__CLASS__, 'render_shortcode'));
		add_action('wp_enqueue_scripts', array(__CLASS__, 'maybe_enqueue_from_post'), 20);
	}

	/**
	 * Shortcode: exact fixed mount root only. No attributes.
	 *
	 * @param array|string $atts Unused; attributes are intentionally ignored.
	 * @return string
	 */
	public static function render_shortcode($atts = array()) {
		self::enqueue_assets();

		return '<div id="phc-cpd-directory"></div>';
	}

	/**
	 * Enqueue early when the shortcode appears in the main singular post content.
	 * Shortcode callback also enqueues for page builders that render later.
	 */
	public static function maybe_enqueue_from_post() {
		if (!is_singular()) {
			return;
		}

		$post = get_post();
		if (!$post instanceof WP_Post) {
			return;
		}

		if (has_shortcode($post->post_content, self::SHORTCODE)) {
			self::enqueue_assets();
		}
	}

	/**
	 * Conditionally enqueue CSS + production IIFE bundle only.
	 * Nested application ESM modules are not shipped and must not be loaded.
	 */
	public static function enqueue_assets() {
		if (self::$assets_enqueued) {
			return;
		}

		$plugin_dir = plugin_dir_path(__FILE__);
		$plugin_url = plugin_dir_url(__FILE__);

		$css_rel = 'assets/css/phc-directory.css';
		$js_rel = 'assets/js/phc-cpd-directory.bundle.js';
		$css_path = $plugin_dir . $css_rel;
		$js_path = $plugin_dir . $js_rel;

		if (!is_readable($css_path) || !is_readable($js_path)) {
			return;
		}

		$css_version = self::asset_version($css_path);
		$js_version = self::asset_version($js_path);

		wp_enqueue_style(
			self::STYLE_HANDLE,
			$plugin_url . $css_rel,
			array(),
			$css_version
		);

		wp_enqueue_script(
			self::SCRIPT_HANDLE,
			$plugin_url . $js_rel,
			array(),
			$js_version,
			true
		);

		self::$assets_enqueued = true;
	}

	/**
	 * @param string $path Absolute filesystem path.
	 * @return string
	 */
	private static function asset_version($path) {
		$mtime = @filemtime($path);
		if (false === $mtime) {
			return self::VERSION;
		}

		return self::VERSION . '.' . (string) $mtime;
	}
}

PHC_CPD_Directory_Plugin::init();
