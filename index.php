<?php

// lylina feed aggregator
// Copyright (C) 2004-2005 Panayotis Vryonis
// Copyright (C) 2005 Andreas Gohr
// Copyright (C) 2006-2010 Eric Harmon

// Load in the configuration to start
$base_config = parse_ini_file("config.ini");

// Set up our autoloads
function lylina_autoload($name) {
	// Load utility classes
	if(file_exists("inc/$name.class.php")) {
		include("inc/$name.class.php");
	// Load page classes
	} elseif(file_exists("pages/$name.class.php")) {
		include("pages/$name.class.php");
	}
}
spl_autoload_register("lylina_autoload");

// Switch to UTF-8
@setlocale(LC_ALL, "UTF-8");

// Set up time
ini_set('date.timezone', $base_config['zone']);

// Include ADODB Library
require_once('lib/adodb5/adodb.inc.php');

// Create our DB object
$db = ADONewConnection($base_config['type']);
$db->Connect($base_config['hostname'], $base_config['user'], $base_config['pass'], $base_config['database']);

// Handle login
$auth = new Auth();
if(isset($_POST['pass'])) {
	$auth->validate($_POST['pass']);
}

// Handle requests
if(isset($_REQUEST['p'])) {
	$page = ucfirst($_REQUEST['p']);
} else {
	$page = "Main";
}

// Load corresponding page Class and excute
$content = new $page();
$content->render();

?>
