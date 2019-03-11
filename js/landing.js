$(document).ready(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomcode = urlParams.get('roomcode');
    if(roomcode != undefined) {
        window.location.href = "/client#" + roomcode;  
    }

    function joinRoom() {
       var roomcode = document.getElementById("joinroom-text").value;
       window.location.href = "/client#" + roomcode;
    }

    function createRoom() {
        window.location.href = "/host";
    }

    $("#joinroom-text").on("change", joinRoom);
    $("#createroom").click(createRoom);
});
