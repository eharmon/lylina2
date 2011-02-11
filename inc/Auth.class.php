<?php

// lylina feed aggregator
// Copyright (C) 2004-2005 Panayotis Vryonis
// Copyright (C) 2005 Andreas Gohr
// Copyright (C) 2006-2010 Eric Harmon

// Provides support for authentication
class Auth {
    // Handle on the DB
    private $db;
    // Handle on the configuration
    private $config;

    function __construct() {
        global $db;
        global $base_config;
        $this->db = $db;
        $this->config = new Config($this->db);
        $this->salt = $base_config['salt'];
    }

    function validate($pass) {
        if($this->config->get('password') == sha1($pass . $this->salt)) {
            // If its a good password, let's start the session and generate a unique fingerprint of the remote user
            @session_start();
            // User agent and remote host help prevent stolen-cookie attacks, may as well make this properly secure
            $_SESSION['key'] = sha1($this->config->get('password') . $_SERVER['HTTP_USER_AGENT'] . $_SERVER['REMOTE_ADDR'] . $this->salt);
            return true;
        } else {
            return false;
        }
    }

    function check() {
        @session_start();
        if(isset($_SESSION['key']) && $_SESSION['key'] == sha1($this->config->get('password') . $_SERVER['HTTP_USER_AGENT'] . $_SERVER['REMOTE_ADDR'] . $this->salt)) {
            return true;
        } else {
            return false;
        }
    }

    function logout() {
        // To logout we just have to destroy the session, this will break the key and the users session will be invalid
        @session_start();
        $_SESSION = array();
        @session_destroy();
        // TODO: Delete the cookie? It works fine without doing so, and this is very ugly, thanks PHP!
    }
}
