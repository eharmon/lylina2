{{include file='head.tpl'}}
<div id="container">
<form method="post" action="admin?op=delete">
<input type="hidden" name="id" value="{{$feed.id}}" />
<input type="hidden" name="confirm" value="1" />
Are you sure you want to delete {{$feed.name}} and all of its {{$feed.itemcount}} items?
<input type="submit" value="Yes" />
</form>
</div>
{{include file='foot.tpl'}}
