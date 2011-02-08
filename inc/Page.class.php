<?php

// lylina feed aggregator
// Copyright (C) 2004-2005 Panayotis Vryonis
// Copyright (C) 2005 Andreas Gohr
// Copyright (C) 2006-2010 Eric Harmon

// This is the interface for the functions a basic Page provides
interface Page {
    function __construct($db) {
    }

    function render() {
    }
}
