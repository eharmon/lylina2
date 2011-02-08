<?php

// lylina feed aggregator
// Copyright (C) 2004-2005 Panayotis Vryonis
// Copyright (C) 2005 Andreas Gohr
// Copyright (C) 2006-2010 Eric Harmon

// This class fetches things via Curl, with automatic fallback
class Curl_Get {
    // Track curl support
    private $curl = false;

    function __construct() {
        if(extension_loaded('curl')) {
            $this->curl = true;
        }
    }

    function multi_get($urls) {
        // If we have Curl support, lets use curl_multi
        if($this->curl) {
            $curl_multi = curl_multi_init();
            $curl = array();
            for($n = 0; $n < count($urls); $n++) {
                $curl[$n] = curl_init();
                curl_setopt($curl[$n], CURLOPT_URL, $urls[$n]['url']);
                curl_setopt($curl[$n], CURLOPT_RETURNTRANSFER, true);
                curl_setopt($curl[$n], CURLOPT_HEADER, false);
                curl_setopt($curl[$n], CURLOPT_TIMEOUT, 15);
                curl_setopt($curl[$n], CURLOPT_CONNECTTIMEOUT, 10);
                curl_setopt($curl[$n], CURLOPT_FOLLOWLOCATION, true);
                curl_setopt($curl[$n], CURLOPT_USERAGENT, "lylina/dev (http://lylina.sf.net)");
                if($urls[$n]['mod'] != -1) {
                    curl_setopt($curl[$n], CURLOPT_TIMECONDITION, CURL_TIMECOND_IFMODSINCE);
                    curl_setopt($curl[$n], CURLOPT_TIMEVALUE, $urls[$n]['mod']);
                }
                curl_multi_add_handle($curl_multi, $curl[$n]);
            }
            
            // Execute parallel curl
            $running = NULL;
            do {
                    curl_multi_exec($curl_multi, $running);
            } while ($running > 0);

            $result = array();

            for($n = 0; $n < count($urls); $n++) {
                $result[$n]['data'] = curl_multi_getcontent($curl[$n]);
                $result[$n]['code'] = curl_getinfo($curl[$n], CURLINFO_HTTP_CODE);
                $result[$n]['error'] = curl_errno($curl[$n]);
            }
        // If not, fallback to using file_get_contents one-by-one
        } else {
            $result = array();
            for($n = 0; $n < count($urls); $n++) {
                $result[$n]['data'] = file_get_contents($urls[$n]['url']);
            }
        }
        return $result;
    }
}

?>
