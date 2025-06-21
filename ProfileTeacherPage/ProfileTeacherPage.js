document.addEventListener('DOMContentLoaded', () => {

    if (!restrictAccess()) return;

    const userFullName = sessionStorage.getItem('userFullName') || 'Иванов И. И.';
    document.querySelector('.profile-tooltip_username').textContent = userFullName;
    document.querySelector('.userinfo__username').textContent = userFullName;
    document.querySelector('.profile-tooltip_role').textContent = 'Преподаватель';
    fetchAssignedTasks();
});

document.getElementById('profile-tooltip__button-logout').addEventListener('click', e => {
    e.preventDefault();
    Logout();
});

async function Logout() {
    try {
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
        } else {
            console.error('Ошибка выхода:', res.status, res.statusText);
            alert('Не удалось выйти из системы');
        }
    } catch (error) {
        console.error('Ошибка при выходе:', error);
        alert('Произошла ошибка при выходе');
    }
}
async function fetchAssignedTasks() {
    try {
        const authtoken = Cookies.get('.AspNetCore.Identity.Application');
        if (!authtoken) {
            throw new Error('Токен авторизации отсутствует');
        }
        
        console.log('Отправка запроса к API:', `${apiHost}/AB/Users/`);
        const tasksResponse = await fetch(`${apiHost}/AB/Users/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authtoken}`
            }
        });
        
        if (!tasksResponse.ok) {
            throw new Error(`Ошибка HTTP: ${tasksResponse.status} ${tasksResponse.statusText}`);
        }
        
        const tasks = await tasksResponse.json();
        console.log('Ответ API:', tasks);
        
        if (!Array.isArray(tasks)) {
            throw new Error('Ответ API не является массивом заданий');
        }
        
        const tasksWithUserInfo = tasks.map(assignment => {
            if (!assignment.user || !assignment.user.id || !assignment.task) {
                console.warn('Некорректная структура задания:', assignment);
                return {
                    ...assignment.task || {},
                    userId: 'unknown',
                    userName: 'Неизвестный пользователь',
                    group: '----------'
                };
            }
            const user = assignment.user;
            return {
                ...assignment.task,
                userId: user.id,
                userName: [user.secondName, user.name, user.patronymic].filter(Boolean).join(' '),
                group: user.group || '----------'
            };
        });
        
        console.log('Преобразованные данные:', tasksWithUserInfo);
        populateTasksTable(tasksWithUserInfo);
    } catch (error) {
        console.error('Ошибка в fetchAssignedTasks:', error.message, error.stack);
        alert(`Произошла ошибка при загрузке заданий: ${error.message}`);
    }
}

function populateTasksTable(tasks) {
    const tableBody = document.querySelector('.given-tasks-table__table tbody');
    if (!tableBody) {
        console.error('Элемент tbody не найден');
        return;
    }
    tableBody.innerHTML = '';

    tasks.forEach(task => {
        const tr = document.createElement('tr');
        tr.style.whiteSpace = 'nowrap';
        
        const date = new Date(task.date || Date.now());
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
        const shortName = formatShortName(task.userName);
        const status = task.isSolved ? 'Выполнено' : 'Выдано';
        const userId = task.userId || 'unknown';
        
        console.log(`Рендеринг строки: Task ID: ${task.id || 'unknown'}, User ID: ${userId}, User Name: ${shortName}`);
        
        const viewButton = task.isSolved ? `<button class="button-view" data-task-id="${task.id || 'unknown'}" data-user-id="${userId}" title="Посмотреть решение"></button>` : '';
        
        tr.innerHTML = `
            <td>min-max алгоритм</td>
            <td>${shortName}</td>
            <td>${task.group}</td>
            <td>${formattedDate}</td>
            <td>${status}</td>
            <td class="actions-cell">
                <button class="button-edit" data-task-id="${task.id || 'unknown'}" data-user-id="${userId}" title="Редактировать"></button>
                <button class="button-delete" data-task-id="${task.id || 'unknown'}" data-user-id="${userId}" title="Удалить"></button>
                ${viewButton}
            </td>
        `;
        
        tableBody.appendChild(tr);
    });

    document.querySelectorAll('.button-delete').forEach(button => {
        button.addEventListener('click', handleDeleteTask);
    }); 
    document.querySelectorAll('.button-edit').forEach(button => {
        button.addEventListener('click', handleEditTask);
    }); 
    document.querySelectorAll('.button-view').forEach(button => {
        button.addEventListener('click', handleViewSolution);
    });
}

async function handleDeleteTask(e) {
    const button = e.currentTarget;
    const taskId = button.dataset.taskId;
    const userId = button.dataset.userId;
    
    if (!confirm('Вы уверены, что хотите удалить это задание?')) {
        return;
    }

    try {
        const authtoken = Cookies.get('.AspNetCore.Identity.Application');
        console.log(`Удаление задания: Task ID: ${taskId}, User ID: ${userId}`);
        const response = await fetch(`${apiHost}/AB/Users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authtoken}`
            }
        });

        if (response.ok) {
            alert('Задание успешно удалено');
            button.closest('tr').remove();
        } else {
            throw new Error(`Ошибка HTTP: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        console.error('Ошибка при удалении:', error);
        alert('Не удалось удалить задание');
    }
}

function handleEditTask(e) {
    const button = e.currentTarget;
    const taskId = button.dataset.taskId;
    const userId = button.dataset.userId;
    const userName = button.closest('tr').querySelector('td:nth-child(2)').textContent;
    const userGroup = button.closest('tr').querySelector('td:nth-child(3)').textContent;
    
    console.log(`Редактирование: Task ID: ${taskId}, User ID: ${userId}, User Name: ${userName}`);
    window.location.href = `/TaskEditPage/TaskEditPage.html?userId=${userId}&userName=${encodeURIComponent(userName)}&userGroup=${encodeURIComponent(userGroup)}&taskId=${taskId}`;
}

function handleViewSolution(e) {
    const button = e.currentTarget;
    const taskId = button.dataset.taskId;
    const userId = button.dataset.userId;
    
    console.log(`Просмотр решения: Task ID: ${taskId}, User ID: ${userId}`);
    window.location.href = `/TaskSolvePage/TaskSolvePage.html?view=true&taskId=${taskId}&userId=${userId}`;
}

function formatShortName(fullName) {
    if (!fullName) return 'Без имени';
    
    const parts = fullName.split(' ').filter(Boolean);
    
    if (parts.length >= 3) {
        return `${parts[0]} ${parts[1][0]}.${parts[2][0]}.`;
    } else if (parts.length === 2) {
        return `${parts[0]} ${parts[1][0]}.`;
    } else if (parts.length === 1) {
        return parts[0];
    }
    
    return fullName;
}