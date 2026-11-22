const fs = require("fs");
const src = fs.readFileSync("src/data/exam.ts", "utf8");
const re = /makeQ\(\s*(\d+)\s*,\s*[1-4]\s*,\s*"(?:[^"\\]|\\.)*"\s*,\s*"([ABCD])"/g;
const key = {};
let m;
while ((m = re.exec(src))) key[+m[1]] = m[2];
console.log("parsed:", Object.keys(key).length);
const E = {1:"A",2:"C",3:"B",4:"D",5:"A",6:"D",7:"B",8:"B",9:"C",10:"A",11:"C",12:"A",13:"A",14:"B",15:"A",16:"A",17:"A",18:"B",19:"B",20:"B",21:"B",22:"A",23:"B",24:"A",25:"A",26:"B",27:"B",28:"A",29:"A",30:"A",31:"A",32:"B",33:"C",34:"A",35:"B",36:"C",37:"A",38:"A",39:"D",40:"C",41:"B",42:"A",43:"B",44:"C",45:"B",46:"A",47:"C",48:"C",49:"A",50:"D",51:"C",52:"A",53:"A",54:"D",55:"C",56:"D",57:"C",58:"C",59:"C",60:"A",61:"C",62:"B",63:"D",64:"B",65:"C",66:"D",67:"D",68:"A",69:"B",70:"A",71:"A",72:"B",73:"A",74:"C",75:"A",76:"C",77:"C",78:"B",79:"D",80:"A",81:"C",82:"C",83:"B",84:"A",85:"B",86:"D",87:"B",88:"A",89:"C",90:"A",91:"C",92:"A",93:"D",94:"C",95:"A",96:"C",97:"B",98:"C",99:"D",100:"D"};
let ok = 0, bad = [];
for (let i = 1; i <= 100; i++) {
  if (key[i] === E[i]) ok++;
  else bad.push(i + ":" + (key[i] || "MISSING") + "!=" + E[i]);
}
console.log("matched:", ok + "/100");
if (bad.length) console.log("issues:", bad.join(" "));
