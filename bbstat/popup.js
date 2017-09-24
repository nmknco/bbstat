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
                            activated = !activated;
                            $button1.text(
                                activated ? "deactivate" : "activate");
                        }
                });
            }
        );
    });
});