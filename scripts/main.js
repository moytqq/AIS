export const apiHost = 'https://beliaevartyom.ru/api'

export default async function Logout() {
    try {
        const authtoken = Cookies.get('.AspNetCore.Identity.Application');
        const response = await fetch(`${apiHost}/Users/Logout`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${authtoken}`
            },
            credentials: 'include' // Важно для отправки cookies
        });

        // УДАЛЯЕМ КУКИ НА СТОРОНЕ КЛИЕНТА ВНЕ ЗАВИСИМОСТИ ОТ ОТВЕТА СЕРВЕРА
        Cookies.remove('.AspNetCore.Identity.Application');
        Cookies.remove('RefreshToken');
        
        // Также очищаем localStorage/sessionStorage
        sessionStorage.removeItem('userFullName');
        localStorage.removeItem('accessToken');
        

        // Перенаправляем на страницу логина
        window.location.href = "/LoginPage/LoginPage.html";
        
    } catch (error) {
        console.error('Ошибка при выходе:', error);
        // Даже при ошибке очищаем cookies и перенаправляем
        Cookies.remove('.AspNetCore.Identity.Application');
        Cookies.remove('RefreshToken');
        sessionStorage.removeItem('userFullName');
        window.location.href = "/LoginPage/LoginPage.html";
    }
}