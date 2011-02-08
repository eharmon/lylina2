<?php

// lylina feed aggregator
// Copyright (C) 2004-2005 Panayotis Vryonis
// Copyright (C) 2005 Andreas Gohr
// Copyright (C) 2006-2010 Eric Harmon

// Fetch feeds
class Update {
    private $db;
    function __construct() {
        global $db;
        $this->db = $db;
    }

    function render() {
        $newest = $_REQUEST['newest'];
        $fetch = new Fetch($this->db);
        $fetch->get();

        $result = $this->db->GetRow('SELECT COUNT(*) FROM lylina_items WHERE id > ? AND UNIX_TIMESTAMP(dt) > UNIX_TIMESTAMP()-(8*60*60)', $newest);

        if($result) {
            $count = $result['COUNT(*)'];
        } else {
            $count = 0;
        }

        $render = new Render();
        $render->assign('count', $count);
        $render->display('update.tpl');
    }
}
