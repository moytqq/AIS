function joinFullName(data) {
    data.forEach(row => {
        row.name = [row.secondName, row.name, row.patronymic].join(' ');
    });
}

let allUsers = [];
let selectedUserIds = [];


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

document.addEventListener('DOMContentLoaded', function () {
    fetchDBData();
});

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

            const tr = document.createElement('tr');
            tr.dataset.userId = row.id;

            tr.innerHTML = `
                <td>
                    <input type="checkbox" class="user-checkbox" data-user-id="${row.id}">
                    ${row.group}
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
    
    try {
        const authtoken = Cookies.get('.AspNetCore.Identity.Application');
        
        const requests = selectedUserIds.map(userId => 
            fetch(`${apiHost}/AB/Users/${userId}/Assign?treeHeight=${parseInt(treeHeight)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authtoken}`
                }
            })
        );

        const responses = await Promise.all(requests);
        
        const allSuccess = responses.every(response => response.ok);
        
        if (allSuccess) {
            alert('Задание успешно назначено выбранным пользователям');
            clearCheckboxes();
        } else {
            alert('Произошла ошибка при назначении задания некоторым пользователям');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Произошла ошибка при назначении задания');
    }
});

function clearCheckboxes() {
    document.querySelectorAll('.user-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    document.getElementById('select-all-checkbox').checked = false;
    
    selectedUserIds = [];
}