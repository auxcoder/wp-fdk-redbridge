<?php

$data = \Timber\Timber::get_context();
$country = $_SESSION['country'] ?: 'us';
$data['posts'] = \Timber\Timber::get_posts(array(
  'post_type'    => 'page',
  'posts_per_page' => -1,
  'tax_query' => array(
    array(
      'taxonomy' => 'countries',
      'field'    => 'term_id',
      'terms'    => array(intval($_SESSION['country'])),
      // 'operator' => 'IN', // default
      // 'include_children' => true, // default
    ),
  )
));

if (is_category()) {
  $data['title'] = single_cat_title('', false);
} elseif (is_tag()) {
  $data['title'] = 'Tag Archive';
} elseif (is_tax()) {
  $data['title'] = 'Taxonomy Archive';
} else {
  $data['title'] = 'Archive';
}

\Timber\Timber::render('archive.twig', $data);
