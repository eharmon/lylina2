<?php

// lylina feed aggregator
// Copyright (C) 2004-2005 Panayotis Vryonis
// Copyright (C) 2005 Andreas Gohr
// Copyright (C) 2006-2010 Eric Harmon

require_once('lib/smarty/libs/Smarty.class.php');

// This class supports display through Smarty
class Render extends Smarty {
    function __construct() {
        parent::__construct();

        // Pull in the auth object so we can tell templates if we're properly authenticated or not
        global $auth;
        $this->assign('auth', $auth->check());

        // Assign a false title by default so we don't get warnings about title being undefined
        $this->assign('title', false);

        // Assign a false updates by default
        $this->assign('update', false);

        // Get rid of whitespace
        $this->loadFilter("output","trimwhitespace");

        // Smarty defaults to { and }, which is used by script tags and CSS and is thus stupid, fix here
        $this->left_delimiter = '{{';
        $this->right_delimiter = '}}';
    }
}

?>
