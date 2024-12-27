const { ipcRenderer } = require('electron');

// Variables for form elements and sections
const reminderForm = document.getElementById('reminder-form');
const reminderTitle = document.getElementById('reminder-title');
const reminderDescription = document.getElementById('reminder-description');
const reminderDate = document.getElementById('reminder-date');
const reminderTime = document.getElementById('reminder-time');
const remindersList = document.getElementById('reminders');
const newReminderSection = document.getElementById('new-reminder');
const remindersListSection = document.getElementById('reminders-list');
const submitButton = reminderForm.querySelector('button');

// Button elements for sidebar
const viewRemindersButton = document.getElementById('view-reminders-btn');
const newReminderButton = document.getElementById('new-reminder-btn');

// Store the currently editing reminder
let editingReminder = null;
let isEditing = false;

// Toggle between "View Reminders" and "New Reminder" sections
viewRemindersButton.addEventListener('click', () => {
    confirmSwitchSection(() => {
        newReminderSection.classList.remove('active');
        remindersListSection.classList.add('active');
        resetForm();
    });
});

newReminderButton.addEventListener('click', () => {
    confirmSwitchSection(() => {
        remindersListSection.classList.remove('active');
        newReminderSection.classList.add('active');
        document.querySelector('.form-header').textContent = 'Create New Reminder';
        resetForm();
    });
});

// Reset form for creating a new reminder
function resetForm() {
    reminderForm.reset();
    submitButton.textContent = 'Save Reminder';
    editingReminder = null;
    isEditing = false;
}

// Confirm before switching sections
function confirmSwitchSection(callback) {
    if (isEditing) {
        const confirmSwitch = confirm('You have unsaved changes. Do you want to discard them and switch?');
        if (confirmSwitch) {
            callback();
        }
    } else {
        callback();
    }
}

// Initialize the reminders list
async function initializeReminders() {
    const reminders = await ipcRenderer.invoke('get-reminders');
    remindersList.innerHTML = '';
    reminders.forEach(addReminderToDOM);
}

// Add reminder to the DOM
function addReminderToDOM(reminder) {
    const reminderItem = document.createElement('li');
    reminderItem.classList.add('reminder-item');
    reminderItem.dataset.id = reminder.id;

    reminderItem.innerHTML = `
        <h3>${reminder.title}</h3>
        <p>Date: ${reminder.date}</p>
        <p>Time: ${reminder.time}</p>
        <p class="reminder-description">${reminder.description}</p>
        <div class="reminder-status ${reminder.status}">${capitalize(reminder.status)}</div>
        <div class="reminder-actions">
            <button class="edit">Edit</button>
            <button class="delete">Delete</button>
            <button class="toggle-status">Mark as ${reminder.status === 'ongoing' ? 'Completed' : 'Ongoing'}</button>
        </div>
    `;

    remindersList.appendChild(reminderItem);
    addReminderEventListeners(reminderItem);
}

// Handle reminder form submission
reminderForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = reminderTitle.value.trim();
    const description = reminderDescription.value.trim();
    const date = reminderDate.value.trim();
    const time = reminderTime.value.trim();

    if (!title || !date || !time) {
        alert('Title, date, and time are required!');
        return;
    }

    if (editingReminder) {
        // Update existing reminder
        const updatedReminder = {
            id: editingReminder.dataset.id,
            title,
            description,
            date,
            time,
            status: editingReminder.querySelector('.reminder-status').textContent.toLowerCase(),
        };
        await ipcRenderer.invoke('update-reminder', updatedReminder);
        editingReminder.remove();
        addReminderToDOM(updatedReminder);

        editingReminder = null;
        submitButton.textContent = 'Save Reminder';
    } else {
        // Add new reminder
        const newReminder = { title, description, date, time };
        const savedReminder = await ipcRenderer.invoke('add-reminder', newReminder);
        addReminderToDOM(savedReminder);
    }

    resetForm();
    remindersListSection.classList.add('active');
    newReminderSection.classList.remove('active');
    isEditing = false;
});

