const express = require('express');
var bodyParser = require('body-parser');
var app = express();
var clingoFramework = require('./framework2.js')

var state;

//GAME CONSTANTS
function resetState() {
    state = {
        animals: {}, 
        map: {}, 
        tick: 1, 
        score: {min: 0, max: 0}, 
        species: [], 
        issues: [],
        players: [],
        candidateOpinions: [],
        playersReadyCount: 0
    };
}

//ASP RULES CALLBACKS

//animal(animalId).
function animalCallback(animalId) { 
    state.animals[animalId] = {
        name: animalId,
        stats: {},
        opinions: {}
    };
}

//ofSpecies(animalId, species).
function ofSpeciesCallback(animalId, species) {
    state.animals[animalId].species = species;
}

//impressionable(animalId, impressionableScore).
function impressionableCallback(animalId, impressionableScore) {
    state.animals[animalId].stats.impressionable = impressionableScore;
}

//influential(animalId, influentialScore).
function influentialCallback(animalId, influentialScore) {
    state.animals[animalId].stats.influential = influentialScore;
}

//friendliness(animalId, friendlinessScore).
function friendlinessCallback(animalId, friendlinessScore) {
    state.animals[animalId].stats.friendliness = friendlinessScore;
}

//opinion(animalId, issue, score).
function opinionCallback(animalId, issue, score) {
    if(score > state.score.max) score = state.score.max;
    else if(score < state.score.min) score = state.score.min;
    state.animals[animalId].opinions[issue] = score;
}

//atLocation(animalId, locationId).
function atLocationCallback(animalId, locationId) {
    state.animals[animalId].location = locationId;
}

//location(locationId).
function locationCallback(locationId) {
    state.map[locationId] = {
        id: locationId,
        connected: []
    };
}

//connected(locationId1, locationId2).
function connectedCallback(locationId1, locationId2) {
    state.map[locationId1].connected.push(locationId2);
}

//locationAttributes(locationId, terrain, size).
function locationAttributesCallback(locationId, terrain, size) {
    state.map[locationId].terrain = terrain;
    state.map[locationId].size = size;
}

//total(locationId, total).
function totalCallback(locationId, total) {
    state.map[locationId].total = total;
}

//score(score).
function scoreCallback(score) {
    if(score < state.score.min) state.score.min = parseInt(score);
    if(score > state.score.max) state.score.max = parseInt(score);
}

//species(species).
function speciesCallback(species) {
    state.species.push(species);
}

//issue(issue).
function issueCallback(issue) {
    state.issues.push(issue);
}

var ASPParseCallbacks = {
    "animal": animalCallback,
    "ofSpecies": ofSpeciesCallback,
    "impressionable": impressionableCallback,
    "influential": influentialCallback,
    "friendliness": friendlinessCallback,
    "opinion": opinionCallback,
    "atLocation": atLocationCallback,
    "location": locationCallback,
    "connected": connectedCallback,
    "locationAttributes": locationAttributesCallback,
    "total": totalCallback,
    "score": scoreCallback,
    "species": speciesCallback,
    "issue": issueCallback,
}

var invariantFacts = ["score", "stat", "terrain", "size", "issue", "species"];
var animalFacts = ["animal", "ofSpecies", "impressionable", "influential", "friendliness", "opinion", "atLocation"];
var locationFacts = ["location", "connected", "locationAttributes", "total"];
var variantFacts = ["atLocation", "opinion"];
var allFacts = invariantFacts.concat(locationFacts).concat(animalFacts);


function createASPFacts() {
    var aspFacts = [];
    state.issues.forEach(function(issue) {
        aspFacts.push(clingo.createASPFact("issue", [issue], false));
    });
    Object.keys(state.animals).forEach(function(animalId) {
        aspFacts.push(clingo.createASPFact("animal", [animalId], false));
        aspFacts.push(clingo.createASPFact("atLocation", [animalId, state.animals[animalId].location]));
        aspFacts.push(clingo.createASPFact("influential", [animalId, state.animals[animalId].stats.influential], false))
        aspFacts.push(clingo.createASPFact("impressionable", [animalId, state.animals[animalId].stats.impressionable], false))
        Object.keys(state.animals[animalId].opinions).forEach(function(issue) {
            aspFacts.push(clingo.createASPFact("opinion", [animalId, issue, state.animals[animalId].opinions[issue]]));
        });
    });
    Object.keys(state.map).forEach(function(locationId) {
        aspFacts.push(clingo.createASPFact("location", [locationId], false));
        state.map[locationId].connected.forEach(function(locationId2) {
            aspFacts.push(clingo.createASPFact("connected", [locationId, locationId2], false));
        });
    });
    return aspFacts;
}

function calculateApprovalRatings() {
    var approvalRatings = {};
    for(var player in state.candidateOpinions) {
        var aTotal = 0;
        for(var animal in Object.keys(state.animals)){
            for(var issue in state.animals[animal].opinions){
                var opinion = state.animals[animal].opinions[issue];
                aTotal += Math.abs(opinion - state.candidateOpinions[player][issue]);
            }
        }
        var aRating = aTotal/(Object.keys(state.animals).length * Object.keys(state.issues).length);
        approvalRatings[player] = aRating;
    }

    return approvalRatings;
}


//GAME ROUTES

var clingo = new clingoFramework(
    ASPParseCallbacks,
    allFacts 
);

resetState();

app.use(express.static('public'));
app.use(bodyParser.json());

app.get('/init', function(req, res) {
    id = state.players.length;
    state.players.push(id);
    if(state.players.length == 1) {
        clingo.solve(['initial_generation.lp'], true, function() {
            res.json({
                state: state,
                currentPlayerId: id
            });
        });
    } else {
        res.json({
            state: state,
            currentPlayerId: id
        });
    }
})

app.post('/update', function(req, res) {
    var stateFacts = createASPFacts();
    var candidateOpinions = req.body.candidateOpinions;
    var playerId = req.body.currentPlayerId;
    state.playersReadyCount++;
    state.candidateOpinions[playerId] = candidateOpinions;
    if(state.playersReadyCount == state.players.length) {
        clingo.writeFactsToFile('temp.lp', stateFacts);
        clingo.solve(['temp.lp', 'update_models.lp'], true, function() {
            var approvalRatings = calculateApprovalRatings();
            state.approvalRatings = approvalRatings;
            state.tick = clingo.tick;
            state.playersReadyCount = 0;
            res.json({});
        });
    } else {
        res.json({});
    }
})

app.get('/getState', function(req, res) {
    res.json(state);
})

app.listen(3000, function(err) {
    if(!err) {
        console.log("Listening on port 3000...");
    }
})