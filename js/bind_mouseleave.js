function bind_mouseleave() {
	$('#exp-or-income ul li:first-child a').mouseleave(function() {
		$('#exp-or-income div.tooltip').hide();
	});

	$('#exp-or-income ul li:last-child a').mouseleave(function() {
		$('#exp-or-income div.tooltip').hide();
	});
	
}