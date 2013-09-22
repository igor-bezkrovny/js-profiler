var Instrumenter = require("./src/instrumenter.js").Instrumenter,
	fs = require("fs"),
	path = require("path");

if(process.argv.length < 4) {
	console.log(
		"Syntax:\n" +
		"node.exe main.js inFile.js outFile.js"
	);
	exit();
}

var inFileName = process.argv[2],
	outFileName = process.argv[3],
	ownDirectory = path.dirname(process.argv[1]);

var code = fs.readFileSync(inFileName, 'utf8'),
	preamble1Code = fs.readFileSync(path.normalize(ownDirectory + '/preamble/setImmediate.js'), 'utf8'),
	preamble2Code = fs.readFileSync(path.normalize(ownDirectory + '/preamble/profiler.js'), 'utf8');

var instrumentedCode = new Instrumenter().instrumentCode(inFileName, code, preamble1Code + preamble2Code);

fs.writeFileSync(outFileName, instrumentedCode, 'utf8');