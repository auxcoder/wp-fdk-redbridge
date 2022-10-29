<?php

/**
 * Template Name: Home Page
 * Description: A Page Template with a parallax design.
 * @package    UXC
 * @subpackage Timber
 * @since      Timber 0.2
 */

$data = \Timber\Timber::get_context();
$data['countries'] = \Timber\Timber::get_terms([
  'taxonomy' => 'countries',
  'orderby'  => 'slug',
]);
$data['country'] = $_SESSION['country'] ?: 'us';
\Timber\Timber::render('home.twig', $data);
