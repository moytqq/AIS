function joinFullName(data) {
    data.forEach(row => {
        row.name = [row.secondName, row.name, row.patronymic].join(' ');
    });
}

let isEditMode = false;
let editUserId = null;

let allUsers = [];
let selectedUserIds = [];

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    editUserId = urlParams.get('userId');
    const userName = urlParams.get('userName');
    const userGroup = decodeURIComponent(urlParams.get('userGroup')) || '----------';
    isEditMode = !!editUserId;

    if (isEditMode) {
        if (!editUserId || !userName || !userGroup) {
            alert('Не переданы необходимые параметры для редактирования');
            window.location.href = "/ProfileTeacherPage/ProfileTeacherPage.html";
            return;
        }

        const tableBody = document.querySelector('#admin-users-table tbody');
        tableBody.innerHTML = '';
        
        const tr = document.createElement('tr');
        tr.dataset.userId = editUserId;
        tr.innerHTML = `
            <td>
                <input type="checkbox" class="user-checkbox" data-user-id="${editUserId}" checked disabled>
                ${decodeURIComponent(userGroup)}
            </td>
            <td>${decodeURIComponent(userName)}</td>
        `;
        tableBody.appendChild(tr);
        
        selectedUserIds = [editUserId];
    } else {
        fetchDBData();
    }
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

async function fetchDBData() {
    try {
        const authtoken = Cookies.get('.AspNetCore.Identity.Application');
        const response = await fetch(`${apiHost}/Users`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authtoken}`
            },
        });
        const data = await response.json();
        console.log("fetch")
        populateTable(data);
        return data;
    } catch (error) {
        console.error('Ошибка при получении данных:', error);
    }
}

function populateTable(data) {
    const tableBody = document.querySelector('#admin-users-table tbody');
    tableBody.innerHTML = '';
    joinFullName(data);
    allUsers = data;

    data.forEach(row => {
        if (row.name != ' admin ') {
            const group = row.group || '----------';
            const tr = document.createElement('tr');
            tr.dataset.userId = row.id;

            tr.innerHTML = `
                <td>
                    <input type="checkbox" class="user-checkbox" data-user-id="${row.id}">
                    ${group}
                </td>
                <td>${row.name}</td>
            `;

            tableBody.appendChild(tr);
        }
    });
    setupCheckboxes();
}

function setupCheckboxes() {
    document.getElementById('select-all-checkbox').addEventListener('change', function(e) {
        const checkboxes = document.querySelectorAll('.user-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = e.target.checked;
        });
        updateSelectedUsers();
    });

    const checkboxes = document.querySelectorAll('.user-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateSelectedUsers);
    });
}

function updateSelectedUsers() {
    selectedUserIds = [];
    const checkboxes = document.querySelectorAll('.user-checkbox:checked');
    checkboxes.forEach(checkbox => {
        selectedUserIds.push(checkbox.dataset.userId);
    });
}

document.querySelector('.admin-form__submit-button').addEventListener('click', async function(e) {
    e.preventDefault();
    
    if (selectedUserIds.length === 0) {
        alert('Пожалуйста, выберите хотя бы одного пользователя');
        return;
    }

    const treeHeight = document.getElementById('tree-height-input').value;
    const max = document.getElementById('max-input').value;
    const template = document.getElementById('template-input').value;
    
    try {
        const authtoken = Cookies.get('.AspNetCore.Identity.Application');
        
        if (isEditMode) {
            const response = await fetch(`${apiHost}/AB/Users/${editUserId}?height=${parseInt(treeHeight)}&maxValue=${parseInt(max)}&template=${parseInt(template)}&generate=true`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authtoken}`
                }
            });

            if (response.ok) {
                alert('Задание успешно обновлено');
                window.location.href = "/ProfileTeacherPage/ProfileTeacherPage.html";
            } else {
                throw new Error('Ошибка при обновлении задания');
            }
        } else {
            const response = await fetch(`${apiHost}/AB/Users/Assign?treeHeight=${parseInt(treeHeight)}&max=${parseInt(max)}&template=${parseInt(template)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authtoken}`
                },
                body: JSON.stringify(selectedUserIds)
            });

            if (response.ok) {
                alert('Задание успешно назначено');
                clearCheckboxes();
            } else {
                throw new Error('Ошибка при назначении задания');
            }
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Произошла ошибка: ' + error.message);
    }
});

function clearCheckboxes() {
    document.querySelectorAll('.user-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    document.getElementById('select-all-checkbox').checked = false;
    
    selectedUserIds = [];
}