<?php

// lylina feed aggregator
// Copyright (C) 2004-2005 Panayotis Vryonis
// Copyright (C) 2005 Andreas Gohr
// Copyright (C) 2006-2010 Eric Harmon
// Copyright (C) 2011 Robert Leith

// Handle the admin interface
class Admin {
    // Our handle on the DB
    private $db;
    // Our handle on Auth
    private $auth;
    
    function __construct() {
        global $db;
        $this->db = $db;
        global $auth;
        $this->auth = $auth;
    }

    // General TODO: check sanity of all inputs

    function render() {
        $render = new Render($this->db);

        // Check our authorization
        $auth = new Auth($this->db);
        // If we've been posted a password and it's wrong
        if(isset($_POST['user']) && isset($_POST['pass']) && !$auth->validate($_POST['user'], $_POST['pass'])) {
            // TODO: Use a real error handler instead of this
            header('HTTP/1.1 403 Forbidden');
            $render->assign('title', 'There was an error');
            $render->assign('reason', "I'm sorry, the password you entered is incorrect");
            $render->display('auth_fail.tpl');
            return;
        }
        // Otherwise we need to check to see if the user has already logged in or not
        if(!$this->auth->check()) {
            header('HTTP/1.1 403 Not Found');
            $render->assign('title', 'There was an error');
            $render->assign('reason', 'You need to login to perform this operation.');
            $render->display('auth_fail.tpl');
            return;
        }
        if(empty($_REQUEST['op'])) {
            $op = 'main';
        } else {
            $op = $_REQUEST['op'];
        }
        if(method_exists($this, $op)) {
            $this->$op($render);
        } else {
            header('HTTP/1.1 404 Not Found');
            $render->assign('title', 'There was an error');
            $render->assign('reason', 'The page you are looking for does not seem to exist.');
            $render->display('auth_fail.tpl');
            return;
        }
    }

    function login($render) {
        header('Location: index.php');
    }

    function main($render) {
        $feeds = $this->db->GetAll('SELECT *, (SELECT COUNT(*) FROM lylina_items WHERE lylina_items.feed_id = lylina_feeds.id) AS itemcount FROM lylina_feeds ORDER BY name');
        $render->assign('feeds', $feeds);
        $render->assign('title', 'Preferences');
        $render->display('preferences.tpl');
    }

    function add($render) {
        $url = $_REQUEST['url'];
        require_once('lib/simplepie/simplepie.inc');
        $pie = new SimplePie();
        $pie->enable_cache(false);
        $pie->set_autodiscovery_level(SIMPLEPIE_LOCATOR_ALL);
        $pie->set_feed_url($url);
        $pie->init();
        $feed_url = $pie->feed_url;
        $render->assign('url', $url);
        $render->assign('feed_url', $feed_url);
        $render->assign('items', array_slice($pie->get_items(), 0, 5));
        $render->assign('feed', $pie);
        $render->assign('title', 'Adding Feed');
        $render->display('feed_search.tpl');
    }
    function doadd($render) {
        $feed = $_REQUEST['feedurl'];
        $title = $_REQUEST['feedtitle'];
        $this->db->EXECUTE('INSERT IGNORE INTO lylina_feeds (url, name) VALUES(?, ?)', array($feed, $title));
        
        // Immediately fetch so the feed items appear
        $fetch = new Fetch($this->db);
        $fetch->get();

        header('Location: admin');
    }

    function delete($render) {
        $confirm = $_REQUEST['confirm'];
        $id = $_REQUEST['id'];
        if($confirm) {
            $this->db->Execute('DELETE lylina_feeds, lylina_items FROM lylina_feeds LEFT JOIN lylina_items ON lylina_feeds.id = lylina_items.feed_id WHERE lylina_feeds.id = ?', array($id));
            header('Location: admin');
        } else {
            $feed = $this->db->GetAll('SELECT *, (SELECT COUNT(*) FROM lylina_items WHERE lylina_items.feed_id = lylina_feeds.id) AS itemcount FROM lylina_feeds WHERE lylina_feeds.id = ?', array($_REQUEST['id']));
            $render->assign('feed', $feed[0]);
            $render->assign('title', 'Confirm Delete');
            $render->display('confirm_delete.tpl');
        }
    }

    function rename($render) {
        $confirm = $_REQUEST['confirm'];
        $name = $_REQUEST['name'];
        $id = $_REQUEST['id'];
        if($confirm) {
            $this->db->Execute('UPDATE lylina_feeds SET name=? WHERE id=?', array($name, $id));
            header('Location: admin');
        } else {
            $feed = $this->db->GetAll('SELECT * FROM lylina_feeds WHERE id=?', array($id));
            $render->assign('feed', $feed[0]);
            $render->assign('title', 'Rename Feed');
            $render->display('rename_feed.tpl');
        }
    }
    function passwd($render) {
        $old_pass = $_REQUEST['old_pass'];
        $new_pass = $_REQUEST['new_pass'];
        $config = new Config();
        if($this->auth->validate($old_pass)) {
            $config->set('password', $this->auth->hash($new_pass));
            $this->auth->logout();
            $render->assign('auth', false);
            $render->assign('title', 'Password changed');
            $render->assign('reason', "Your password has been changed. You'll need to log in again to continue.");
            $render->display('auth_fail.tpl');
        } else {
            $render->assign('title', 'There was an error changing your password');
            $render->assign('reason', 'Your current password was incorrect. <a href="admin">Try again</a>.');
            $render->display('auth_fail.tpl');
        }
    }
}
