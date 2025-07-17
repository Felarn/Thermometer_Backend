// const https = require('http');
const https = require('https');
const fs = require('fs');
const { join } = require('path');

const dataLog = { time: [], temp: [], restartTime: [] , restartCounter:[]};

const findOccuranceFromTheEnd=(arr,item)=>{
  console.log("searching " + item + "in" )
  console.log(arr)
  for (let i=arr.length-1;(i>=0)&&(i>arr.length-1010);i--){
    if (item === arr[i])
      return i;
  }
  return -1;
}

function writeErrorToFile(error, filePath = 'error_log.txt') {
  const errorMessage = `${new Date().toISOString()} - ${error.message}\n${
    error.stack
  }\n\n`;
  fs.appendFile(filePath, errorMessage, (err) => {
    if (err) {
      console.error('Failed to write error to file:', err);
    }
  });
}

const privateKey = fs.readFileSync(
  '/etc/letsencrypt/live/felarn.fun/privkey.pem',
  'utf8'
);
const certificate = fs.readFileSync(
  '/etc/letsencrypt/live/felarn.fun/fullchain.pem',
  'utf8'
);
const credentials = { key: privateKey, cert: certificate };

const server = https.createServer(credentials, (req, res) => {
  // const server = https.createServer((req, res) => {
  try {
    console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.url}`);
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': 2592000,
    };

    if (req.url !== '/') {
      res.writeHead(400);
      res.end();
      return;
    }

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
      req
        .on('data', (chunk) => {
          body.push(chunk);
        })
        .on('end', () => {
          try {
            body = Buffer.concat(body).toString();
            if (body) {
              data = JSON.parse(body);
              console.log('data:', data);
              if (data.epochTime && data.temp && data.epochTime.length>0) {
                console.log('processing time/temp')
                const startingIndex = findOccuranceFromTheEnd(dataLog.time, data.epochTime[0]*1000)
                console.log("duplicate index: " + startingIndex)
                if (startingIndex>=0){
                  console.log("duplicates spliced")
                  dataLog.time.splice(startingIndex)
                  dataLog.temp.splice(startingIndex)
                }
                console.log("data added")
                dataLog.time.push(... data.epochTime.map(item => item * 1000));
                dataLog.temp.push(... data.temp);
              }

              if (data.restartTime && data.restartCount) {
                console.log("data added")
                dataLog.restartTime.push( data.restartTime * 1000);
                dataLog.restartCount.push( data.restartCount);
              }
            }
            res.writeHead(200, headers);
            res.end(
//              `got T ${dataLog.temp[dataLog.temp.length - 1]} @time ${
//                dataLog.time[dataLog.temp.length - 1]
//              }`
            );
          } catch (error) {
            console.log(error);
            writeErrorToFile(error);
            res.writeHead(400);
            res.end();
            return;
          }
        });
    }
  } catch (error) {
    console.error(error);
  }
});

server.on('error', (error) => {
  console.error('Server error:', error);
});

const PORT = 443;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
