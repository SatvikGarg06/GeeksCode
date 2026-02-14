const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Dialog
    openFolder: () => ipcRenderer.invoke('dialog:openFolder'),

    // File system
    readDir: (dirPath) => ipcRenderer.invoke('fs:readDir', dirPath),
    readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
    writeFile: (filePath, content) => ipcRenderer.invoke('fs:writeFile', filePath, content),
    createFile: (filePath) => ipcRenderer.invoke('fs:createFile', filePath),
    createFolder: (folderPath) => ipcRenderer.invoke('fs:createFolder', folderPath),

    // Settings
    getLastFolder: () => ipcRenderer.invoke('settings:getLastFolder'),
    setLastFolder: (folderPath) => ipcRenderer.invoke('settings:setLastFolder', folderPath),

    // Terminal
    createTerminal: (cols, rows) => ipcRenderer.invoke('terminal:create', cols, rows),
    writeTerminal: (data) => ipcRenderer.send('terminal:write', data),
    resizeTerminal: (cols, rows) => ipcRenderer.send('terminal:resize', cols, rows),
    onTerminalData: (callback) => ipcRenderer.on('terminal:data', (_, data) => callback(data)),
    setTerminalCwd: (cwd) => ipcRenderer.send('terminal:cwd', cwd),

    // Tab management
    onCloseTab: (callback) => ipcRenderer.on('close-active-tab', () => callback()),
});
