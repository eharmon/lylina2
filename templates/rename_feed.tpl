{{include file='head.tpl'}}
<div id="container">
Renaming {{$feed.name}}:
<form method="post" action="admin?op=rename">
<input type="hidden" name="id" value="{{$feed.id}}" />
<input type="hidden" name="confirm" value="1" />
New name: <input type="text" name="name" value="{{$feed.name}}" />
<input type="submit" value="Rename" />
</form>
</div>
{{include file='foot.tpl'}}
