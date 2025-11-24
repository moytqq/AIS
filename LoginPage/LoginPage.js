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
        const response = await fetch(`${apiHost}/Users/Login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (response.status === 200) {
            Cookies.set('.AspNetCore.Identity.Application', result.accessToken);
            Cookies.set('RefreshToken', result.refreshToken);
            
            // ВРЕМЕННО: пропускаем вызов GetUsers и переходим сразу
            // TODO: позже исправить бэкенд и вернуть этот код
            
            // Используем данные из логина для простого редиректа
            sessionStorage.setItem('userFullName', 'Пользователь'); // временное значение
            sessionStorage.setItem('isTeacher', 'false'); // временно для студента
            
            // Переходим на страницу студента (или учителя если знаете что пользователь админ)
            window.location.href = "/ProfileStudentPage/ProfileStudentPage.html";
            
        } else if (response.status === 401 || response.status === 400) {
            const errorMessage = document.getElementById('error-message');
            errorMessage.textContent = 'Неверный логин или пароль';
            errorMessage.style.display = 'block';
        } else {
            throw new Error('Ошибка сервера');
        }
    } catch (error) {
        console.error('Ошибка авторизации:', error);
        const errorMessage = document.getElementById('error-message');
        errorMessage.textContent = 'Произошла ошибка при входе';
        errorMessage.style.display = 'block';
    }
}