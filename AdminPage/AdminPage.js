function splitFullName(FullName, separator) {
    let SplittedFullName = FullName.split(separator);
    return (SplittedFullName);
}
function joinFullName(data) {
    data.forEach(row => {
        row.name = [row.secondName, row.name, row.patronymic].join(' ');
    })
}
function generateLogin(fullName) {
    // 1. Транслитерация с русского на английский
    const translitRules = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
        'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
        'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
        'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
        'я': 'ya',
        'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh',
        'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
        'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'Ts',
        'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch', 'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu',
        'Я': 'Ya'
    };

    // Транслитерируем ФИО
    let transliterated = '';
    for (const char of fullName) {
        transliterated += translitRules[char] || char;
    }

    // 2. Формируем базовый логин (фамилия + первые буквы имени и отчества)
    const [lastName, firstName, middleName] = transliterated.split(' ').filter(Boolean);
    let baseLogin = '';

    // Вариант 1: IvanovPS (фамилия + первые буквы имени и отчества)
    if (lastName && firstName && middleName) {
        baseLogin = (
            lastName.toLowerCase() +
            firstName[0].toLowerCase() +
            middleName[0].toLowerCase()
        );
    }
    // Вариант 2: Pyotr.Sergeevich (имя.отчество)
    else if (firstName && middleName) {
        baseLogin = (
            firstName.toLowerCase() + '.' + middleName.toLowerCase()
        );
    }
    // Если только фамилия и имя
    else if (lastName && firstName) {
        baseLogin = (
            lastName.toLowerCase() + firstName[0].toLowerCase()
        );
    }
    // Если только фамилия
    else if (lastName) {
        baseLogin = lastName.toLowerCase();
    }
    // Если что-то пошло не так, используем user + случайное число
    else {
        baseLogin = 'user' + Math.floor(Math.random() * 100);
    }

    // 3. Добавляем случайную цифру (0-9)
    const randomDigit = Math.floor(Math.random() * 10);
    baseLogin += randomDigit;

    // 4. Добавляем случайный спецсимвол
    const specialChars = '!@#$%^&*';
    const randomSpecialChar = specialChars[Math.floor(Math.random() * specialChars.length)];
    baseLogin += randomSpecialChar;

    return baseLogin;
}
function generatePassword(length = 8) {
    if (length < 8) length = 8;

    const groups = [
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ', // Заглавные
        'abcdefghijklmnopqrstuvwxyz', // Строчные
        '0123456789', // Цифры
        '!@#$%^&*' // Спецсимволы
    ];

    // Берем минимум по одному символу из каждой группы
    let password = groups.map(group => group[Math.floor(Math.random() * group.length)]);

    // Дополняем случайными символами из всех групп
    const allChars = groups.join('');
    for (let i = 0; i < length - groups.length; i++) {
        password.push(allChars[Math.floor(Math.random() * allChars.length)]);
    }

    // Перемешиваем
    password = password.sort(() => Math.random() - 0.5).join('');

    return password;
}
async function checkIfUserExists() {

    const data = await fetchDBData()
    let test = document.getElementById('id_userId').value;
    for (const user of data) {
        if (user.id == document.getElementById('id_userId').value) {
            return true;
        }
    }
}
async function checkIfGroupExists(groupName) {
    const groups = await fetchGroups();
    return groups.some(group => group.name === groupName);
}

document.getElementById('id_button_generate_login_password').addEventListener('click', e => {
    e.preventDefault();

    document.getElementById('id_userName').value = generateLogin(document.getElementById('id_userFullName').value);
    document.getElementById('id_userPassword').value = generatePassword()

})

document.getElementById('id_button_admin_save').addEventListener('click', async e => {
    e.preventDefault();

    const from_register_user = document.getElementById('id_form_register_user')
    const from_register_user_styles = window.getComputedStyle(from_register_user);

    if (from_register_user_styles.display != 'none') {
        const SplittedFullName = splitFullName(document.getElementById('id_userFullName').value, " ")

        const data = {
            userId: document.getElementById('id_userId').value,
            userName: document.getElementById('id_userName').value,
            password: document.getElementById('id_userPassword').value,
            name: SplittedFullName[1],
            secondName: SplittedFullName[0],
            patronymic: SplittedFullName[2],
            groupId: document.getElementById('id_groupId').value
        }


        if (await checkIfUserExists()) {
            document.getElementById('id_userId').value = '';
            document.getElementById('id_groupId').value = '';
            putUser(data);
        }
        else {
            addUser(data);
        }

    }
    else {
        const groupName = document.getElementById('id_groupName').value.trim();
        if (!groupName) {
            alert('Введите название группы');
            return;
        }
        
        if (await checkIfGroupExists(groupName)) {
            alert('Группа с таким названием уже существует');
            return;
        }
        
        const data = { groupName };
        addGroup(data);
    }

})

async function addUser(data) {
    const authtoken = Cookies.get('.AspNetCore.Identity.Application');
    const res = await fetch(`${apiHost}/Users/Register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authtoken}`
        },
        body: JSON.stringify(data)
    });

    if (res.status === 200) {
        alert('Пользователь добавлен')
        fetchDBData();
    }
    // const result = await res.json();
}

