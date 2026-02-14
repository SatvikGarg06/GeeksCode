const { app, BrowserWindow, ipcMain, dialog, Menu, globalShortcut } = require('electron');
const { exec } = require('child_process')
const path = require('path');
const fs = require('fs');
const os = require('os');
const pty = require('node-pty');


let mainWindow;
let ptyProcess = null;

const SETTINGS_PATH = path.join(app.getPath('userData'), 'settings.json');

function createWindow() {
  const isMac = process.platform === 'darwin';

  const windowOptions = {
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'Code Editor',
    backgroundColor: '#1e1e1e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  };

  if (isMac) {
    windowOptions.titleBarStyle = 'hiddenInset';
    windowOptions.trafficLightPosition = { x: 12, y: 10 };
  }

  mainWindow = new BrowserWindow(windowOptions);

  // In dev mode, load from Vite dev server; in production load the built output
  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (ptyProcess) {
      ptyProcess.kill();
      ptyProcess = null;
    }
  });

  // Build a custom menu to override Cmd+W / Ctrl+W
  const menuTemplate = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'Close Tab',
          accelerator: 'CmdOrCtrl+W',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('close-active-tab');
            }
          },
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
}

function ParseCode(code) {
  const lines = code.split('\n')
  const results = []

  for (const line of lines) {
    let i = 0
    while (i < line.length) {
      if (
        line[i] === '!' &&
        line[i + 1] === '@' &&
        line[i + 2] === '#' &&
        line[i + 3] === '$'
      ) {
        i += 4
        if (line[i] !== '(') {
          return 'Invalid Syntax'
        }
        i++ 
        let temp = ''
        while (i < line.length && line[i] !== ')') {
          temp += line[i]
          i++
        }
        if (i >= line.length) {
          return 'Invalid Syntax'
        }
        results.push(temp)
      }
      i++
    }
  }
  return results
}
function callAI(prompts){
  let res;
  let outputs=[]
  for (let i=0;i<prompts.length;i++){
    res=`int sum=0; for (int i:arr) sum+=i; cout<<sum;`
    outputs.push(res)
  }
  return outputs
}
function placeBack(code, outputs) {
  const lines = code.split('\n')
  let j = 0
  const resultLines = []
  for (const line of lines) {
    let i = 0
    let newLine = ''
    while (i < line.length) {
      if (
        line[i] === '!' &&
        line[i + 1] === '@' &&
        line[i + 2] === '#' &&
        line[i + 3] === '$'
      ) {
        i += 4
        if (line[i] !== '(') {
          return 'Invalid Syntax'
        }
        i++
        while (i < line.length && line[i] !== ')') {
          i++
        }
        if (i >= line.length) {
          return'Invalid Syntax'
        }
        newLine += outputs[j]
        j++
        i++ 
      } else {
        newLine += line[i]
        i++
      }
    }
    resultLines.push(newLine)
  }
  return resultLines.join('\n')
}
function runCpp(code) {
  return new Promise((resolve) => {
    const tmpDir = os.tmpdir()
    const cppPath = path.join(tmpDir, 'temp.cpp')
    const exePath = path.join(tmpDir, 'temp_exec')

    fs.writeFileSync(cppPath, code)

    exec(
      `g++ "${cppPath}" -o "${exePath}" && "${exePath}"`,
      { timeout: 3000 }, 
      (err, stdout, stderr) => {
        if (err) {
          resolve({ error: stderr || err.message })
        } else {
          resolve({ output: stdout })
        }
      }
    )
  })
}

ipcMain.handle('submit-code', async (event, code) => {
  let prompts=ParseCode(code)
  let outputs=callAI(prompts)
  outputs=placeBack(code,outputs)
  let final=await runCpp(outputs)
  console.log(final)
  return {
    success: true,
    length: code.length
  }
})

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ─── IPC: Dialog ────────────────────────────────────────────
ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

// ─── IPC: File System ───────────────────────────────────────
ipcMain.handle('fs:readDir', async (_, dirPath) => {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const results = [];
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue; // skip hidden
      results.push({
        name: entry.name,
        path: path.join(dirPath, entry.name),
        isDirectory: entry.isDirectory(),
      });
    }
    // Sort: directories first, then alphabetical
    results.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
    return results;
  } catch (e) {
    console.error('fs:readDir error', e);
    return [];
  }
});

ipcMain.handle('fs:readFile', async (_, filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (e) {
    console.error('fs:readFile error', e);
    return null;
  }
});

ipcMain.handle('fs:writeFile', async (_, filePath, content) => {
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  } catch (e) {
    console.error('fs:writeFile error', e);
    return false;
  }
});

ipcMain.handle('fs:createFile', async (_, filePath) => {
  try {
    fs.writeFileSync(filePath, '', 'utf-8');
    return true;
  } catch (e) {
    console.error('fs:createFile error', e);
    return false;
  }
});

ipcMain.handle('fs:createFolder', async (_, folderPath) => {
  try {
    fs.mkdirSync(folderPath, { recursive: true });
    return true;
  } catch (e) {
    console.error('fs:createFolder error', e);
    return false;
  }
});

// ─── IPC: Settings ───────────────────────────────
ipcMain.handle('settings:getLastFolder', () => {
  return loadSettings().lastFolder || null;
})

ipcMain.handle('settings:setLastFolder', (_, folderPath) => {
  saveSettings({ lastFolder: folderPath });
})

// ─── IPC: Terminal (node-pty) ───────────────────────────────
ipcMain.handle('terminal:create', (_, cols, rows) => {
  if (ptyProcess) {
    ptyProcess.kill();
  }

  const shell = process.platform === 'win32' ? 'powershell.exe' : process.env.SHELL || '/bin/zsh';

  ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-256color',
    cols: cols || 80,
    rows: rows || 24,
    cwd: os.homedir(),
    env: process.env,
  });

  ptyProcess.onData((data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('terminal:data', data);
    }
  });

  return true;
});

ipcMain.on('terminal:write', (_, data) => {
  if (ptyProcess) {
    ptyProcess.write(data);
  }
});

ipcMain.on('terminal:resize', (_, cols, rows) => {
  if (ptyProcess) {
    try {
      ptyProcess.resize(cols, rows);
    } catch (e) {
      // ignore resize errors
    }
  }
});

ipcMain.on('terminal:cwd', (_, cwd) => {
  // Kill existing and respawn in new cwd
  if (ptyProcess) {
    ptyProcess.kill();
  }
  const shell = process.platform === 'win32' ? 'powershell.exe' : process.env.SHELL || '/bin/zsh';
  ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    cwd: cwd,
    env: process.env,
  });
  ptyProcess.onData((data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('terminal:data', data);
    }
  });
});
