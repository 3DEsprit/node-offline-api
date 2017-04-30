var fs = require('fs');
var path = require('path');
var os = require('os');
var fsx = require('fs-extra');
var arch = os.platform();

var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var gen = '/app/doc/tools/generate.js';
var apiDir = __dirname + '/doc/api/';

var count = 0;

var child;
var flags = [__dirname + '/doc/tools/doc/generate.js', '--template=' + __dirname + '/doc/template.html', ''];

var buildOptions = {
  buildDir: __dirname.slice(0,-3),
  buildVersion: process.version.slice(1)
}

var options = process.argv.slice(2);

// check for command line scripting options
if(options[0] !== '') {
  options.forEach(function(ops, index) {
    if (ops.startsWith('-v')) {
      var version = options[index + 1];
      flags[3] = '--node-version=' + version;
    } else if (ops.startsWith('-f')) {
      buildDir = options[index + 1];
      if (buildDir.slice(-1) !== '/') {
        buildDir += '/';
      }
      buildOptions.buildDir = buildDir;
    }

    if (index === options.length) {
      buildOptions.buildDir += 'node-documents-' + buildOptions.buildVersion + '/';
      checkFolders();
    }
  });
}


// Check for modular options

function convertFile(file) {
  // take file and generate html file
  if (arch === 'darwin' || arch === 'linux') {
    count++;
    flags[2] = __dirname + '/doc/api/' + file;
    var filename = file.slice(0,-3);
    var pathname = buildOptions.buildDir + filename + '.html';
    var fileStream = fs.createWriteStream(pathname);
    var createFile = spawn('node', flags);

    createFile.stdout.pipe(fileStream);
    createFile.on('close', (code) => {
      if (code !== 0) {
        console.log('NODe API: process exited with code ' + code);
      }
    });
  } else if (arch === 'win32') {
    var bat = 'doc.bat';
    var command = bat + flags.join(' ') + file;
    exec(command, (err, out, stderr) => {
      if (err) console.log(err);
      console.log('NODe API: Creating HTML file: ' + file);
    });
  }
}

// grab template file and assets
function checkFiles() {
  fs.readdir(apiDir, function(err, res) {
    var ext = path.extname('*.md');
    if (err) console.error(err.stack);
    res.forEach((file) => {
      if (path.extname(file) === ext) {
         convertFile(file);
      }
    });
  });
}

function copyAssets() {
  fsx.copy(__dirname + '/doc/api_assets', buildOptions.buildDir + 'assets/', function(err) {
    if (err) return console.error('copy', err);
    console.log('NODe: asset copy success');
  });
  checkFiles();
}

// create document directory and copy assets
function checkFolders() {
  fs.stat(buildOptions.buildDir, function(err, out) {
    if (out) {
      console.log('NODe API: build folder exists');
      fs.stat(buildOptions.buildDir + 'assets', function(err, out) {
        if (err) {
          copyAssets();
        }
      });
    } else {
      console.log('NODe API: creating build folder');
      fs.mkdirSync(buildOptions.buildDir);
      copyAssets();
    }
  });
}

function checkOptions() {
  if (buildOptions.buildVersion !== os.version) {
    var version = buildOptions.buildVersion;
    flags[3] = '--node-version=' + version;
  }

  if(buildOptions.buildDir.slice(0,1)) {
    buildOptions.buildDir = buildOptions.buildDir.replace(/^~/, os.homedir);
  }

  if (buildOptions.buildDir.slice(-1) !== '/') {
      buildOptions.buildDir += '/';
  }
  buildOptions.buildDir += 'node-documents-' + buildOptions.buildVersion + '/';

  console.log('NODe API: Building to Directory: %s', buildOptions.buildDir);
  checkFolders();
}

function createDocs() {
  checkOptions();
}

module.exports = {
  createDocs: createDocs,
  buildOptions: buildOptions,
  documentPath: buildOptions.buildDir
}