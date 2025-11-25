const apiHost = 'https://beliaevartyom.ru/api'

async function Logout() {
    try {
        const authtoken = Cookies.get('.AspNetCore.Identity.Application');
        const response = await fetch(`${apiHost}/Users/Logout`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${authtoken}`
            },
            credentials: 'include' 
        });

        Cookies.remove('.AspNetCore.Identity.Application');
        Cookies.remove('RefreshToken');
        
        sessionStorage.removeItem('userFullName');
        localStorage.removeItem('accessToken');
        

        window.location.href = "/LoginPage/LoginPage.html";
        
    } catch (error) {
        console.error('Ошибка при выходе:', error);
        Cookies.remove('.AspNetCore.Identity.Application');
        Cookies.remove('RefreshToken');
        sessionStorage.removeItem('userFullName');
        window.location.href = "/LoginPage/LoginPage.html";
    }
}