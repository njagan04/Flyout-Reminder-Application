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
let isEditing = false; // Tracks if the form is in editing mode

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

// Reset form for creating new reminder
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

// Handle reminder form submission (create or edit)
// Handle reminder form submission (create or edit)
reminderForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = reminderTitle.value.trim();
    const description = reminderDescription.value.trim();
    const date = reminderDate.value.trim();
    const time = reminderTime.value.trim(); // Use the formatted time value

    if (!title || !date || !time) {
        alert('Title, date, and time are required!');
        return;
    }

    if (editingReminder) {
        // Update existing reminder
        editingReminder.querySelector('h3').textContent = title;
        editingReminder.querySelector('.reminder-description').textContent = description;
        editingReminder.querySelector('p:nth-child(2)').textContent = `Date: ${date}`;
        editingReminder.querySelector('p:nth-child(3)').textContent = `Time: ${time}`;

        // Reset editing mode
        editingReminder = null;
        submitButton.textContent = 'Save Reminder';
    } else {
        // Create a new reminder
        const reminderItem = document.createElement('li');
        reminderItem.classList.add('reminder-item');

        reminderItem.innerHTML = `
            <h3>${title}</h3>
            <p>Date: ${date}</p>
            <p>Time: ${ensure12HourFormat(time)}</p>
            <p class="reminder-description">${description}</p>
            <div class="reminder-status ongoing">Ongoing</div>
            <div class="reminder-actions">
                <button class="edit">Edit</button>
                <button class="delete">Delete</button>
                <button class="toggle-status">Mark as Completed</button>
            </div>
        `;

        remindersList.appendChild(reminderItem);
        addReminderEventListeners(reminderItem);
    }

    resetForm();
    remindersListSection.classList.add('active');
    newReminderSection.classList.remove('active');
    isEditing = false; // Reset editing state
});

// Edit button logic with autofill and proper edit handling
function addReminderEventListeners(reminderItem) {
    const editButton = reminderItem.querySelector('.edit');
    const deleteButton = reminderItem.querySelector('.delete');
    const toggleStatusButton = reminderItem.querySelector('.toggle-status');

    editButton.addEventListener('click', () => {
        // Extract title and description
        reminderTitle.value = reminderItem.querySelector('h3').textContent;
        reminderDescription.value = reminderItem.querySelector('.reminder-description').textContent;

        // Extract and assign the date
        reminderDate.value = reminderItem.querySelector('p:nth-child(2)').textContent.split(': ')[1];

        // Extract and assign the time
        const timeText = reminderItem.querySelector('p:nth-child(3)').textContent.split(': ')[1].trim();
        reminderTime.value = ensure12HourFormat(timeText);
        
        // Set up the editing mode
        editingReminder = reminderItem;
        isEditing = true;
        submitButton.textContent = 'Save Changes';
        document.querySelector('.form-header').textContent = 'Modify Reminder';
        newReminderSection.classList.add('active');
        remindersListSection.classList.remove('active');
    });

    deleteButton.addEventListener('click', () => {
        if (confirm('Are you sure to delete this reminder?')) {
            reminderItem.remove();
        }
    });

    toggleStatusButton.addEventListener('click', () => {
        const statusElement = reminderItem.querySelector('.reminder-status');
        const currentStatus = statusElement.textContent.trim();
        const newStatus = currentStatus === 'Ongoing' ? 'Completed' : 'Ongoing';
        const newClass = newStatus.toLowerCase();
        const newButtonText = newStatus === 'Ongoing' ? 'Mark as Completed' : 'Mark as Ongoing';

        if (confirm(`Mark as ${newStatus}?`)) {
            statusElement.textContent = newStatus;
            statusElement.className = `reminder-status ${newClass}`;
            toggleStatusButton.textContent = newButtonText;
        }
    });
}

// Ensure 12-hour format with AM/PM
function ensure12HourFormat(timeStr) {
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":");
    if (modifier === "PM" && hours !== "12") hours = parseInt(hours, 10) ;
    if (modifier === "AM" && hours === "12") hours = "00";
    return `${hours.toString().padStart(2, "0")}:${minutes}`;
}


// Sample reminders for testing
const sampleReminders = [
    { title: 'Meeting with John', description: 'Discuss project updates', date: '2024-12-21', time: '10:00 AM' },
    { title: 'Doctor Appointment', description: 'Annual checkup', date: '2024-12-22', time: '2:00 PM' },
    { title: 'Complete Assignment', description: 'Finish coding task', date: '2024-12-23', time: '5:00 PM' },
];

// Add sample reminders to the list
sampleReminders.forEach((reminder) => {
    const reminderItem = document.createElement('li');
    reminderItem.classList.add('reminder-item');

    reminderItem.innerHTML = `
        <h3>${reminder.title}</h3>
        <p>Date: ${reminder.date}</p>
        <p>Time: ${reminder.time}</p>
        <p class="reminder-description">${reminder.description}</p>
        <div class="reminder-status ongoing">Ongoing</div>
        <div class="reminder-actions">
            <button class="edit">Edit</button>
            <button class="delete">Delete</button>
            <button class="toggle-status">Mark as Completed</button>
        </div>
    `;

    remindersList.appendChild(reminderItem);
    addReminderEventListeners(reminderItem);
});
