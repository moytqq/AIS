function restrictAccess() {
    const authToken = Cookies.get('.AspNetCore.Identity.Application');
    if (!authToken) {
        alert('Необходимо авторизоваться');
        window.location.href = '/LoginPage/LoginPage.html';
        return false;
    }
    const userFullName = sessionStorage.getItem('userFullName');
    if (!userFullName || sessionStorage.getItem('isTeacher') === null) {
        alert('Пожалуйста, войдите в систему');
        window.location.href = '/LoginPage/LoginPage.html';
        return false;
    }
    return true;
}