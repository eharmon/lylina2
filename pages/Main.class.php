<?php

// lylina feed aggregator
// Copyright (C) 2004-2005 Panayotis Vryonis
// Copyright (C) 2005 Andreas Gohr
// Copyright (C) 2006-2010 Eric Harmon

class Main {
	private $db;
	function __construct() {
		global $db;
		global $auth;
		$this->db = $db;
	}

	function render() {
		$render = new Render();
		$render->display('head.tpl');

		$items = new Items($this->db);
		$list = $items->get_items();

		$render->assign('items', $list);
		$render->display('items.tpl');
		$render->display('foot.tpl');
	}
}
