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
        
        // ПОПЫТАЕМСЯ получить данные пользователя для определения роли
        try {
            const userResponse = await fetch(`${apiHost}/Users?getSelf=true`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${result.accessToken}`
                }
            });
            
            if (userResponse.ok) {
                const userData = await userResponse.json();
                const currentUser = userData[0]; // первый пользователь в массиве
                
                const fullName = formatShortName([
                    currentUser.secondName,
                    currentUser.name,
                    currentUser.patronymic
                ]);
                
                sessionStorage.setItem('userFullName', fullName);
                sessionStorage.setItem('isTeacher', currentUser.isAdmin ? 'true' : 'false');
                
                // РЕДИРЕКТ В ЗАВИСИМОСТИ ОТ РОЛИ
                if (currentUser.isAdmin) {
                    window.location.href = "/ProfileTeacherPage/ProfileTeacherPage.html";
                } else {
                    window.location.href = "/ProfileStudentPage/ProfileStudentPage.html";
                }
            } else {
                throw new Error('Не удалось получить данные пользователя');
            }
        } catch (userError) {
            console.error('Ошибка получения данных пользователя:', userError);
            // Если не получилось - используем временный редирект
            sessionStorage.setItem('userFullName', 'Пользователь');
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