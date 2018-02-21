var contentChangeWatcher= {

    interval: 2000,
    minDiff: 5,
    bodyLength: 0,
    changeDetInterval: null,

    watchForChange: function() {
        contentChangeWatcher.bodyLength = document.body.innerText.length;
        contentChangeWatcher.changeDetInterval = setInterval(function() {
            // console.log(contentChangeWatcher.bodyLength);
            var newLength = document.body.innerText.length
            // console.log(newLength);
            if (Math.abs(newLength - contentChangeWatcher.bodyLength) > contentChangeWatcher.minDiff) {
                // console.log('page change detected');
                chrome.runtime.sendMessage({
                    type: "getStates",
                    tabid: -1 // use sender.tab.id in listener
                }, function(response) {
                    if (response.data.activated) {
                        activate();
                    }
                });
                contentChangeWatcher.bodyLength = newLength;
            }
        }, contentChangeWatcher.interval);
    },

    cancelWatch: function() {
        clearInterval(this.changeDetInterval);
    },
};