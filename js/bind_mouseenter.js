function bind_mouseenter() {
	$('#exp-or-income ul li:first-child a').mouseenter(function() {
		var tooltip = $('#exp-or-income div.tooltip');
		tooltip.html('control + e');
		tooltip.css('left', '120px');
		tooltip.show();
	});
	$('#exp-or-income ul li:last-child a').mouseenter(function() {
		var tooltip = $('#exp-or-income div.tooltip');
		tooltip.html('control + i');
		tooltip.css('left', '250px');
		tooltip.show();
	});

}