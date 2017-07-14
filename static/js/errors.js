function addError(text) {
    var error = $("<div />", {
        "class": "error",
        "text": text
    });
    $("#errors").append(error);
    error.css("margin-left", "calc(50% - " + (error.width() / 2 + 15) + "px)");
    setTimeout(function() {
        error.fadeOut(2000, function() {
            error.remove();
        });
    }, 5000)
}