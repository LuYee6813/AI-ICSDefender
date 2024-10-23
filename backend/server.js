const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const WebSocket = require('ws');
const chokidar = require('chokidar');

const app = express();
const PORT = 5001;

// 啟用 CORS
app.use(cors());

// 提供靜態 API 來獲取日誌內容
app.get('/api/logs', (req, res) => {
  const logDir = path.join(__dirname, 'data');
  const logData = readLogFiles(logDir);

  res.json(logData);
});

// 遞迴讀取 .log 文件中的內容
function readLogFiles(dir) {
  let logs = [];

  const files = findLogFiles(dir);
  files.forEach(file => {
    // log的上一層資料夾名稱即為tactics名稱
    const tacticsName = path.basename(path.dirname(file));
    // log檔案名稱即為techniques名稱
    const techniquesName = path.basename(file).split('.')[0];
    const logContent = fs.readFileSync(file, 'utf-8').split('\n').filter(line => line.trim() !== '');

    // 將每一行的內容添加到 logs 並附加文件路徑
    logContent.forEach(line => {
      logs.push({ 
        tacticsName: tacticsName,
        techniquesName: techniquesName,
        content: line,
        filePath: file
      });
    });
  });

  // 根據時間戳降序排序
  logs.sort((a, b) => {
    const timeA = new Date(a.content.split('] ')[0].replace('[', ''));
    const timeB = new Date(b.content.split('] ')[0].replace('[', ''));
    return timeB - timeA;
  });

  return logs;
}

// 遞迴查找 .log 文件
function findLogFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findLogFiles(filePath));
    } else if (file.endsWith('.log')) {
      results.push(filePath);
    }
  });
  return results;
}

// 創建 WebSocket 伺服器
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');

  // 使用 chokidar 監控 data 資料夾及其子資料夾
  const watcher = chokidar.watch(path.join(__dirname, 'data'), {
    ignored: /(^|[\/\\])\../, // 忽略隱藏文件
    persistent: true,
    depth: 10 // 可調整深度
  });

  // 監控文件的新增、變更和刪除
  watcher.on('add', filePath => handleFileChange(ws, 'add', filePath));
  watcher.on('change', filePath => handleFileChange(ws, 'change', filePath));
  watcher.on('unlink', filePath => handleFileChange(ws, 'unlink', filePath));

  ws.on('close', () => {
    console.log('Client disconnected from WebSocket');
    watcher.close();
  });
});

// 處理文件變化
function handleFileChange(ws, eventType, filePath) {
  const logDir = path.join(__dirname, 'data');
  if (eventType === 'unlink') {
    // 發送刪除事件給前端
    ws.send(JSON.stringify({ eventType: 'delete', filePath }));
  } else {
    const logs = readLogFiles(logDir);
    // 發送新增或變更的日誌內容給前端
    ws.send(JSON.stringify({ eventType: 'update', logs }));
  }
}

app.listen(PORT, () => {
  console.log(`HTTP server running on http://localhost:${PORT}`);
});
