console.log("contentscript executed");

var nameDict;
var latinDict;
var localDict; // local name-playerinfo dict
var playerStats; // stores complete stats get from xhr response
var playerSet; // store a hashset of players found (in concat ids)

// need to run below as a call back
var mainfunc = function() {

    // The following variables are initialized once and 
    //      changes persist through deactivation
    latinDict = loadLatinDict();
    playerStats = {}; 
    localDict = {};
    // The following is initialized in each activation 
    playerSet = {};

    chrome.runtime.onMessage.addListener(
        function(message, sender, sendResponse) {
            var msg = message.message;
            var res_code; // response status/err code
            var res_msg = ""
            console.log("Received Message: " + msg);
            if (msg == "activate") {
                res_code = activate();
                res_msg = "activateDONE";
            }
            else if (msg == "deactivate") {
                res_code = deactivate();
                res_msg = "deactivateDONE";
            }
            else if (msg == "getAll") {
                res_code = requestAllPlayers(Object.keys(playerSet));
                res_msg = "getAllDONE";
            }
            sendResponse({
                status: res_code,
                message: res_msg
            });
        }
    );
};

var loadLatinDict = function() {
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
};

var toEnglish = function(word, dict) {
    var newword = ""
    for (var i = 0; i < word.length; i++) {
        c = word.charAt(i);
        newword += (c in dict) ? dict[c] : c;
    }
    return newword;
};

var trimHead = function(word) {
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
};

var trimTail = function(word) {
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
};

var preProcAll = function(word, dict) {
    return trimTail(trimHead(toEnglish(word, dict)));
};

var isCap = function(word) {
    if (word == "") return false;
    var c0 = word.charAt(0);
    return (c0 >= "A" && c0 <= "Z");
};

var activateInner = function(node) {
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
                // console.log("Potential last name: %s", lastName);
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
                            var player = matches[0];

                            // multiple matches: for now use the most recent match
                            if (matches.length > 1) {
                                console.log("Multiple matches for " + lastName);
                                matches.forEach( function(match) {
                                    console.log(match.key_mlbam + ": " + +match.mlb_played_last);
                                    if (+match.mlb_played_last > +player.mlb_played_last) {
                                        player = match;
                                    }
                                });
                            }

                            // Now we found a player

                            // update local dict and player set
                            // local dict may already has the key from last activation 
                            if (!localDict.hasOwnProperty(player["key_mlbam"]))
                                localDict[player["key_mlbam"]] = player;
                            var ids_concat = player["key_mlbam"] + "_" + player["key_bbref"];
                            playerSet[ids_concat] = true;

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
                            
                            playerNode.id = ids_concat;
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

        skip = newNodes.length - 1; // tells the recusive function call below
                                    // to skip the newly created nodes
    }

    else if (node.nodeType == 1 && node.childNodes && 
            !/(script|style)/i.test(node.tagName)) {
        var chnds = node.childNodes;
        for (var i = 0; i < chnds.length; i++) {
            i += activateInner(chnds[i]); // replace and skip all newly added
        }
    }

    return skip;
};

var activate = function() {

    // We do a research each time extension is deactivated and reactivated
    console.log("Searching for players...");

    activateInner(document.body);
    console.log("Searched players:");
    console.log(playerSet);
    console.log("Stored player stats:");
    console.log(playerStats);

    // set up mouseover events
    addPopup();

    return 0;
};

var deactivate = function() {

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

    playerSet = {};

    return 0;
};

var addPopup = function() {
    var playerNodes = document.querySelectorAll("._player_node");
    for (var i = 0; i < playerNodes.length; i++) {
        playerNodes[i].addEventListener("mouseover", function() { showPopup(this); }, false);
        playerNodes[i].addEventListener("mouseout", function() { hidePopup(this); }, false);
    }
};

var showPopup = function(node) {
    // using jQuery for offest()

    var popupID = "_popup_" + node.id;
    var $popup = $("#" + popupID);
    var $node = $(node);    // convert to jQuery objectv
    var $prt = $node.parent();
    $prt.attr("data-title-org", $prt.attr("title")).removeAttr("title");

    var offset = $node.offset(); // need to adjust offset both
            // for new and existing popups to deal with multiple occurences

    if ($popup.length) {
        // update..?
        // and show
        $popup.css("left", offset.left)
              .css("top", offset.top + 15);
        $popup.show();
    } else {
        
        // console.log($node.offset());
        $popup = $("<div></div>")
                .attr("id", popupID)
                .attr("class", "_player_popup")
                .css("left", offset.left)
                .css("top", offset.top + 15);
        fillPopup($popup, node.id);
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
        // request statistics from API
        // right now only request once on $popup create
        var ids = node.id.split("_");
        var key_mlbam = ids[0];
        var stats = playerStats[key_mlbam];

        if (!stats) {
            console.log("No stored stats for " + key_mlbam + ". Requesting...");
            requestStats(ids[1], function(stats) {
                storeStats(stats, key_mlbam);
                updateStatsInPopup(stats, $popup);
            });
        }
        else {
            console.log("Using stored stats for " + key_mlbam);
            updateStatsInPopup(stats, $popup);
        }
    }
};

