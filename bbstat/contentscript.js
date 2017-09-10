console.log("contentscript executed");

var nameDict
var xhr = new XMLHttpRequest();
var dictURL = chrome.runtime.getURL("data/people.json");

xhr.onload = function() {
    console.log("name dictionary loaded - response status: %d",
            xhr.status);
    console.log("response length: %d", xhr.responseText.length);
    nameDict = JSON.parse(xhr.responseText);
    mainfunc();
}

xhr.open("GET", dictURL, true);
xhr.send(null);

// need to run below as a call back
function mainfunc() {
    chrome.runtime.onMessage.addListener(
        function(message, sender, sendResponse) {
            console.log("woohoo!");
            console.log("Received Message: " + message.message);
            doSomething();
            // doSomething2()
            sendResponse();
        }
    );
}

function doSomethingInner(node) {
    // console.log("doing something INNER with...");
    // console.log(node);
    // console.log(node.childNodes);
    if (node.nodeType == 3) {
        var splits = node.data.split(' ');
        for (var i = 0; i < splits.length; i++) {
            var word = splits[i];
            var c = word.charAt(0);
            if (c >= 'A' && c <= 'Z') {
                // look for word in the name list
                if (word in nameDict) {
                    console.log("found: %s", word);
                    splits[i] = word + " (PLAYER) ";
                }
            }
        }
        var highlightedText = splits.join(' ');
        node.data = highlightedText; // bad practice?
    }
    else if (node.nodeType == 1 && node.childNodes && 
            !/(script|style)/i.test(node.tagName)) {
        var chnds = node.childNodes;
        for (var i = 0; i < chnds.length; i++) {
            doSomethingInner(chnds[i]);
        }
    }
}

function doSomething() {
    console.log("doing something...");

    doSomethingInner(document.body);

}
