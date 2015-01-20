$(document).ready(function() {
    $("input:text").focus(function() { $(this).select(); });

    bind_click();
    bind_keydown();
    bind_keyup();
    bind_focusout();
    bind_mouseenter();
    bind_mouseleave();

    $('#btn_add_transaction').focus(function() {
        $(this).css('background', '#ccc');
        $(this).css('color', 'black');
    })

    load_expenses_chart();
});
