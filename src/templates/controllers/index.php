<?php

$data = \Timber\Timber::get_context();
$data['footer'] = \Timber\Timber::get_sidebar('footer.php');
\Timber\Timber::render('index.twig', $data);
