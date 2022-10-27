<?php
/* =========================================================================
   Ajax calls and handlers
   ========================================================================= */

namespace Fabrica\Devkit;

require_once('project.php');

class Ajax extends Singleton
{

  public function __construct()
  {
    // Namespaced tags
    $this->postNonce = Project::$namespace . '-post-nonce';
  }

  public function init()
  {
    add_filter(Project::$varsTag, array($this, 'scriptVars'));
    // AJAX handler functions as required
    add_action('wp_ajax_nopriv_setCountry', array($this, 'ajaxHandler'));
    add_action('wp_ajax_setCountry', array($this, 'ajaxHandler'));
  }

  // Send script variables to front end
  public function scriptVars($scriptVars = array())
  {
    // exposed as window[Project::$varsTag].nameSpaced.adminAjax
    $scriptVars = array_merge($scriptVars, array(
      'nameSpaced' => array(
        'hostUrl' => __(get_site_url(), Project::$namespace),
        'ajaxUrl' => __(admin_url('admin-ajax.php'), Project::$namespace),
        'postNonce' => wp_create_nonce($this->postNonce),
      )
    ));

    // Non-destructively merge script variables according to page or query conditions
    if (is_single()) {
      // exposed as window[Project::$varsTag].nameSpaced.key1
      $scriptVars = array_merge($scriptVars, array(
        'nameSpaced' => array(
          'key1' => __('value one', Project::$namespace),
          'key2' => __('value two', Project::$namespace)
        )
      ));
    }
    return $scriptVars;
  }

  // Handle AJAX requests
  public function ajaxHandler()
  {
    if (isset($_POST['postNonce'])) {
      $nonce = $_POST['postNonce'];
    } else {
      $this->sendAjaxResponse(array('success' => false, 'error' => "Couldn't retrieve nonce."));
    }

    if (!wp_verify_nonce($nonce, $this->postNonce)) {
      $this->sendAjaxResponse(array('success' => false, 'error' => 'Invalid nonce.'));
    }

    // Retrieve submitted data
    if (!isset($_POST['termId'])) {
      $this->sendAjaxResponse(array('success' => false, 'error' => "Couldn't retrieve termId."));
    }

    // Act on it
    $_SESSION['country'] = isset($_POST['termId']) ? $_POST['termId'] : null;
    $country = get_term($_POST['termId']);
    // Add data to response + send!
    $this->sendAjaxResponse(array('success' => true, 'data' => $country));
  }

  // Send AJAX responses
  public function sendAjaxResponse($response)
  {
    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
  }
}

// Create a singleton instance of Ajax
Ajax::instance()->init();
