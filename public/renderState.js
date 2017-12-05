var canvas = document.getElementById('kingOfTheJungle');
var context = canvas.getContext('2d');

canvas.addEventListener("mousemove", function(evt) {
    var x = evt.clientX - canvas.getBoundingClientRect().left;
    var y = evt.clientY - canvas.getBoundingClientRect().top;
    document.getElementById('animalDetails').innerText = getDetails(x, y);
})

var locationCoords = {};
var animalCoords = {};
var animalSpecies = {};
var locations;
var length;
var angleIncrement;
var center = {x: canvas.width / 2, y: canvas.height / 2};
var radius = 300;
var angle = 0;
var rectWidth = 200;
var rectHeight = 200;
var animalSize = 32;
var worldInit = false;
function World(){}

renderInit();
function renderInit(){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", "/init", false ); // false for synchronous request
    xmlHttp.send( null );
    var response = JSON.parse(xmlHttp.response);
    World.state = response.state;
    World.currentPlayerId = response.currentPlayerId;
    document.getElementById("playerId").innerText = World.currentPlayerId;
    locations = Object.keys(World.state.map);
    length = locations.length;
    angleIncrement = (2 * Math.PI) / length;

    for (var i = 0; i < length; i++) {
        var x = center.x + radius * Math.sin(angle);
        var y = center.y - radius * Math.cos(angle);

        angle += angleIncrement;

        locationCoords[locations[i]] = {x: x, y:y};
    }

    var animalKeys = Object.keys(World.state.animals);
    for(var i=0; i<animalKeys.length; i++){
        animalSpecies[animalKeys[i]] = World.state.animals[animalKeys[i]].species;
    }

    /* RENDER */
    //setInterval(render, 300);
    render();
}


function drawAnimals() {
    var animalKeys = Object.keys(World.state.animals);
    for(var i=0; i<animalKeys.length; i++){
        var img = new Image();
        img.width = animalSize;
        img.height = animalSize;
        img.animal = World.state.animals[animalKeys[i]];
        img.coordX = locationCoords[img.animal.location].x - (rectWidth / 2) + Math.random() * (rectWidth - img.width);
        img.coordY = locationCoords[img.animal.location].y - (rectHeight / 2) + Math.random() * (rectHeight - img.height);
        animalCoords[animalKeys[i]] = {x: img.coordX, y: img.coordY};
        img.onload = function() {
            context.drawImage(this, this.coordX, this.coordY, this.width, this.height);
        }
        img.src = "images/"+animalSpecies[animalKeys[i]]+"2.png";
    }
}


function drawTerrain() {
    var terrainDrawn = 0;
    for (var i = 0; i < length; i++) {
        var locationCoord = locationCoords[locations[i]];
        var rectX = locationCoord.x - rectWidth / 2;
        var rectY = locationCoord.y - rectHeight / 2;
        // context.fillStyle = "#ffffff";
        // context.fillRect(rectX, rectY, rectWidth, rectHeight);
        // context.strokeStyle = "#000000";
        // context.strokeRect(rectX, rectY, rectWidth, rectHeight);

        var img = new Image();
        img.width = rectWidth;
        img.height = rectHeight;
        img.coordX = rectX;
        img.coordY = rectY;
        img.style.zIndex = "-1";
        img.style.opacity = "0.1";
        img.onload = function() {
            context.drawImage(this, this.coordX, this.coordY, this.width, this.height);
            terrainDrawn++;
            if(terrainDrawn == length) {
                drawAnimals();
            }
        }
        img.src = "images/"+ World.state.map[locations[i]].terrain + ".jpg";
    }
}


function render() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    document.getElementById("tick").innerText = World.state.tick - 1;
    if(World.state.approvalRatings) {
        for(var player in Object.keys(World.state.approvalRatings)) {
            document.getElementById("team" + player).innerHTML = World.state.approvalRatings[player];
        }
    }
    for (var i = 0; i < length; i++) {
        var locationCoord = locationCoords[locations[i]];

        var connected = World.state.map[locations[i]].connected;
        for(var j=0; j<connected.length; j++){
            context.beginPath();
            context.moveTo(locationCoord.x,locationCoord.y);
            context.lineTo(locationCoords[connected[j]].x,locationCoords[connected[j]].y);
            context.stroke();
        }
    }

    drawTerrain();

    //animals
}

