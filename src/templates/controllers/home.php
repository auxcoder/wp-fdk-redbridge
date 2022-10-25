<?php

/**
 * Template Name: Home Parallax
 * Description: A Page Template with a parallax design.
 * @package    UXC
 * @subpackage Timber
 * @since      Timber 0.2
 */

$data = \Timber\Timber::get_context();
$data['countries'] = \Timber\Timber::get_terms('countries');
$data['session'] = $_SESSION;
\Timber\Timber::render('home.twig', $data);
