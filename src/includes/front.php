<?php
/* =========================================================================
	 Front-end-specific configuration, scripts and handlers
	 ========================================================================= */

namespace Fabrica\Devkit;

require_once('singleton.php');
require_once('project.php');

class Front extends Singleton
{

  public function init()
  {
    if (is_admin() || wp_doing_ajax()) {
      return;
    }

    add_action('wp_enqueue_scripts', array($this, 'enqueueAssets'));
    // Frontend specific tags, hooks and initializations
    // Fires authenticated Ajax actions for logged-in users.
    add_action('wp_ajax_seCountry', array($this, 'seCountryFn'));
    // Fires non-authenticated Ajax actions for logged-out users.
    add_action('wp_ajax_nopriv_seCountry', array($this, 'seCountryFn'));
    // add_action('action_name', array($this, 'actionHandlerFn'));
    // filters
    add_filter(Project::$varsTag, array($this, 'updateScriptVars'));
    // add_filter('filter_name', array($this, 'filterHandlerFn'));
  }

  public function enqueueAssets()
  {
    wp_enqueue_script(
      Project::$frontHandle,
      get_stylesheet_directory_uri() . '/js/front' . Project::$scriptSuffix . '.js',
      array(),
      null,
      true
    );

    // Pass variables to JavaScript at runtime
    $scriptVars = array();
    $scriptVars = apply_filters(Project::$varsTag, $scriptVars);
    if (!empty($scriptVars)) {
      wp_localize_script(Project::$frontHandle, Project::$namespace, $scriptVars);
    }

    // Front-end stylesheet
    wp_enqueue_style(
      Project::$frontHandle,
      get_stylesheet_directory_uri() . '/css/front' . Project::$styleSuffix . '.css',
      array(),
      null
    );
  }

  public function updateScriptVars($scriptVars = array())
  {
    // Non-destructively merge script variables according to page or query conditions
    if (is_single()) {
      $scriptVars = array_merge($scriptVars, array(
        'nameSpaced' => array(
          'key1' => __('value one', Project::$namespace),
          'key2' => __('value two', Project::$namespace)
        )
      ));
    }
    return $scriptVars;
  }
}

// Create a singleton instance of Front
Front::instance()->init();
