{{foreach from=$items item=item name=items}}
{{if $smarty.foreach.items.index == 0 || $items[$smarty.foreach.items.index - 1].date != $item.date}}<h1>{{$item.date}}</h1>{{/if}}

<div class="feed">
<div class="item{{if $item.viewed}} read{{/if}}{{if $item.new}} new{{/if}}" id="I:{{$item.id}}:{{$item.timestamp}}">
<img src="cache/{{md5($item.feed_url)}}.ico" width="16" height="16" class="icon" alt="" />
<span class="time">{{date('H:i', $item.timestamp)}}</span>
<span class="title" id="TITLE{{$item.id}}">{{$item.title}}</span>
<span class="source">
<a href="{{$item.url}}" target="_blank">&raquo;
{{$item.feed_name}}
</a>
</span>
<div class="excerpt">
{{$item.body}}
</div></div></div>
{{/foreach}}
