document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    const taskInput = document.getElementById("task-input");
    const taskDateInput = document.getElementById("task-date");
    const calendarIcon = document.getElementById("calendar-icon");
    const addTaskBtn = document.getElementById("add-task-btn");
    const taskList = document.getElementById("task-list");
    const pendingTaskCount = document.getElementById("pending-task");
    const clearAllBtn = document.getElementById("clear-all-btn");

    let selectedDate = "";

    function escapeHTML(text) {
        return text.replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
    }

    function calculateDaysLeft(taskDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [y, m, d] = taskDate.split('-');
        const dueDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        return Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    }

    function createTaskElement(task) {
        const { id, text, completed, date } = task;
        const daysLeft = calculateDaysLeft(date);
        let daysLeftText, color;

        if (daysLeft < 0) { daysLeftText = "Overdue"; color = "#ff4d4d"; }
        else if (daysLeft === 0) { daysLeftText = "Due Today"; color = "#ffa500"; }
        else { daysLeftText = `${daysLeft}d left`; color = daysLeft < 3 ? "#ff4d4d" : "#2ecc71"; }

        const li = document.createElement("li");
        li.dataset.id = id;
        li.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${completed ? "checked" : ""}>
            <span class="task-text ${completed ? "completed" : ""}">${escapeHTML(text)}</span>
            <span class="daysLeft" style="color: ${color};">${daysLeftText}</span>
            <div class="li-buttons">
                <button class="edit-btn">✏️</button>
                <button class="delete-btn">❌</button>
            </div>
        `;

        li.querySelector(".task-checkbox").addEventListener("change", (e) => {
            updateTaskStatusInLocalStorage(id, e.target.checked);
            li.querySelector(".task-text").classList.toggle("completed", e.target.checked);
            updatePendingTasks();
        });

        li.querySelector(".edit-btn").onclick = () => editTask(li);
        li.querySelector(".delete-btn").onclick = () => {
            removeTaskFromLocalStorage(id);
            li.remove();
            updatePendingTasks();
        };

        return li;
    }

    function editTask(li) {
        li.classList.add('editing');
        const id = li.dataset.id;
        const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        const textSpan = li.querySelector(".task-text");
        const daysSpan = li.querySelector(".daysLeft");
        const btnContainer = li.querySelector(".li-buttons");

        const tInput = document.createElement("input");
        tInput.type = "text";
        tInput.value = task.text;
        tInput.className = "edit-input";

        const dInput = document.createElement("input");
        dInput.type = "date";
        dInput.value = task.date;
        dInput.className = "edit-date";

        const saveBtn = document.createElement("button");
        saveBtn.innerHTML = "💾";
        saveBtn.className = "save-btn";

        const cancelBtn = document.createElement("button");
        cancelBtn.innerHTML = "❌";
        cancelBtn.className = "cancel-btn";

        li.replaceChild(tInput, textSpan);
        li.replaceChild(dInput, daysSpan);

        const oldEditBtn = btnContainer.querySelector(".edit-btn");
        if (oldEditBtn) btnContainer.removeChild(oldEditBtn);

        btnContainer.appendChild(saveBtn);
        btnContainer.appendChild(cancelBtn);

        tInput.focus();

        const finishEdit = () => loadTasks();

        saveBtn.onclick = () => {
            if (tInput.value.trim() && dInput.value) {
                updateTaskInLocalStorage(id, tInput.value.trim(), dInput.value);
                finishEdit();
            } else {
                alert("Both fields are required!");
            }
        };
        cancelBtn.onclick = finishEdit;
    }

    function saveTaskToLocalStorage(text, completed, date) {
        let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
        const id = Date.now() + "-" + Math.random().toString(36).substr(2, 9);
        tasks.push({ id, text, completed, date });
        localStorage.setItem("tasks", JSON.stringify(tasks));
        return id;
    }

    function updateTaskStatusInLocalStorage(id, completed) {
        let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
        tasks = tasks.map(t => t.id === id ? { ...t, completed } : t);
        localStorage.setItem("tasks", JSON.stringify(tasks));
    }

    function updateTaskInLocalStorage(id, text, date) {
        let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
        tasks = tasks.map(t => t.id === id ? { ...t, text, date } : t);
        localStorage.setItem("tasks", JSON.stringify(tasks));
    }

    function removeTaskFromLocalStorage(id) {
        let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
        tasks = tasks.filter(t => t.id !== id);
        localStorage.setItem("tasks", JSON.stringify(tasks));
    }

    function loadTasks() {
        const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
        taskList.innerHTML = "";
        tasks.forEach(task => taskList.appendChild(createTaskElement(task)));
        updatePendingTasks();
    }

    function updatePendingTasks() {
        const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
        const pending = tasks.filter(t => !t.completed).length;
        pendingTaskCount.textContent = `You Have ${pending} Pending Task(s).`;
        clearAllBtn.style.display = tasks.length > 0 ? "block" : "none";
    }

    addTaskBtn.onclick = () => {
        const text = taskInput.value.trim();
        if (text && selectedDate) {
            saveTaskToLocalStorage(text, false, selectedDate);
            taskInput.value = "";
            taskDateInput.value = "";
            selectedDate = "";
            loadTasks();
        } else {
            alert("Please enter task and date!");
        }
    };

    calendarIcon.onclick = () => taskDateInput.showPicker();
    taskDateInput.onchange = (e) => selectedDate = e.target.value;
    clearAllBtn.onclick = () => {
        if (confirm("Clear all tasks?")) {
            localStorage.removeItem("tasks");
            loadTasks();
        }
    };

    loadTasks();
});