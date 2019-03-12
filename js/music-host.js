$(document).ready(function() {
    var querystring = require('query-string');
	var Spotify = require('spotify-web-api-js');
    var mongoose = require('mongoose');
	var spotifyApi = new Spotify();
	spotifyApi.setAccessToken(accessToken);

    /* setInterval(updateAccessToken, 10000);
    function updateAccessToken() {
        var data = fetchFromAPI();
        data["accessToken"] = getNewAPIToken();;
	    spotifyApi.setAccessToken(data["accessToken"]);
        pushToAPI(data);
    }*/

    function makeid() {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < 32; i++) {
          text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

   /*
    var Schema = mongoose.Schema;
    var RoomModelSchema = new Schema({
        roomcode: String,
        queue: [],
        currentlyplaying: String,
        albumart: String,
        currentdeviceid: String,
        currentdevice: String,
        currentlypaused: Boolean
    });
    */
    var roomcode = makeid();
    document.getElementById("roomcode").innerHTML = roomcode;
    document.getElementById("roomcodecopy").innerHTML = "Link: musictude.minhyukpark.com?roomcode=" + roomcode;
    initRoom();
    function initRoom() {
        spotifyApi.getMyCurrentPlayingTrack().then(function(data) {
            if(data["item"] != undefined) {
                var is_currently_playing = data["is_playing"];
                var current_url = data["item"]["album"]["images"][0]["url"]; 
                var currently_playing = data["item"]["name"] + " by " + data["item"]["artists"][0]["name"] + " from " + data["item"]["album"]["name"];
                if(is_currently_playing) {
                    document.getElementById("currentlyplaying").innerHTML = currently_playing;
                    document.getElementById("play").innerHTML = "pause";
                } else {
                    document.getElementById("play").innerHTML = "play";
                }
            }
            var new_room = {
                "roomcode": roomcode,
                "queue": [],
                "currentlyplaying": undefined,
                "albumart": '' + "",
                "currentdeviceid": "",
                "currentdevice": "",
                "accessToken": accessToken
            }
            addNewToAPI(new_room);
        });
    }

    function updatePage() {
        var data = fetchFromAPI()[0];
        refreshQueue();
        document.getElementById("albumart").src = data["albumart"];
        document.getElementById("currentlyplaying").innerHTML = data["currentlyplaying"];
        document.getElementById("currentdevice").innerHTML = data["currentdevice"];
        document.getElementById("currentdeviceid").innerHTML = data["currentdeviceid"];
    }

    function checkEnd() {
        var data = fetchFromAPI()[0];
        spotifyApi.getMyCurrentPlayingTrack().then(function(data) {
            var is_currently_playing = data["is_playing"];
            if(is_currently_playing == false && calledpause == false && data["curentdeviceid"] != "") {
                playFromQueue();
            }
        });
    }

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
        var api_data = fetchFromAPI()[0];
        spotifyApi.getMyCurrentPlayingTrack().then(function(data) {
            if(data["item"] != undefined) {
                var is_currently_playing = data["is_playing"];
                var current_url = data["item"]["album"]["images"][0]["url"]; 
                var currently_playing = data["item"]["name"] + " by " + data["item"]["artists"][0]["name"] + " from " + data["item"]["album"]["name"];
                document.getElementById("play").innerHTML = "pause";
                api_data["currentlyplaying"] = currently_playing;
                api_data["albumart"] = current_url;
                api_data["currentdevice"] = item["name"]; 
                api_data["currentdeviceid"] = item["id"]; 
                pushToAPI(api_data);
                var current_device_id = '' + document.getElementById("currentdeviceid").innerHTML;
                spotifyApi.play({"device_id" : current_device_id}).then(function(){},function(err){});
                updatePage();
            }
        });
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

    var calledpause = false;
    function playPause() {
        var current_status = document.getElementById("play").innerHTML;
        if(current_status == "play") {
            var current_device_id = '' + document.getElementById("currentdeviceid").innerHTML;
            spotifyApi.play({"device_id" : current_device_id}).then(function(){},function(err){});
            document.getElementById("play").innerHTML = "pause";
            calledpause = false;
        } else if(current_status == "pause") {
            var current_device_id = '' + document.getElementById("currentdeviceid").innerHTML;
            spotifyApi.pause({"device_id" : current_device_id}).then(function(){},function(err){});
            document.getElementById("play").innerHTML = "play";
            calledpause = true;
        }
    }

    function skip() {
        playFromQueue();
    }

    function playFromQueue() {
        var data = fetchFromAPI()[0];
        if(data["queue"] == []) {
            return;
        }

        var cur_element = data["queue"][0];
        var cur_uri = cur_element["uri"];
        var current_device_id = '' + document.getElementById("currentdeviceid").innerHTML;
        spotifyApi.play({"uris" : [cur_uri], "device_id" : current_device_id})
            .then(function() {
        }, function(err) {
            console.error(err);
        });
        document.getElementById("play").innerHTML = "pause";
        data["queue"].shift();
        data["currentlyplaying"] = cur_element["visible"];
        data["albumart"] = cur_element["albumart"];
        data["uri"] = cur_element["uri"];

        pushToAPI(data);
        updatePage();
	}

    // MARK: API_MARK
    /*
    function getNewAPIToken() {
	    var xmlHttp = new XMLHttpRequest();
	    var url = "/token/refresh";
	    xmlHttp.open( "GET", url, false );
	    xmlHttp.send( null );
	    var data = JSON.parse(xmlHttp.responseText);
        console.log(data);
	    return data;
    }*/

	function fetchFromAPI() {
	    var xmlHttp = new XMLHttpRequest();
	    var url = "https://api.minhyukpark.com/music";
	    xmlHttp.open( "GET", url, false );
	    xmlHttp.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
        var send_data = { "roomcode" : document.getElementById("roomcode").innerHTML };
	    xmlHttp.setRequestHeader("roomcode", document.getElementById("roomcode").innerHTML);
	    xmlHttp.send( null );
	    var data = JSON.parse(xmlHttp.responseText)
	    return data;
	}

	function pushToAPI(data) {
	    var url = "https://api.minhyukpark.com/music";
	    var xmlHttp = new XMLHttpRequest();
	    xmlHttp.open( "POST", url, false );
	    xmlHttp.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
	    xmlHttp.send(JSON.stringify(data));
	}

	function addNewToAPI(data) {
	    var url = "https://api.minhyukpark.com/music/create";
	    var xmlHttp = new XMLHttpRequest();
	    xmlHttp.open( "POST", url, false );
	    xmlHttp.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
	    xmlHttp.send(JSON.stringify(data));
        updatePage();
        setInterval(checkEnd, 5000);
        setInterval(refreshQueue, 3000);
	}

    function addToQueue(event) {
        refreshQueue();
        var data = fetchFromAPI()[0];
        var item = event.data.item;

        var currently_added = {}
        currently_added["uri"] = item["uri"];
        currently_added["visible"] = item["name"] + " by " + item["artists"][0]["name"] + " from " + item["album"]["name"];
        currently_added["albumart"] = item["album"]["images"][0]["url"];
        data["queue"].push(currently_added);
        pushToAPI(data);
        refreshQueue();
    }

    function clearQueue() {
        var data = fetchFromAPI()[0];
        $('#hidden-songqueue-ul').empty();	
        $('#songqueue-ul').empty();	
        data["queue"] = [];
        pushToAPI(data);
    }

    function refreshQueue() {
        var data = fetchFromAPI()[0];
        $('#songqueue-ul').empty();
        var visible_ul = document.getElementById("songqueue-ul");
        for (var key in data["queue"]) {
            if(data["queue"].hasOwnProperty(key)) {
                var li = document.createElement("li");
                li.setAttribute('id', data["queue"][key]["visible"] + key);
                li.appendChild(document.createTextNode(data["queue"][key]["visible"]));
                visible_ul.appendChild(li);
            }
        }
    }

    $("#clearqueue").click(clearQueue);
    $("#searchbar-text").on("change", searchTracks);
    $("#findavailabledevices").click(findAvailableDevices);
    $("#play").click(playPause);
    $("#skip").click(skip);
});
