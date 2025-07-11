const http = require('http');
const { join } = require('path');

const dataLog = {time:[],temp:[]};

const server = http.createServer((req, res) => {
  console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.url}`);
//  console.log('Headers:', JSON.stringify(req.headers, null, 2));

  let body = [];
  req.on('data', chunk => {
    body.push(chunk);
  }).on('end', () => {
        body = Buffer.concat(body).toString();
        data = JSON.parse(body);
        if (body) {
            console.log('data:', data);
            dataLog.time.push(data.epochTime*1000);
            dataLog.temp.push(data.temp);
        }
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(JSON.stringify(dataLog));
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});