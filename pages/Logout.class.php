<?php

// lylina feed aggregator
// Copyright (C) 2004-2005 Panayotis Vryonis
// Copyright (C) 2005 Andreas Gohr
// Copyright (C) 2006-2010 Eric Harmon

// Handle logout
class Logout {
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
		$this->auth->logout();
		header('Location: index.php');
	}
}
