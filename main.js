const { app, BrowserWindow } = require('electron');

let mainWindow;

function createWindow() {

    const { width, height } = require('electron').screen.getPrimaryDisplay().workAreaSize;
    mainWindow = new BrowserWindow({
        width: 800,  
        height: 700, 
        x: 30, 
        y: height - 800,   
        webPreferences: {
            nodeIntegration: true
        }
    });

    mainWindow.loadURL('C:/Zenith/GitHub/ModerFlyoutReminder/index.html');  // Or load your local HTML file
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

