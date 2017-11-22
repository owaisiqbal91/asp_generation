function createSliderObject(handle) {
    var issueSliderObject = {
        create: function() {
            handle.text($(this).slider("value"));
        },
        max: 5,
        min: -5,
        step: 1,
        value: 0,
        slide: function(event, ui) {
            handle.text(ui.value);
        }
    }
    return issueSliderObject;
}
$(function() {
    var issuesSliderNames  = ["education", "vegetarianism", "waterSupply"];
    issuesSliderNames.forEach(function(issueName) {
        var issueSliderObject = createSliderObject($("#"+issueName));
        $("#slider-"+issueName).slider(issueSliderObject);
    });
});

$(function() {
    $("button").button();
});