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
        const messageElement = document.getElementById('solution-message');
        try {
            const response = await submitSolution(userSolution);
            const checkResult = checkSolution(userSolution, response);
            console.log('Решение пользователя:', userSolution);
            console.log('Результат проверки:', checkResult);
            messageElement.style.display = 'block';
            messageElement.innerHTML = '';
            if (checkResult.isCorrect) {
                messageElement.classList.remove('error');
                messageElement.classList.add('success');
                messageElement.innerHTML = 'Все минимаксные значения, узлы, путь и отсечения выполнены правильно!';
            } else {
                messageElement.classList.remove('success');
                messageElement.classList.add('error');
                const valueErrors = checkResult.errors.filter(e => e.errorType === 'incorrect_value').length;
                const extraNodeErrors = checkResult.errors.filter(e => e.errorType === 'extra_node').length;
                const missingNodeErrors = checkResult.errors.filter(e => e.errorType === 'missing_node').length;
                const incorrectlyPrunedErrors = checkResult.errors.filter(e => e.errorType === 'incorrectly_pruned').length;
                const pathNotSelectedErrors = checkResult.errors.filter(e => e.errorType === 'path_not_selected').length;
                const incorrectPathErrors = checkResult.errors.filter(e => e.errorType === 'incorrect_path').length;
                let message = 'Найдены ошибки:';
                message += '<ul>';
                if (valueErrors > 0) {
                    message += `<li>Ошибка в определении минимаксных значений в ${valueErrors} узлах.</li>`;
                }
                if (extraNodeErrors > 0 || missingNodeErrors > 0) {
                    message += `<li>Ошибка в отсечении ${extraNodeErrors + missingNodeErrors} узлов.</li>`;
                }
                if (pathNotSelectedErrors > 0 || incorrectPathErrors > 0) {
                    message += `<li>Ошибка в выборе правильного пути.</li>`;
                }
                message += '</ul>';
                messageElement.innerHTML = message;
            }
        } catch (error) {
            console.error('Ошибка отправки решения:', error);
            messageElement.style.display = 'block';
            messageElement.classList.remove('success');
            messageElement.classList.add('error');
            messageElement.innerHTML = `Не удалось проверить решение: ${error.message}`;
        }
    });    
    document.getElementById('profile-tooltip__button-logout').addEventListener('click', function(e) {
        e.preventDefault();
        Logout();
    });

    document.addEventListener('click', function(e) {
        if (e.target.tagName === 'line' && (e.target.classList.contains('branch-line') || e.target.classList.contains('hit-area'))) {
            e.preventDefault();
            const line = e.target.classList.contains('hit-area') ? e.target.previousSibling : e.target;
            const currentColor = line.getAttribute('stroke');
            
            if (currentColor === '#f44336' || currentColor === '#4CAF50') {
                line.setAttribute('stroke', '#808080');
            } else {
                line.setAttribute('stroke', '#f44336');
            }
        }
    });

    document.addEventListener('contextmenu', function(e) {
        if (e.target.tagName === 'line' && (e.target.classList.contains('branch-line') || e.target.classList.contains('hit-area'))) {
            e.preventDefault();
            const line = e.target.classList.contains('hit-area') ? e.target.previousSibling : e.target;
            const parentId = parseInt(line.dataset.parentId);
            const childId = parseInt(line.dataset.childId);
            const currentColor = line.getAttribute('stroke');
            
            if (currentColor === '#f44336' || currentColor === '#4CAF50') {
                line.setAttribute('stroke', '#808080');
            } else {
                let levelOneNodeId;
                if (parentId === 0) {
                    levelOneNodeId = childId;
                } else {
                    const parentLine = document.querySelector(`.branch-line[data-child-id="${parentId}"]`);
                    if (parentLine) {
                        levelOneNodeId = parseInt(parentLine.dataset.childId);
                    }
                }
                
                if (levelOneNodeId) {
                    document.querySelectorAll('.branch-line').forEach(otherLine => {
                        const otherChildId = parseInt(otherLine.dataset.childId);
                        const otherParentId = parseInt(otherLine.dataset.parentId);
                        let otherLevelOneNodeId;
                        if (otherParentId === 0) {
                            otherLevelOneNodeId = otherChildId;
                        } else {
                            const otherParentLine = document.querySelector(`.branch-line[data-child-id="${otherParentId}"]`);
                            if (otherParentLine) {
                                otherLevelOneNodeId = parseInt(otherParentLine.dataset.childId);
                            }
                        }
                        if (otherLevelOneNodeId && otherLevelOneNodeId !== levelOneNodeId && otherLine.getAttribute('stroke') === '#4CAF50') {
                            otherLine.setAttribute('stroke', '#808080');
                        }
                    });
                }
                
                document.querySelectorAll(`.branch-line[data-parent-id="${parentId}"]`).forEach(siblingLine => {
                    if (siblingLine !== line && siblingLine.getAttribute('stroke') === '#4CAF50') {
                        siblingLine.setAttribute('stroke', '#808080');
                    }
                });
                
                line.setAttribute('stroke', '#4CAF50');
            }
        }
    });
    
    document.addEventListener('dblclick', function(e) {
        if (e.target.tagName === 'line' && (e.target.classList.contains('branch-line') || e.target.classList.contains('hit-area'))) {
            e.preventDefault();
        }
    });
}