function getDetails(x, y) {
    var animalKeys = Object.keys(animalCoords);
    for(var i = 0; i < animalKeys.length; i++) {
        var ax = animalCoords[animalKeys[i]].x;
        var ay = animalCoords[animalKeys[i]].y;
        if(x >= ax && x <= (ax + animalSize) && y >= ay && y <= (ay + animalSize)) {
            //console.log(JSON.stringify(World.state.animals[animalKeys[i]]));
            return JSON.stringify(World.state.animals[animalKeys[i]]);
        }
    }
    return document.getElementById('animalDetails').innerText;
}

function updateWorld() {
    document.getElementById("updateButton").disabled = true;
    document.getElementById("updateButton").innerText = "Waiting for day to end!";
    var xmlHttp = new XMLHttpRequest();
    var candidateOpinions = {};
    World.state.issues.forEach(function(issue) {
        candidateOpinions[issue] = parseInt(document.getElementById(issue).innerText);
    })
    xmlHttp.open( "POST", "/update", false ); // false for synchronous request
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.send( JSON.stringify({
        candidateOpinions: candidateOpinions,
        currentPlayerId: World.currentPlayerId
    }) );
    //var response = JSON.parse(xmlHttp.response);
    var intervalId = window.setInterval(function() {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open( "GET", "/getState", false ); // false for synchronous request
        xmlHttp.setRequestHeader("Content-Type", "application/json");
        xmlHttp.send(null);
        var response = JSON.parse(xmlHttp.response);

        if(response != undefined && response.tick != World.state.tick) {
            clearInterval(intervalId);
            World.state = response;
            console.log(World.state);
            render();
            if((World.state.tick - 1) == 5) {
                var winner = World.state.votes[0] > World.state.votes[1]? 0: 1;
                var loser = World.state.votes[0] > World.state.votes[1]? 1: 0;
                document.getElementById("resultshead").innerText = "Player " + winner + " Wins!!!";
                document.getElementById("resultsbody").innerText = "Player " + winner + " wins by " + (World.state.votes[winner] - World.state.votes[loser]) + " votes! ("
                    + World.state.votes[winner] + " vs " + World.state.votes[loser] + ")"; 
                showEndGameDialog();
                return;
            }
            document.getElementById("headlines").innerText = World.state.headlines;
            var interviewText = "";
            for(var i = 0; i < World.state.interview.length; i++) {
                interviewText += "<br>";
                if(i % 2 == 0)
                    interviewText += "<b>"+ World.state.interview[i] + "</b>";
                else
                    interviewText += World.state.interview[i];
                interviewText += "<br>";
            }
            document.getElementById("dialog").title = "Day " + (World.state.tick - 1);
            document.getElementById("mostDiscussed").innerText = World.state.stats.mostDiscussed;
            document.getElementById("mostOneSided").innerText = World.state.stats.mostOneSided;
            document.getElementById("mostContested").innerText = World.state.stats.mostContested;
            var a0 = World.state.stats.candidateHonor[0];
            var a1 = World.state.stats.candidateHonor[1];
            if(a0 == a1) {
                a0 = "50%";
                a1 = "50%";
            } else {
                var t = a0 + a1;
                var t2;
                t2 = Math.round((a0 * (100.0))/ t) + "%";
                a0 = Math.round((a1 * (100.0))/ t) + "%";
                a1 = t2;
            }
            document.getElementById("hrate0").innerText = a0;
            document.getElementById("hrate1").innerText = a1;
            document.getElementById("interview").innerHTML = interviewText;
            showDialog();
            document.getElementById("updateButton").disabled = false;
            document.getElementById("updateButton").innerText = "Update World";
        }
    }, 1000);
}