// Add event listeners for reminder actions
function addReminderEventListeners(reminderItem) {
    const editButton = reminderItem.querySelector('.edit');
    const deleteButton = reminderItem.querySelector('.delete');
    const toggleStatusButton = reminderItem.querySelector('.toggle-status');

    editButton.addEventListener('click', () => {
        const isConfirmed = confirm('Are you sure you want to edit this reminder?');
        if (isConfirmed) {
            reminderTitle.value = reminderItem.querySelector('h3').textContent;
            reminderDescription.value = reminderItem.querySelector('.reminder-description').textContent;
            reminderDate.value = reminderItem.querySelector('p:nth-child(2)').textContent.split(': ')[1];
            reminderTime.value = reminderItem.querySelector('p:nth-child(3)').textContent.split(': ')[1];

            editingReminder = reminderItem;
            isEditing = true;
            submitButton.textContent = 'Save Changes';
            document.querySelector('.form-header').textContent = 'Modify Reminder';
            newReminderSection.classList.add('active');
            remindersListSection.classList.remove('active');
        }
    });

    deleteButton.addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete this reminder?')) {
            const id = reminderItem.dataset.id;
            await ipcRenderer.invoke('delete-reminder', id);
            reminderItem.remove();
        }
    });

    toggleStatusButton.addEventListener('click', async () => {
        const statusElement = reminderItem.querySelector('.reminder-status');
        const currentStatus = statusElement.textContent.toLowerCase();
        const newStatus = currentStatus === 'ongoing' ? 'completed' : 'ongoing';
        
        // Add confirmation before changing the status
        const isConfirmed = confirm(`Are you sure you want to mark this reminder as ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}?`);
        
        if (isConfirmed) {
            const id = reminderItem.dataset.id;

            const updatedReminder = {
                id,
                title: reminderItem.querySelector('h3').textContent,
                description: reminderItem.querySelector('.reminder-description').textContent,
                date: reminderItem.querySelector('p:nth-child(2)').textContent.split(': ')[1],
                time: reminderItem.querySelector('p:nth-child(3)').textContent.split(': ')[1],
                status: newStatus,
            };

            // Update reminder in the database
            await ipcRenderer.invoke('update-reminder', updatedReminder);

            // Update the UI
            statusElement.textContent = capitalize(newStatus);
            statusElement.className = `reminder-status ${newStatus}`;
            toggleStatusButton.textContent = `Mark as ${currentStatus === 'ongoing' ? 'Ongoing' : 'Completed'}`;
        }
    });
}

// Utility: Capitalize the first letter of a string
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Search and filter functionality

// Get search input and status filter dropdown
const searchBar = document.getElementById('search-bar');
const statusFilter = document.getElementById('status-filter');

// Add event listeners for search and status filter
searchBar.addEventListener('input', filterReminders);
statusFilter.addEventListener('change', filterReminders);

// Filter reminders based on search query and selected status
function filterReminders() {
    const searchQuery = searchBar.value.toLowerCase();
    const selectedStatus = statusFilter.value;

    const reminders = [...remindersList.children];
    reminders.forEach(reminder => {
        const title = reminder.querySelector('h3').textContent.toLowerCase();
        const description = reminder.querySelector('.reminder-description').textContent.toLowerCase();
        const status = reminder.querySelector('.reminder-status').textContent.toLowerCase();

        const matchesSearch = title.includes(searchQuery) || description.includes(searchQuery);
        const matchesStatus = selectedStatus ? status.includes(selectedStatus) : true;

        // Show the reminder and dim it if it doesn't match the status filter
        if (matchesSearch && matchesStatus) {
            reminder.style.display = '';
            reminder.classList.remove('dimmed');
        } else if (matchesSearch) {
            reminder.style.display = '';
            reminder.classList.add('dimmed');
        } else {
            reminder.style.display = 'none';
            reminder.classList.remove('dimmed');
        }
    });
}

// Get the reset icon element
const resetIcon = document.getElementById('reset-icon');

// Add event listener to the reset icon to clear search bar and reset filter dropdown
resetIcon.addEventListener('click', () => {
    // Reset the search bar
    searchBar.value = '';

    // Reset the filter dropdown
    statusFilter.value = '';

    // Reapply the filter so that all reminders are visible again
    filterReminders();
});


// Initialize the app
initializeReminders();
