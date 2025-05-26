document.getElementById('form_login').addEventListener('submit', e => {
    e.preventDefault();
    
    const data = {
        userName: document.getElementById('id_userLogin').value,
        userPassword: document.getElementById('id_userPassword').value,
        twoFactorCode: "",
        twoFactorRecoveryCode: ""
    }
    
    sendLoginForm(data);
})

async function sendLoginForm(data) {
    const res = await fetch('/api/Users/Login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    });

    const result = await res.json();
}