console.log("contentscript executed");

chrome.runtime.onMessage.addListener(
    function(message, sender, sendResponse) {
        console.log("woohoo!");
        console.log("Received Message: " + message.message);
        doSomething();
        sendResponse();
    }
);

function doSomething() {
    console.log("doing something...");
    var articleHtml = $("article").html();
    // console.log(articleHtml);
    var keyword = "Cleveland";
    var splits = articleHtml.split(keyword);
    console.log(splits.length);
    var modifiedKey = '<span style="background-color: #FFFF00;">'
            + keyword + "</span>";
    console.log(modifiedKey);
    var highlightedHTML = splits.join(modifiedKey);
    $("article").html(highlightedHTML);
}

function findAll(source, target) {
    indexes = [];
    for (i = 0; i < source.length - target.length; i++) {
        var found = true;
        for (j = 0; j < target.length; j++) {
            if (source.charAt(i+j) != target.charAt(j)) {
                found = false;
                break;
            }
        }
        if (found) indexes.push(i);
    }
    return indexes;
}