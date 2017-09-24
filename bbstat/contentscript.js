console.log("contentscript executed");

$(document).ready(function(){
    var styleEl = document.createElement("style");
    document.head.appendChild(styleEl);

    var rule = "._player_popup { ";
    rule += "position: absolute;";
    rule += "background-color: #f2f2e5;"; 
    rule += "border: 1px solid #000000;";
    rule += "margin: 10px; padding: 10px;";
    // rule += "width: 150px; height: 150px;";
    rule += " }";
    styleEl.sheet.insertRule(rule, 0);
});

var nameDict
var xhr = new XMLHttpRequest();
var dictURL = chrome.runtime.getURL("data/people.json");
var latinDict = loadLatinDict();
var localDict = {};

xhr.onload = function() {
    if (xhr.status == 200) {
        console.log("name dictionary loaded - response status: %d",
                xhr.status);
        console.log("response length: %d", xhr.responseText.length);
        nameDict = JSON.parse(xhr.responseText);
        mainfunc();
    }
}

xhr.open("GET", dictURL, true);
xhr.send(null);

// need to run below as a call back
function mainfunc() {
    chrome.runtime.onMessage.addListener(
        function(message, sender, sendResponse) {
            console.log("woohoo!");
            console.log("Received Message: " + message.message);
            if (message.message == "activate")
                activate();
            else if (message.message == "deactivate")
                deactivate();
            sendResponse({status: 0});
        }
    );
}

function loadLatinDict() {
    console.log("Loading Latin dict");
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
}

function toEnglish(word, dict) {
    var newword = ""
    for (var i = 0; i < word.length; i++) {
        c = word.charAt(i);
        newword += (c in dict) ? dict[c] : c;
    }
    return newword;
}

function trimHead(word) {
    // assuming that all letters are English
    var i = 0;
    while (i < word.length) {
        var c = word.charAt(i);
        if ((c >= "a" && c <= "z") || (c >= "A" && c <= "Z")) {
            break;
        }
        i++;
    }
    return word.slice(i);
}

function trimTail(word) {
    // assuming that all letters are English
    // assuming the word start with letters
    var i = 0;
    while (i < word.length) {
        var c = word.charAt(i);
        // Remember: 'a' > 'A' (97 > 65)
        if (c < "A" || (c > "Z" && c < "a") || c > "z") {
            // Prevent trmming legit names like O'Day
            var c1 = word.charAt(i+1);
            if (!(c == "'" && c1 >= "A" && c1 <= "Z"))
                break;
        }
        i++;
    }
    return word.slice(0,i);
}

function preProcAll(word, dict) {
    return trimTail(trimHead(toEnglish(word, dict)));
}

function isCap(word) {
    if (word == "") return false;
    var c0 = word.charAt(0);
    return (c0 >= "A" && c0 <= "Z");
}

