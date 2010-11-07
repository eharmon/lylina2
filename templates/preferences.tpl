{{include file='head.tpl'}}
<div id="container">
Here lie some preferences of some kind. Amazing!

<h2>Feeds</h2>
<ul class="propertylist">
{{foreach from=$feeds item=feed}}
	<li><img src="cache/{{md5($feed.url)}}.ico" width="16" height="16" alt="" /> {{$feed.name}}</li>
{{/foreach}}
</ul>
{{include file='foot.tpl'}}