async function addGroup(data) {
    const authtoken = Cookies.get('.AspNetCore.Identity.Application');
    const res = await fetch(`${apiHost}/Users/Groups?groupName=` + data.groupName, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authtoken}`
        },
    });

    if (res.status === 200) {
        alert('Группа добавлена')
    }
    // const result = await res.json();
}

document.addEventListener('DOMContentLoaded', function () {
    fetchDBData();
    setupGroupDropdowns();
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
    tableBody.innerHTML = ''; // Очищаем таблицу перед заполнением
    joinFullName(data);

    data.forEach(row => {
        if (row.name != ' admin ') {

            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td>${row.group}</td>
                <td>${row.name}</td>
                <td>
                    <button id="id_admin-list__button-edit" class="admin-list__button-edit" data-id="${row.id}"></button> 
                    <button id="id_admin-list__button-delete" class="admin-list__button-delete" data-id="${row.id}"></button>
                </td>
            `;

            tableBody.appendChild(tr);
        }
    });

    document.querySelectorAll('.admin-list__button-delete').forEach(btn => {
        btn.addEventListener('click', async function () {
            if (confirm('Вы уверены, что хотите удалить эту запись?')) {
                await deleteRecord(this.getAttribute('data-id'));
                fetchDBData();
            }

        });
    });
    document.querySelectorAll('.admin-list__button-edit').forEach(btn => {
        btn.addEventListener('click', function () {
            editRecord(this.getAttribute('data-id'));
        });
    });
};

async function deleteRecord(id) {
    try {
        if (typeof id === String) {
            arrOfIds = [id];
        }
        const authtoken = Cookies.get('.AspNetCore.Identity.Application');
        const response = await fetch(`${apiHost}/Users?userId=` + id, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authtoken}`,
            }
        });
        alert('Запись успешно удалена');
        fetchDBData();
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось удалить запись');
    }
}
async function editRecord(id) {
    const userdata = await fetchDBData();
    const groupdata = await fetchGroups();
    userdata.forEach(user => {
        if (user.id === id) {
            document.getElementById('id_groupName-of-user').value = `${user.group}`
            document.getElementById('id_userFullName').value = user.name
            document.getElementById('id_userId').value = user.id
            groupdata.forEach(group => {
                if (user.group === group.name) {
                    document.getElementById('id_groupId').value = group.id
                }
            })
        }
    });
}

async function putUser(data) {
    try {
        const authtoken = Cookies.get('.AspNetCore.Identity.Application');
        const response = await fetch(`${apiHost}/Users/${data.userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authtoken}`
            },
            body: JSON.stringify(data)
        });
        if (response.status == 200) {
            alert('Запись успешно изменена');
        }
        else{alert('oops')}
        fetchDBData();
    } catch (error) {

    }

}

async function fetchGroups() {
    try {
        const authtoken = Cookies.get('.AspNetCore.Identity.Application');
        const response = await fetch(`${apiHost}/Users/Groups`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authtoken}`
            },
        });
        return await response.json();
    } catch (error) {
        console.error('Ошибка при получении списка групп:', error);
        return [];
    }
}

async function setupGroupDropdowns() {
    const groups = await fetchGroups();
    
    // Обработчики для кнопок в форме студента
    document.querySelector('.tabs__input-group .profile-tooltip__button-chevron').addEventListener('click', function(e) {
        e.preventDefault();
        toggleGroupDropdown(this, groups, 'id_groupName-of-user');
    });
    
    // Обработчики для кнопок в форме группы
    document.querySelector('#group-tab .tabs__input-group .profile-tooltip__button-chevron').addEventListener('click', function(e) {
        e.preventDefault();
        toggleGroupDropdown(this, groups, 'id_groupName');
    });
}

function toggleGroupDropdown(button, groups, inputId) {
    // Проверяем, есть ли уже выпадающий список
    const existingDropdown = button.nextElementSibling;
    if (existingDropdown && existingDropdown.classList.contains('group-dropdown')) {
        existingDropdown.remove();
        return;
    }
    
    // Создаем новый выпадающий список
    const dropdown = document.createElement('div');
    dropdown.className = 'group-dropdown';
    dropdown.style.position = 'absolute';
    dropdown.style.backgroundColor = '#fff';
    dropdown.style.border = '1px solid #ddd';
    dropdown.style.borderRadius = '5px';
    dropdown.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    dropdown.style.zIndex = '1000';
    dropdown.style.maxHeight = '200px';
    dropdown.style.overflowY = 'auto';
    dropdown.style.minWidth = '300px'; // Увеличиваем минимальную ширину
    
    // Добавляем группы в список
    groups.forEach(group => {
        const item = document.createElement('div');
        item.textContent = group.name;
        item.style.padding = '8px 12px';
        item.style.cursor = 'pointer';
        item.style.whiteSpace = 'normal'; // Разрешаем перенос текста
        item.style.wordBreak = 'break-word'; // Переносим длинные слова
        
        item.addEventListener('click', () => {
            document.getElementById(inputId).value = group.name;
            if (group.id) {
                document.getElementById("id_groupId").value = group.id;
            }
            dropdown.remove();
        });
        
        item.addEventListener('mouseover', () => {
            item.style.backgroundColor = '#f5f5f5';
        });
        
        item.addEventListener('mouseout', () => {
            item.style.backgroundColor = '#fff';
        });
        
        dropdown.appendChild(item);
    });
    
    // Позиционируем выпадающий список
    const rect = button.getBoundingClientRect();
    dropdown.style.top = `${rect.bottom + window.scrollY}px`;
    dropdown.style.left = `${rect.left + window.scrollX}px`;
    
    // Добавляем в DOM
    document.body.appendChild(dropdown);
    
    // Закрываем при клике вне списка
    const closeHandler = (e) => {
        if (!dropdown.contains(e.target) && e.target !== button) {
            dropdown.remove();
            document.removeEventListener('click', closeHandler);
        }
    };
    
    document.addEventListener('click', closeHandler);
}

