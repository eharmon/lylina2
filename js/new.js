// Extend jQuery to check for focus, as per http://stackoverflow.com/questions/967096/using-jquery-to-test-if-an-input-has-focus
jQuery.extend(jQuery.expr[':'], {
    focus: function(element) { 
        return element == document.activeElement; 
    }
});

function moveNext() { 
    // Go to next item
    var old = $(".selected");
    if(old.length == 0 || old.nextALL(".item").length == 0) {
        old.removeClass("selected");
        old = $(".item:first");
        old.addClass("selected");
    } else {
        // This code is really bad, should find a better way
        old.nextALL(".item:first").addClass("selected");
        old.removeClass("selected");
    }
}

function movePrevious() {
    // Go to previous item
    var old = $(".selected");
    if(old.length == 0 || old.prevALL(".item").length == 0) {
        old.removeClass("selected");
        old = $(".item:last");
        old.addClass("selected");
    } else {
        old.prevALL(".item:first").addClass("selected");
        old.removeClass("selected");
    }
}

function scrollSelected() {
    calculatedOffset = -1 * $("#navigation").outerHeight();
    // Stop the previous scrolls to prevent it from getting too bottlenecked
    // scrollTo animates the html node, so we simply dump the previous scroll value and replace it with the new one
    $("html").stop(true);
    $.scrollTo(".selected", "fast", {offset: calculatedOffset});
}

function clickTitle() {
    $(".selected").find(".title").click();
}

function openItem(speed) {
    if(speed == null)
        speed = "fast";
    // Show flash objects, which may have been previously hidden
    $(".selected object").show();
    // Unmask images
    $(".selected .excerpt img").each(function() {
        $(this).attr("src", $(this).data("original"));
    });
    $(".selected").fadeTo(200, 1).find(".excerpt").slideDown(speed);
}

function closeItem(speed) {
    if(speed == null)
        speed = "fast";
    // Hide flash objects, they overlay in some browsers and break the sliding effect
    $(".selected object").hide();
    $(".selected").fadeTo(500, 0.60).effect("highlight", {color: "#FFF"}, 500).find(".excerpt").slideUp(speed);
}

function markRead(id) {
    $.ajax({
        type: "POST",
        url: "index.php",
        data: "p=read&id=" + id,
        dataType: "text"
    });
}

function showRead(element) {
    element.fadeTo(500, 0.60);
    element.addClass("read");
}

var biggest = 0;
var scrolled = 0;
var newest_id = 1;

function setupElements(container) {
    // If a container was not given assume #main
    if(!container) {
        container = $("#main");
    }

    // Prevent images from loading until the JS runs, based on jQuery LazyLoad by Mike Tuupola
    container.find(".excerpt img").each(function() {
        $(this).data("original", $(this).attr("src"));
        $(this).attr("src", "img/blank.png");
    });

    // TODO: Do this on the server side? It is display tweaking however.
    container.find(".excerpt object").each(function() {
        // Don't do this for IE, it doesn't end up with a proper object so you can't append to it
        if(!$.browser.msie) {
            $(this).append("<param name='wmode' value='transparent'>");
        }
    });

    var old_newest_id = newest_id;
    container.find(".item").each(function() {
        if(parseInt($(this).attr("id").split(":")[0]) > newest_id) {
            newest_id = parseInt($(this).attr("id").split(":")[0]);
        }
    });

    // Now that we've temporarily killed all the images on the page for loading speed, start loading them in the background
    /*setTimeout(loadImages, 5000);*/
}

/**
 * Check if two Date object represent date-times on the same day.
 */
function areSameDay(d1, d2) {
    // Create Date's without HMS parts so they can be compared
    var day1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
    var day2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
    return (day1 - day2) == 0;
}

