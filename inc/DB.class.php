<?php

// lylina feed aggregator
// Copyright (C) 2004-2005 Panayotis Vryonis
// Copyright (C) 2005 Andreas Gohr
// Copyright (C) 2006-2010 Eric Harmon

// This class handles DB abstraction via ADODB
class DB {
    // Internal database connection object
    private $db;
    function __construct($db_config) {
        // Setup and connect ADODB
        require_once('lib/adodb5/adodb.inc.php');
        $this->db = ADONewConnection($db_config['db_type']);
        $this->db->Connect($db_config['hostname'], $db_config['user'], $db_config['pass'], $db_config['database']);
    }

    function fetch_rows($query) {
        

