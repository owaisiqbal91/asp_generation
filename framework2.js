var Clingo = require('clingojs');
var fs = require('fs');

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function Framework(factsCallbacks, factsOrder) {
    this.clingo = new Clingo();
    this.factsCallbacks = factsCallbacks;
    this.factsOrder = factsOrder;
}

Framework.prototype.solve = function(inputFiles) {
    this.clingo.config({
        args: ['--seed=' + getRandomInt(0, 10000), "--rand-freq=1", "--sign-def=rnd"],
        maxModels: 1
    });

    var currentModel = [];

    this.clingo.solve({
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
            this.processModel(currentModel[0]);
        });
}

Framework.prototype.compareFactNames = function(a, b) {
    return (this.factsOrder.indexOf(Object.keys(a)[0]) - this.factsOrder.indexOf(Object.keys(b)[0]));
}

Framework.prototype.extractFacts = function(model) {
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

Framework.prototype.parse = function(fact) {
    var factName = Object.keys(fact)[0];
    var factValues = fact[factName];
    this.factsCallbacks[factName].apply(this, factValues);
}

Framework.prototype.processModel = function(model) {
    var facts = extractFacts(model);
    facts.sort(this.compareFactNames);
    facts.forEach(parse);
}

Framework.prototype.writeFactsToFile = function(filename, facts) {
    fs.writeFile(filename, facts.join('\n'), function(err) {
        if(err) {
            console.log("Error: " + err);
        }
    })
}

Framework.prototype.createASPFact = function(key, params, addTick = true) {
    var parameters = params.join(',');
    if(addTick == true)
        parameters += "," + this.tick;
    return key + "(" + parameters + ")."; 
}

Framework.prototype.setOrder = function(keyOrder) {
    this.keyOrder = keyOrder;
}

Framework.prototype.setRuleParseCallback = function(key, callback) {
    this.RuleParseCallbacks[key] = callback;
}

module.exports = Framework;