$(document).ready(function() {
    var button1 = $("#btn1");
    button1.click(function() {
        button1.append("1");
        // send message to contentscript
        chrome.tabs.query(
            {active: true, currentWindow: true},
            function(tabs) {
                chrome.tabs.sendMessage(
                    tabs[0].id,
                    { message: "button clicked" }
                );
            }
        );
    });
});