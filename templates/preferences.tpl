{{include file='head.tpl'}}
<div id="container">
<h2>Change Password</h2>
<form method="post" action="admin?op=passwd">
Current Password: <input type="password" name="old_pass" value="" /><br />
New Password: <input type="password" name="new_pass" value="" /><br />
<input type="submit" value="Change" />
</form>
<h2>Add Feed</h2>
<form method="post" action="admin?op=add">
Website or Feed URL: <input type="text" name="url" />
<input type="submit" value="Add" />
</form>

<h2>Manage Feeds</h2>
<ul class="propertylist">
{{foreach from=$feeds item=feed}}
	<li><img src="cache/{{md5($feed.url)}}.ico" width="16" height="16" alt="" /> {{$feed.name}} ({{$feed.itemcount}} items)<span class="controls"><a href="admin?op=delete&id={{$feed.id}}">Delete</a> &middot; <a href="admin?op=rename&id={{$feed.id}}">Rename</a></li>
{{/foreach}}
</ul>
</div>
{{include file='foot.tpl'}}
