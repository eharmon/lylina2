<?php

// lylina feed aggregator
// Copyright (C) 2004-2005 Panayotis Vryonis
// Copyright (C) 2005 Andreas Gohr
// Copyright (C) 2006-2010 Eric Harmon
// Copyright (C) 2011 Robert Leith

// Item operations?
// TODO: Define relationship with other classes
class Items {
    private $db;
    private $auth;
    function __construct() {
        global $db;
        global $auth;
        $this->db = $db;
        $this->auth = $auth;
    }

    function get_items($newest = 0, $pivot = 0) {
        $args = array();

        // Build select
        $select_clause = "SELECT lylina_items.id, 
                                 lylina_items.url, 
                                 lylina_items.title, 
                                 lylina_items.body, 
                                 UNIX_TIMESTAMP(lylina_items.dt) AS timestamp, 
                                 lylina_feeds.url AS feed_url, 
                                 lylina_feeds.name AS feed_name";

        if($this->auth->check()) {
            $select_clause .= ", COALESCE(lylina_vieweditems.viewed,0) AS viewed";
        } else {
            $select_clause .= ", lylina_items.viewed";
        }

        // Build from and join
        $from_clause = "FROM lylina_items";
        if($this->auth->check()) {
            $from_clause .= " INNER JOIN (lylina_userfeeds) ON (lylina_items.feed_id = lylina_userfeeds.feed_id)";
            $from_clause .= " LEFT JOIN (lylina_vieweditems) ON (lylina_userfeeds.user_id = lylina_vieweditems.user_id AND lylina_items.id = lylina_vieweditems.item_id)";
        }
        $from_clause .= " INNER JOIN (lylina_feeds) ON (lylina_items.feed_id = lylina_feeds.id)";

        // Build where
        $where_clause = "WHERE ";

        if($pivot > 0) {
            $where_clause .= "lylina_items.id < ? 
                              AND lylina_items.id > ?";
            $args[] = $pivot;
            $args[] = $newest;
        } else {
            $where_clause .= "UNIX_TIMESTAMP(lylina_items.dt) > UNIX_TIMESTAMP()-(8*60*60) 
                              AND lylina_items.id > ?";
            $args[] = $newest;
        }
        if($this->auth->check()) {
            $where_clause .= " AND lylina_userfeeds.user_id = ?";
            $args[] = $this->auth->getUserId();
        }

        // Build suffix
        $suffix = "ORDER BY lylina_items.dt DESC";
        if($pivot > 0) {
            $suffix .= " LIMIT 100";
        }

        // Assemble final query
        $query = "$select_clause $from_clause $where_clause $suffix";
        //error_log($query);
        //error_log(implode($args));
        $items = $this->db->GetAll($query, $args);

        // Only calculate newest if pivot is not set
        if(!$pivot) {
            $newest_read = 0;

            // Find out what the newest one we've read is
            foreach($items as &$item) {
                if($item['viewed'] && $item['id'] > $newest_read) {
                    $newest_read = $item['id'];
                }
            }

            // If its newer than the newest item on this page, use that as the "newest" instead, likely the user browsed from a different location
            if($newest_read > $newest) {
                $newest = $newest_read;
            }
        }

        foreach($items as &$item) {
            // If we have a newer item, mark it as new
            if($newest && $item['id'] > $newest) {
                $item['new'] = 1;
            } else {
                $item['new'] = 0;
            }
            // Format the date for headers
            $item['date'] = date('l F j, Y', $item['timestamp']);
        }

        return $items;
    }
}   
