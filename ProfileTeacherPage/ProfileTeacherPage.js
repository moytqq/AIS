document.addEventListener('DOMContentLoaded', function() {
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
        window.location.href = "/LoginPage/LoginPage.html";
    }
}

async function fetchAssignedTasks() {
    try {
        const authtoken = Cookies.get('.AspNetCore.Identity.Application');
        
        // Получаем список заданий
        const tasksResponse = await fetch(`${apiHost}/AB/Users/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authtoken}`
            }
        });
        
        if (!tasksResponse.ok) {
            throw new Error('Ошибка при получении заданий');
        }
        
        const tasks = await tasksResponse.json();
        
        const tasksWithUserInfo = await Promise.all(
            tasks.map(async task => {               
                const user = task.user;
                return {
                    ...task.task,
                    userName: [user.secondName, user.name, user.patronymic].join(' '),
                    group: user.group
                };
            })
        );
        
        populateTasksTable(tasksWithUserInfo);
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Произошла ошибка при загрузке заданий');
    }
}

// Заполнение таблицы заданиями
function populateTasksTable(tasks) {
    const tableBody = document.querySelector('.given-tasks-table__table tbody');
    tableBody.innerHTML = '';

    tasks.forEach(task => {
        const tr = document.createElement('tr');
        tr.style.whiteSpace = 'nowrap';
        
        const date = new Date(task.date);
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
        const shortName = formatShortName(task.userName);
        const status = task.isSolved ? 'Выполнено' : 'Выдано';
        const group = task.group || '----------';
        
        tr.innerHTML = `
            <td>α & β отсечение</td>
            <td>${shortName}</td>
            <td>${group}</td>
            <td>${formattedDate}</td>
            <td>${status}</td>
            <td>
                <button class="button-edit" data-task-id="${task.id}" data-user-id="${task.userId}"></button>
                <button class="button-delete" data-task-id="${task.id}" data-user-id="${task.userId}"></button>
            </td>
        `;
        
        tableBody.appendChild(tr);
    });

    // Добавляем обработчики для кнопок удаления
    document.querySelectorAll('.button-delete').forEach(button => {
        button.addEventListener('click', handleDeleteTask);
    }); 
    // Обработчики для кнопок редактирования
    document.querySelectorAll('.button-edit').forEach(button => {
        button.addEventListener('click', handleEditTask);
    }); 
    // О
}

// Обработчик удаления задания
async function handleDeleteTask(e) {
    const button = e.currentTarget;
    const taskId = button.dataset.taskId;
    const userId = button.dataset.userId;
    
    if (!confirm('Вы уверены, что хотите удалить это задание?')) {
        return;
    }

    try {
        const authtoken = Cookies.get('.AspNetCore.Identity.Application');
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
            throw new Error('Ошибка при удалении задания');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось удалить задание');
    }
}
function handleEditTask(e) {
    const button = e.currentTarget;
    const taskId = button.dataset.taskId;
    const userId = button.dataset.userId;
    const userName = button.closest('tr').querySelector('td:nth-child(2)').textContent;
    const userGroup = button.closest('tr').querySelector('td:nth-child(3)').textContent;
    
    window.location.href = `/TaskEditPage/TaskEditPage.html?userId=${userId}&userName=${encodeURIComponent(userName)}&userGroup=${encodeURIComponent(userGroup)}&taskId=${taskId}`;
}
function formatShortName(fullName) {
    if (!fullName) return 'Неизвестный пользователь';
    
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