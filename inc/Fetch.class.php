<?php

// lylina feed aggregator
// Copyright (C) 2004-2005 Panayotis Vryonis
// Copyright (C) 2005 Andreas Gohr
// Copyright (C) 2006-2010 Eric Harmon

// This class handles fetching feeds for us
class Fetch {
    // Our object for database access
    private $db;
    // The global configuration object
    private $config;

    function __construct() {
        global $db;
        $this->db = $db;
        // Include what we need to parse a feed
        require_once('lib/htmlpurifier/library/HTMLPurifier.auto.php');
        require_once('lib/simplepie/simplepie.inc');
        require_once('inc/SimplePie_Sanitize_Null.class.php');
    }
    
    function get() {
        $purifier_config = HTMLPurifier_Config::createDefault();
        $purifier_config->set('Cache.SerializerPath', 'cache');
        // TODO: This feature is very nice, but breaks titles now that we purify them. Titles only need their entities fixed, so we shouldn't really purify them allowing us to turn this back on
#       $purifier_config->set('AutoFormat.Linkify', true);
        // Allow flash embeds in newer versions of purifier
        $purifier_config->set('HTML.SafeObject', true);
        $purifier_config->set('Output.FlashCompat', true);
        $purifier_config->set('HTML.FlashAllowFullScreen', true);
        $purifier = new HTMLPurifier($purifier_config);

        $query = 'SELECT * FROM lylina_feeds';
        $feeds = $this->db->GetAll($query);
        
        $pie = new SimplePie();
        $pie->enable_cache(false);
        $pie->set_sanitize_class('SimplePie_Sanitize_Null');
        $pie->set_autodiscovery_level(SIMPLEPIE_LOCATOR_ALL);
        $pie->enable_order_by_date(false);

        // Array storing feeds which need to be parsed
        $feeds_parse = array();

        // Keep track of how many we need to parse
        $feeds_count = 0;

        // Build array of feeds to fetch and their metadata
        foreach($feeds as $feed) {
            // Track our cache
            $mod_time = -1;
            $cache_path = 'cache/' . md5($feed['url']) . '.xml';
            if(file_exists($cache_path)) {
                $mod_time = @filemtime($cache_path);
                $filemd5 = @md5_file($cache_path);
            } else {
                $mod_time = -1;
                $filemd5 = 0;
            }
            // If our cache is older than 5 minutes, or doesn't exist, fetch new feeds
            if(time() - $mod_time > 300 || $mod_time == -1) {
            #if(true) {
                $feeds_parse[$feeds_count] = array();
                        $feeds_parse[$feeds_count]['url'] = $feed['url'];
                        $feeds_parse[$feeds_count]['id'] = $feed['id'];
                        $feeds_parse[$feeds_count]['name'] = $feed['name'];
                $feeds_parse[$feeds_count]['icon'] = $feed['favicon_url'];
                        $feeds_parse[$feeds_count]['cache_path'] = $cache_path;
                $feeds_parse[$feeds_count]['filemd5'] = $filemd5;
                $feeds_parse[$feeds_count]['mod'] = $mod_time;
                $feeds_count++;
            }
        }

        // Get the data for feeds we need to parse
        $curl = new Curl_Get();
        $feeds_data = $curl->multi_get($feeds_parse);

        // Handle the data and parse the feeds
        for($n = 0; $n < count($feeds_parse); $n++) {
            $data = $feeds_data[$n];
            $info = $feeds_parse[$n];
            // If we got an error back from Curl
            if(isset($data['error']) && $data['error'] > 0) {
                // Should be logged
                error_log("Curl error: " . $data['error']);
            // If the feed has been retrieved with content, we should save it
            } elseif($data['data'] != NULL) {
                file_put_contents($info['cache_path'], $data['data']);
            // Otherwise we've gotten an error on the feed, or there is nothing new, let's freshen the cache
            } else {
                touch($info['cache_path']);
            }
        }

        // Clear the file stat cache so we get good data on feed mirror size changes
        clearstatcache();

        for($n = 0; $n < count($feeds_parse); $n++) {
            $data = $feeds_data[$n];
            $info = $feeds_parse[$n];
            if($data['data'] != NULL && md5_file($info['cache_path']) != $info['filemd5']) {
                $pie->set_feed_url($info['cache_path']);
                $pie->init();
                // If SimplePie finds a new RSS URL, let's update our cache
                if($pie->feed_url != $info['url']) {
                    $this->db->Execute('UPDATE lylina_items SET url=?, fallback_url=? WHERE id=?', array($pie->feed_url, $info['url'], $info['id']));
                }
                // TODO: Favicon handling isn't real pretty
                // If we have a new favicon URL, no cache, or stale cache, update cache
                if(!file_exists('cache/' . md5($info['url']) . '.ico') || time() - filemtime('cache/' . md5($info['url']) . '.ico') > 7*24*60*60 || $pie->get_favicon() != $info['icon']) {
                    $this->update_favicon($info, $pie);
                }
                // If we can successfully parse the file, format them
                if($pie->get_items()) {
                    $this->insert_items($info, $pie, $purifier);
                }
            } else {
                // TODO: Provide debugging
            }
        }   
    }

