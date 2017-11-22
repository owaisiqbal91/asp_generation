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
function World(){}

renderInit();
function renderInit(){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", "/init", false ); // false for synchronous request
    xmlHttp.send( null );
    var state = JSON.parse(xmlHttp.response);
    World.state = state;
    locations = Object.keys(state.map);
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

function render() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    if(World.state.approvalRatings) {
        document.getElementById("teamA").innerHTML = World.state.approvalRatings.a;
        document.getElementById("teamB").innerHTML = World.state.approvalRatings.b;
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

    for (var i = 0; i < length; i++) {
        var locationCoord = locationCoords[locations[i]];
        var rectX = locationCoord.x - rectWidth / 2;
        var rectY = locationCoord.y - rectHeight / 2;
        context.fillStyle = "#ffffff";
        context.fillRect(rectX, rectY, rectWidth, rectHeight);
        context.strokeStyle = "#000000";
        context.strokeRect(rectX, rectY, rectWidth, rectHeight);
    }

    //animals
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
        img.src = "images/"+animalSpecies[animalKeys[i]]+".png";
    }
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
    var xmlHttp = new XMLHttpRequest();
    var candidateOpinions = {
        a: {},
        b: {}
    };
    World.state.issues.forEach(function(issue) {
        candidateOpinions.a[issue] = parseInt(document.getElementById(issue).innerText);
        candidateOpinions.b[issue] = parseInt(document.getElementById(issue).innerText);
    })
    xmlHttp.open( "POST", "/update", false ); // false for synchronous request
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.send( JSON.stringify(candidateOpinions) );
    World.state = JSON.parse(xmlHttp.response);
    render();
}