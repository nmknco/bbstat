var activated = false;

$(document).ready(function() {
    var $button1 = $("#btn1");
    $button1.click(function() {
        // send message to contentscript
        var msg = activated ? "deactivate" : "activate";
        chrome.tabs.query(
            {active: true, currentWindow: true},
            function(tabs) {
                chrome.tabs.sendMessage(
                    tabs[0].id,
                    { message: msg },
                    function(response) {
                        // console.log(response);
                        if (response.status == 0) {
                            if (response.message == "activateDONE") {
                                activated = true;
                                $button1.text("Deactivate");
                            }
                            else if (response.message == "deactivateDONE") {
                                activated = false;
                                $button1.text("Activate");
                            }
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
                        if (response.status == 0 && 
                            response.message == "getAllDONE") {
                            console.log("getAll complete");
                        }
                    }
                );
            }
        );
    })
});