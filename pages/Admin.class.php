<?php

// lylina feed aggregator
// Copyright (C) 2004-2005 Panayotis Vryonis
// Copyright (C) 2005 Andreas Gohr
// Copyright (C) 2006-2010 Eric Harmon

// Handle the admin interface
class Admin {
	// Our handle on the DB
	private $db;
	// Our handle on Auth
	private $auth;
	
	function __construct() {
		global $db;
		$this->db = $db;
		global $auth;
		$this->auth = $auth;
	}

	function render() {
		$render = new Render($this->db);

		// Check our authorization
		//$auth = new Auth($this->db);
		// If we've been posted a password and it's wrong
		//if(isset($_POST['pass']) && !$auth->validate($_POST['pass'])) {
		//	$render->assign('reason', 'Bad password.');
		//	$render->display('auth_fail.tpl');
		//	return;
		//}
		// Otherwise we need to check to see if the user has already logged in or not
		if(!$this->auth->check()) {
			$render->assign('reason', 'No login.');
			$render->display('auth_fail.tpl');
			return;
		}
		if(empty($_GET['op'])) {
			$op = 'main';
		} else {
			$op = $_GET['op'];
		}
		if(function_exists('$this->' . $op)) {
			$this->$op();
		} else {
			$render->assign('reason', 'Bad operation.');
			$render->display('auth_fail.tpl');
			return;
		}
	}

	function main() {
		echo "test";
	}
}
