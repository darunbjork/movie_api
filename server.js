const http = require('http');
const fs = require('fs');
const url = require('url');

http.createServer((request, response) => {
    let addr = request.url;
    let q = new URL(addr, `http://${request.headers.host}`);
    let filePath = '';

    fs.appendFile('log.txt', `URL: ${addr}\nTimestamp: ${new Date()}\n\n`, (err) => {
        if (err) {
            console.log(err);
        } else {
            console.log('Added to log.');
        }
    });

    if (q.pathname.includes('documentation')) {
        filePath = (__dirname + '/documentation.html');
    } else {
        filePath = 'index.html';
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            throw err;
        }
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.write(data);
        response.end();
    });
}).listen(8080);

console.log('My test server is running on Port 8080.');
