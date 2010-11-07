<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
	"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

<html xmlns="http://www.w3.org/1999/xhtml">
<head profile="http://gmpg.org/xfn/1">
	<title>lylina rss aggregator {{if $title}} - {{$title}} {{/if}}</title>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
	<meta http-equiv="Pragma" content="no-cache" />
	<meta http-equiv="Expires" content="-1" />

	<link rel="stylesheet" type="text/css" href="style/new.css" media="screen" />
	<link rel="stylesheet" type="text/css" media="only screen and (max-device-width: 480px)" href="style/small-device.css" />

	<script language="JavaScript" type="text/javascript" src="js/jquery.js"></script>

	<script language="JavaScript" type="text/javascript" src="js/jquery-ui-custom.js"></script>
	<script language="JavaScript" type="text/javascript" src="js/jquery.nextALL.js"></script>
	<script language="JavaScript" type="text/javascript" src="js/jquery.scrollTo.js"></script>
	<script language="JavaScript" type="text/javascript" src="js/new.js"></script>
	<meta name="viewport" content="width=480" />

	<link rel="shortcut icon" href="favicon.ico" type="image/x-icon" />
	<!--<link rel="alternate" type="application/rss+xml" title="RSS" href="rss.php/cfcd208495d565ef66e7dff9f98764da.xml" />-->
	<script language="JavaScript" type="text/javascript">
	<!--
		var showDetails = false;
		var markID = '';
	//-->
	</script>
</head>
<body>
<div id="navigation"><a href="index.php"><img src="img/mini.png" width="39" height="25" alt="lylina" id="logo" /></a>
<img src="img/div.png" width="1" height="20" alt="" />
{{if !$title}}
	<div id="message"><img src="img/4-1.gif" alt="..." />Please wait while lylina updates...</div>
{{else}}
	{{$title}}
{{/if}}

{{if !$auth}}
<div id="login">
	<form method="post" action="index.php" class="login">
	<input type="hidden" name="p" value="admin" />
	<input type="hidden" name="op" value="login" />
	<img src="img/password-trans.png" alt="password" /> <input type="password" name="pass" />
	<input type="submit" value="Login" />
	</form>
</div>
{{else}}
<div id="login">
	<a href="admin">Preferences</a>
	<a href="logout">Logout</a>
</div>
{{/if}}
</div>
<div id="main">

