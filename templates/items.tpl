{{if $items}}
{{foreach from=$items item=item name=items}}
    {{if $smarty.foreach.items.index == 0}}
        <div class="day" id="{{$item.timestamp|date_format:"%Y%m%d"}}">
            <h1>{{$item.date}}</h1>
    {{elseif $items[$smarty.foreach.items.index - 1].date != $item.date}}
        </div>
        <div class="day" id="{{$item.timestamp|date_format:"%Y%m%d"}}">
            <h1>{{$item.date}}</h1>
    {{/if}}
            <div class="item{{if $item.viewed}} read{{/if}}{{if $item.new}} new{{/if}}" id="{{$item.id}}:{{$item.timestamp}}">
                <img src="cache/{{md5($item.feed_url)}}.ico" class="icon" alt="" />
                <span class="time">{{$item.timestamp|date_format:"%H:%M"}}</span>
                <span class="title" id="TITLE{{$item.id}}">{{$item.title}}</span>
                <span class="source">
                    <a href="{{$item.url}}" target="_blank">&raquo; {{$item.feed_name}}</a>
                </span>
                <div class="excerpt">
                    {{$item.body}}
                </div>
            </div>
{{/foreach}}
        </div>
        <div id="show-older-button">Show Older</div>
{{else}}
<p>No items were found, perhaps you haven't opened lylina in awhile? Try <a href="#" onclick="fetch_feeds(); $('#message').click(); return false">manually updating the items</a> (this make take a moment) if you do not wish to wait for them to automatically refresh.</p>
{{/if}}
