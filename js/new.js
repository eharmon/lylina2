// Extend jQuery to check for focus, as per http://stackoverflow.com/questions/967096/using-jquery-to-test-if-an-input-has-focus
jQuery.extend(jQuery.expr[':'], {
    focus: function(element) { 
        return element == document.activeElement; 
    }
});

function moveNext() { 
    // Go to next item
    var old = $(".selected");
    var next = old;

    if(old.length == 0) {
        next = $(".item:first");
    } else {
        next = old.nextAll(".item:first");
        if(next.length == 0) {
            // no more items in the same day; try the next day
            next = old.closest(".day").nextAll(".day:first").find(".item:first");
        }
        if(next.length == 0) {
            // didn't find an item in the following day; get the first item
            next = $(".item:first");
        }
    }

    old.removeClass("selected");
    next.addClass("selected");
}

function movePrevious() {
    // Go to previous item
    var old = $(".selected");
    var prev = old;

    if(old.length == 0) {
        prev = $(".item:last");
    } else {
        prev = old.prevAll(".item:first");
        if(prev.length == 0) {
            // no more items in the same day; try the previous day
            prev = old.closest(".day").prevAll(".day:first").find(".item:last");
        }
        if(prev.length == 0) {
            // didn't find an item in the previous day; get the last item
            prev = $(".item:last");
        }
    }

    old.removeClass("selected");
    prev.addClass("selected");
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

function getDateFromItemElement(item) {
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
        // no items on the page, make sure it is completely empty
        $("#main").children().remove();

        // page is empty, now just drop new items in place and return
        // newItems has a dummy div so grab the children
        newItems.children().appendTo($("#main"));
        return;
    }
    
    // Merge each day into place
    newItems.children(".day").each(function() {
        // Get the day element from the page if it exists
        var day = $("#main").children("#" + $(this).attr("id"));

        if(day.length == 0) {
            // this day does not exist on the page
            // find where it goes and insert it
            var date = $(this).attr("id");

            var inserted = false;
            var days = $("#main").children(".day");
            for(var i = 0; i < days.length; i++) {
                var nextDate = $(days[i]).attr("id");
                // Insert once the new day comes after an existing one
                if(date > nextDate) {
                    $(days[i]).before($(this));
                    inserted = true;
                    break;
                }
            }
            // If inserted is false we need to insert after all existing days
            if(!inserted) {
                $(days[days.length-1]).after($(this));
                inserted = true;
            }
        } else if(day.length == 1) {
            // merge this day's items with already existing items
            var pageItem = day.children(".item:first");
            $(this).children(".item").each(function() {
                var newDate = getDateFromItemElement($(this));
                // Find the first page item that should be below the new item
                // we will insert above it
                while(pageItem.length > 0 && newDate < getDateFromItemElement(pageItem)) {
                    pageItem = pageItem.nextAll(".item:first");
                }

                if(pageItem.length > 0) {
                    pageItem.before($(this));
                } else {
                    // Reached the end of items in this day; append to end
                    day.append($(this));
                }
            });
        } else {
            // Sanity check, should never reach here
            throw "Failed sanity check merging day element into place";
        }
    });
}

function showOlderItems() {
    fetchOlder = 0;
    $("#show-older-button").html("Loading...");

    // Just get the last item on the page. It should be the oldest
    var idAttr = $("#main").find(".item").last().attr("id").split(":");
    var oldest_id = parseInt(idAttr[0]);

    // Load dummy div with new items and merge them in on success
    $("<div/>").load(
        "index.php",
        "p=Get_Items&pivot=" + oldest_id,
        function(responseText, textStatus, XMLHttpRequest) {
            if(textStatus == "success") {
                setupElements($(this));
                mergeNewItems($(this));
            } else {
                alert("Update fail: " . textStatus);
            }

            // Re-enable fetching older even if update fails
            fetchOlder = 1;
            $("#show-older-button").html("Show Older");
        }
    );
}

function cleanupOldItems() {
    // Cleanup old items
    $("#main").find(".item").each(function() {
        var date = getDateFromItemElement($(this));
        var time = date.getTime();
        var now = new Date();
        var curTime = now.getTime();
        if(curTime - time > 8*60*60*1000) {
            $(this).remove();
        }
        $(this).removeClass('new');
    });

    // Cleanup old day headers by seeing if they have items after them
    $("#main").find("h1").each(function() {
        // See if the next element is not an item
        if($(this).next(".item").length == 0) {
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
    // Handle clicks to show older items
    $("#show-older-button").live('click', function() {
        if(fetchOlder) {
            showOlderItems();
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
var fetchOlder = 1;
var checkNew = true;

function fetch_feeds() {
    if(checkNew && fetch) {
        checkNew = false;
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
                        // Check to see if #navigation already has any pending animations
                        // to prevent a bunch of highlights playing when the page has come
                        // into focus after being in the background for awhile.
                        // See: http://api.jquery.com/animate/ Additional Notes section
                        if(new_items != old_items && $("#navigation").queue().length == 0) {
                            $("#navigation").effect("highlight", {}, 2000);
                        }
                    }
                }
            },
            complete: function() {
                checkNew = true;
            }
        });
    }
    setTimeout(fetch_feeds, 90 * 1000);
}

