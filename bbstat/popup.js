var activated = false;

$(document).ready(function() {

    var $activate = $("#activate");
    $activate.change(function() {
        // send message to contentscript
        var msg = this.checked ? "activate" : "deactivate";
        chrome.tabs.query(
            {active: true, currentWindow: true},
            function(tabs) {
                chrome.tabs.sendMessage(
                    tabs[0].id,
                    { message: msg },
                    function(response) {
                        // console.log(response);
                        if (response.message == "activated") {
                            activated = true;
                        }
                        else if (response.message == "deactivated") {
                            activated = false;
                        }
                });
            }
        );
    });

    var $loadAllBtn = $("#getAllBtn");
    $loadAllBtn.click(function() {
        var msg = "getAll"
        chrome.tabs.query(
            {active: true, currentWindow: true},
            function(tabs) {
                chrome.tabs.sendMessage(
                    tabs[0].id,
                    { message: msg },
                    function(response) {
                        if (response.message == "all request sent") {
                            console.log(response.message);
                        }
                    }
                );
            }
        );
    })
});


chrome.runtime.onMessage.addListener(
    function(message, sender, sendResponse) {
        var type = message.type;
        if (type == "updateProgress") {
            $("#progress").text(message.data.count);
        }
        sendResponse({
            message: "Progress updated"
        })
    }
);