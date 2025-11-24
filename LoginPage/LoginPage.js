function formatShortName(fullNameParts) {
    const [secondName, name, patronymic] = fullNameParts.filter(Boolean);
    if (secondName && name && patronymic) {
        return `${secondName} ${name[0]}.${patronymic[0]}.`;
    } else if (secondName && name) {
        return `${secondName} ${name[0]}.`;
    } else if (secondName) {
        return secondName;
    }
    return 'Без имени';
}

document.getElementById('form_login').addEventListener('submit', e => {
    e.preventDefault();
    
    const errorMessage = document.getElementById('error-message');
    errorMessage.style.display = 'none';
    errorMessage.textContent = '';

    const data = {
        userName: document.getElementById('id_userLogin').value,
        password: document.getElementById('id_userPassword').value,
    }
    
    sendLoginForm(data);
})

async function sendLoginForm(data) {
    try {
        // Пробуем оба варианта имени поля
        const payload = {
            username: data.userName, // пробуем username
            password: data.password
        };

        const response = await fetch(`${apiHost}/Users/Login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });

        // Сначала проверим статус и тип контента
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.log('Non-JSON response:', text);
            throw new Error('Server returned non-JSON response');
        }

        const result = await response.json();
        
        // Успешный логин
        Cookies.set('.AspNetCore.Identity.Application', result.accessToken);
        Cookies.set('RefreshToken', result.refreshToken);
        
        // Временный редирект
        sessionStorage.setItem('userFullName', 'Пользователь');
        sessionStorage.setItem('isTeacher', 'false');
        window.location.href = "/ProfileStudentPage/ProfileStudentPage.html";
        
    } catch (error) {
        console.error('Ошибка авторизации:', error);
        const errorMessage = document.getElementById('error-message');
        errorMessage.textContent = 'Произошла ошибка при входе: ' + error.message;
        errorMessage.style.display = 'block';
    }
}