function activateInner(node) {
    // console.log("doing something INNER with...");
    // console.log(node);
    // console.log(node.childNodes);
    var skip = 0;

    if (node.nodeType == 3) {
        // gloabl skip for newly added elements
        // New node will be a collection of textnodes and elements
        // current node is to be replaced with all nodes in newNodes
        var currentTextArray = [];
        var newNodes = [];
        var isFirstText = true; // if we are at the first text node

        // To do: quickly skip empty/blank text nodes
        var splits = node.data.split(/[\s]+/);
        if (splits.length == 0) return;

        var next = trimTail(trimHead(
                toEnglish(splits[0], latinDict))); // always trimmed
        var isNextCap = isCap(next);

        for (var i = 0; i < splits.length; i++) {
            // console.log(next);
            var word = splits[i];
            currentTextArray.push(word);

            var ord = next;
            var isCurrentCap = isNextCap;

            // check next, update next and isNextCap
            if (i < splits.length-1) {
                next = trimHead(toEnglish(splits[i+1], latinDict)); //new next
                isNextCap = isCap(next);
                if (isNextCap) next = trimTail(next);
                if (isNextCap && (next in nameDict)) {
                    // if new next is capped and is a name
                    // skip and continue
                    continue;
                }
            }
            // now that next is recorded, check if current is capped
            if (!isCurrentCap && ord != "deGrom" && ord != "d'Arnaud") {
                continue;
            }
            // exceptions
            // Handled here: deGrom | d'Arnaud
            // Handled later: van Xx | van den Xxx | de Xxx | de la Xxx | den Xxx
            //                  de los Xxx | d'Arnaud
            // Parts like "de" or "van" may be capitalized - we handle this by
            //  using all-uppercase names to match

            // We will also handle suffix as if they are part of the name


            // console.log(word);
            // console.log(ord);
            // now we know ord is (1) English, (2) trimmed, (3) capped (except 2)
            // it's a potential last name

            // Since we are using all-uppercase as keys for matching, we 
            //      don't need to deal with ALL CAP texts separately

            var lastName = ord.toUpperCase(); // normal case
            
            // handle exceptions with multi-word last name
            var preLen = 1; // length of components up to ord (so suffix doesn't count)
                            //  it's used as offset from ord in looking for first name
            if (i > 0) {
                var pre1 = preProcAll(splits[i-1], latinDict).toUpperCase();
                // Griffey Jr.
                if (lastName == "JR" || lastName == "SR" || lastName == "III") {
                    lastName = pre1 + " " + lastName;
                    preLen = 2;
                }
                // den Dekker
                else if (pre1 == "DE" || pre1 == "DEN" || pre1 == "VAN") {
                    lastName = pre1 + " " + lastName;
                    preLen = 2;
                }
                // de la Rosa
                else if (i > 1) {
                    var pre2 = preProcAll(splits[i-2], latinDict).toUpperCase();
                    if (pre2 == "DE" || pre2 == "VAN") {
                        lastName = pre2 + " " + pre1 + " " + lastName;
                        preLen = 3;
                    }
                }
            }

            // redundant toUpperCase to be sure
            lastName = lastName.toUpperCase();

            // if (longName) console.log("long name? %s", lastName);

            // look for word in the name list
            if (lastName in nameDict) {
                console.log("Potential last name: %s", lastName);
                if (i >= preLen) {
                    var prev = splits[i - preLen];
                    var prev = trimHead(toEnglish(prev, latinDict));
                    if (isCap(prev)) {
                        // looking for potential first name preceding
                        var initial = "";
                        if (prev.length == 2 && prev.charAt(1) == ".") {
                            // A. McCutchen
                            // A. J. Burnett
                            initial = prev;
                            if (i > 1) {
                                prev = trimHead(toEnglish(splits[i-2], latinDict)
                                        ) + " " + prev;
                            }
                            // initial will be "X."
                            // prev will be ".... X."
                        }
                        else if (prev.length == 4 &&
                                prev.charAt(1) == "." && prev.charAt(3) == ".") {
                            // R.A. Dickey
                            prev = prev.slice(0,2) + " " + prev.slice(2,4);
                            // console.log(prev + " " + lastName);
                        }

                        // match first name preceding
                        // Is prev a first name or team name?
                        var players = nameDict[lastName];
                        var matches = []; // index of the matches
                        for (var j = 0; j < players.length; j++) {
                            prev = prev.toUpperCase();
                            var firstName = players[j]["name_first"].toUpperCase();
                            var fnInit = firstName.charAt(0) + "."
                            if (prev == firstName || initial == fnInit)
                                matches.push(players[j]);
                        }
                        if (matches.length == 0) continue;
                        else if (matches.length >= 1) {
                            // when > 1 for now use the most recent match
                            if (matches.length > 1) {
                                for (var k = 1; k < matches.length; k++) {
                                    if (matches[k]["mlb_played_last"] > matches[0]["mlb_player_last"]) {
                                        matches[0] = matches[k];
                                    }
                                }
                            }

                            // write local dict
                            var player = matches[0];
                            localDict[player["key_mlbam"]] = player;

                            // add the texts before last name to new nodes
                            var currentText = currentTextArray.slice(0, -preLen).join(" ");
                            var currentText = currentText + " ";
                            if (isFirstText) {
                                isFirstText = false;
                            } else {
                                currentText = " " + currentText;
                            }
                            newNodes.push(document.createTextNode(currentText));
                            
                           
                            // add an element node for the found player
                            var playerNode = document.createElement("mark");
                            playerNode.className = "_player_node";
                            
                            playerNode.id = player["key_mlbam"] + "_" + player["key_bbref"];
                            // wrap the last name as appeared in original text
                            var orgLastName = currentTextArray.slice(-preLen).join(" ");
                            playerNode.appendChild(
                                    document.createTextNode(orgLastName));
                            newNodes.push(playerNode);

                            currentTextArray = [];
                        }
                        // else {
                        //     // multiple matches
                        //     // disambiguate
                        //     // 2. year
                        //     // 3. team
                        //     splits[i] = word + " (multi match)";
                        // }
                    }
                    else {
                        // no first name BEFORE, now
                        // 1. check first name after comma

                        // If we want to show name w/o first name, then:
                        // 2. are there multiple records?
                    }
                }
            }
            else {
                // name not in namedict
            }
        }
        // var newText = splits.join(" ");
        // node.nodeValue = newText; // bad practice?

        // Now we are going to mutate dom tree, and will be replacing one node
        //      with multiple node, and this causes unwanted behavior when
        //      iterating through parent.childNodes recursively - the iteration
        //      will reflect the change each time
        // Two solutions
        //      1. copy childNodes (a NodeList obj) into an array first
        //          so that we can iterate through the original elements
        //          safely
        //      2. Explicitly tell the iteration to skip a certain amount
        //          of node

        // push the last batch of texts, and then replace the node
        newNodes.push(document.createTextNode(" " + currentTextArray.join(" ")));
        var prt = node.parentNode;
        for (var i = 0; i < newNodes.length; i++) {
            prt.insertBefore(newNodes[i], node);
        }
        node.remove();

        skip = newNodes.length - 1;
    }

    else if (node.nodeType == 1 && node.childNodes && 
            !/(script|style)/i.test(node.tagName)) {
        var chnds = node.childNodes;
        for (var i = 0; i < chnds.length; i++) {
            i += activateInner(chnds[i]); // replace and skip all newly added
        }
    }

    return skip;
}

