// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const WebSocket = require('ws');
const chokidar = require('chokidar');

const app = express();
const PORT = 5001;

// 启用 CORS
app.use(cors());

// 提供 API 来获取日志内容
app.get('/api/logs', (req, res) => {
  const logDir = path.join(__dirname, 'data');
  const logData = readLogFiles(logDir);

  res.json(logData);
});

// 递归读取 .log 文件中的内容
function readLogFiles(dir) {
  let logs = [];

  const files = findLogFiles(dir);
  files.forEach((file) => {
    // 日志的上上一层文件夹名称即为 tactics 名称
    const tacticsName = path.basename(path.dirname(path.dirname(file)));
    // 日志上一层文件夹名称即为 techniques 名称
    const techniquesName = path.basename(file).split('.')[0];
    // 日志内容为检测到的时间点
    const logContent = fs
      .readFileSync(file, 'utf-8')
      .split('\n')
      .filter((line) => line.trim() !== '');

    // 将每一行的内容添加到 logs，并附加文件路径
    logContent.forEach((line) => {
      logs.push({
        tacticsName: tacticsName,
        techniquesName: techniquesName,
        content: line,
        filePath: file,
      });
    });
  });

  // 根据时间戳降序排序
  logs.sort((a, b) => {
    const timeA = new Date(a.content.split('] ')[0].replace('[', ''));
    const timeB = new Date(b.content.split('] ')[0].replace('[', ''));
    return timeB - timeA;
  });

  return logs;
}

// 递归查找 .log 文件
function findLogFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
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

// 创建 WebSocket 服务器
const wss = new WebSocket.Server({ port: 8080 });

// 用于跟踪每个文件的最后读取行数
const fileReadPositions = {};

wss.on('connection', (ws) => {
  console.log('客戶端已連接到 WebSocket');

  // 初始化每个文件的读取位置
  const logDir = path.join(__dirname, 'data');
  const files = findLogFiles(logDir);
  files.forEach((file) => {
    const lineCount = fs
      .readFileSync(file, 'utf-8')
      .split('\n')
      .filter((line) => line.trim() !== '').length;
    fileReadPositions[file] = lineCount;
  });

  // 使用 chokidar 监控 data 文件夹及其子文件夹
  const watcher = chokidar.watch(path.join(__dirname, 'data'), {
    ignored: /(^|[\/\\])\../, // 忽略隐藏文件
    persistent: true,
    depth: 10, // 可调整深度
  });

  // 监控文件的新增、变更和删除
  watcher.on('add', (filePath) => handleFileAdd(ws, 'add', filePath));
  watcher.on('change', (filePath) => handleFileChange(ws, 'change', filePath));
  watcher.on('unlink', (filePath) => handleFileChange(ws, 'unlink', filePath));

  ws.on('close', () => {
    console.log('客戶端已斷開 WebSocket 連接');
    watcher.close();
  });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.eventType === 'deleteLogLine') {
        const { filePath, content } = data;
        // 从日志文件中删除特定的行
        deleteLogLine(filePath, content);

        // 将 'delete' 事件广播给所有客户端
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(
              JSON.stringify({
                eventType: 'delete',
                filePath,
                content,
              })
            );
          }
        });
      }
    } catch (err) {
      console.error('解析客户端消息时出错：', err);
    }
  });
});

// 修改 handleFileAdd 函数
function handleFileAdd(ws, eventType, filePath) {
  if (eventType === 'add') {
    // 初始化文件的读取位置
    const lineCount = fs
      .readFileSync(filePath, 'utf-8')
      .split('\n')
      .filter((line) => line.trim() !== '').length;
    fileReadPositions[filePath] = lineCount;

    // 读取新增的日志内容
    const newLogs = readNewLogs(filePath);

    if (newLogs.length > 0) {
      // 发送新增的日志内容给前端
      ws.send(JSON.stringify({ eventType: 'update', logs: newLogs }));
    }
  }
}

// 处理文件变更或删除
function handleFileChange(ws, eventType, filePath) {
  if (eventType === 'unlink') {
    // 发送删除事件给前端
    ws.send(JSON.stringify({ eventType: 'delete', filePath }));
    // 移除跟踪的文件
    delete fileReadPositions[filePath];
  } else if (eventType === 'change') {
    // 读取新增的日志行
    const newLogs = readNewLogs(filePath);
    if (newLogs.length > 0) {
      // 发送新增的日志内容给前端
      ws.send(JSON.stringify({ eventType: 'update', logs: newLogs }));
    }
  }
}

// 读取新增的日志行
function readNewLogs(filePath) {
  let logs = [];
  try {
    const tacticsName = path.basename(path.dirname(path.dirname(filePath)));
    const techniquesName = path.basename(filePath).split('.')[0];
    const fileContent = fs
      .readFileSync(filePath, 'utf-8')
      .split('\n')
      .filter((line) => line.trim() !== '');

    const lastReadPosition = fileReadPositions[filePath] || 0;
    const newLines = fileContent.slice(lastReadPosition);
    fileReadPositions[filePath] = fileContent.length;

    newLines.forEach((line) => {
      logs.push({
        tacticsName: tacticsName,
        techniquesName: techniquesName,
        content: line,
        filePath: filePath,
      });
    });
  } catch (err) {
    console.error(`读取文件 ${filePath} 时出错：`, err);
  }
  return logs;
}

// 从日志文件中删除特定的行
function deleteLogLine(filePath, content) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');
    const updatedLines = lines.filter(
      (line) => line.trim() !== content.trim()
    );
    fs.writeFileSync(filePath, updatedLines.join('\n'));
    console.log(`已從 ${filePath} 中删除一行`);
  } catch (err) {
    console.error(`删除文件 ${filePath} 中的行时出错：`, err);
  }
}

app.listen(PORT, () => {
  console.log(`HTTP 服務器運行在 http://localhost:${PORT}`);
});