function getDateFromFeedElement(feed) {
    var item = feed.find(".item").first();
    // Use regular expression to grab everything after the :
    var idAttr = item.attr("id");
    var timeStr = idAttr.replace(/(.+:)(\d+)$/, "$2");
    var epochTime = parseInt(timeStr);

    // epochTime is in seconds from PHP; Date expects milliseconds
    return new Date(epochTime * 1000);
}

function mergeNewItems(newItems) {
    // Check if page is empty; happens if all previous items were old and got cleared
    if($("#main").find(".item").length == 0) {
        // page is empty, just drop new items in place and return
        // newItems has a dummy div so grab the children
        newItems.children().appendTo($("#main"));
        return;
    }

    // First merge in new day headers if necessary
    // Get first header on page. Any new headers will most likely be newer than it.
    var firstHeader = $("#main").find("h1").first();
    newItems.find("h1").each(function() {
        if($(this).html() != firstHeader.html()) {
            // The header in newItems is different than the first on the page
            // Now we need to find where it goes, if anywhere
            var newDate = new Date($(this).html());
            var firstDate = new Date($(firstHeader).html());

            if(newDate > firstDate) { // Header is newer, insert now
                firstHeader.before($(this));
            } else if(newDate < firstDate) { // Header is older, check farther
                var nextHeaders = firstHeader.siblings("h1");

                // See if the new header is already on the page
                for(var i = 0; i < nextHeaders.length; i++) {
                    if(nextHeaders[i].html == $(this).html) {
                        // Header is already on the page so we can return
                        return;
                    }
                }

                // We could not find the header on the page, so insert it
                // The header must go at the end of the page, items will be inserted later
                $("#main").append($(this));
            } else { // Sanity check, should never get here
                throw "Failed sanity check while inserting new day headers";
            }
        }
    });

    // Get first feed currently on page
    var pageFeed = $("#main").find(".feed").first();
    newItems.find(".feed").each(function() {
        var newItemDate = getDateFromFeedElement($(this));
        var inserted = false;

        while(newItemDate < getDateFromFeedElement(pageFeed)) {
            // Get next feed on the page
            var nextFeed = pageFeed.nextAll(".feed:first");
            // Check to see if there were no more items
            if(nextFeed.length == 0) {
                // There are no more feeds on the page so we need to insert after this one
                if(areSameDay(newItemDate, getDateFromFeedElement(pageFeed))) {
                    // New item goes under the same day header so just insert after it
                    pageFeed.after($(this));
                } else {
                    // There should be only day headers after pageFeed right now
                    // Also the next element should be the day header for this new item
                    pageFeed.next().after($(this));
                }

                // Don't insert this new item again later
                inserted = true;
                break;
            }
            pageFeed = nextFeed;
        }

        // We found the first page feed which is <= the new item; we insert the new item before it
        if(!inserted) {
            // Need to see if the new item has the same date as the one we're inserting before
            var pageFeedDate = getDateFromFeedElement(pageFeed);
            if(areSameDay(newItemDate, pageFeedDate)) { // same day, insert here
                pageFeed.before($(this));
            } else if(newItemDate > pageFeedDate) { // must insert before day header
                pageFeed.prev().before($(this));
            } else { // sanity check; should never happen due to way insertion is done
                throw "Failed sanity check while inserting new item";
            }
        }
    });
}

function cleanupOldItems() {
    // Cleanup old items
    $("#main").find(".feed").each(function() {
        var date = getDateFromFeedElement($(this));
        var time = date.getTime();
        var now = new Date();
        var curTime = now.getTime();
        if(curTime - time > 8*60*60*1000) {
            $(this).remove();
        }
        $(this).find(".item").removeClass('new');
    });

    // Cleanup old day headers by seeing if they have items after them
    $("#main").find("h1").each(function() {
        // See if the next element is not an item
        if($(this).next(".feed").length == 0) {
            // No items for this day header, remove it
            $(this).remove();
        }
    });
}

function loadImages() {
    $(".excerpt img").each(function() {
        $(this).attr("src", $(this).attr("original"));
    });
}

var title = "lylina rss aggregator";

