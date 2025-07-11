const https = require('https');
const fs = require('fs');
const { join } = require('path');

const dataLog = {time:[],temp:[]};

const privateKey = fs.readFileSync('/etc/letsencrypt/live/felarn.fun/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/felarn.fun/fullchain.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate };

const server = https.createServer(credentials,(req, res) => {
  console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.url}`);
    const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*', 
    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': 2592000, 

  };

  if (req.method === 'OPTIONS') {
    res.writeHead(204, headers);
    res.end();
    return;
  }

  let body = [];

    if (req.method === 'GET') {
    res.writeHead(200, headers);
    res.end(JSON.stringify(dataLog));
    return;
  }

    if (req.method === 'POST') {
        req.on('data', chunk => {
    body.push(chunk);
  }).on('end', () => {
        body = Buffer.concat(body).toString();
        if (body) {
          data = JSON.parse(body);
            console.log('data:', data);
            dataLog.time.push(data.epochTime*1000);
            dataLog.temp.push(data.temp);
        }
        res.writeHead(200, headers);
        res.end(`got T ${data.temp.at(-1)} @time ${data.time.at(-1)}`);
  });
    res.writeHead(200, headers);
    res.end();
    return;
  }

});

server.on('error', (error) => {
  console.error('Server error:', error);
});

const PORT = 443;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});