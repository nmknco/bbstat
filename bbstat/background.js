// alert("background.js");

var tabStates = {};

chrome.runtime.onMessage.addListener(
    function(message, sender, sendResponse) {
        var tabid = message.tabid;
        if (message.type == "getStates") {
            if (tabid === -1) 
                tabid = sender.tab.id; // req from contentscript

            var tab_activated = false; // default
            if (tabStates[tabid] == undefined) {
                tabStates[tabid] = {activated: false};
            } else {
                tab_activated = tabStates[tabid].activated;
            }
            sendResponse({
                message: "OK",
                data: {activated: tab_activated}
            })
        }
        else if (message.type == "setStates") {
            if (tabStates[tabid] == undefined) {
                tabStates[tabid] = {};
            }
            var data = message.data
            Object.keys(data).forEach(function(key) {
                tabStates[tabid][key] = data[key];
            });
        }
    }
);