<?php

// lylina feed aggregator
// Copyright (C) 2004-2005 Panayotis Vryonis
// Copyright (C) 2005 Andreas Gohr
// Copyright (C) 2006-2010 Eric Harmon
// Copyright (C) 2011 Robert Leith

// Mark things as read
class Read {
    private $db;
    private $auth;
    function __construct() {
        global $db;
        global $auth;
        $this->db = $db;
        $this->auth = $auth;
    }

    function render() {
        $item_id = $_REQUEST['id'];

        if($this->auth->check()) {
            $this->db->Execute('INSERT INTO lylina_vieweditems (user_id, item_id, viewed) VALUES(?, ?, 1)',
                               array($this->auth->getUserId(), $item_id));
        } else {
            $this->db->Execute('UPDATE lylina_items SET viewed = 1 WHERE id = ?', $item_id);
        }
    }
}
