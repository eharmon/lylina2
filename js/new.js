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

function setupElements() {
	// Prevent images from loading until the JS runs, based on jQuery LazyLoad by Mike Tuupola
	$(".excerpt img").each(function() {
		$(this).data("original", $(this).attr("src"));
		$(this).attr("src", "img/blank.png");
	});

	// TODO: Do this on the server side? It is display tweaking however.
	$(".excerpt object").each(function() {
		// Don't do this for IE, it doesn't end up with a proper object so you can't append to it
		if(!$.browser.msie) {
			$(this).append("<param name='wmode' value='transparent'>");
		}
	});

	var old_newest_id = newest_id;
	$(".item").each(function() {
		if(parseInt($(this).attr("id").split(":")[1]) > newest_id) {
			newest_id = parseInt($(this).attr("id").split(":")[1]);
		}
	});

	// Now that we've temporarily killed all the images on the page for loading speed, start loading them in the background
	/*setTimeout(loadImages, 5000);*/
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
	//	window.open(this.href);
		if(!$(this).parents().find(".excerpt").is(':visible'))
			$(this).parent().parent().fadeTo(500, 0.60);
		$(".selected").removeClass("selected");
		$(this).parent().parent().addClass("selected");
		$(this).parent().parent().removeClass("new");
		markRead($(this).parent().parent().attr("id").split(":")[1]);
	//	return false;
	});
	$(".title").live('click', function() {
		$(".selected").removeClass("selected");
		$(this).parent().addClass("selected");
		$(this).parent().removeClass("new");
		if($(this).parent().find(".excerpt").is(':visible'))
			closeItem();
		else {
			openItem();
			markRead($(this).parent().attr("id").split(":")[1]);
		}
	});
	$("#message").live('click', function() {
		if(fetch) { // This will prevent clicking on the update message when lylina is already updating
			fetch = 0; // Also disables fetching
			$("#main").slideUp("slow");
			$("#message").html("<img src=\"img/4-1.gif\" />Please wait while lylina updates...");
			$("#main").load(
				"index.php",
				"p=Get_Items&newest=" + newest_id,
				function(responseText, textStatus, XMLHttpRequest) {
					setupElements();
					$("#main").slideDown("500");
					$("#message").html("Get new items");
					document.title = title;
					new_items = 0;
					fetch = 1;
					if(textStatus != "success")
						alert("Update fail: " . textStatus);
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


