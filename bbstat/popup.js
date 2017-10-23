// in general, we send tab-state updating message to background.js
//      from contentscript instead of from here, since contentscript
//      has better persistence.

var tab_activated;

var init = function() {

    var $activate = $("#activate");
    var $menuMain = $("#menuMain");
    var $initMsg = $("#initMsg");
    $menuMain.hide();

    // send a message (with current tab info) to background.js
    //      to get states for current tab, then update both
    //      1. state variable 2. DOM elements in popup

    // popup request for states is for determine the current
    //      popup elements (e.g. toggle switch state)
    // contentscript send request separately to see if activation
    //      is needed on page load
    // This needs to be called everytime popup is opened
    chrome.tabs.query({active: true, currentWindow: true},
        function(tabs) {
            // alert("query states from background.js...");
            chrome.runtime.sendMessage({
                type: "getStates",
                tabid: tabs[0].id
            },
            function(response) {
                // update state variable and toggle switch
                tab_activated = response.data.activated;
                $activate.prop("checked", tab_activated);

                // show menu when current tab is initialized
                if (response.data.initialized) {
                    $menuMain.show();
                    $initMsg.hide();
                }
            });
        }
    );

    // add control functionality to the toggle switch
    
    $activate.change(function() {
        // send message to contentscript when switch flipped
        msg = this.checked ? "activate" : "deactivate";
        chrome.tabs.query(
            {active: true, currentWindow: true},
            function(tabs) {
                chrome.tabs.sendMessage(
                    tabs[0].id,
                    { message: msg },
                    function(response) {
                        if (response.message == "activated") {
                            tab_activated = true;
                        }
                        else if (response.message == "deactivated") {
                            tab_activated = false;
                        }
                        // let content script notify and update 
                        //      tab states in background
                    }
                );
            }
        );
    });

    var $loadAllBtn = $("#getAllBtn");
    $loadAllBtn.click(function() {
        if (!tab_activated) {
            // do nothing if not activated
            var msgDiv =  $("#msgbar");
            msgDiv.text("Please activate first")
                .fadeOut(2000, function() {
                        $(this).text("").show();
            });
        } else {
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
        }
    })

    chrome.runtime.onMessage.addListener(
        function(message, sender, sendResponse) {
            switch(message.type) {
                case "updateProgress":
                    var $msgDiv =  $("#msgbar");
                    var msg = "Data for " + message.data.completed 
                                + "/" + message.data.total
                                + " new players loaded";
                    $msgDiv.text(msg);
                    if (message.data.completed === message.data.total) {
                        $msgDiv.append("<p></p>")
                                    .text("Data for all players are loaded")
                                    .fadeOut(2000, function() {
                    // actions after fadeOut must be in the call back
                    //      again, this refers back to $msgDiv
                                            $(this).text("").show();
                                    })
                    }
                    sendResponse({
                        message: "Progress updated"
                    });
                    break;
                case "initComplete":
                    // show menu when current tab just completes init
                    $menuMain.show();
                    $initMsg.hide();
                    // again let contentscript notify background.js
                    break;
                default:
                    console.log(message);
            }
        }
    );
}

$(document).ready(init);