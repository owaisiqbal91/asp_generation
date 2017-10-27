function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

var Clingo = require('clingojs');
var fs = require('fs');
const express = require('express');
var app = express();

app.use(express.static('public'));

app.get('/init', function(req, res) {
    init(function(state) {
        res.json(state);
    })
})

app.listen(3000, function(err) {
    if(!err)
        console.log("Listening on port 3000")
})

var clingo = new Clingo();


function init(callback){
    solve(['initial_generation.lp'], function(model){
        resetState();
        processModel(model);
        //renderInit();
        callback(state);
    });
}

function solve(inputFiles, callback) {
    clingo.config({
        args: ['--seed=' + getRandomInt(0, 10000), "--rand-freq=1", "--sign-def=rnd"],
        maxModels: 1
    });

    var currentModel = [];

    clingo.solve({
        inputFiles: inputFiles
    })
        .on('model', function (model) {
            // Here 'model' is an Array of strings representing the atoms of the model
            // e.g. ['example(0)', 'example(1)']
            currentModel.push(model);
        })
        .on('end', function () {
            // This function gets called after all models have been received
            currentModel.pop();
            callback(currentModel[0]);

        });
}

var state;
function resetState(){
    state = {animals: {}, map: {}, tick: 1, score: {min: 0, max: 0}, species: [], issues: []};
}

var invariantFacts = ["score", "stat", "terrain", "size", "issue", "species"];
var animalFacts = ["animal", "ofSpecies", "impressionable", "influential", "friendliness", "opinion", "atLocation"];
var locationFacts = ["location", "connected", "locationAttributes", "total"];
var variantFacts = ["atLocation", "opinion"];
var allFacts = invariantFacts.concat(locationFacts).concat(animalFacts);

function processModel(model) {
    var facts = getFacts(model);
    facts.sort(compareFactNames);
    facts.forEach(parse);
    console.log(state);
}

function updateModel() {
    var newFacts = createASPFacts(state);
    writeFactsToFile("./temp.lp", newFacts);
    solve(['./temp.lp', 'update_models.lp'], console.log)
}

function compareFactNames(a, b) {
    return (allFacts.indexOf(Object.keys(a)[0]) - allFacts.indexOf(Object.keys(b)[0]));
}

function parse(fact) {
    var factName = Object.keys(fact)[0];
    var factValues = fact[factName];
    //animals
    if (animalFacts.includes(factName)) {
        switch (factName) {
            case "animal":
                state.animals[factValues[0]] = {name: factValues[0], stats: {}, opinions: {}};
                break;

            case "ofSpecies":
                state.animals[factValues[0]].species = factValues[1];
                break;

            case "impressionable":
                state.animals[factValues[0]].stats.impressionable = factValues[1];
                break;

            case "influential":
                state.animals[factValues[0]].stats.influential = factValues[1];
                break;

            case "friendliness":
                state.animals[factValues[0]].stats.friendliness = factValues[1];
                break;

            case "opinion":
                var score = factValues[2];
                if (score > state.score.max) score = state.score.max;
                else if (score < state.score.min) score = state.score.min;
                state.animals[factValues[0]].opinions[factValues[1]] = score;
                break;

            case "atLocation":
                state.animals[factValues[0]].location = factValues[1];
                break;
        }
    } else if (locationFacts.includes(factName)) {
        switch (factName) {
            case "location":
                state.map[factValues[0]] = {id: factValues[0], connected: []};
                break;

            case "connected":
                state.map[factValues[0]].connected.push(factValues[1]);
                break;

            case "locationAttributes":
                state.map[factValues[0]].terrain = factValues[1];
                state.map[factValues[0]].size = factValues[2];
                break;

            case "total":
                state.map[factValues[0]].total = factValues[1];
                break;
        }
    } else if (invariantFacts.includes(factName)) {
        switch (factName) {
            case "score":
                if (factValues[0] < state.score.min) state.score.min = parseInt(factValues[0]);
                if (factValues[0] > state.score.max) state.score.max = parseInt(factValues[0]);
                break;

            case "species":
                state.species.push(factValues[0]);
                break;

            case "issue":
                state.issues.push(factValues[0]);
                break;
        }
    }
}

function getFacts(model) {
    var facts = [];

    model.forEach(function (fact) {
        var factArray = new RegExp("([a-zA-Z]*)\\((.*)\\)").exec(fact);
        var factName = factArray[1];
        var factValues = factArray[2].split(",");
        var obj = {};
        obj[factName] = factValues;
        facts.push(obj);
    });

    return facts;
}

function createASPFacts(state) {
    var aspFacts = [];
    state.issues.forEach(function(issue) {
        aspFacts.push("issue(" + issue +  ").");
    });
    Object.keys(state.animals).forEach(function(key) {
        aspFacts.push("animal(" + key + ").");
        aspFacts.push("atLocation(" + key + "," + state.animals[key].location + "," + state.tick + ").");
        aspFacts.push("influential(" + key + "," + state.animals[key].stats.influential + ").");
        aspFacts.push("impressionable(" + key + "," + state.animals[key].stats.impressionable + ").");
        Object.keys(state.animals[key].opinions).forEach(function(issue) {
            aspFacts.push("opinion(" + key + "," + issue + "," + state.animals[key].opinions[issue] + "," + state.tick +").");
        })
    });
    Object.keys(state.map).forEach(function(key) {
        aspFacts.push("location(" + key + ").");
        state.map[key].connected.forEach(function(location) {
            aspFacts.push("connected(" + key + "," + location + ").");
        })
    })
    aspFacts.push("tick(" + state.tick + ").");
    return aspFacts;
}

function writeFactsToFile(filename, facts) {
    fs.writeFile(filename, facts.join('\n'), function(err) {
        if(err) {
            console.log("Error: " + err);
        }
    })
}