<?php

// lylina feed aggregator
// Copyright (C) 2004-2005 Panayotis Vryonis
// Copyright (C) 2005 Andreas Gohr
// Copyright (C) 2006-2010 Eric Harmon

// This class provide an interface for manipulating the global configuration
class Config {
    // Handle on the DB
    private $db;
    
    function __construct() {
        global $db;
        $this->db = $db;
    }

    // Get a particular config value
    function get($key) {
        $result = $this->db->GetRow('SELECT value FROM lylina_preferences WHERE name=?', array($key));
        if($result) {
            return $result['value'];
        } else {
            return false;
        }
    }
    
    function set($name, $value) {
        if($this->get($name)) {
            $this->db->Execute('UPDATE lylina_preferences SET value=? WHERE name=?', array($value, $name));
        } else {
            $this->db->Execute('INSERT INTO lylina_preferences (name, value) VALUES (?, ?)', array($name, $value));
        }
    }

}
