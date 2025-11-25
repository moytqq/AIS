import { apiHost } from "../scripts/main";

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
        const payload = {
            username: data.userName,
            password: data.password
        };

        const response = await fetch(`${apiHost}/Users/Login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        // Сохраняем токены
        Cookies.set('.AspNetCore.Identity.Application', result.accessToken);
        Cookies.set('RefreshToken', result.refreshToken);
        
        // ВРЕМЕННО: ЖЕСТКО задаем редирект для admin
        console.log('User logged in:', data.userName);
        
        if (data.userName.toLowerCase() === 'admin') {
            // ADMIN → преподаватель
            sessionStorage.setItem('userFullName', 'Администратор');
            sessionStorage.setItem('isTeacher', 'true');
            window.location.href = "/ProfileTeacherPage/ProfileTeacherPage.html";
        } else {
            // ВСЕ ОСТАЛЬНЫЕ → студент
            sessionStorage.setItem('userFullName', data.userName);
            sessionStorage.setItem('isTeacher', 'false');
            window.location.href = "/ProfileStudentPage/ProfileStudentPage.html";
        }
        
    } catch (error) {
        console.error('Ошибка авторизации:', error);
        const errorMessage = document.getElementById('error-message');
        errorMessage.textContent = 'Произошла ошибка при входе: ' + error.message;
        errorMessage.style.display = 'block';
    }
}