function activate() {
    console.log("doing something...");

    activateInner(document.body);

    // set up mouseover events
    addPopup();
}

function deactivate() {

    // again we need to handle carefully as HTMLCollection of doms
    //  mutated during iteration
    // However if we use querySelectorAll() we get a non-live NodeList
    //          (note: NodeList CAN be live, as in activateINNER() )
    //  and can just iterate through

    // var playerNodes = document.getElementsByClassName("_player_node");
    // console.log(playerNodes);    // this returns HTMLCollection, live
    var playerNodes = document.querySelectorAll("._player_node");
    // console.log(playerNodes);       // this returns NodeList that is not live
    for (var i = 0; i < playerNodes.length; i++) {
        var node = playerNodes[i];
        var prt = node.parentNode;
        node.replaceWith(node.firstChild);
        prt.normalize();
    }
}

function addPopup() {
    var playerNodes = document.querySelectorAll("._player_node");
    for (var i = 0; i < playerNodes.length; i++) {
        playerNodes[i].addEventListener("mouseover", function() { showPopup(this); }, false);
        playerNodes[i].addEventListener("mouseout", function() { hidePopup(this); }, false);
    }
}

function showPopup(node) {
    // using jQuery for offest()

    var popupID = "_popup_" + node.id;
    var $popup = $("#" + popupID);
    if ($popup.length) {
        // update..?
        // and show
        $popup.show();
    } else {
        var $node = $(node);    // convert to jQuery object
        var offset = $node.offset();
        // console.log($node.offset());
        var $popup = $("<div></div>")
                .attr("id", popupID)
                .attr("class", "_player_popup")
                .css("left", offset.left)
                .css("top", offset.top + 25);
        var player = localDict[node.id.split("_")[0]];
        $popup.text(player["name_first"] + " " + player["name_last"]);
        $("body").append($popup);
        $popup.hover(
            function() {
                // console.log(this);
                $(this).show();
            },
            function() {
                $(this).hide(); 
            }
        );
    }
}

function hidePopup(node) {
    var popupID = "_popup_" + node.id;
    setTimeout(function() {
        if(!($('#' + popupID + ":hover").length > 0)) {
            $("#" + popupID).hide();
        }
    }, 200);
}

