const http = require('http');
const { join } = require('path');

const dataLog = [];

const server = http.createServer((req, res) => {
  console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.url}`);
//  console.log('Headers:', JSON.stringify(req.headers, null, 2));

  let body = [];
  req.on('data', chunk => {
    body.push(chunk);
  }).on('end', () => {
        body = Buffer.concat(body).toString();
        if (body) {console.log('Body:', body);
            dataLog.push(Number(body));
        }
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(JSON.stringify(dataLog));
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});