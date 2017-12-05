const express = require('express');
var bodyParser = require('body-parser');
var app = express();
var clingoFramework = require('./framework.js');

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
        playersReadyCount: 0,
        headlines: "",
        interview: [],
        stats: {
            mostDiscussed: "",
            mostOneSided: "",
            mostContested: "",
            candidateHonor: [0, 0]
        }
    };
}

//ASP RULES CALLBACKS

//animal(animalId).
function animalCallback(animalId) { 
    state.animals[animalId] = {
        name: animalId,
        stats: {},
        opinions: {},
        conversation: {},
    };
}

//ofSpecies(animalId, species).
function ofSpeciesCallback(animalId, species) {
    state.animals[animalId].species = species;
}

function ofNameCallback(animalId, name) {
    state.animals[animalId].name = name;
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
    if(state.animals[animalId].opinions[issue] == undefined)
        state.animals[animalId].opinions[issue] = { score: score };
    state.animals[animalId].opinions[issue].delta = state.animals[animalId].opinions[issue].score - score;
    state.animals[animalId].opinions[issue].score = score;
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


//talk(animalX, animalY, issue).
function talkCallback(animalX, animalY, issue) {
    if(state.animals[animalX].conversation[issue] == undefined)
        state.animals[animalX].conversation[issue] = new Set();
    state.animals[animalX].conversation[issue].add(animalY);
    if(state.animals[animalY].conversation[issue] == undefined)
        state.animals[animalY].conversation[issue] = new Set();
    state.animals[animalY].conversation[issue].add(animalX);
    //console.log("Talk: " + animalX + " " + animalY + " " + issue);
}

var ASPParseCallbacks = {
    "animal": animalCallback,
    "ofSpecies": ofSpeciesCallback,
    "ofName": ofNameCallback,
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
    "talk": talkCallback
}

var invariantFacts = ["score", "stat", "terrain", "size", "issue", "species"];
var animalFacts = ["animal", "ofSpecies", "ofName", "impressionable", "influential", "friendliness", "opinion", "atLocation"];
var locationFacts = ["location", "connected", "locationAttributes", "total"];
var variantFacts = ["atLocation", "opinion", "talk"];
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
            aspFacts.push(clingo.createASPFact("opinion", [animalId, issue, state.animals[animalId].opinions[issue].score]));
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
                var opinion = state.animals[animal].opinions[issue].score;
                aTotal += Math.abs(opinion - state.candidateOpinions[player][issue]);
            }
        }
        var aRating = aTotal/(Object.keys(state.animals).length * Object.keys(state.issues).length);
        approvalRatings[player] = 10 - aRating;
    }

    return approvalRatings;
}

function createHeadlines(newRatings) {
        "Player 0 moves into the lead with a strong 95% approval rating while player 1 lags behind by a small margin of 7%.";  
    var oldLeader, oldRunnerUp, newLeader, newRunnerUp;
    var players = Object.keys(newRatings);

    newLeader = players.reduce(function(a, b) { return newRatings[a] > newRatings[b]? a : b});
    newRunnerUp = players.reduce(function(a, b) { return newRatings[a] <= newRatings[b]? a : b});
    var leaderScore = Math.round(newRatings[newLeader] * 10);
    var runnerUpScore = Math.round(newRatings[newRunnerUp] * 10); 
    
    if(state.approvalRatings) {
        oldLeader = players.reduce(function(a, b) { return state.approvalRatings[a] > state.approvalRatings[b]? a : b});
        oldRunnerUp = players.reduce(function(a, b) { return state.approvalRatings[a] <= state.approvalRatings[b]? a : b});         
    } else {
        return "Player " + newLeader + " starts off campaign with a " + "strong " + leaderScore + "% approval rating." + " Player " + newRunnerUp + " came in " +
            "with an " + runnerUpScore + "%.";
    }

    var deltas = {};
    Object.keys(newRatings).forEach(function(player) {
        deltas[player] = {};
        deltas[player].delta = state.approvalRatings == undefined? newRatings[player]: newRatings[player] - state.approvalRatings[player];
    });
    
    if(oldLeader != newLeader) {
        //Change in leader in approval ratings
        return "Player " + newLeader + " moves into the lead with a " + "strong " + leaderScore + "% approval rating while player " + 
            newRunnerUp + " lags behind by a " + "small " + "margin of " + (leaderScore - runnerUpScore) + "%.";
    } else if(deltas[newRunnerUp] > deltas[newLeader]) {
        //Runner up is catching up
        return "The battle is intense as " + " player " + newRunnerUp + " catches up. " + " Now " + (leaderScore - runnerUpScore) + "% behind in approvals.";
    } else {
        //Winner is pulling away
        return "Player " + newLeader + " extends lead " + " with a " + leaderScore + "% approval rating.";
    }
}


