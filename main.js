const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const db = require('./database'); // Import the SQLite database module


let mainWindow;

console.log(`Main window : `, mainWindow);

function createWindow() {
    const { width, height } = require('electron').screen.getPrimaryDisplay().workAreaSize;
    mainWindow = new BrowserWindow({
        width: 800,
        height: 700,
        x: 30,
        y: height - 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // Ensure this is set to false to allow `require` in renderer.js
            disableBlinkFeatures: 'Autofill',
        },
    });

    mainWindow.loadURL('file://' + __dirname + '/index.html');  // Or load your local HTML file
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

// Add this IPC handler to focus the window when requested
ipcMain.handle('focus-window', () => {
    console.log(`focus-window event received in main process`)
    if (mainWindow) {
        console.log(`Attemnpting to focus the main window`)
        //mainWindow.focus();  // Focus the main window when triggered
        mainWindow.show(); // Bring the window to the front
        mainWindow.setAlwaysOnTop(true); // Keep it on top
        mainWindow.focus(); // Attempt to focus
        mainWindow.setAlwaysOnTop(false); 
        console.log(`window focused `)
    } else {
        console.error('No main window found.');
    }
});


// IPC Handlers for Database Operations

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
