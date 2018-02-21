var contentInit = {

    initialize: function() {

        // The following variables are initialized once and 
        //      changes persist through deactivation
        latinDict = this.loadLatinDict();
        playerStats = {}; 
        localDict = {};
        // The following is initialized in each activation 
        playerSet = {};

        // get tab states from background.js - activate immediately if needed
        chrome.runtime.sendMessage({
            type: "getStates",
            tabid: -1 // use sender.tab.id in listener
        }, function(response) {
            // console.log(response);
            if (response.data.activated) {
                activate();
                contentChangeWatcher.watchForChange();
            }
        });

        chrome.runtime.onMessage.addListener(
            function(message, sender, sendResponse) {
                var msg = message.message;
                var res_msg = "";
                // console.log("Received Message: " + msg);
                switch (msg) {
                    case "activate":
                        activate();
                        contentChangeWatcher.watchForChange();
                        res_msg = "activated";
                        // update states in background
                        chrome.runtime.sendMessage({
                            type: "setStates",
                            tabid: -1,
                            data: {activated: true}
                        });
                        break;
                    case "deactivate":
                        deactivate();
                        contentChangeWatcher.cancelWatch();
                        res_msg = "deactivated";
                        chrome.runtime.sendMessage({
                            type: "setStates",
                            tabid: -1,
                            data: {activated: false}
                        });
                        break;
                    case "getAll":
                        requestAllPlayers(Object.keys(playerSet));
                        res_msg = "all request sent";
                        break;
                    default:
                        console.log("Unknown message: " + msg);
                }
                sendResponse({
                    message: res_msg
                });
            }
        );

        // signaling that variable initialization is complete, main menu
        //      in control panel can be displayed
        //  This is sent to by popup
        chrome.runtime.sendMessage({
            type: "initComplete",
        }); 
        // This is sent to background
        chrome.runtime.sendMessage({
            type: "setStates",
            tabid: -1,
            data: {initialized: true}
        });
    },

    loadDict: function() {
        // load dict and kick off initialization when complete
        var xhr = new XMLHttpRequest();
        var dictURL = chrome.runtime.getURL("data/people.json");

        xhr.onload = function() {
            if (xhr.status === 200) {
                console.log("name dictionary loaded - response status: %d",
                        xhr.status);
                console.log("response length: %d", xhr.responseText.length);
                nameDict = JSON.parse(xhr.responseText);
                contentInit.initialize();
            }
        };

        xhr.open("GET", dictURL, true);
        xhr.send(null);
    },

    loadLatinDict: function() {
        // console.log("Loading Latin dict");
        var latinDict = {
            "á" : "a",
            "é" : "e", 
            "í" : "i", 
            "ó" : "o", 
            "ú" : "u", 
            "ñ" : "n", 
            "ü" : "u",
            "Á" : "A",
            "É" : "E",
            "Í" : "I",
            "Ñ" : "N",
            "Ó" : "O",
            "Ú" : "U",
            "Ü" : "U"
        }
        return latinDict;
    },

}

console.log("contentinit is being executed");

// reset tab initialization status in background.js to false
chrome.runtime.sendMessage({
    type: "setStates",
    tabid: -1,
    data: {initialized: false}
});

// starting loading name dictionary
// TO DO: load only upon user request
contentInit.loadDict();

