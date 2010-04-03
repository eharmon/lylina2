<?php

// lylina feed aggregator
// Copyright (C) 2004-2005 Panayotis Vryonis
// Copyright (C) 2005 Andreas Gohr
// Copyright (C) 2006-2010 Eric Harmon

// Mark things as read
class Read {
	private $db;
	function __construct() {
		global $db;
		$this->db = $db;
	}

	function render() {
		$item_id = $_REQUEST['id'];
		$this->db->Execute('UPDATE lylina_items SET viewed = 1 WHERE id = ?', $item_id);
	}
}
