// $Id: jquery.nextALL.js 75 2008-12-03 04:46:10Z spadgos $
jQuery(function($) {
	$.fn.reverse = function() {
		return this.pushStack(this.get().reverse(), arguments);
	};
	$.each( ['prev', 'next'], function(unusedIndex, name) {
		$.fn[ name + 'ALL' ] = function(matchExpr) {
			var $all = $('body').find('*').andSelf();
			$all = (name == 'prev')
				 ? $all.slice(0, $all.index(this)).reverse()
				 : $all.slice($all.index(this) + 1)
			;
			if (matchExpr) $all = $all.filter(matchExpr);
			return $all;
		};
	});
});