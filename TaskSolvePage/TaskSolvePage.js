document.addEventListener('DOMContentLoaded', function() {
    const taskData = JSON.parse(sessionStorage.getItem('currentTask'));
    if (!taskData || !taskData.problem) {
        alert('Данные задачи не найдены');
        window.location.href = "/ProfileStudentPage/ProfileStudentPage.html";
        return;
    }

    renderTree(taskData.problem.head);
    setupEventListeners();
});

// Обновлённая функция setupEventListeners
function setupEventListeners() {
    document.getElementById('submit-solution').addEventListener('click', function() {
        const solution = collectSolution();
        console.log('Решение:', solution);
        alert('Решение сохранено (в реальной системе будет отправлено на сервер)');
    });

    document.getElementById('profile-tooltip__button-logout').addEventListener('click', function(e) {
        e.preventDefault();
        Logout();
    });

    // Обработчики для кнопок бесконечности
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('infinity-btn')) {
            const btn = e.target;
            const input = btn.parentElement.querySelector('input');
            
            // Переключаем знак
            const newSign = btn.dataset.sign === '+' ? '-' : '+';
            const newValue = newSign + '∞';
            
            btn.dataset.sign = newSign;
            btn.textContent = newValue;
            input.value = newValue;
            
            // Убираем затемнение кнопки
            btn.classList.remove('disabled');
        }
    });

    // Обработчики для полей ввода
    document.addEventListener('input', function(e) {
        if (e.target.matches('.alpha-input input, .beta-input input')) {
            const input = e.target;
            const btn = input.parentElement.querySelector('.infinity-btn');
            const isInfinity = input.value === '+∞' || input.value === '-∞';
            
            // Активируем/деактивируем кнопку
            btn.classList.toggle('disabled', !isInfinity);
        }
    });
}

// Обновлённая функция renderTree
function renderTree(node, parentContainer = null, level = 0) {
    const container = parentContainer || document.getElementById('tree-container');
    if (!parentContainer) container.innerHTML = '';

    const nodeWrapper = document.createElement('div');
    nodeWrapper.className = `node-wrapper level-${level}`;
    
    const nodeElement = document.createElement('div');
    nodeElement.className = 'tree-node';
    
    if (!node.subNodes || node.subNodes.length === 0) {
        nodeElement.textContent = node.a;
        nodeElement.classList.add('leaf-node');
    } 
    else {
        // Задаем начальные значения только для корневого узла (level === 0)
        const alphaValue = level === 0 ? '-∞' : '';
        const betaValue = level === 0 ? '+∞' : '';
        const alphaSign = level === 0 ? '+' : '+';
        const betaSign = level === 0 ? '-' : '+';
        const alphaDisabled = level === 0 ? '' : 'disabled';
        const betaDisabled = level === 0 ? '' : 'disabled';
        
        nodeElement.innerHTML = `
            <div class="alpha-input">
                <span>α:</span>
                <div>
                    <input type="text" data-node-id="${node.id}" value="${alphaValue}">
                    <button type="button" class="infinity-btn ${alphaDisabled}" data-sign="${alphaSign}" data-for="alpha">${alphaSign}∞</button>
                </div>
            </div>
            <div class="beta-input">
                <span>β:</span>
                <div>
                    <input type="text" data-node-id="${node.id}" value="${betaValue}">
                    <button type="button" class="infinity-btn ${betaDisabled}" data-sign="${betaSign}" data-for="beta">${betaSign}∞</button>
                </div>
            </div>
        `;
    }
    
    nodeWrapper.appendChild(nodeElement);
    container.appendChild(nodeWrapper);

    if (node.subNodes && node.subNodes.length > 0) {
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'children-container';
        nodeWrapper.appendChild(childrenContainer);
        
        node.subNodes.forEach(childNode => {
            renderTree(childNode, childrenContainer, level + 1);
        });
    }
}

// Обновлённая функция collectSolution
function collectSolution() {
    const solution = [];
    
    document.querySelectorAll('.alpha-input input').forEach(input => {
        const nodeId = parseInt(input.dataset.nodeId);
        let alphaValue = input.value;
        let betaValue = document.querySelector(`.beta-input input[data-node-id="${nodeId}"]`).value;
        
        // Преобразуем значения
        alphaValue = convertInputValue(alphaValue);
        betaValue = convertInputValue(betaValue);
        
        solution.push({
            id: nodeId,
            a: alphaValue,
            b: betaValue
        });
    });
    
    return solution;
}

// Вспомогательная функция для преобразования значений
function convertInputValue(value) {
    if (value === '+∞') return Infinity;
    if (value === '-∞') return -Infinity;
    const num = parseInt(value);
    return isNaN(num) ? 0 : num;
}

async function Logout() {
    const authtoken = Cookies.get('.AspNetCore.Identity.Application');
    const res = await fetch(`${apiHost}/Users/Logout`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${authtoken}`
        }
    });

    if (res.status === 200) {
        window.location.href = "/LoginPage/LoginPage.html";
    }
}