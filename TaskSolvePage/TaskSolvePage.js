document.addEventListener('DOMContentLoaded', async function() {
    try {
        const taskData = await fetchTaskData();
        if (!taskData || !taskData.problem) {
            alert('Данные задачи не найдены');
            window.location.href = "/ProfileStudentPage/ProfileStudentPage.html";
            return;
        }
        renderTree(taskData.problem.head);
        setupEventListeners(taskData);
    } catch (error) {
        console.error('Ошибка загрузки задачи:', error);
        alert('Не удалось загрузить задачу');
        window.location.href = "/ProfileStudentPage/ProfileStudentPage.html";
    }
});

async function fetchTaskData() {
    const authtoken = Cookies.get('.AspNetCore.Identity.Application');
    const response = await fetch(`${apiHost}/AB/Test`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authtoken}`
        }
    });

    if (!response.ok) {
        throw new Error('Ошибка при получении задачи');
    }

    return await response.json();
}

function setupEventListeners(taskData) {
    document.getElementById('submit-solution').addEventListener('click', async function() {
        const userSolution = collectSolution();
        try {
            const response = await submitSolution(userSolution);
            const checkResult = checkSolution(userSolution, response.solution);
            console.log('Решение пользователя:', userSolution);
            console.log('Результат проверки:', checkResult);
            if (checkResult.isCorrect) {
                alert('Все значения α и β введены правильно!');
            } else {
                alert(`Найдены ошибки в ${checkResult.errors.length} узлах. Поля с ошибками подсвечены.`);
            }
        } catch (error) {
            console.error('Ошибка отправки решения:', error);
            alert('Не удалось проверить решение');
        }
    });

    document.getElementById('profile-tooltip__button-logout').addEventListener('click', function(e) {
        e.preventDefault();
        Logout();
    });

    document.addEventListener('click', function(e) {
        if (e.target.tagName === 'line' && (e.target.classList.contains('branch-line') || e.target.classList.contains('hit-area'))) {
            const line = e.target.classList.contains('hit-area') ? e.target.previousSibling : e.target;
            if (line.getAttribute('stroke') === '#808080') {
                line.setAttribute('stroke', '#f44336'); // Красный
            } else if (line.getAttribute('stroke') === '#f44336') {
                line.setAttribute('stroke', '#4CAF50');
            } else {
                line.setAttribute('stroke', '#808080');
            }
        }
    });
}1

async function submitSolution(userSolution) {
    const authtoken = Cookies.get('.AspNetCore.Identity.Application');
    const response = await fetch(`${apiHost}/AB/Test`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authtoken}`
        },
        body: JSON.stringify({
            'nodes': userSolution.nodes,
            'path': Array.from(userSolution.branches)
        })
    });

    if (!response.ok) {
        throw new Error('Ошибка при отправке решения');
    }

    return await response.json();
}

function checkSolution(userSolution, correctSolution) {
    const errors = [];
    const solutionMap = new Map(correctSolution.map(node => [node.id, node]));

    userSolution.nodes.forEach(node => {
        if (!node.isLeaf) { 
            const correctNode = solutionMap.get(node.id);
            if (correctNode) {
                const isRoot = node.id === 0;
                const userValue = isRoot ? node.a : node.b;
                const correctValue = isRoot ? correctNode.a : correctNode.b;
                if (userValue !== correctValue) {
                    errors.push({ id: node.id, input: userValue, correct: correctValue, type: isRoot ? 'α' : 'β' });
                    const input = document.querySelector(`input[data-node-id="${node.id}"]`);
                    if (input) input.classList.add('error-input');
                } else {
                    const input = document.querySelector(`input[data-node-id="${node.id}"]`);
                    if (input) input.classList.remove('error-input');
                }
            }
        }
    });

    return {
        isCorrect: errors.length === 0,
        errors: errors
    };
}

