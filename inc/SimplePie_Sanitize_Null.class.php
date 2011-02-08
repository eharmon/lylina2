<?php
// lylina feed aggregator
// Copyright (C) 2004-2005 Panayotis Vryonis
// Copyright (C) 2005 Andreas Gohr
// Copyright (C) 2006-2010 Eric Harmon

// This class extends the SimplePie sanitizer and simply performs no sanitation
// This allows us to passthrough SimplePie and sanitize with HTMLPurifier instead

class SimplePie_Sanitize_Null extends SimplePie_Sanitize {
    function strip_htmltags($tags) {
    }
    function encode_instead_of_strip($encode) {
    }
    function strip_attributes($attribs) {
    }
    function strip_comments($strip) {
    }
    function set_url_replacements($element_attribute) {
    }
    function sanitize($data, $type, $base = '')
    {
        return $data;
    }
}
?>
