"use strict";

let http = require('http');
let request = require('request');
let path = require('path')
let fs = require('fs')
let argv = require('yargs')
    .default('host', '127.0.0.1')
    .argv

let scheme = 'http://'
// Build the destinationUrl using the --host value
let port = argv.port || (argv.host === 'localhost' ? 8000 : 80)

// Update our destinationUrl line from above to include the port
let destinationUrl = argv.url || scheme + argv.host + ':' + port
let logPath = argv.log && path.join(__dirname, argv.log)
let logStream = logPath ? fs.createWriteStream(logPath) : process.stdout

http.createServer((req, res) => {
    // Proxy code
    let options = {
        headers: req.headers,
        url: `http://${destinationUrl}${req.url}`
    }
    request(options);
    request(options).pipe(res);
    options.method = req.method
    // Notice streams are chainable:
    // inpuStream -> input/outputStream -> outputStream
    // Log the req headers and content in the **server callback**
    logStream.write('Request headers: ' + JSON.stringify(req.headers))
    req.pipe(logStream, {end: false})

    let downstreamResponse = req.pipe(request(options))
    logStream.write('DownstreamResponse headers: ' + JSON.stringify(downstreamResponse.headers))

    downstreamResponse.pipe(process.stdout)
    downstreamResponse.pipe(res)

}).listen(8001)