var requestStats = function(key_bbref, dataHandler) {
    // request and store data
    //  - dataHandler(stats) is the callback function processing the
    //  - received data [stats]
    var xhr = new XMLHttpRequest();
    var api_url = "https://localhost:2334/?key_bbref=" + key_bbref;

    xhr.onload = function() {
        if (xhr.status == 200) {
            console.log("%d: DATA API response received", xhr.status);
            console.log("response length: %d", xhr.responseText.length);
            var stats = JSON.parse(xhr.responseText.replace(/\'/g, "\""));
            console.log(stats);
            
            dataHandler(stats);
        }
    }

    xhr.open("GET", api_url, true);
    xhr.send(null);
}

var requestAllPlayers = function(ids_list) {
    var counter = 0; // tracking no. of processed players
                    // no-request or request-complete
    var counter_req = 0;
    console.log("Requesting stats for all players that have no data yet...");

    ids_list.forEach(function(ids_concat) {
        // loop of async calls - beware of data mutation
        var ids = ids_concat.split("_");
        var key_mlbam = ids[0];
        var key_bbref = ids[1]; // must retrive ids now 
                    // - ids[0] will be changed if callback is called later
        if(!playerStats.hasOwnProperty(key_mlbam)) {
            requestStats(key_bbref, function(stats) {
                // executed when a new request is completed
                storeStats(stats, key_mlbam);
                counter++; 
                counter_req++;
                if (counter == ids_list.length) {
                    return requestAllComplete(counter_req);
                }
            });
        } else {
            counter++;
            if (counter == ids_list.length) {
                return requestAllComplete(counter_req);
            }
        }
    });
}

var requestAllComplete = function(cnt_req) {
    console.log("Completed requests for " + cnt_req + " players");
    return 0;
}

var storeStats = function(stats, key_mlbam) {
    // It is assumed that stats won't need to be requested again
    //      for a same player before user reload the webpage next time,
    //      and thus storeStats() is only called once for each player 
    //      (in all normal situations), and there's no need to check for 
    //      existing key
    console.log("Storing stats for " + key_mlbam);
    playerStats[key_mlbam] = stats;
}

var updateStatsInPopup = function(stats, $popup) {

    // insert stats in valid xhr response into the popup
    var recentrow = stats[stats.length-1];
    if (recentrow.hasOwnProperty("AVG")) {
        var slash = recentrow.Year + ": " + recentrow.AVG + "/";
        slash += recentrow.OBP + "/" + recentrow.SLG;
        console.log(slash);
        $popup.find("._stats_div").text(slash);
    }
};

var hidePopup = function(node) {
    var $node = $(node);
    var $prt = $node.parent();
    $prt.attr("title", $prt.attr("data-title-org")).removeAttr("data-title-org");

    var popupID = "_popup_" + node.id;
    setTimeout(function() {
        if(!($('#' + popupID + ":hover").length > 0)) {
            $("#" + popupID).hide();
        }
    }, 200);
};

var fillPopup = function($popup, id) {
    var ids = id.split("_");
    var key_mlbam = ids[0];
    var key_bbref = ids[1];
    var player = localDict[key_mlbam];



    $popup.append($("<div></div>").addClass("_header_texts"));
    var $headerText = $popup.find("._header_texts");
    $headerText.append($("<div></div>")
            .addClass("_player_name")
            .text(player["name_first"] + " " + player["name_last"]));
    $headerText.append($("<a></a>").text("Baseball Reference").attr(
            "href", "https://www.baseball-reference.com/players/"
                    + key_bbref.charAt() + "/" + key_bbref + ".shtml")
            .attr("target", "_blank")
    );
    var stats = "";
    $headerText.append($("<div></div>")
                .attr("class", "_stats_div")
                .text(stats));

    var headshot_mlb = "http://mlb.mlb.com/mlb/images/players/head_shot/";
    headshot_mlb += key_mlbam + ".jpg";
    $popup.append($("<div></div>")
            .addClass("_headshot_div")
            .append('<img class="_headshot" align="left" src ="' + headshot_mlb + '" />'));

    return $popup;
};

var insertCSS = function(){
    var styleEl = document.createElement("style");
    document.head.appendChild(styleEl);

    var rule = "._player_popup { ";
    rule += "position: absolute; z-index: 100;";
    rule += "display: flex;";
    rule += "background-color: #f8f8f8;"; 
    // rule += "border: 1px solid #000000;";
    rule += "margin: 10px; padding: 10px; border-radius: 10px;";
    rule += "width: 240px;";
    rule += "-webkit-box-shadow: 1px 1px 5px 0px rgba(50,50,50,0.75);";
    rule += "-moz-box-shadow: 1px 1px 5px 0px rgba(50,50,50,0.75);";
    rule += "box-shadow: 1px 1px 5px 0px rgba(50,50,50,0.75);";
    rule += "font-family: \"Ariel\", sans-serif; font-size: 15px; text-align: left;";
    rule += " }";
    styleEl.sheet.insertRule(rule, 0);

    rule = "._headshot { ";
    rule += "width: 60px;";
    rule += "border: 2px solid white; border-radius: 7px; margin: 0px 5px 5px 5px";
    rule += " }";
    styleEl.sheet.insertRule(rule, 0);

    rule = "._headshot_div { width: 80px; height: 100px; }";
    styleEl.sheet.insertRule(rule, 0);

    rule = "._header_texts { width: 100%; }";
    styleEl.sheet.insertRule(rule, 0);

    rule = "._player_name { font-weight: bold; }";
    styleEl.sheet.insertRule(rule, 0);

    rule = "._player_popup a { color: black; }";
    styleEl.sheet.insertRule(rule, 0);

};



$(document).ready(insertCSS);

var xhr = new XMLHttpRequest();
var dictURL = chrome.runtime.getURL("data/people.json");

xhr.onload = function() {
    if (xhr.status == 200) {
        console.log("name dictionary loaded - response status: %d",
                xhr.status);
        console.log("response length: %d", xhr.responseText.length);
        nameDict = JSON.parse(xhr.responseText);
        console.log(nameDict["JOHNSON"]);
        mainfunc();
    }
};

xhr.open("GET", dictURL, true);
xhr.send(null);