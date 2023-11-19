<?php
namespace Bigup\Contact_Form;

/**
 * Plugin Name: Bigup Web: Contact Form
 * Plugin URI: https://jeffersonreal.uk
 * Description: An SMTP/local mailer contact form, including widget and shortcode.
 * Version: 0.6.5
 * Author: Jefferson Real
 * Author URI: https://jeffersonreal.uk
 * License: GPL2
 *
 * @package bigup-contact-form
 * @author Jefferson Real <me@jeffersonreal.uk>
 * @copyright Copyright (c) 2023, Jefferson Real
 * @license GPL2+
 * @link https://jeffersonreal.uk
 */

/**
 * Set this plugin's base URL constant for use throughout the plugin.
 * 
 * There is no in-built WP function to get the base URL for a plugin, so this constant allows us to
 * write relative file references, making code portable.
 */
$url = trailingslashit( plugin_dir_url( __FILE__ ) );
define( 'BIGUPCF_URL', $url );
$path = trailingslashit( plugin_dir_path( __FILE__ ) );
define( 'BIGUPCF_PATH', $path );

/**
 * Load PHP autoloader to ready the classes.
 */
require_once( plugin_dir_path( __FILE__ ) . 'classes/autoload.php');

/**
 * Init class which in turn calls all plugin dependencies.
 */
new Init();
