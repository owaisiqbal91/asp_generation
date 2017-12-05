var token_table = {
    "player": "@",
    "wall": "W",
    "gem": "*",
    "altar": "A",
    "": "."
}

function draw_map(m, h, w) {
    var mapstring = ""
    for(var i = 0; i < h; i++) {
        for(var j = 0; j < w; j++) {
            if(m[i] == undefined || m[i][j] == undefined)
                mapstring += "."
            else
                mapstring += token_table[m[i][j]];
        }
        mapstring += "\n";
    }
    return mapstring;
}

function generate() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "POST", "/generateDungeon", false ); // false for synchronous request
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    var text = document.getElementById("inputRules").value;
    var facts = text.split(".\n");
    facts.splice(-1, 1);
    facts = facts.map(x => x + '.');
    xmlHttp.send( JSON.stringify({
        rules: facts
    }) );
    var response = JSON.parse(xmlHttp.response);
    var mapstring = draw_map(response.map, response.height, response.width);
    document.getElementById("output").innerHTML = "<pre>" + mapstring + "</pre>";
}