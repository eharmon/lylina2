<?php

// lylina feed aggregator
// Copyright (C) 2004-2005 Panayotis Vryonis
// Copyright (C) 2005 Andreas Gohr
// Copyright (C) 2006-2010 Eric Harmon

// AJAX display feeds
class Items {
	private $db;
	function __construct() {
		global $db;
		$this->db = $db;
	}

	function render() {
		$newest = $_REQUEST['newest'];
		$items = $this->db->GetAll('SELECT lylina_items.id, lylina_items.url, lylina_items.title, lylina_items.body, UNIX_TIMESTAMP(lylina_items.dt) AS timestamp, lylina_items.viewed, lylina_feeds.url AS feed_url, lylina_feeds.name AS feed_name FROM lylina_items, lylina_feeds WHERE UNIX_TIMESTAMP(lylina_items.dt) > UNIX_TIMESTAMP()-(8*60*60) AND lylina_items.feed_id = lylina_feeds.id ORDER BY lylina_items.dt DESC');

		foreach($items as &$item) {
			// If we have a newer item, mark it as new
			if($newest && $item['id'] > $newest) {
				$item['new'] = 1;
			}
			print "\n";
			// Format the date for headers
			$item['date'] = date('l F j, Y', $item['timestamp']);
		}

		$render = new Render();
		$render->assign('items', $items);
		$render->display('items.tpl');
	}
}
