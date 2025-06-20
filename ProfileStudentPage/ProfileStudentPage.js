document.addEventListener('DOMContentLoaded', function() {

    if (!restrictAccess()) return;

    const userFullName = sessionStorage.getItem('userFullName') || 'Иванов И. И.';
    document.querySelector('.profile-tooltip_username').textContent = userFullName;
    document.querySelector('.userinfo__username').textContent = userFullName;
    document.querySelector('.profile-tooltip_role').textContent = 'Студент';
    
    const adminLink = document.querySelector('.admin-link, #admin-link');
    if (adminLink && !isTeacher) {
        adminLink.style.display = 'none';
    }
    
    document.querySelectorAll('.tasklist_task-button').forEach(button => {
        button.addEventListener('click', function() {
            const taskType = this.getAttribute('data-task-type');
            if (taskType === 'ab-train') {
                window.location.href = `/TaskSolvePage/TaskSolvePage.html?taskType=train`;
            } else if (taskType === 'ab-test') {
                fetchAssignedTasks();
            }
        });
    });

    fetchAssignedTasks();
});

document.getElementById('profile-tooltip__button-logout').addEventListener('click', e => {
    e.preventDefault();

    Logout();
})

async function Logout() {
    const authtoken = Cookies.get('.AspNetCore.Identity.Application');
    const res = await fetch(`${apiHost}/Users/Logout`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${authtoken}`
        }
    });

    if (res.status === 200) {
        sessionStorage.removeItem('userFullName'); // Clear stored name on logout
        window.location.href = "/LoginPage/LoginPage.html";
    }
}

async function fetchAssignedTasks() {
    try {
        const authtoken = Cookies.get('.AspNetCore.Identity.Application');
        
        const response = await fetch(`${apiHost}/AB/Test`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authtoken}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                return;
            }
            throw new Error('Ошибка при получении задания');
        }
        
        const taskData = await response.json();
        populateTasksTable(taskData);
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Произошла ошибка при загрузке заданий');
    }
}

function populateTasksTable(taskData) {
    const tableBody = document.querySelector('.given-tasks-table__table tbody');
    tableBody.innerHTML = '';

    if (!taskData) return;

    const currentDate = new Date();
    const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}.${(currentDate.getMonth() + 1).toString().padStart(2, '0')}.${currentDate.getFullYear()}`;

    const status = taskData.solution ? (taskData.userSolution ? 'Проверено' : 'Выполнено') : 'Выдано';

    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>α & β отсечение</td>
        <td>Преподаватель</td> <!-- Можно заменить на реальное имя преподавателя -->
        <td>${formattedDate}</td>
        <td>${status}</td>
        <td>
            <button class="button-solve" data-task-id="ab-task"></button>
        </td>
    `;
    
    tableBody.appendChild(tr);

    document.querySelector('.button-solve').addEventListener('click', function() {
        sessionStorage.setItem('currentTask', JSON.stringify(taskData));
        window.location.href = "/TaskSolvePage/TaskSolvePage.html";
    });
}