function renderTree(node, parentContainer = null, level = 0) {
    const container = parentContainer || document.getElementById('tree-container');
    if (!parentContainer) container.innerHTML = '';

    const nodeWrapper = document.createElement('div');
    nodeWrapper.className = `node-wrapper level-${level}`;
    
    const nodeElement = document.createElement('div');
    nodeElement.className = 'tree-node';
    nodeElement.dataset.nodeId = node.id;
    
    if (!node.subNodes || node.subNodes.length === 0) {
        nodeElement.textContent = node.a;
        nodeElement.classList.add('leaf-node');
    } else {
        nodeElement.innerHTML = `
            <div class="node-input">
                <input type="text" data-node-id="${node.id}" value="" placeholder="${node.id === 0 ? 'α' : 'β'}">
            </div>
        `;
    }
    
    nodeWrapper.appendChild(nodeElement);
    container.appendChild(nodeWrapper);

    if (node.subNodes && node.subNodes.length > 0) {
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'children-container';
        nodeWrapper.appendChild(childrenContainer);
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.className = 'branch-svg';
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.width = '100%';
        svg.style.height = '50px';
        svg.style.zIndex = '1';
        childrenContainer.appendChild(svg);
        
        const childCount = node.subNodes.length;
        const nodeWidth = level === 0 ? 210 : 70;
        const totalWidth = childCount * nodeWidth;
        const spacing = childCount === 1 ? 0 : totalWidth / childCount; 
        
        node.subNodes.forEach((childNode, index) => {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.classList.add('branch-line');
            line.dataset.parentId = node.id;
            line.dataset.childId = childNode.id;
            line.setAttribute('stroke', '#808080');
            line.setAttribute('stroke-width', '4');
            line.style.cursor = 'pointer';
            
           
            const hitArea = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            hitArea.classList.add('hit-area');
            hitArea.setAttribute('stroke', 'transparent');
            hitArea.setAttribute('stroke-width', '10'); 
            hitArea.style.cursor = 'pointer';
            
            const x1 = '50%'; 
            const y1 = 0; 
            
            const offset = (index * spacing) - (totalWidth - nodeWidth) / 2;
            const x2 = `calc(50% + ${offset}px)`;
            const y2 = 50;
            
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            hitArea.setAttribute('x1', x1);
            hitArea.setAttribute('y1', y1);
            hitArea.setAttribute('x2', x2);
            hitArea.setAttribute('y2', y2);
            
            svg.appendChild(line);
            svg.appendChild(hitArea);
            renderTree(childNode, childrenContainer, level + 1);
        });
    }
}

function collectSolution() {
    const solution = {
        nodes: [],
        branches: new Set()
    };
    
    document.querySelectorAll('.tree-node').forEach(nodeElement => {
        const nodeId = parseInt(nodeElement.dataset.nodeId);
        const isLeaf = nodeElement.classList.contains('leaf-node');
        
        let a = null;
        let b = null;
        
        if (isLeaf) {
            a = convertInputValue(nodeElement.textContent);
            b = a;
        } else if (nodeId === 0) {
            a = convertInputValue(nodeElement.querySelector('.node-input input').value);
            b = 2147483647;
        } else {
            b = convertInputValue(nodeElement.querySelector('.node-input input').value);
            a = -2147483648;
        }
        solution.nodes.push({
            id: nodeId,
            a: a,
            b: b,
        });
    });
    
    document.querySelectorAll('.branch-line').forEach(line => {
        const parentId = parseInt(line.dataset.parentId);
        const childId = parseInt(line.dataset.childId);
        let color = 'grey';
        if (line.getAttribute('stroke') === '#f44336') color = 'red';
        if (line.getAttribute('stroke') === '#4CAF50') 
        {
            color = 'green';
            solution.branches.add(childId);
        }
    });
    
    return solution;
}

function convertInputValue(value) {
    const num = parseInt(value);
    return isNaN(num) ? null : num;
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
