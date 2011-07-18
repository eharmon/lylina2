<?php

// lylina feed aggregator
// Copyright (C) 2004-2005 Panayotis Vryonis
// Copyright (C) 2005 Andreas Gohr
// Copyright (C) 2006-2010 Eric Harmon
// Copyright (C) 2011 Robert Leith

// Fetch feeds
class Update {
    private $db;
    private $auth;
    function __construct() {
        global $db;
        global $auth;
        $this->db = $db;
        $this->auth = $auth;
    }

    function render() {
        $newest = $_REQUEST['newest'];
        $fetch = new Fetch($this->db);
        $fetch->get();

        $query = 'SELECT COUNT(*) 
                  FROM lylina_items';

        if($this->auth->check()) {
            $query .= ' INNER JOIN (lylina_userfeeds) ON (lylina_items.feed_id = lylina_userfeeds.feed_id)';
        }
        
        $query .= ' WHERE id > ? AND UNIX_TIMESTAMP(dt) > UNIX_TIMESTAMP()-(8*60*60)';
        if($this->auth->check()) {
            $query .= ' AND lylina_userfeeds.user_id = ?';
        }

        $result = $this->db->GetRow($query, array($newest, $this->auth->getUserId()));

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