    private function insert_items($info, $pie, $purifier) {
        // Empty can't use return values from functions, very annoying, so store it here
        $title = $pie->get_title();
        if(empty($info['name']) && !empty($title)) {
            $this->db->Execute('UPDATE lylina_feeds SET name=? WHERE id=?', array($title, $info['id']));
        }
        
        $items = $pie->get_items();
    
        $recent_items = $this->db->GetAll('SELECT * FROM lylina_items WHERE feed_id=? ORDER BY id DESC LIMIT ' . (count($items) + 15), array($info['id']));

        // If we didn't get anything, substitute a blank array
        if(!$recent_items) {
            $recent_items = array();
        }

        $insert_item = $this->db->Prepare('INSERT IGNORE INTO lylina_items SET feed_id=?, post_id=?, length=?, url=?, title=?, body=?, dt=FROM_UNIXTIME(?)');
        
        // Here we are checking for duplicated items. We do this by grabbing the newer items and comparing, as this is faster than repeated SQL queries
        foreach($items as $item) {
            $item_id = $item->get_id();
            
            $matching_item = false;
            foreach($recent_items as $potential_match) {
                if($potential_match['post_id'] == $item_id) {
                    $matching_item = true;
                    break;
                }
            }
            if(!$matching_item) {
                if($item->get_date('U')) {
                                $date = $item->get_date('U');
                        } else {
                                $date = time();
                }
                // Fix unclean &s in the title, for some reason other solutions aren't working properly
                // TODO: Make fix cleaner
//              $title = strip_tags($item->get_title());
//              $title = preg_replace('/&(?![A-Za-z0-9#]{1,7};)/', '&amp;', $title);
                $this->db->Execute($insert_item, array($info['id'], $item_id, strlen($item->get_title() . $item->get_content()), $this->htmlentities2($item->get_link()), $purifier->purify(strip_tags($item->get_title())), $purifier->purify($item->get_content()), $date));
            // If we found a match in the database, but it looks like the post has been updated, let's do an UPDATE
            // $potential_match is still defined from when we were in the foreach loop, so here's a nasty trick
            // Trying this out, thanks to ads feed items change a lot, so we'll only publish an update if the post has at least 5 new characters.
            } elseif(abs($potential_match['length'] - (strlen($item->get_title() . $item->get_content()))) >= 5) {
                $this->db->Execute("UPDATE lylina_items SET post_id=?, length=?, title=?, body=? WHERE id=?", array($item_id, strlen($item->get_title() . $item->get_content()), $purifier->purify(strip_tags($item->get_title())), $purifier->purify($item->get_content()), $potential_match['id']));
            }
        }
    }

    private function update_favicon($info, $pie) {
        // Update URL
        $this->db->Execute('UPDATE lylina_feeds SET favicon_url=? WHERE id=?', array($pie->get_favicon(), $info['id']));
    
        // Empty icon if needed
        $blank_icon = base64_decode(
            'AAABAAEAEBAAAAEACABoBQAAFgAAACgAAAAQAAAAIAAAAAEACAAAAAAAQAEAAAAAAAAAAAAAAAAA' .
            'AAAAAAAAAAAA////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' .
            'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' .
            'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' .
            'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' .
            'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' .
            'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' .
            'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' .
            'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' .
            'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' .
            'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' .
            'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' .
            'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' .
            'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' .
            'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' .
            'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' .
            'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' .
            'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' .
            'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' .
            'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' .
            'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' .
            'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' .
            'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' .
            'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD//wAA//8AAP//AAD//wAA//8AAP//' .
            'AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAA=');
        // Could use the Curl library later for a small speed boost
        // Try to fetch remote icon, if we cannot then use the blank icon
        if(!$data = @file_get_contents($pie->get_favicon())) {
            $data = $blank_icon;
        }
        file_put_contents('cache/' . md5($info['url']) . '.ico', $data);
    }

    // From PHP.net user notes
    // htmlentities() which preserves originals
    private function htmlentities2($html) {
            $translation_table = get_html_translation_table(HTML_ENTITIES, ENT_QUOTES);
            $translation_table[chr(38)] = '&';
            return preg_replace("/&(?![A-Za-z]{0,4}\w{2,3};|#[0-9]{2,3};)/", "&amp;", strtr($html, $translation_table));
    }

}
?>
