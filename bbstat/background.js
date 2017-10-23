// alert("background.js");

var tabStates = {}; // storing vairous states for tabs

chrome.runtime.onMessage.addListener(
    function(message, sender, sendResponse) {
        var tabid = message.tabid;
        if (tabid === -1)
            // this is a req from contentscript
            tabid = sender.tab.id;
            console.log(tabid);

        switch(message.type) {
            case "getStates":
                if (tabStates[tabid] === undefined) {
                    // default states
                    tabStates[tabid] = {
                        activated: false,
                        initialized: false
                    };
                }
                sendResponse({
                    message: "getStates OK",
                    data: tabStates[tabid] // return the states
                });
                break;

            case "setStates":
                if (tabStates[tabid] === undefined) {
                    tabStates[tabid] = {};
                }
                var data = message.data
                Object.keys(data).forEach(function(key) {
                    tabStates[tabid][key] = data[key];
                });
                sendResponse({
                    message: "setStates OK"
                });
                break;

            default:
                console.log(message);
        }
    }
);