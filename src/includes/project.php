<?php
/* =========================================================================
   Project-specific configuration, scripts and handlers
   ========================================================================= */

namespace Fabrica\Devkit;

require_once('singleton.php');

class Project extends Singleton
{

  // Namespace for this project
  public static $namespace = 'uxc';

  // Tag for passing data to front-end scripts
  public static $varsTag = 'uxc_script_vars';

  // Handle for front-end assets
  public static $frontHandle = 'uxc-front';

  // Menus required
  public static $menus = array('main' => 'Main menu');

  // Google Analytics ID (injected by Base class)
  public static $googleAnalyticsId = '';

  // Assets timestamp + environment suffixes
  public static $scriptSuffix, $styleSuffix = '';

  public function init()
  {

    // If in production mode, load minified timestamped assets
    if (WP_DEBUG !== true) {
      self::$scriptSuffix = '.' . SCRIPT_BUILD_TIME . '.min';
      self::$styleSuffix = '.' . STYLE_BUILD_TIME . '.min';
    }

    // Extra theme support options
    add_theme_support('editor-styles');
    add_theme_support('align-wide');
    add_theme_support('align-full');

    // Project-specific tags, hooks and initializations
    add_action('init', array($this, 'registerStructure'));
    add_action('widgets_init', array($this, 'registerWidgetFooterOne'));
    add_action('widgets_init', array($this, 'registerWidgetFooterTwo'));
    // add_action('action_name', array($this, 'actionHandler'));
    // add_filter('filter_name', array($this, 'filterHandler'));
  }

  // Register Custom Post Types and Taxonomies
  public function registerStructure()
  {
    // http://generatewp.com/ has a useful generator
  }

  public function registerWidgetFooterOne()
  {
    register_sidebar(array(
      'name' => __('Footer Widget Area 1', Project::$namespace),
      'id' => 'footer-1',
      'description' => 'Appears in the footer section of the site.',
      'before_widget' => '<div id="%1$s" class="widget %2$s">',
      'after_widget' => '</div>',
      'before_title' => '<h4 class="widget-title">',
      'after_title' => '</h4>'
    ));
  }

  public function registerWidgetFooterTwo()
  {
    register_sidebar(array(
      'name' => __('Footer Widget Area 2', Project::$namespace),
      'id' => 'footer-2',
      'description' => 'Appears in the footer section of the site.',
      'before_widget' => '<div id="%1$s" class="widget %2$s">',
      'after_widget' => '</div>',
      'before_title' => '<h4 class="widget-title">',
      'after_title' => '</h4>'
    ));
  }
}

// Create a singleton instance of Project
Project::instance()->init();
