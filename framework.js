var Clingo = require('clingojs');
var fs = require('fs');

/**
 * Helper function to generate a random number between min and max
 * @param  {} min
 * @param  {} max
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * Framework Constructor
 * @param  {} factsCallbacks - Key Value map of predicates and callback functions to be executed for each occurence of key predicate
 * @param  {} factsOrder - List of predicates indicating order in which the facts should be processed.
 * @param  {} variantFacts - Variable predicates that change with every update and that need to be appended with tick
 */
function Framework(factsCallbacks, factsOrder, variantFacts) {
    this.clingo = new Clingo();
    this.factsCallbacks = factsCallbacks;
    this.factsOrder = factsOrder;
    this.tickingFacts = new Set(variantFacts);
    this.tick = 1;
}


/**
 * Solve inputFiles using clingo solver
 * @param  {} inputFiles - List of input files to be solved.
 * @param  {} updateTick - Boolean value indicating whether internal tick of framework should be updated or not.
 * @param  {} done - Callback to execute after model has been processed.
 */
Framework.prototype.solve = function (inputFiles, updateTick, done) {
    this.clingo.config({
        args: ['--seed=' + getRandomInt(0, 10000), "--rand-freq=1", "--sign-def=rnd"],
        maxModels: 1
    });

    var currentModel = [];
    var framework = this;

    this.clingo.solve({
        inputFiles: inputFiles
    })
        .on('model', function (model) {
            currentModel.push(model);
        })
        .on('end', function () {
            framework.processModel(currentModel[0]);
            if (updateTick)
                framework.tick++;
            done();
        });
}


/**
 * Sorting comparator function: Sort by predicates in fact order
 * @param  {} a
 * @param  {} b
 */
Framework.prototype.compareFactNames = function (a, b) {
    return (this.factsOrder.indexOf(Object.keys(a)[0]) - this.factsOrder.indexOf(Object.keys(b)[0]));
}


/**
 * Set the order in which facts should be processed.
 * @param  {} keyOrder - list of predicates in order
 */
Framework.prototype.setOrder = function (keyOrder) {
    this.keyOrder = keyOrder;
}


/**
 * Set callback for a particular predicate key
 * @param  {} key - predicate name
 * @param  {} callback - predicate callback
 */
Framework.prototype.setRuleParseCallback = function (key, callback) {
    this.RuleParseCallbacks[key] = callback;
}

/**
 * Process solved model
 * @param  {} model
 */
Framework.prototype.processModel = function (model) {
    var facts = this.extractFacts(model);
    facts.sort(this.compareFactNames.bind(this));
    facts.forEach(this.parse.bind(this));
}



/**
 * Function to extract facts from solved model
 * @param  {} model - solved model
 */
Framework.prototype.extractFacts = function (model) {
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


/**
 * Function to parse each fact and apply callback if applicable.
 * @param  {} fact
 */
Framework.prototype.parse = function (fact) {
    var factName = Object.keys(fact)[0];
    var factValues = fact[factName];
    if (this.factsCallbacks[factName]) {
        if (this.tick != 1 && this.tickingFacts.has(factName)) {
            var lastFact = factValues[factValues.length - 1];
            if (parseInt(lastFact) <= this.tick)
                return;
        }
        if (this.tick == 1 || this.tickingFacts.has(factName))
            this.factsCallbacks[factName].apply(this, factValues);
    }
}



/**
 * Function to write facts on a file.
 * @param  {} filename - name of file to be created.
 * @param  {} facts - list of facts to be written.
 */
Framework.prototype.writeFactsToFile = function (filename, facts) {
    facts.push(this.createASPFact("tick", [this.tick], false));
    fs.writeFile(filename, facts.join('\n'), function (err) {
        if (err) {
            console.log("Error: " + err);
        }
    })
}


/**
 * Create ASP fact for a predicated and parameters.
 * @param  {} key - Predicated key
 * @param  {} params - Parameters to be added to the fact
 * @param  {} addTick = true - Boolean describing whether a tick should be appended to the current fact.
 */
Framework.prototype.createASPFact = function (key, params, addTick = true) {
    var parameters = params.join(',');
    if (addTick == true) {
        this.tickingFacts.add(key);
        parameters += "," + this.tick;
    }
    return key + "(" + parameters + ").";
}


//Export framework
module.exports = Framework;