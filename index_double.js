const https = require('https');
const http = require('http');
const fs = require('fs');

const dataLog = { time: [], temp: [], restartTime: [], restartCounter: [] };

// Функция для поиска индекса с конца
const findOccuranceFromTheEnd = (arr, item) => {
  for (let i = arr.length - 1; i >= 0 && i > arr.length - 1010; i--) {
    if (item === arr[i]) return i;
  }
  return -1;
};

// Функция для записи ошибок в файл
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

// Загрузка SSL-сертификатов
const privateKey = fs.readFileSync(
  '/etc/letsencrypt/live/felarn.fun/privkey.pem',
  'utf8'
);
const certificate = fs.readFileSync(
  '/etc/letsencrypt/live/felarn.fun/fullchain.pem',
  'utf8'
);
const credentials = { key: privateKey, cert: certificate };

// Логика обработки запросов
const requestHandler = (req, res) => {
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
          res.writeHead(200);
          res.end();

          try {
            body = Buffer.concat(body).toString();
            if (body) {
              const data = JSON.parse(body);
              console.log('data:', data);

              if (data.epochTime && data.temp && data.epochTime.length > 0) {
                console.log('processing time/temp');
                const startingIndex = findOccuranceFromTheEnd(
                  dataLog.time,
                  data.epochTime[0] * 1000
                );
                console.log("duplicate index: " + startingIndex);
                if (startingIndex >= 0) {
                  console.log("duplicates spliced");
                  dataLog.time.splice(startingIndex);
                  dataLog.temp.splice(startingIndex);
                }
                console.log("data added");
                dataLog.time.push(...data.epochTime.map(item => item * 1000));
                dataLog.temp.push(...data.temp);
              }

              if (data.restartTime && data.restartCount) {
                console.log("data added");
                dataLog.restartTime.push(data.restartTime * 1000);
                dataLog.restartCount.push(data.restartCount);
              }
            }
          } catch (error) {
            console.log(error);
            writeErrorToFile(error);
          }
        });
    }
  } catch (error) {
    console.error(error);
  }
};

// Создание HTTPS-сервера для GET-запросов
const httpsServer = https.createServer(credentials, requestHandler);
httpsServer.on('error', (error) => {
  console.error('HTTPS Server error:', error);
});
const HTTPS_PORT = 443;
httpsServer.listen(HTTPS_PORT, () => {
  console.log(`HTTPS server running at https://localhost:${HTTPS_PORT}/`);
});

// Создание HTTP-сервера для POST-запросов
const httpServer = http.createServer(requestHandler);
httpServer.on('error', (error) => {
  console.error('HTTP Server error:', error);
});
const HTTP_PORT = 3001;
httpServer.listen(HTTP_PORT, () => {
  console.log(`HTTP server running at http://localhost:${HTTP_PORT}/`);
});