async function submitSolution(userSolution) {
    if (!userSolution.nodes.every(node => Number.isInteger(node.id) && Number.isInteger(node.a) && Number.isInteger(node.b))) {
        throw new Error('Некорректные данные в узлах');
    }
    if (!userSolution.path.every(id => Number.isInteger(id))) {
        throw new Error('Некорректные данные в пути');
    }
    if (userSolution.path.length === 0) {
        throw new Error('Путь не выбран. Выделите зеленым ветви от корня до листа.');
    }
    
    const authtoken = Cookies.get('.AspNetCore.Identity.Application');
    const response = await fetch(`${apiHost}/AB/Test`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authtoken}`
        },
        body: JSON.stringify({
            nodes: userSolution.nodes,
            path: userSolution.path
        })
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('Ошибка сервера:', response.status, errorText);
        throw new Error(`Ошибка при отправке решения: ${response.status} ${errorText}`);
    }
    
    const responseData = await response.json();
    console.log('Ответ сервера:', responseData);
    
    if (!responseData || !Array.isArray(responseData.nodes) || !Array.isArray(responseData.path)) {
        console.error('Некорректный формат ответа сервера:', responseData);
        throw new Error('Некорректный формат ответа сервера');
    }
    
    return responseData;
}

function checkSolution(userSolution, correctSolution) {
    const errors = [];
    const solutionMap = new Map(correctSolution.nodes.map(node => [node.id, node]));
    const correctPath = new Set(correctSolution.path);
    const correctNodeIds = new Set(correctSolution.nodes.map(node => node.id));
    const userNodeIds = new Set(userSolution.nodes.map(node => node.id));
    const userPath = new Set(userSolution.path);
    
    const redBranchIds = new Set();
    const greenBranchIds = new Set();
    const levelOneIds = new Set();
    const levelTwoIds = new Set();
    
    document.querySelectorAll('.branch-line').forEach(line => {
        const childId = parseInt(line.dataset.childId);
        const parentId = parseInt(line.dataset.parentId);
        const stroke = line.getAttribute('stroke');
        if (stroke === '#f44336') {
            redBranchIds.add(childId);
        } else if (stroke === '#4CAF50') {
            greenBranchIds.add(childId);
        }
        if (parentId === 0) {
            levelOneIds.add(childId);
        } else if (levelOneIds.has(parentId)) {
            levelTwoIds.add(childId);
        }
    });
    
    userSolution.nodes.forEach(node => {
        const nodeElementDom = document.querySelector(`.tree-node[data-node-id="${node.id}"]`);
        if (nodeElementDom) {
            nodeElementDom.classList.remove('pruned-node', 'correct-path-node', 'incorrectly-pruned-node');
        }
        
        if (!node.isLeaf) {
            const correctNode = solutionMap.get(node.id);
            if (correctNode) {
                const isRoot = node.id === 0;
                const userValue = isRoot ? node.a : node.b;
                const correctValue = isRoot ? correctNode.a : correctNode.b;
                if (userValue !== correctValue) {
                    errors.push({
                        id: node.id,
                        input: userValue,
                        correct: correctValue,
                        type: isRoot ? 'α' : 'β',
                        errorType: 'incorrect_value'
                    });
                    const input = document.querySelector(`input[data-node-id="${node.id}"]`);
                    if (input) input.classList.add('error-input');
                } else {
                    const input = document.querySelector(`input[data-node-id="${node.id}"]`);
                    if (input) input.classList.remove('error-input');
                }
            }
        }
    });
    
    document.querySelectorAll('.tree-node').forEach(nodeElement => {
        const nodeId = parseInt(nodeElement.dataset.nodeId);
        const nodeElementDom = document.querySelector(`.tree-node[data-node-id="${nodeId}"]`);
        const isPrunedByUser = redBranchIds.has(nodeId);
        const isSelectedByUser = greenBranchIds.has(nodeId);
        const isLevelTwo = levelTwoIds.has(nodeId);
        
        if (nodeElementDom && !userNodeIds.has(nodeId)) {
            nodeElementDom.classList.remove('pruned-node', 'correct-path-node', 'incorrectly-pruned-node');
        }
        
        if (nodeId === 0) {
            if (nodeElementDom) {
                nodeElementDom.classList.add('correct-path-node');
            }
        } else if (correctNodeIds.has(nodeId) && userNodeIds.has(nodeId)) {
            const correctNode = solutionMap.get(nodeId);
            const userNode = userSolution.nodes.find(n => n.id === nodeId);
            const isRoot = nodeId === 0;
            const userValue = isRoot ? userNode.a : userNode.b;
            const correctValue = isRoot ? correctNode.a : correctNode.b;
            
            if (correctPath.has(nodeId) && !userPath.has(nodeId) && !isPrunedByUser) {
                errors.push({
                    id: nodeId,
                    input: null,
                    correct: null,
                    type: 'path',
                    errorType: 'path_not_selected'
                });
                if (nodeElementDom) {
                    nodeElementDom.classList.add('pruned-node');
                }
            } else if (!correctPath.has(nodeId) && isSelectedByUser) {
                errors.push({
                    id: nodeId,
                    input: null,
                    correct: null,
                    type: 'path',
                    errorType: 'incorrect_path'
                });
                if (nodeElementDom) {
                    nodeElementDom.classList.add('pruned-node');
                }
            } else if (isPrunedByUser && !correctPath.has(nodeId)) {
                if (isLevelTwo) {
                    errors.push({
                        id: nodeId,
                        input: null,
                        correct: null,
                        type: 'pruning',
                        errorType: 'incorrectly_pruned'
                    });
                    if (nodeElementDom) {
                        nodeElementDom.classList.add('incorrectly-pruned-node');
                    }
                }
            } else if (userValue === correctValue && (!isPrunedByUser || correctPath.has(nodeId))) {
                if (nodeElementDom) {
                    nodeElementDom.classList.add('correct-path-node');
                }
            }
        } else if (userNodeIds.has(nodeId) && !correctNodeIds.has(nodeId)) {
            errors.push({
                id: nodeId,
                input: null,
                correct: null,
                type: 'pruning',
                errorType: 'extra_node'
            });
            if (nodeElementDom) {
                nodeElementDom.classList.add('pruned-node');
            }
        } else if (correctNodeIds.has(nodeId) && !userNodeIds.has(nodeId)) {
            errors.push({
                id: nodeId,
                input: null,
                correct: null,
                type: 'pruning',
                errorType: 'missing_node'
            });
            if (nodeElementDom) {
                nodeElementDom.classList.add('pruned-node');
            }
        }
        
        if (correctPath.has(nodeId) && isPrunedByUser) {
            errors.push({
                id: nodeId,
                input: null,
                correct: null,
                type: 'pruning',
                errorType: 'incorrectly_pruned'
            });
            if (nodeElementDom) {
                nodeElementDom.classList.add('incorrectly-pruned-node');
            }
        } else if (!correctNodeIds.has(nodeId) && isPrunedByUser && !userNodeIds.has(nodeId)) {
            if (nodeElementDom) {
                nodeElementDom.classList.add('correct-path-node');
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
                <input type="text" data-node-id="${node.id}" value="" placeholder="${node.id === 0 ? '' : ''}">
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
        svg.style.left = level === 0 ? '5px' : '0';
        svg.style.width = '100%';
        svg.style.height = '50px';
        svg.style.zIndex = '1';
        childrenContainer.appendChild(svg);
        
        const childCount = node.subNodes.length;
        const nodeWidth = level === 0 ? 280 : 60;
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
        path: []
    };
    
    const emptyNodes = [];
    document.querySelectorAll('.tree-node:not(.leaf-node)').forEach(nodeElement => {
        const nodeId = parseInt(nodeElement.dataset.nodeId);
        const input = nodeElement.querySelector('.node-input input');
        if (!input || input.value.trim() === '') {
            emptyNodes.push(nodeId);
        }
    });
    
    if (emptyNodes.length > 0) {
        alert(`Пожалуйста, введите минимаксные значения для всех узлов.`);
        throw new Error('Не все узлы заполнены');
    }
    
    const redBranchChildIds = new Set();
    document.querySelectorAll('.branch-line').forEach(line => {
        const childId = parseInt(line.dataset.childId);
        const stroke = line.getAttribute('stroke');
        if (stroke === '#f44336') {
            redBranchChildIds.add(childId);
        }
    });
    
    document.querySelectorAll('.tree-node').forEach(nodeElement => {
        const nodeId = parseInt(nodeElement.dataset.nodeId);
        if (redBranchChildIds.has(nodeId)) return;
        
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
        
        if (a === null || b === null) {
            console.warn(`Некорректные значения для узла ${nodeId}: a=${a}, b=${b}`);
        }
        
        solution.nodes.push({
            id: nodeId,
            a: a !== null ? a : (isLeaf ? 0 : nodeId === 0 ? 0 : -2147483648),
            b: b !== null ? b : (isLeaf ? 0 : nodeId === 0 ? 2147483647 : 0)
        });
    });
    
    let currentId = 0;
    while (true) {
        const greenLine = Array.from(document.querySelectorAll('.branch-line')).find(line => 
            parseInt(line.dataset.parentId) === currentId && 
            line.getAttribute('stroke') === '#4CAF50'
        );
        
        if (!greenLine) break;
        
        const childId = parseInt(greenLine.dataset.childId);
        solution.path.push(childId);
        currentId = childId;
        
        const currentNode = document.querySelector(`.tree-node[data-node-id="${currentId}"]`);
        if (currentNode && currentNode.classList.contains('leaf-node')) break;
    }
    if (solution.path.length !== 2) {
        alert('Пожалуйста, выберите полный путь, выделив зеленым ветви от корня до листа.');
        throw new Error('Неполный путь');
    }
    console.log('Собранное решение:', solution);
    return solution;
}

function convertInputValue(value) {
    if (value === '' || value == null) return null;
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