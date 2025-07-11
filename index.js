const https = require('http');
const fs = require('fs');
const { join } = require('path');

const dataLog = {time:[],temp:[]};

const privateKey = fs.readFileSync('/etc/letsencrypt/live/felarn.fun/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/felarn.fun/fullchain.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate };

const server = https.createServer(credentials,(req, res) => {
  console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.url}`);
//  console.log('Headers:', JSON.stringify(req.headers, null, 2));
    const headers = {
    'Content-Type': 'text/plain',
    'Access-Control-Allow-Origin': '*', /* @dev First, read about security */
    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
    'Access-Control-Max-Age': 2592000, // 30 days
    /** add other headers as per requirement */
  };

  if (req.method === 'OPTIONS') {
    res.writeHead(204, headers);
    res.end();
    return;
  }

  let body = [];
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
        res.end(JSON.stringify(dataLog));
  });
});

const PORT = 443;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});