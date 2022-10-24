<?php

/**
 * Template Name: Home Parallax
 * Description: A Page Template with a parallax design.
 * @package    UXC
 * @subpackage Timber
 * @since      Timber 0.2
 */

$data = \Timber\Timber::get_context();
// $data['post'] = new \Timber\Post();
$data['countries'] = \Timber\Timber::get_terms('countries');
$data['footer'] = \Timber\Timber::get_sidebar('footer.php');
$data['nonce'] = wp_create_nonce("abc");
\Timber\Timber::render('home.twig', $data);
