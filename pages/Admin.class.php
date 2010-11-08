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
		$auth = new Auth($this->db);
		// If we've been posted a password and it's wrong
		if(isset($_POST['pass']) && !$auth->validate($_POST['pass'])) {
			$render->assign('reason', 'Bad password.');
			$render->display('auth_fail.tpl');
			return;
		}
		// Otherwise we need to check to see if the user has already logged in or not
		if(!$this->auth->check()) {
			$render->assign('reason', 'No login.');
			$render->display('auth_fail.tpl');
			return;
		}
		if(empty($_REQUEST['op'])) {
			$op = 'main';
		} else {
			$op = $_REQUEST['op'];
		}
		if(method_exists($this, $op)) {
			$this->$op($render);
		} else {
			$render->assign('reason', 'Bad operation.');
			$render->display('auth_fail.tpl');
			return;
		}
	}

	function login($render) {
		header('Location: index.php');
	}

	function main($render) {
		$feeds = $this->db->GetAll('SELECT *, (SELECT COUNT(*) FROM lylina_items WHERE lylina_items.feed_id = lylina_feeds.id) AS itemcount FROM lylina_feeds ORDER BY name');
		$render->assign('feeds', $feeds);
		$render->assign('title', 'Preferences');
		$render->display('preferences.tpl');
	}

	function add($render) {
		$url = $_REQUEST['url'];
		require_once('lib/simplepie/simplepie.inc');
		$pie = new SimplePie();
		$pie->enable_cache(false);
		$pie->set_autodiscovery_level(SIMPLEPIE_LOCATOR_ALL);
		$pie->set_feed_url($url);
		$pie->init();
		$feed_url = $pie->feed_url;
		$render->assign('url', $url);
		$render->assign('feed_url', $feed_url);
		$render->assign('items', array_slice($pie->get_items(), 0, 5));
		$render->assign('feed_title', $pie->get_title());
		$render->assign('title', 'Adding Feed');
		$render->display('feed_search.tpl');
	}
	function doadd($render) {
		$feed = $_REQUEST['feedurl'];
		$title = $_REQUEST['feedtitle'];
		$this->db->EXECUTE('INSERT IGNORE INTO lylina_feeds (url, name) VALUES(?, ?)', array($feed, $title));
		header('Location: admin');
	}

	function delete($render) {
		$confirm = $_REQUEST['confirm'];
		$id = $_REQUEST['id'];
		if($confirm) {
			$this->db->Execute('DELETE lylina_feeds, lylina_items FROM lylina_feeds LEFT JOIN lylina_items ON lylina_feeds.id = lylina_items.feed_id WHERE lylina_feeds.id = ?', array($id));
			header('Location: admin');
		} else {
			$feed = $this->db->GetAll('SELECT *, (SELECT COUNT(*) FROM lylina_items WHERE lylina_items.feed_id = lylina_feeds.id) AS itemcount FROM lylina_feeds WHERE lylina_feeds.id = ?', array($_REQUEST['id']));
			$render->assign('feed', $feed[0]);
			$render->assign('title', 'Confirm Delete');
			$render->display('confirm_delete.tpl');
		}
	}
}