$(document).ready(function() {
    if(show_updates) {
        $("#message").html("<img src=\"img/4-1.gif\" />Please wait while lylina loads...");
    }
    title = document.title;
    setTimeout(fetch_feeds, 10000);

    setupElements();

    $(window).keydown(function(event) {
        if(!$("input").is(":focus")) {
            switch(event.keyCode) {
                // N
                case 78:
                    moveNext();
                    scrollSelected();
                    break;
                // J
                case 74:
                    if($(".selected").find(".excerpt").is(':visible'))
                        closeItem(0);
                    moveNext();
                    openItem(0);
                    markRead($(".selected").attr("id"));
                    scrollSelected();
                    break;
                // P
                case 80:
                    movePrevious();
                    scrollSelected();
                    break;
                // K
                case 75:
                    if($(".selected").find(".excerpt").is(':visible'))
                        closeItem();
                    movePrevious();
                    openItem();
                    markRead($(".selected").attr("id").split(":")[0]);
                    scrollSelected();
                    break;
                // O, Enter
                case 79:
                case 13:
                    clickTitle();
                    break;
                // V
                case 86:
                    $(".selected").find(".source a").click();
                    $(".selected").find(".source a").mouseup();
                    break;
            }
        }
    });

    // Handle clicks in items (doesn't include middle click)    
    $(".item a").live('click', function() {
        window.open(this.href);
        return false;
    });
    // Handle all clicks on source links (including middle click)
    $(".source a").live('mouseup', function() {
    //  window.open(this.href);
        if(!$(this).parents().find(".excerpt").is(':visible'))
            $(this).parent().parent().fadeTo(500, 0.60);
        $(".selected").removeClass("selected");
        $(this).parent().parent().addClass("selected");
        $(this).parent().parent().removeClass("new");
        markRead($(this).parent().parent().attr("id").split(":")[0]);
    //  return false;
    });
    $(".title").live('click', function() {
        $(".selected").removeClass("selected");
        $(this).parent().addClass("selected");
        $(this).parent().removeClass("new");
        if($(this).parent().find(".excerpt").is(':visible'))
            closeItem();
        else {
            openItem();
            markRead($(this).parent().attr("id").split(":")[0]);
        }
    });
    $("#message").live('click', function() {
        if(fetch) { // This will prevent clicking on the update message when lylina is already updating
            fetch = 0; // Also disables fetching
            $("#message").html("<img src=\"img/4-1.gif\" />Please wait while lylina updates...");
            $("<div></div>").load(
                "index.php",
                "p=Get_Items&newest=" + newest_id,
                function(responseText, textStatus, XMLHttpRequest) {
                    if(textStatus == "success") {
                        setupElements($(this));
                        cleanupOldItems();
                        mergeNewItems($(this));
                        $("#message").html("Get new items");
                        document.title = title;
                        new_items = 0;
                    } else {
                        alert("Update fail: " . textStatus);
                    }

                    // Re-allow fetching even if loading failed
                    fetch = 1;
                }
            );
        }
    });


    // TODO: Fix this, description of functionality is in css
    $("#main").show();
    if(show_updates) {
        $("#message").html("Get new items");
    }
});

var new_items = 0;
var fetch = 1;

function fetch_feeds() {
    if(fetch) {
        $.ajax({
            type: "POST",
            url: "index.php",
            data: "p=update&newest=" + newest_id,
            dataType: "text",
            timeout: 500 * 1000,
            success: function(msg) {
                if(fetch) {
                    var old_items = new_items;
                    new_items = parseInt(msg);
                    if(new_items > 0 && show_updates) {
                        $("#message").html('<b>Get new items (' + new_items + ')</b>');
                        document.title = "[" + new_items + "] " + title;
                        if(new_items != old_items) {
                            $("#navigation").effect("highlight", {}, 2000);
                        }
                    }
                }
            }
        });
    }
    setTimeout(fetch_feeds, 90 * 1000);
}


