const { app, BrowserWindow, ipcMain, screen, Menu, Tray } = require('electron');
const path = require('path');
const db = require('./database'); // Import the SQLite database module

let mainWindow;
let tray;

function createWindow(isVisible = true) {
    const { height } = screen.getPrimaryDisplay().workAreaSize;
    mainWindow = new BrowserWindow({
        width: 800,
        height: 700,
        x: 30,
        y: height - 800,
        show: isVisible, // Determines whether to show the window on creation
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            disableBlinkFeatures: 'Autofill',
        },
    });

    mainWindow.loadURL('file://' + __dirname + '/index.html');

    mainWindow.on('minimize', (event) => {
        event.preventDefault();
        mainWindow.hide(); // Hide instead of minimizing
    });

    mainWindow.on('close', (event) => {
        if (!app.isQuiting) {
            event.preventDefault();
            mainWindow.hide(); // Hide instead of closing
        }
    });
}

function createTray() {
    tray = new Tray(path.join(__dirname, 'icon.png')); // Replace with your tray icon
    tray.setToolTip('My Reminder App');

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show App',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                }
            },
        },
        {
            label: 'Exit',
            click: () => {
                app.isQuiting = true;
                app.quit();
            },
        },
    ]);

    tray.setContextMenu(contextMenu);

    // Add a click handler to show the app directly
    tray.on('click', () => {
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
        }
    });
}

app.whenReady().then(() => {
    createWindow(false); // Initially hidden
    createTray();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// IPC Handlers
ipcMain.handle('focus-window', () => {
    if (mainWindow) {
        mainWindow.show();
        mainWindow.setAlwaysOnTop(true); // Bring the window to the front
        mainWindow.focus();
        mainWindow.setAlwaysOnTop(false);
    } else {
        console.error('No main window found.');
    }
});

// Database Operations Handlers (no changes here)

// Fetch all reminders
ipcMain.handle('get-reminders', async () => {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM reminders', (err, rows) => {
            if (err) {
                console.error('Error fetching reminders:', err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
});

// Add a new reminder
ipcMain.handle('add-reminder', async (event, reminder) => {
    return new Promise((resolve, reject) => {
        const query = `INSERT INTO reminders (title, description, date, time, status) VALUES (?, ?, ?, ?, 'ongoing')`;
        db.run(query, [reminder.title, reminder.description, reminder.date, reminder.time], function (err) {
            if (err) {
                console.error('Error adding reminder:', err.message);
                reject(err);
            } else {
                resolve({ id: this.lastID, ...reminder, status: 'ongoing' });
            }
        });
    });
});

// Update an existing reminder
ipcMain.handle('update-reminder', async (event, reminder) => {
    return new Promise((resolve, reject) => {
        const query = `UPDATE reminders SET title = ?, description = ?, date = ?, time = ?, status = ? WHERE id = ?`;
        db.run(
            query,
            [reminder.title, reminder.description, reminder.date, reminder.time, reminder.status, reminder.id],
            (err) => {
                if (err) {
                    console.error('Error updating reminder:', err.message);
                    reject(err);
                } else {
                    resolve(reminder);
                }
            }
        );
    });
});

// Delete a reminder
ipcMain.handle('delete-reminder', async (event, id) => {
    return new Promise((resolve, reject) => {
        const query = `DELETE FROM reminders WHERE id = ?`;
        db.run(query, [id], (err) => {
            if (err) {
                console.error('Error deleting reminder:', err.message);
                reject(err);
            } else {
                resolve(true);
            }
        });
    });
});
