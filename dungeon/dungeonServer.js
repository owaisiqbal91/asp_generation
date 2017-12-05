const express = require('express');
var bodyParser = require('body-parser');
var app = express();
var clingoFramework = require('../framework.js');


//sprite(x, y, type).
function spriteCallback(x, y, type) {
    x = parseInt(x);
    y = parseInt(y);
    if(state.map[x] == undefined) {
        state.map[x] = [];
    }
    state.map[x][y] = type;
    if(x >= state.height)
        state.height = x + 1;
    if(y >= state.width)
        state.width = y + 1;
}

var ASPParseCallbacks = {
    "sprite": spriteCallback
};

var allFacts = [];

var clingo = new clingoFramework(
    ASPParseCallbacks,
    allFacts,
    []
);

var state;

function resetState() {
    state = {
        map: [],
        height: 0,
        width: 0
    };
}

app.use(express.static('public/dungeon'));
app.use(bodyParser.json());

app.post('/generateDungeon', function(req, res) {
    resetState();
    clingo.writeFactsToFile('test.lp', req.body.rules);
    clingo.solve(["test.lp"], false, function() {
        res.json(state);
    })
})

app.listen(8000, function(err) {
    if(!err) {
        console.log("Listening on port 8000...");
    }
})