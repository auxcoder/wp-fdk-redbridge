<?php

$data = \Timber\Timber::get_context();
$data['footer'] = Timber::get_sidebar('footer.php');
\Timber\Timber::render('index.twig', $data);
