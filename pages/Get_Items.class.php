<?php

// lylina feed aggregator
// Copyright (C) 2004-2005 Panayotis Vryonis
// Copyright (C) 2005 Andreas Gohr
// Copyright (C) 2006-2010 Eric Harmon

// AJAX display feeds
class Get_Items {
    private $db;
    function __construct() {
        global $db;
        $this->db = $db;
    }

    function render() {
        if(isset($_REQUEST['newest'])) {
            $newest = $_REQUEST['newest'];
        } else {
            $newest = 0;
        }
        if(isset($_REQUEST['pivot'])) {
            $pivot = $_REQUEST['pivot'];
        } else {
            $pivot = false;
        }

        $items = new Items($this->db);

        $list = $items->get_items($newest, $pivot);

        $render = new Render();
        $render->assign('items', $list);
        $render->display('items.tpl');
    }
}
