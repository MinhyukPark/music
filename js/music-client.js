$(document).ready(function() {
	var Spotify = require('spotify-web-api-js');
    var mongoose = require('mongoose');
	var spotifyApi = new Spotify();
	spotifyApi.setAccessToken(accessToken);
    document.getElementById("roomcode").innerHTML = window.location.hash.substring(1);
    updatePage();
    setInterval(updatePage, 5000);
    setInterval(refreshQueue, 1000);
    function updatePage() {
        var data = fetchFromAPI()[0];
        refreshQueue();
        document.getElementById("albumart").src = data["albumart"];
        document.getElementById("currentlyplaying").innerHTML = data["currentlyplaying"];
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
    // MARK: API_MARK
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

    $("#searchbar-text").on("change", searchTracks);
});
