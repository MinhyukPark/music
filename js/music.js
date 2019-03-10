$(document).ready(function() {
	var Spotify = require('spotify-web-api-js');
	var spotifyApi = new Spotify();
	spotifyApi.setAccessToken(accessToken);
    function checkEnd() {
        var remoteText = fetchFromAPI();
		spotifyApi.getMyCurrentPlayingTrack().then(function(data) {
            document.getElementById("albumart").src = data["item"]["album"]["images"][0]["url"]; 
            document.getElementById("currentlyplaying").innerHTML = remoteText["currently-playing"];
            if(data["is_playing"] == false && remoteText["currentlypaused"] == false) {
                playFromQueue();
                document.getElementById("play").innerHTML = "pause";
            } else if(data["is_playing"] == true) {
                remoteText["currentlypaused"] = false;
                document.getElementById("play").innerHTML = "pause";
                pushToAPI(remoteText);
            } else if(data["is_playing"] == false && remoteText["currentlypaused"] == true) {
                document.getElementById("play").innerHTML = "play";
            }

            var progressbar = document.getElementById("progressbar");
            var width = data["progress_ms"] * 100 / data["item"]["duration_ms"];
            progressbar.style.width = width + '%';
        }, function(err) {
        });

        
    }
    setInterval(checkEnd, 3000);

	function searchTracks() {
		var searchQuery = document.getElementById("searchbar-text").value;
		spotifyApi.searchTracks(searchQuery)
		  .then(function(data) {
		    var result = data["tracks"]["items"];
		    $('#searchresults-ul').empty();
		    var ul = document.getElementById("searchresults-ul");
		    for (item of result) {
			    var li = document.createElement("li");
			    li.setAttribute('id', item["id"]);
			    li.appendChild(document.createTextNode(item["name"] + " by " + item["artists"][0]["name"] + " from " + item["album"]["name"]));
			    ul.appendChild(li);
                $("#" + item["id"]).click({item: item}, addToQueue);
		    }
		  }, function(err) {
		    console.error(err);
		});
	}

	function selectDevice(event) {
	    item = event.data.item;
	    document.getElementById("currentdevice").innerHTML = item["name"];
	    document.getElementById("currentdeviceid").innerHTML = item["id"];
        var remoteText = fetchFromAPI();
        remoteText["currentdevice"] = item["name"]; 
        remoteText["currentdeviceid"] = item["id"]; 
        pushToAPI(remoteText);
	}

	function findAvailableDevices() {
		spotifyApi.getMyDevices()
		  .then(function(data) {
		    var result = data["devices"];
		    $('#available-ul').empty();
		    var ul = document.getElementById("available-ul");
		    for (item of result) {
			    var li = document.createElement("li");
			    li.setAttribute('id', item["id"]);
			    li.appendChild(document.createTextNode(item["name"]));
			    ul.appendChild(li);
                $("#" + item["id"]).click({item: item}, selectDevice);
		    }
		  }, function(err) {
		    console.error(err);
		});
	}

    var currently_paused = false;
    function playPause() {
        if(currently_paused) {
            spotifyApi.play().then(function(){},function(err){});
            document.getElementById("play").innerHTML = "pause";
            currently_paused = false;
            var remoteText = fetchFromAPI();
            remoteText["currentlypaused"] = false;
            pushToAPI(remoteText);
            return;
        } else {
            document.getElementById("play").innerHTML = "play";
            spotifyApi.pause().then(function(){},function(err){});
            currently_paused = true;
            var remoteText = fetchFromAPI();
            remoteText["currentlypaused"] = true;
            pushToAPI(remoteText);
            return;
        }
    }

    function playFromQueue() {
        var remoteText = fetchFromAPI();
        refreshQueue();
        if($("#hidden-songqueue-ul li:first")[0] == undefined) {
            return;
        }
        var cur_song = 'spotify:' + $("#hidden-songqueue-ul li:first")[0].innerHTML.split('spotify:')[1]
        var current_device_id = '' + document.getElementById("currentdeviceid").innerHTML;
        spotifyApi.play({"uris" : [cur_song], "device_id" : current_device_id})
            .then(function() {
        }, function(err) {
            console.error(err);
        });

        var ul = document.getElementById("hidden-songqueue-ul");
        var childId = $("#hidden-songqueue-ul li:first").attr("id");
        var lis = document.querySelectorAll('#hidden-songqueue-ul li');
        ul.removeChild(lis[0]);

        var ul = document.getElementById("songqueue-ul");
        var childId = $("#songqueue-ul li:first").attr("id");
        var lis = document.querySelectorAll('#songqueue-ul li');
        remoteText["currently-playing"] = lis[0].innerHTML;
        ul.removeChild(lis[0]);

        delete remoteText[childId]

        var currently_playing = document.getElementById("currentlyplaying");
        currently_playing.innerHTML = remoteText["currently-playing"];
        pushToAPI(remoteText);
	}

	function fetchFromAPI() {
	    var xmlHttp = new XMLHttpRequest();
	    var url = "https://api.minhyukpark.com/music";
	    xmlHttp.open( "GET", url, false );
	    xmlHttp.send( null );
	    var remoteText = JSON.parse(xmlHttp.responseText)
	    return remoteText;
	}

	function pushToAPI(data) {
	    var url = "https://api.minhyukpark.com/music";
	    var xmlHttp = new XMLHttpRequest();
	    xmlHttp.open( "POST", url, false );
	    xmlHttp.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
	    xmlHttp.send(JSON.stringify(data));
	}

	function addToQueue(event) {
        refreshQueue();
        var remoteText = fetchFromAPI();
	    var item = event.data.item;

	    var ul = document.getElementById("hidden-songqueue-ul");
	    var li = document.createElement("li");
	    li.setAttribute('id', item["id"] + "queue");
	    li.appendChild(document.createTextNode(item["name"] + item["uri"]));
	    ul.appendChild(li);
	    remoteText[item["id"] + "queue"] = {}
        remoteText[item["id"] + "queue"]["hidden"] = item["name"] + item["uri"];


	    var ul = document.getElementById("songqueue-ul");
	    var li = document.createElement("li");
	    li.setAttribute('id', item["id"] + "visiblequeue");
	    li.appendChild(document.createTextNode(item["name"] + " by " + item["artists"][0]["name"] + " from " + item["album"]["name"]));
	    ul.appendChild(li);
        
        remoteText[item["id"] + "queue"]["visible"] = item["name"] + " by " + item["artists"][0]["name"] + " from " + item["album"]["name"];

	    pushToAPI(remoteText);
	}

    function clearQueue() {
        var remoteText = fetchFromAPI();
        var clearedText = {};
        $('#hidden-songqueue-ul').empty();	
        $('#songqueue-ul').empty();	
	    for (var key in remoteText) {
            if(!key.includes("queue")) {
			    if(remoteText.hasOwnProperty(key)) {
                    clearedText[key] = remoteText[key];
                }
            }
        }
        pushToAPI(clearedText);
    }


    function refreshQueue() {
        var remoteText = fetchFromAPI();
        $('#hidden-songqueue-ul').empty();	
        $('#songqueue-ul').empty();	
        var ul = document.getElementById("hidden-songqueue-ul");
        var visible_ul = document.getElementById("songqueue-ul");
	    for (var key in remoteText) {
            if(key.includes("queue")) {
			    if(remoteText.hasOwnProperty(key)) {
				    var li = document.createElement("li");
				    li.setAttribute('id', key);
				    li.appendChild(document.createTextNode(remoteText[key]["hidden"]));
				    ul.appendChild(li);
				    var cur_id = '' + key.split("queue")[0];
				    var cur_name = '' + remoteText[key]["hidden"].split("spotify:")[0]
				    var cur_uri = 'spotify:' + remoteText[key]["hidden"].split("spotify:")[1]
				    $("#" + key).click({item: {"id": cur_id, "name": cur_name, "uri": cur_uri}}, selectDevice);

				    var li = document.createElement("li");
				    li.setAttribute('id', key);
				    li.appendChild(document.createTextNode(remoteText[key]["visible"]));
				    visible_ul.appendChild(li);
				    $("#" + key + "visiblequeue").click({item: {"id": cur_id, "name": cur_name, "uri": cur_uri}}, selectDevice);
			    }
		    } else if(key == "currentdevice") {
                var currentdevice = document.getElementById("currentdevice");
                currentdevice.innerHTML = remoteText[key];
		    } else if(key == "currentdeviceid") {
                var currentdeviceid = document.getElementById("currentdeviceid");
                currentdeviceid.innerHTML = remoteText[key];
            } else if(key == "currentlyplaying") {
		        var currently_playing = document.getElementById("currentlyplaying");
			    currently_playing.innerHTML = remoteText[key];
            }
	    }
	}

    $("#refreshqueue").click(refreshQueue);
    $("#clearqueue").click(clearQueue);
	var initLoad = true;
	if(initLoad) {
	    refreshQueue();
        checkEnd();
	    initLoad = false;
	}
    $("#searchbar-text").on("change", searchTracks);
    $("#findavailabledevices").click(findAvailableDevices);
    $("#play").click(playPause);
});
