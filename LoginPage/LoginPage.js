document.getElementById('form_login').addEventListener('submit', e => {
    e.preventDefault();
    
    const data = {
        userName: document.getElementById('id_userLogin').value,
        password: document.getElementById('id_userPassword').value,
        // twoFactorCode: "",
        // twoFactorRecoveryCode: ""
    }
    
    sendLoginForm(data);
})

async function sendLoginForm(data) {
    const res = await fetch('https://localhost:7169/api/Users/Login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    });

    const result = await res.json();
    if (res.status === 200){
        Cookies.set('.AspNetCore.Identity.Application', result.accessToken);
        window.location.href = "/ProfileTeacherPage/ProfileTeacherPage.html"
    }
    else {
        alert('Что-то пошло не так');
    }
}