{{include file='head.tpl'}}
<div id="container">
<form method="post" action="admin?op=delete">
<input type="hidden" name="id" value="{{$feed.id}}" />
<input type="hidden" name="confirm" value="1" />
Are you sure you want to remove {{$feed.name}} with {{$feed.itemcount}} items from your feeds?
<input type="submit" value="Yes" />
</form>
</div>
{{include file='foot.tpl'}}