function createInterview() {
    var animals = Object.keys(state.animals);
    var animalId = animals[Math.floor(Math.random() * animals.length)];
    var issue = state.issues[Math.floor(Math.random() * state.issues.length)];
    var interview = [];
    var candidate = state.players[Math.floor(Math.random() * state.players.length)];
    var opponent = candidate == 0? 1: 0;
    var q1 = "Hello! " + "Can you tell us a little about yourself?";
    var a1 = "Hey! " + "My name is " + state.animals[animalId].name + " the " + state.animals[animalId].species + ". " +
        "I am from the " + state.map[state.animals[animalId].location].terrain + "."; 
    var q2 = "That's awesome! " + "What do you think about " + issue + "?";
    var a2 = "I am " + "strongly in favor of " + "spending more on " + issue + ". ";
    if(state.animals[animalId].conversation[issue] != undefined) {
        var otherAnimals = Array.from(state.animals[animalId].conversation[issue]);
        var otherAnimalsWithNames = otherAnimals.map(a => state.animals[a].name + " the " + state.animals[a].species)
        if(otherAnimals.length >= 1)
            a2 += "I had a "+ " interesting " + " conversation with " + otherAnimalsWithNames.join(", ") + " about this topic.";
    }
    var q3 = "What do you think about Player " + candidate + "?";
    var candidateScore = 0, opponentScore = 0;
    for(var issue in state.animals[animalId].opinions) {
        var opinion = state.animals[animalId].opinions[issue].score;
        candidateScore = Math.abs(opinion - state.candidateOpinions[candidate][issue]);
        opponentScore = Math.abs(opinion - state.candidateOpinions[opponent][issue]);
    }
    var a3 = "";
    if(candidateScore > opponentScore) {
        a3 += "I do not " + "like " + "player " + candidate + "'s decision on various issues in this election. ";  
    } else {
        a3 += "I " + "agree with " + "player " + candidate + "'s decision on various issues in this election. ";  
    }
    if(state.animals[animalId].opinions[issue] == state.candidateOpinions[opponent][issue]) {
        a3 += "I completely agree with Player " + opponent + " on his position on " + issue + ".";
    } else if(state.animals[animalId].opinions[issue] > state.candidateOpinions[opponent][issue]) {
        a3 += "I wish Player " + opponent + " was more conservative when it comes to " + issue + ".";
    } else {
        a3 += "I wish Player " + opponent + " was more liberal on the topic of " + issue + ".";
    }

    var q4 = "Thanks. " + "Have a good night!";

    interview.push(q1, a1, q2, a2, q3, a3, q4);
    return interview;
}

function createStats(newRatings) {
    var discussCount = [];
    var variances = [];
    for(var i in state.issues) {
        var issue = state.issues[i];
        var opinions = [];
        discussCount[issue] = 0;
        for(var animal in state.animals) {
            var size = state.animals[animal].conversation[issue] == undefined ? 0: state.animals[animal].conversation[issue].size;
            discussCount[issue] += size;
            opinions.push(parseInt(state.animals[animal].opinions[issue].score));
        }
        var mean = (opinions.reduce((a, b) => a + b)) / Object.keys(state.animals).length;
        var variance = 0;
        for (var i = 0; i < opinions.length; i++) {
            variance += Math.abs(mean - opinions[i]);
        }
        variances[issue] = variance;
    }
    var defaultIssue = state.issues[0];
    var maxDiscuss = 0;
    var maxDiscussIssue = defaultIssue;
    var maxVariance = 0;
    var maxVarianceIssue = defaultIssue;    
    var minVariance = Infinity;
    var minVarianceIssue = defaultIssue;
    for(var i in discussCount) {
        if(discussCount[i] > maxDiscuss) {
            maxDiscuss = discussCount[i];
            maxDiscussIssue = i;
        }
    }
    for(var i in variances) {
        if(variances[i] > maxVariance) {
            maxVariance = variances[i];
            maxVarianceIssue = i;
        }
        if(variances[i] <= minVariance) {
            minVariance = variances[i];
            minVarianceIssue = i;
        }
    }
    state.stats.mostDiscussed = maxDiscussIssue;
    state.stats.mostContested = maxVarianceIssue;
    state.stats.mostOneSided = minVarianceIssue;
}


function calcualteVotes() {
    var votes = [0, 0];
    for(var animal in Object.keys(state.animals)) {
        var scores = [0, 0];
        for(var issue in state.animals[animal].opinions) {
            var opinion = state.animals[animal].opinions[issue].score;
            scores[0] += Math.abs(opinion - state.candidateOpinions[0][issue]);
            scores[1] += Math.abs(opinion - state.candidateOpinions[1][issue]);
        }
        if(scores[0] == scores[1]) {
            if(state.stats.candidateHonor[0] > state.stats.candidateHonor[1]) {
                votes[1]++;
            } else {
                votes[0]++;
            }
        } else if(scores[0] >= scores[1]) {
            votes[1]++;
        } else {
            votes[0]++;
        }
    }
    return votes;
}

//GAME ROUTES

var clingo = new clingoFramework(
    ASPParseCallbacks,
    allFacts,
    variantFacts 
);

resetState();

app.use(express.static('public'));
app.use(bodyParser.json());

app.get('/init', function(req, res) {
    id = state.players.length;
    state.players.push(id);
    if(state.players.length == 1) {
        clingo.solve(['initial_generation.lp'], true, function() {
            state.tick = clingo.tick;
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
    if(state.candidateOpinions[playerId] != undefined) {
        for(var issue in candidateOpinions) {
            state.stats.candidateHonor[playerId] +=  Math.abs(state.candidateOpinions[playerId][issue] - candidateOpinions[issue]);
        }
    }
    state.candidateOpinions[playerId] = candidateOpinions;
    if(state.playersReadyCount == state.players.length) {
        clingo.writeFactsToFile('temp.lp', stateFacts);
        clingo.solve(['temp.lp', 'update_models.lp'], true, function() {
            var approvalRatings = calculateApprovalRatings();
            createStats(approvalRatings);
            var headlines = createHeadlines(approvalRatings);
            state.approvalRatings = approvalRatings;
            state.headlines = headlines;
            var interview = createInterview();
            state.interview = interview;
            state.votes = calcualteVotes();
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