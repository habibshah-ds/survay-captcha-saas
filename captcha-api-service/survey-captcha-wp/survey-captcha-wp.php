<?php
/**
 * Plugin Name: Survey CAPTCHA
 * Description: Human-friendly CAPTCHA using survey + proof-of-work.
 * Version: 1.0.0
 * Author: Your Name
 */

if (!defined('ABSPATH')) exit;

// ------- SETTINGS -------
define("SC_API_URL", "https://your-api.com");  // Your API endpoint
define("SC_SITE_KEY", "YOUR_SITE_KEY_HERE");  // Client's site_key

// ------- LOAD SCRIPTS -------
function sc_load_scripts() {
    wp_enqueue_style("sc-style", plugin_dir_url(__FILE__) . "assets/widget.css", [], "1.0");
    wp_enqueue_script("sc-script", plugin_dir_url(__FILE__) . "assets/widget.js", [], "1.0", true);

    // Pass PHP data (like site_key) to JS
    wp_localize_script("sc-script", "SC_DATA", [
        "apiBase" => SC_API_URL,
        "siteKey" => SC_SITE_KEY
    ]);
}
add_action("wp_enqueue_scripts", "sc_load_scripts");


// ------- SHORTCODE -------
function sc_shortcode_render() {
    ob_start(); ?>

    <div id="sc-captcha-box" class="sc-widget">
        <!-- loading animation -->
        <div id="sc-loading" class="sc-loading">
            <div class="sc-spinner"></div>
            <div>Loading CAPTCHA...</div>
        </div>

        <!-- CAPTCHA UI loads here -->
        <div id="sc-inner"></div>
    </div>

    <?php return ob_get_clean();
}
add_shortcode("survey_captcha", "sc_shortcode_render");

