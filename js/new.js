jQuery.fn.myBlindToggle = function(speed, easing, callback) {
	var h = this.height() + parseInt(this.css('paddingTop')) + parseInt(this.css('paddingBottom'));
	alert("I am here.");
	return this.animate({marginTop: parseInt(this.css('marginTop')) <0 ? 0 : -h}, speed, easing, callback);  
};

jQuery.fn.slideFadeToggle = function(speed, easing, callback) {
	return this.animate({opacity: 'toggle', height: 'toggle'}, speed, easing, callback);
};

jQuery.fn.autoscroll = function(selector) {
	$('html,body').animate(
	{scrollTop: $(selector).offset().top}, 500);
}

function moveNext() { 
	// Go to next item
	var $old = $(".selected");
	if($old.length == 0 || $old.nextALL(".item").length == 0) {
		$old.removeClass("selected");
		$old = $(".item:first");
		$old.addClass("selected");
	} else {
		// This code is really bad, should find a better way
		$old.nextALL(".item:first").addClass("selected");
		$old.removeClass("selected");
	}
}

function movePrevious() {
	// Go to previous item
	var $old = $(".selected");
	if($old.length == 0 || $old.prevALL(".item").length == 0) {
		$old.removeClass("selected");
		$old = $(".item:last");
		$old.addClass("selected");
	} else {
		$old.prevALL(".item:first").addClass("selected");
		$old.removeClass("selected");
	}
}

function scrollSelected() {
	// Currently hardcoded offset, should calculate on the fly for custom CSS designs!
	calculatedOffset = -1 * $("#navigation").outerHeight();
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
var newest_id = 0;

function setupElements() {
	// Handle clicks in items (doesn't include middle click)	
	$(".item a").click(function() {
		window.open(this.href);
		return false;
	});
	// Handle all clicks on source links (including middle click)
	$(".source a").mouseup(function() {
	//	window.open(this.href);
		if(!$(this).parents().find(".excerpt").is(':visible'))
			$(this).parent().parent().fadeTo(500, 0.60);
		$(".selected").removeClass("selected");
		$(this).parent().parent().addClass("selected");
		$(this).parent().parent().removeClass("new");
		markRead($(this).parent().parent().attr("id").split(":")[1]);
	//	return false;
	});
	$(".title").click(function() {
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
	$("#message").click(function() {
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
	var old_newest_id = newest_id;
	$(".item").each(function() {
		if(parseInt($(this).attr("id").split(":")[1]) > newest_id) {
			newest_id = parseInt($(this).attr("id").split(":")[1]);
		}
	});
}

var title = "lylina rss aggregator";

$(document).ready(function() {
	$("#message").html("<img src=\"img/4-1.gif\" />Please wait while lylina loads...");
	title = document.title;
	setTimeout(fetch_feeds, 10000);

	setupElements();

	$(window).keydown(function(event) {
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
	});
	// TODO: Fix this, description of functionality is in css
	//$("#main").show();
	$("#message").html("Get new items");			
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
					if(new_items > 0) {
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


