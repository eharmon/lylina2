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

function getTimeFromFeedElement(feed) {
    var item = feed.find(".item").first();
    // Use regular expression to grab everything after the :
    var idAttr = item.attr("id");
    var timeStr = idAttr.replace(/(.+:)(\d+)$/, "$2");
    return parseInt(timeStr);
}

function mergeNewItems(newItems) {
    // Get first feed currently on page
    var pageFeed = $("#main").find(".feed").first();
    newItems.find(".feed").each(function() {
        var newItemTime = getTimeFromFeedElement($(this));
        var inserted = false;

        while(newItemTime < getTimeFromFeedElement(pageFeed)) {
            // Get next feed on the page
            var nextFeed = pageFeed.next(".feed");
            if(nextFeed.length == 0) {
                // There are no more feeds on the page so we need to insert after this one
                pageFeed.after($(this));
                // Don't insert this new item again later
                inserted = true;
                break;
            }
            pageFeed = nextFeed;
        }

        // We found the first page feed which is <= the new item; we insert the new item before it
        if(!inserted) {
            pageFeed.before($(this));
        }
    });
}

function cleanupOldItems() {
    $("#main").find(".feed").each(function() {
        var time = getTimeFromFeedElement($(this));
        var date = new Date();
        var curTime = date.getTime();
        if(curTime - time*1000 > 8*60*60*1000) {
            $(this).remove();
        }
        $(this).find(".item").removeClass('new');
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


