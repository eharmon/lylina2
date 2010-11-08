{{include file='head.tpl'}}
<div id="container">
{{if $items}}
Here are some headlines we found
{{/if}}
{{if $feed_title}}
at {{$feed_title}}:<br /><br />
{{elseif $items}}
:<br /><br />
{{/if}}
{{if $items}}
<ul class="propertylist">
{{foreach from=$items item=item}}
	<li>{{$item->get_title()}}</li>
{{/foreach}}
</ul>
<form method="post" action="admin?op=doadd">
<input type="hidden" name="feedurl" value="{{$feed_url}}" />
<input type="hidden" name="feedtitle" value="{{$feed_title}}" />
Would you like to add the feed? <input type="submit" value="Yes" />
</form>
<br />
Not the feed you were looking for? Lylina tries to automatically find the feed you are searching for, but we're not always able to find exactly which one you want. Try again:
</ul>
{{else}}
Sorry, no items were found. Would you like to try a different URL?
{{/if}}
<form method="post" action="admin?op=add">
Website or Feed URL: <input type="text" name="url" value="{{$url}}" />
<input type="submit" value="Add" />
</form>
</div>
{{include file='foot.tpl'}}
