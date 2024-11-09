console.log('Script started');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const resetButton = document.getElementById('resetButton');
const colorPalette = document.getElementById('colorPalette');
const howToPlayBtn = document.getElementById('howToPlayBtn');
const howToPlay = document.getElementById('howToPlay');
const checkMinColorsBtn = document.getElementById('checkMinColorsBtn');
const numVerticesInput = document.getElementById('numVertices');

console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);

let vertices = [];
let edges = [];
let draggingVertex = null;
let selectedColor = null;
let currentMode = 'random';
let sketchState = 'vertices'; // 'vertices' or 'edges'
let selectedVertex = null;

const colors = [
    '#f44336',  // Red
    '#2196F3',  // Light Blue
    '#4CAF50',  // Green
    '#FFEB3B',  // Bright Yellow
    '#1a237e',  // Dark Blue
    '#9C27B0',  // Purple
    '#FF9800',  // Orange
    '#795548'   // Brown
];

const challenges = [
    // Challenge 1:Triangle-Based Graph 
    {
        vertices: [
            {x: canvas.width/2 - 100, y: canvas.height/2 - 100}, // top left
            {x: canvas.width/2 + 100, y: canvas.height/2 - 100}, // top right
            {x: canvas.width/2 - 200, y: canvas.height/2 + 100}, // bottom left
            {x: canvas.width/2, y: canvas.height/2 + 100},       // bottom middle
            {x: canvas.width/2 + 200, y: canvas.height/2 + 100}  // bottom right
        ],
        edges: [[0,1],[0,2],[0,3],[1,3],[1,4],[2,3],[3,4]]
    },
    // Challenge 2: Pentagon with Inner Star 
    {
        vertices: [
            {x: 300, y: 50}, {x: 450, y: 150}, {x: 400, y: 350},
            {x: 200, y: 350}, {x: 150, y: 150}, {x: 300, y: 200}
        ],
        edges: [[0,1],[1,2],[2,3],[3,4],[4,0],[0,5],[1,5],[2,5],[3,5],[4,5]]
    },
    // Challenge 3: Graph with Overlapping Edges 
    {
        vertices: [
            {x: 200, y: 100}, {x: 400, y: 100}, {x: 200, y: 300}, {x: 400, y: 300},
            {x: 250, y: 150}, {x: 450, y: 150}, {x: 250, y: 350}, {x: 450, y: 350}
        ],
        edges: [[0,1],[0,2],[0,4],[1,3],[1,5],[2,3],[2,6],[3,7],[4,5],[4,6],[5,7],[6,7]]
    },
    // Challenge 4:Simple Graph 
    {
        vertices: [
            {x: 300, y: 100}, {x: 450, y: 200}, {x: 400, y: 350},
            {x: 200, y: 350}, {x: 150, y: 200}
        ],
        edges: [[0,1],[0,2],[0,3],[0,4],[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]]
    },
    // Challenge 5: Complex Graph 
    {
        vertices: [
            {x: 300, y: 50}, {x: 450, y: 150}, {x: 400, y: 350},
            {x: 200, y: 350}, {x: 150, y: 150}, {x: 300, y: 100},
            {x: 375, y: 175}, {x: 350, y: 275}, {x: 250, y: 275}, {x: 225, y: 175}
        ],
        edges: [[0,1],[1,2],[2,3],[3,4],[4,0],[0,5],[1,6],[2,7],[3,8],[4,9],[5,7],[7,9],[9,6],[6,8],[8,5]]
    },
    // Challenge 6: Circular Graph 
    {
        vertices: Array(20).fill().map((_, i) => ({
            x: 300 + 200 * Math.cos(2 * Math.PI * i / 20),
            y: 200 + 200 * Math.sin(2 * Math.PI * i / 20)
        })),
        edges: [
            [0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],
            [10,11],[11,12],[12,13],[13,14],[14,15],[15,16],[16,17],[17,18],[18,19],[19,0],
            [0,5],[1,6],[2,7],[3,8],[4,9],[10,15],[11,16],[12,17],[13,18],[14,19]
        ]
    },
    // Challenge 7: Hexagonal Graph 
    {
        vertices: [
            {x: 200, y: 200}, {x: 400, y: 200},
            {x: 150, y: 300}, {x: 450, y: 300},
            {x: 300, y: 100}, {x: 300, y: 400}
        ],
        edges: [[0,1],[0,2],[0,3],[0,4],[0,5],[1,2],[1,3],[1,4],[1,5],[2,3],[2,4],[2,5],[3,4],[3,5],[4,5]]
    },
    // Challenge 8: Double Pentagon Graph 
    {
        vertices: [
            // Outer pentagon
            {x: 200, y: 100}, {x: 400, y: 100}, 
            {x: 450, y: 250}, {x: 300, y: 400}, 
            {x: 150, y: 250},
            // Inner pentagon
            {x: 250, y: 150}, {x: 350, y: 150},
            {x: 375, y: 250}, {x: 300, y: 325},
            {x: 225, y: 250}
        ],
        edges: [
            // Outer pentagon edges
            [0,1], [1,2], [2,3], [3,4], [4,0],
            // Inner pentagon edges
            [5,6], [6,7], [7,8], [8,9], [9,5],
            // Connections between pentagons
            [0,5], [1,6], [2,7], [3,8], [4,9]
        ]
    }
];

// Create mode buttons
const modes = [
    { value: 'random', text: 'Random', icon: '🎲' },
    { value: 'challenge', text: 'Challenge', icon: '🎯' },
    { value: 'sketch', text: 'Sketch', icon: '✏️' },
    { value: 'help', text: 'How to Play', icon: '❓' }
];

const modeButtonsContainer = document.getElementById('mode-buttons-container');

modes.forEach(mode => {
    const button = document.createElement('button');
    button.className = 'mode-button';
    button.dataset.mode = mode.value;
    button.innerHTML = `
        <span class="mode-icon">${mode.icon}</span>
        <span>${mode.text}</span>
    `;
    
    if (mode.value === 'help') {
        button.addEventListener('click', showHowToPlay);
    } else {
        button.addEventListener('click', () => {
            document.querySelectorAll('.mode-button').forEach(btn => 
                btn.classList.remove('active'));
            button.classList.add('active');
            updateControlsVisibility(mode.value);
        });
    }
    
    modeButtonsContainer.appendChild(button);
});

// Set initial active mode
document.querySelector('.mode-button').classList.add('active');
updateControlsVisibility('random');

let unlockedChallenges = new Set([0]); // Only first challenge unlocked initially

function generateRandomGraph(numVertices) {
    vertices = [];
    edges = [];

    // Create vertices in a more centered way
    const radius = Math.min(canvas.width, canvas.height) * 0.35; // Use 35% of canvas size
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    for (let i = 0; i < numVertices; i++) {
        const angle = (2 * Math.PI * i) / numVertices;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        vertices.push({
            x: x,
            y: y,
            color: null,
            adjacentVertices: []
        });
    }

    // Create edges with 30% probability
    for (let i = 0; i < numVertices; i++) {
        for (let j = i + 1; j < numVertices; j++) {
            if (Math.random() < 0.3) {
                edges.push([i, j]);
                vertices[i].adjacentVertices.push(j);
                vertices[j].adjacentVertices.push(i);
            }
        }
    }
    
    console.log('Generated graph with:', vertices.length, 'vertices and', edges.length, 'edges');
    drawGraph();
    updateColorCount();
}

function drawGraph() {
    console.log('Drawing graph with:', vertices.length, 'vertices');
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw edges
    ctx.beginPath();
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 2;
    edges.forEach(([from, to]) => {
        ctx.moveTo(vertices[from].x, vertices[from].y);
        ctx.lineTo(vertices[to].x, vertices[to].y);
    });
    ctx.stroke();

    // Draw vertices
    vertices.forEach((vertex) => {
        ctx.beginPath();
        ctx.arc(vertex.x, vertex.y, 15, 0, 2 * Math.PI);
        ctx.fillStyle = vertex.color || 'white';
        ctx.fill();
        ctx.strokeStyle = '#666';
        ctx.stroke();
    });
}

// Add this to track completed challenges
let completedChallenges = new Set();

// Update showChallengeButtons function
function showChallengeButtons() {
    const container = document.createElement('div');
    container.id = 'challenge-container';
    
    const rowsContainer = document.createElement('div');
    rowsContainer.className = 'challenge-rows';
    
    // Create 2 rows of 4 buttons each
    for (let row = 0; row < 2; row++) {
        const buttonRow = document.createElement('div');
        buttonRow.className = 'challenge-row';
        
        for (let col = 0; col < 4; col++) {
            const challengeIndex = row * 4 + col;
            if (challengeIndex < challenges.length) {
                const button = document.createElement('button');
                button.className = 'challenge-button';
                
                // Add locked/unlocked status
                if (!unlockedChallenges.has(challengeIndex)) {
                    button.classList.add('locked');
                    button.innerHTML = `<span class="lock-icon">🔒</span><br>Challenge ${challengeIndex + 1}`;
                } else {
                    if (completedChallenges.has(challengeIndex)) {
                        button.classList.add('completed');
                    }
                    button.innerHTML = `Challenge ${challengeIndex + 1}`;
                }
                
                button.addEventListener('click', () => {
                    // Only allow clicking if challenge is unlocked
                    if (unlockedChallenges.has(challengeIndex)) {
                        document.querySelectorAll('.challenge-button').forEach(btn => 
                            btn.classList.remove('active'));
                        button.classList.add('active');
                        loadChallenge(challengeIndex);
                    } else {
                        showGameMessage(
                            "Challenge Locked!", 
                            "Complete the previous challenge to unlock this one.", 
                            "warning"
                        );
                    }
                });
                buttonRow.appendChild(button);
            }
        }
        rowsContainer.appendChild(buttonRow);
    }
    
    container.appendChild(rowsContainer);
    const controls = document.getElementById('controls');
    controls.parentElement.insertBefore(container, controls);
}

function loadChallenge(index) {
    vertices = [];
    edges = [];
    
    // Copy vertices from challenge
    challenges[index].vertices.forEach(v => {
        vertices.push({
            x: v.x,
            y: v.y,
            color: null,
            adjacentVertices: []
        });
    });
    
    // Copy edges and build adjacency lists
    challenges[index].edges.forEach(([from, to]) => {
        edges.push([from, to]);
        vertices[from].adjacentVertices.push(to);
        vertices[to].adjacentVertices.push(from);
    });
    
    // Center the graph
    centerGraph();
    
    drawGraph();
    updateColorCount();
}

function centerGraph() {
    if (vertices.length === 0) return;
    
    // Find current bounds
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    vertices.forEach(v => {
        minX = Math.min(minX, v.x);
        maxX = Math.max(maxX, v.x);
        minY = Math.min(minY, v.y);
        maxY = Math.max(maxY, v.y);
    });
    
    // Calculate center offset
    const graphWidth = maxX - minX;
    const graphHeight = maxY - minY;
    const offsetX = (canvas.width - graphWidth) / 2 - minX;
    const offsetY = (canvas.height - graphHeight) / 2 - minY;
    
    // Apply offset to all vertices
    vertices.forEach(v => {
        v.x += offsetX;
        v.y += offsetY;
    });
}

function updateControlsVisibility(mode) {
    currentMode = mode;
    
    const numVerticesControl = document.querySelector('.control-group');
    const resetButton = document.getElementById('resetButton');
    const resetColorsButton = document.createElement('button');
    resetColorsButton.id = 'resetColorsButton';
    resetColorsButton.innerHTML = 'Reset Colors';
    resetColorsButton.className = 'control-button';
    
    // Remove any existing reset colors button
    const existingResetColors = document.getElementById('resetColorsButton');
    if (existingResetColors) {
        existingResetColors.remove();
    }
    
    // Add reset colors functionality
    resetColorsButton.addEventListener('click', () => {
        vertices.forEach(vertex => vertex.color = null);
        drawGraph();
        updateColorCount();
    });
    
    // Hide all controls first
    if (numVerticesControl) {
        numVerticesControl.style.display = 'none';
    }
    if (resetButton) {
        resetButton.style.display = 'none';
    }
    
    // Remove any existing challenge/sketch containers
    const existingContainer = document.getElementById('challenge-container');
    if (existingContainer) {
        existingContainer.remove();
    }

    // Add reset colors button to controls
    const controls = document.getElementById('controls');
    controls.appendChild(resetColorsButton);

    switch(mode) {
        case 'random':
            if (numVerticesControl) {
                numVerticesControl.style.display = 'block';
            }
            generateRandomGraph(parseInt(numVerticesInput.value, 10));
            break;
            
        case 'challenge':
            showChallengeButtons();
            break;
            
        case 'sketch':
            vertices = [];
            edges = [];
            showSketchControls();
            break;
    }

    drawGraph();
    updateColorCount();
}

// Event listener for number of vertices input
numVerticesInput.addEventListener('input', () => {
    const numVertices = parseInt(numVerticesInput.value, 10);
    generateRandomGraph(numVertices);
});

// Color palette setup
colors.forEach(color => {
    const colorButton = document.createElement('div');
    colorButton.className = 'color-option';
    colorButton.style.backgroundColor = color;
    colorButton.addEventListener('click', () => {
        document.querySelectorAll('.color-option').forEach(btn => 
            btn.classList.remove('selected'));
        colorButton.classList.add('selected');
        selectedColor = color;
    });
    colorPalette.appendChild(colorButton);
});

function handleColoringClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const clickedVertex = vertices.findIndex(vertex => {
        const dx = vertex.x - x;
        const dy = vertex.y - y;
        return Math.sqrt(dx * dx + dy * dy) < 15;
    });

    if (clickedVertex !== -1 && selectedColor) {
        if (isValidColor(clickedVertex, selectedColor)) {
            vertices[clickedVertex].color = selectedColor;
            drawGraph();
            updateColorCount();

            if (checkGraphColoring()) {
                const usedColors = new Set(vertices.map(v => v.color)).size;
                const minColors = greedyColoring();
                
                if (currentMode === 'challenge') {
                    const currentChallengeIndex = parseInt(document.querySelector('.challenge-button.active').innerHTML.split(' ')[1]) - 1;
                    
                    // Add to completed challenges and unlock next
                    if (usedColors <= minColors) {
                        completedChallenges.add(currentChallengeIndex);
                        if (currentChallengeIndex + 1 < challenges.length) {
                            unlockedChallenges.add(currentChallengeIndex + 1);
                            saveProgress();
                            const container = document.getElementById('challenge-container');
                            if (container) {
                                container.remove();
                                showChallengeButtons();
                            }
                        }
                    }
                }
                
                if (usedColors < minColors) {
                    showSpecialCelebration();
                    showGameMessage(
                        " EXTRAORDINARY! 🌟",
                        `You beat the algorithm! Only ${usedColors} colors used!`,
                        'exceptional'
                    );
                } else if (usedColors === minColors) {
                    showGameMessage(
                        "🎉 Perfect Solution!",
                        'perfect'
                    );
                } else {
                    showGameMessage(
                        "Can you do better?",
                        `Used ${usedColors} colors - This graph can be colored with ${minColors} colors!`,
                        'success'
                    );
                }
            }
        } else {
            showGameMessage("Invalid move! Adjacent vertices cannot have the same color.", "error");
        }
    }
}

canvas.addEventListener('click', (event) => {
    if (currentMode !== 'sketch') {
        handleColoringClick(event);
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const activeButton = document.querySelector('.challenge-button.active');
    if (!activeButton) return;
    
    if (activeButton.innerHTML === 'Play') {
        handleColoringClick(event);
        return;
    }

    if (activeButton.innerHTML === 'Vertices') {
        // Vertex creation
        const tooClose = vertices.some(vertex => {
            const dx = vertex.x - x;
            const dy = vertex.y - y;
            return Math.sqrt(dx * dx + dy * dy) < 40;
        });

        if (!tooClose) {
            vertices.push({
                x: x,
                y: y,
                color: null,
                adjacentVertices: []
            });
            drawGraph();
        }
    } else if (activeButton.innerHTML === 'Edges') {
        // Edge creation
        const clickedVertex = vertices.findIndex(vertex => {
            const dx = vertex.x - x;
            const dy = vertex.y - y;
            return Math.sqrt(dx * dx + dy * dy) < 15;
        });

        if (clickedVertex !== -1) {
            if (selectedVertex === null) {
                selectedVertex = clickedVertex;
                drawGraph();
                ctx.beginPath();
                ctx.arc(vertices[selectedVertex].x, vertices[selectedVertex].y, 18, 0, 2 * Math.PI);
                ctx.strokeStyle = '#2196F3';
                ctx.lineWidth = 3;
                ctx.stroke();
            } else {
                if (selectedVertex !== clickedVertex) {
                    edges.push([selectedVertex, clickedVertex]);
                    vertices[selectedVertex].adjacentVertices.push(clickedVertex);
                    vertices[clickedVertex].adjacentVertices.push(selectedVertex);
                }
                selectedVertex = null;
                drawGraph();
            }
        }
    } else if (activeButton.innerHTML === 'Delete') {
        // Delete functionality
        const clickedVertex = vertices.findIndex(vertex => {
            const dx = vertex.x - x;
            const dy = vertex.y - y;
            return Math.sqrt(dx * dx + dy * dy) < 15;
        });

        if (clickedVertex !== -1) {
            // Remove all edges connected to this vertex
            edges = edges.filter(([v1, v2]) => 
                v1 !== clickedVertex && v2 !== clickedVertex);
            
            // Update adjacency lists
            vertices.forEach(vertex => {
                vertex.adjacentVertices = vertex.adjacentVertices.filter(v => 
                    v !== clickedVertex);
                vertex.adjacentVertices = vertex.adjacentVertices.map(v => 
                    v > clickedVertex ? v - 1 : v);
            });
            
            vertices.splice(clickedVertex, 1);
            edges = edges.map(([v1, v2]) => [
                v1 > clickedVertex ? v1 - 1 : v1,
                v2 > clickedVertex ? v2 - 1 : v2
            ]);
            
            drawGraph();
            return;
        }

        // Edge deletion
        const clickedEdge = edges.findIndex(([v1, v2]) => {
            const x1 = vertices[v1].x;
            const y1 = vertices[v1].y;
            const x2 = vertices[v2].x;
            const y2 = vertices[v2].y;
            
            const A = x - x1;
            const B = y - y1;
            const C = x2 - x1;
            const D = y2 - y1;
            
            const dot = A * C + B * D;
            const len_sq = C * C + D * D;
            
            let param = -1;
            if (len_sq !== 0) param = dot / len_sq;
            
            let xx, yy;
            
            if (param < 0) {
                xx = x1;
                yy = y1;
            } else if (param > 1) {
                xx = x2;
                yy = y2;
            } else {
                xx = x1 + param * C;
                yy = y1 + param * D;
            }
            
            const dx = x - xx;
            const dy = y - yy;
            return Math.sqrt(dx * dx + dy * dy) < 10;
        });

        if (clickedEdge !== -1) {
            const [v1, v2] = edges[clickedEdge];
            edges.splice(clickedEdge, 1);
            vertices[v1].adjacentVertices = vertices[v1].adjacentVertices.filter(v => v !== v2);
            vertices[v2].adjacentVertices = vertices[v2].adjacentVertices.filter(v => v !== v1);
            drawGraph();
        }
    } else if (activeButton.innerHTML === 'Play') {
        handleColoringClick(event);
    }
});

// Add preview line while creating edge
canvas.addEventListener('mousemove', (event) => {
    if (currentMode === 'sketch' && selectedVertex !== null) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        drawGraph();
        // Draw preview line
        ctx.beginPath();
        ctx.moveTo(vertices[selectedVertex].x, vertices[selectedVertex].y);
        ctx.lineTo(x, y);
        ctx.strokeStyle = '#2196F3';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Keep selected vertex highlighted
        ctx.beginPath();
        ctx.arc(vertices[selectedVertex].x, vertices[selectedVertex].y, 18, 0, 2 * Math.PI);
        ctx.strokeStyle = '#2196F3';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
});

function handleSketchModeClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Get active mode from buttons
    const activeButton = document.querySelector('.challenge-button.active');
    if (!activeButton) return;
    
    sketchState = activeButton.innerHTML.toLowerCase();
    
    if (sketchState === 'vertices') {
        // Check if click is too close to existing vertices
        const tooClose = vertices.some(vertex => {
            const dx = vertex.x - x;
            const dy = vertex.y - y;
            return Math.sqrt(dx * dx + dy * dy) < 40; // Minimum 40px between vertices
        });

        // Check if click is within canvas bounds with padding
        const padding = 20;
        const withinBounds = x >= padding && 
                            x <= canvas.width - padding && 
                            y >= padding && 
                            y <= canvas.height - padding;

        if (!tooClose && withinBounds) {
            vertices.push({
                x: x,
                y: y,
                color: null,
                adjacentVertices: []
            });
            drawGraph();
        }
    }
}

// New helper functions
function findClickedVertex(x, y) {
    return vertices.findIndex(vertex => {
        const dx = vertex.x - x;
        const dy = vertex.y - y;
        return Math.sqrt(dx * dx + dy * dy) < 15;
    });
}

function handleVertexColoring(vertexIndex) {
    if (!isValidColor(vertexIndex, selectedColor)) {
        showGameMessage("Invalid move! Adjacent vertices cannot have the same color.", "error");
        return;
    }

    vertices[vertexIndex].color = selectedColor;
    drawGraph();
    updateColorCount();

    if (checkGraphColoring()) {
        const usedColors = new Set(vertices.map(v => v.color)).size;
        const minColors = greedyColoring();
        
        showGameMessage(
            usedColors === minColors ? "🎉 Perfect Solution!" : "⭐ Graph Colored!",
            usedColors === minColors ? 
                `Minimum ${usedColors} colors used` : 
                `Used ${usedColors} colors - Try with ${minColors}?`,
            usedColors === minColors ? 'perfect' : 'success'
        );
    }
}

function isValidColor(vertexIndex, color) {
    const vertex = vertices[vertexIndex];
    return !vertex.adjacentVertices.some(adjIndex => 
        vertices[adjIndex].color === color);
}

function updateColorCount() {
    const usedColors = new Set(vertices.map(v => v.color).filter(Boolean));
    document.getElementById('colorCount').textContent = usedColors.size;
}

// Initial graph generation
generateRandomGraph(parseInt(numVerticesInput.value, 10));

// Add this event listener for the How to Play button
document.getElementById('howToPlayBtn').addEventListener('click', function() {
    const howToPlay = document.getElementById('howToPlay');
    if (howToPlay.classList.contains('hidden')) {
        howToPlay.classList.remove('hidden');
        this.textContent = 'Hide Instructions';
    } else {
        howToPlay.classList.add('hidden');
        this.textContent = 'How to Play';
    }
});

// Add these functions to your code

function checkGraphColoring() {
    const allVerticesColored = vertices.every(vertex => vertex.color !== null);
    const noAdjacentSameColor = edges.every(([v1, v2]) => 
        vertices[v1].color !== vertices[v2].color
    );
    return allVerticesColored && noAdjacentSameColor;
}

function greedyColoring() {
    const tempVertices = vertices.map(v => ({...v}));
    const availableColors = new Array(vertices.length).fill(true);
    let minColors = 0;

    // Clear all colors
    tempVertices.forEach(v => v.color = null);

    // For each vertex
    for (let i = 0; i < tempVertices.length; i++) {
        // Reset available colors
        availableColors.fill(true);

        // Mark colors of adjacent vertices as unavailable
        tempVertices[i].adjacentVertices.forEach(adj => {
            if (tempVertices[adj].color !== null) {
                availableColors[colors.indexOf(tempVertices[adj].color)] = false;
            }
        });

        // Find the first available color
        let colorIndex = 0;
        while (colorIndex < colors.length && !availableColors[colorIndex]) {
            colorIndex++;
        }
        tempVertices[i].color = colors[colorIndex];
        minColors = Math.max(minColors, colorIndex + 1);
    }

    return minColors;
}

// Add this function for nice notifications
function showNotification(message, type = 'success') {
    // Create or get the message container that sits above the graph
    let messageContainer = document.getElementById('game-message-container');
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.id = 'game-message-container';
        const canvas = document.getElementById('gameCanvas');
        canvas.parentElement.insertBefore(messageContainer, canvas);
    }

    const notification = document.createElement('div');
    notification.className = `game-message ${type}`;
    
    // Create message content with icon
    notification.innerHTML = `
        <div class="message-content">
            <div class="message-icon">${type === 'success' ? '🌟' : '⚠️'}</div>
            <div class="message-text">${message}</div>
        </div>
    `;
    
    // Remove any existing notifications
    messageContainer.innerHTML = '';
    messageContainer.appendChild(notification);
    
    // Add CSS animation
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (messageContainer.contains(notification)) {
                messageContainer.removeChild(notification);
            }
        }, 0);
    }, 50000); // Increased to 5000ms (5 seconds)
}

// Comment out or remove the function definition
/*
function showGameMessage(title, message, type) {
    // This function is currently disabled
}
*/

// Add these console logs to help debug
resetButton.addEventListener('click', () => {
    switch(currentMode) {
        case 'random':
            generateRandomGraph(parseInt(numVerticesInput.value, 10));
            break;
            
        case 'challenge':
            const activeButton = document.querySelector('.challenge-button.active');
            if (activeButton) {
                const challengeIndex = parseInt(activeButton.textContent.split(' ')[1]) - 1;
                loadChallenge(challengeIndex);
            }
            break;
            
        case 'sketch':
            vertices = [];
            edges = [];
            break;
    }
    drawGraph();
    updateColorCount();
});

function showSketchControls() {
    const container = document.createElement('div');
    container.id = 'challenge-container';
    
    const rowsContainer = document.createElement('div');
    rowsContainer.className = 'challenge-rows';
    
    const buttonRow = document.createElement('div');
    buttonRow.className = 'challenge-row';
    
    // Vertices button
    const verticesBtn = document.createElement('button');
    verticesBtn.className = 'challenge-button';
    verticesBtn.innerHTML = 'Vertices';
    
    // Edges button
    const edgesBtn = document.createElement('button');
    edgesBtn.className = 'challenge-button';
    edgesBtn.innerHTML = 'Edges';
    
    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'challenge-button';
    deleteBtn.innerHTML = 'Delete';
    
    // Play button
    const playBtn = document.createElement('button');
    playBtn.className = 'challenge-button';
    playBtn.innerHTML = 'Play';
    
    // Add new Save button
    const saveBtn = document.createElement('button');
    saveBtn.className = 'challenge-button';
    saveBtn.innerHTML = 'Save 💾';
    saveBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'graph.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
    
    // Keep existing event listeners
    verticesBtn.addEventListener('click', () => {
        document.querySelectorAll('.challenge-button').forEach(btn => 
            btn.classList.remove('active'));
        verticesBtn.classList.add('active');
        selectedVertex = null;
        sketchState = 'vertices';
    });
    
    edgesBtn.addEventListener('click', () => {
        document.querySelectorAll('.challenge-button').forEach(btn => 
            btn.classList.remove('active'));
        edgesBtn.classList.add('active');
        selectedVertex = null;
        sketchState = 'edges';
    });
    
    deleteBtn.addEventListener('click', () => {
        document.querySelectorAll('.challenge-button').forEach(btn => 
            btn.classList.remove('active'));
        deleteBtn.classList.add('active');
        selectedVertex = null;
        sketchState = 'delete';
    });
    
    playBtn.addEventListener('click', () => {
        document.querySelectorAll('.challenge-button').forEach(btn => 
            btn.classList.remove('active'));
        playBtn.classList.add('active');
        selectedVertex = null;
        canvas.style.cursor = 'pointer';
    });
    
    buttonRow.appendChild(verticesBtn);
    buttonRow.appendChild(edgesBtn);
    buttonRow.appendChild(deleteBtn);
    buttonRow.appendChild(playBtn);
    buttonRow.appendChild(saveBtn);  // Add save button to row
    
    rowsContainer.appendChild(buttonRow);
    container.appendChild(rowsContainer);
    
    const controls = document.getElementById('controls');
    controls.parentElement.insertBefore(container, controls);
    
    verticesBtn.click();
}

// Add this function for the special celebration
function showSpecialCelebration() {
    // Create celebration overlay
    const overlay = document.createElement('div');
    overlay.className = 'celebration-overlay';
    document.body.appendChild(overlay);

    // Add confetti effect
    for (let i = 0; i < 150; i++) {
        createConfetti(overlay);
    }

    // Remove overlay after animation
    setTimeout(() => {
        overlay.classList.add('fade-out');
        setTimeout(() => overlay.remove(), 1000);
    }, 3000);
}

function createConfetti(overlay) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.animationDelay = Math.random() * 3 + 's';
    confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 50%, 50%)`;
    overlay.appendChild(confetti);
}

console.log('Script ended');

function showGameMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `game-message ${type}`;
    
    // Special styling for EXTRAORDINARY message
    if (message.includes("EXTRAORDINARY")) {
        messageDiv.innerHTML = `
            <div class="message-content">
                <span class="message-text">✨ EXTRAORDINARY! You Beat The Greedy Algorithm! ✨</span>
            </div>
        `;
        
        messageDiv.style.cssText = `
            position: fixed;
            top: 400px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(45deg, #FF6B6B, #4ECDC4);
            color: white;
            padding: 15px 30px;
            border-radius: 12px;
            font-weight: 700;
            font-size: 1.3em;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            animation: popAndGlow 0.5s ease, shimmer 2s infinite;
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 300px;
            text-align: center;
            justify-content: center;
            letter-spacing: 2px;
            border: 2px solid rgba(255,255,255,0.3);
        `;
        
        // Add special animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes popAndGlow {
                0% { 
                    transform: translate(-50%, -20px) scale(0.8);
                    opacity: 0;
                }
                50% {
                    transform: translate(-50%, 0) scale(1.1);
                }
                100% { 
                    transform: translate(-50%, 0) scale(1);
                    opacity: 1;
                }
            }
            
            @keyframes shimmer {
                0% { background-position: 100% 0; }
                100% { background-position: -100% 0; }
            }
            
            .message-text {
                animation: pulse 1.5s infinite;
            }
            
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
    } else {
        // Define styles for different message types
        const styles = {
            error: {
                icon: '⚠️',
                background: '#ff5252',
                shadow: 'rgba(255, 82, 82, 0.2)'
            },
            success: {
                icon: '🎉',
                background: '#4caf50',
                shadow: 'rgba(76, 175, 80, 0.2)'
            },
            perfect: {
                icon: '🌟',
                background: '#2196F3',
                shadow: 'rgba(33, 150, 243, 0.2)'
            },
            info: {
                icon: 'ℹ️',
                background: '#607d8b',
                shadow: 'rgba(96, 125, 139, 0.2)'
            }
        };
        
        const style = styles[type] || styles.info;
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <span class="message-icon">${style.icon}</span>
                <span class="message-text">${message}</span>
            </div>
        `;
        
        messageDiv.style.cssText = `
            position: fixed;
            top: 400px;
            left: 50%;
            transform: translateX(-50%);
            background: ${style.background};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 500;
            box-shadow: 0 4px 12px ${style.shadow};
            z-index: 1000;
            animation: popIn 0.3s ease, fadeOut 0.5s ease 2s forwards;
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 300px;
            text-align: center;
            justify-content: center;
        `;
    }
    
    document.body.appendChild(messageDiv);
    setTimeout(() => messageDiv.remove(), 2500);
}

// Add these functions to save/load progress
function saveProgress() {
    localStorage.setItem('unlockedChallenges', JSON.stringify([...unlockedChallenges]));
    localStorage.setItem('completedChallenges', JSON.stringify([...completedChallenges]));
}

function loadProgress() {
    const savedUnlocked = localStorage.getItem('unlockedChallenges');
    const savedCompleted = localStorage.getItem('completedChallenges');
    
    if (savedUnlocked) {
        unlockedChallenges = new Set(JSON.parse(savedUnlocked));
    }
    if (savedCompleted) {
        completedChallenges = new Set(JSON.parse(savedCompleted));
    }
}

// Add this to your initialization code
loadProgress();

// Add icons to mode buttons
function createModeButtons() {
    const modes = [
        { value: 'random', text: 'Random', icon: '🎲' },
        { value: 'challenge', text: 'Challenge', icon: '🎯' },
        { value: 'sketch', text: 'Sketch', icon: '✏️' }
    ];

    modes.forEach(mode => {
        const button = document.createElement('button');
        button.className = 'mode-button';
        button.dataset.mode = mode.value;
        button.innerHTML = `
            <span class="mode-icon">${mode.icon}</span>
            <span>${mode.text}</span>
        `;
        button.addEventListener('click', () => {
            document.querySelectorAll('.mode-button').forEach(btn => 
                btn.classList.remove('active'));
            button.classList.add('active');
            updateControlsVisibility(mode.value);
        });
        modeButtonsContainer.appendChild(button);
    });
}



// Enhance color palette with color picker
function setupColorPalette() {
    const palette = document.getElementById('colorPalette');
    
    // Add existing colors
    colors.forEach(color => {
        const colorBtn = document.createElement('div');
        colorBtn.className = 'color-option';
        colorBtn.style.backgroundColor = color;
        colorBtn.addEventListener('click', () => selectColor(color));
        palette.appendChild(colorBtn);
    });
    
    // Add color picker button
    const addColorBtn = document.createElement('div');
    addColorBtn.className = 'add-color';
    addColorBtn.innerHTML = '+';
    addColorBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'color';
        input.addEventListener('change', (e) => {
            const newColor = e.target.value;
            colors.push(newColor);
            const colorBtn = document.createElement('div');
            colorBtn.className = 'color-option';
            colorBtn.style.backgroundColor = newColor;
            colorBtn.addEventListener('click', () => selectColor(newColor));
            palette.insertBefore(colorBtn, addColorBtn);
        });
        input.click();
    });
    palette.appendChild(addColorBtn);
}

// Helper function to select color
function selectColor(color) {
    selectedColor = color;
    document.querySelectorAll('.color-option').forEach(btn => {
        btn.classList.toggle('selected', btn.style.backgroundColor === color);
    });
}

function createChallengeButton(index) {
    const button = document.createElement('button');
    button.className = 'challenge-button';
    
    // Create difficulty indicator
    const difficultyBar = document.createElement('div');
    difficultyBar.className = 'difficulty-indicator';
    
    if (!unlockedChallenges.has(index)) {
        button.classList.add('locked');
        button.innerHTML = `
            <div class="lock-icon">🔒</div>
            <div class="challenge-number">Challenge ${index + 1}</div>
        `;
    } else {
        button.innerHTML = `
            <div class="challenge-number">Challenge ${index + 1}</div>
            <div class="challenge-desc">Graph ${index + 1}</div>
        `;
        
        if (completedChallenges.has(index)) {
            button.classList.add('completed');
        }
    }
    
    button.appendChild(difficultyBar);
    
    button.addEventListener('click', () => {
        if (!button.classList.contains('locked')) {
            document.querySelectorAll('.challenge-button').forEach(btn => 
                btn.classList.remove('active', 'just-selected'));
            button.classList.add('active', 'just-selected');
            loadChallenge(index);
            
            // Remove animation class after animation completes
            setTimeout(() => {
                button.classList.remove('just-selected');
            }, 300);
        }
    });
    
    return button;
}

// Add progress indicator
function updateProgressIndicator() {
    const totalChallenges = challenges.length;
    const completedCount = completedChallenges.size;
    
    const progressContainer = document.createElement('div');
    progressContainer.className = 'challenge-progress';
    progressContainer.innerHTML = `
        <div class="progress-bar">
            <div class="progress" style="width: ${(completedCount/totalChallenges) * 100}%"></div>
        </div>
        <div class="progress-text">${completedCount}/${totalChallenges} Completed</div>
    `;
    
    const container = document.getElementById('challenge-container');
    const existingProgress = container.querySelector('.challenge-progress');
    if (existingProgress) {
        existingProgress.remove();
    }
    container.prepend(progressContainer);
}

function updateProgress() {
    const totalChallenges = 8;
    const completedCount = completedChallenges.size;
    const progressPercent = (completedCount / totalChallenges) * 100;

    const progressContainer = document.createElement('div');
    progressContainer.className = 'progress-container';
    progressContainer.innerHTML = `
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${progressPercent}%"></div>
        </div>
        <div class="progress-text">${completedCount}/${totalChallenges} Challenges Completed</div>
    `;

    const container = document.getElementById('challenge-container');
    const existingProgress = container.querySelector('.progress-container');
    if (existingProgress) {
        existingProgress.remove();
    }
    container.insertBefore(progressContainer, container.firstChild);
}

// Call this function whenever a challenge is completed
function onChallengeComplete(challengeIndex) {
    completedChallenges.add(challengeIndex);
    updateProgress();
    saveProgress();
}

function createChallengeProgress() {
    const container = document.getElementById('challenge-container');
    const progressDiv = document.createElement('div');
    progressDiv.className = 'challenge-progress';
    
    for (let i = 0; i < 8; i++) {
        const step = document.createElement('div');
        step.className = 'challenge-step';
        
        if (!unlockedChallenges.has(i)) {
            step.classList.add('locked');
        }
        if (completedChallenges.has(i)) {
            step.classList.add('completed');
        }
        
        const number = document.createElement('span');
        number.className = 'number';
        number.textContent = i + 1;
        step.appendChild(number);
        
        step.addEventListener('click', () => {
            if (!step.classList.contains('locked')) {
                document.querySelectorAll('.challenge-step').forEach(s => 
                    s.classList.remove('active'));
                step.classList.add('active');
                loadChallenge(i);
            }
        });
        
        progressDiv.appendChild(step);
    }
    
    container.innerHTML = '';
    container.appendChild(progressDiv);
}

// Update progress when challenge is completed
function onChallengeComplete(index) {
    const steps = document.querySelectorAll('.challenge-step');
    steps[index].classList.add('completed');
    
    // Unlock next challenge if available
    if (index + 1 < 8) {
        steps[index + 1].classList.remove('locked');
    }
}

function createColorPalette() {
    const colors = [
        '#f44336',  // red
        '#2196F3',  // blue
        '#4CAF50',  // green
        '#FFC107',  // yellow
        '#1a237e',  // dark blue
        '#9C27B0',  // purple
        '#FF9800',  // orange
        '#795548'   // brown
    ];
    
    const palette = document.getElementById('colorPalette');
    
    if (!palette) {
        console.error('Color palette container not found!');
        return;
    }
    
    // Clear existing buttons if any
    palette.innerHTML = '';
    
    colors.forEach(color => {
        const button = document.createElement('button');
        button.className = 'color-button';
        button.style.backgroundColor = color;
        button.dataset.color = color;
        
        button.addEventListener('click', () => {
            document.querySelectorAll('.color-button').forEach(btn => 
                btn.classList.remove('selected'));
            button.classList.add('selected');
            currentColor = color;
        });
        
        palette.appendChild(button);
    });
    
    // Select first color by default
    if (palette.firstChild) {
        palette.firstChild.click();
    }
}

// Add How to Play button
function addHowToPlayButton() {
    const howToPlayBtn = document.createElement('button');
    howToPlayBtn.className = 'how-to-play-btn';
    howToPlayBtn.innerHTML = '❓ How to Play';
    
    howToPlayBtn.addEventListener('click', showHowToPlay);
    
    // Add it to your header or controls area
    const container = document.getElementById('controls'); // or wherever you want to place it
    container.appendChild(howToPlayBtn);
}

// Show How to Play modal
function showHowToPlay() {
    const modal = document.createElement('div');
    modal.className = 'how-to-play-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>🎮 How to Play</h2>
            
            <div class="instructions">
                <h3>🎯 Objective</h3>
                <p>Find the chromatic number of the graph - the minimum number of colors needed to color all vertices so that no adjacent vertices share the same color.</p>
                
                <h3>🧮 About Chromatic Numbers</h3>
                <ul>
                    <li>Every graph has a chromatic number (χ)</li>
                    <li>The challenge is finding the smallest possible number of colors</li>
                    <li>The computer uses a greedy algorithm which might not always find the optimal solution</li>
                    <li>You might be able to find a better solution than the computer!</li>
                </ul>

                <h3>📝 Basic Rules</h3>
                <ul>
                    <li>🎨 Select a color from the palette below the graph</li>
                    <li>🔵 Click on a vertex to color it</li>
                    <li>⚠️ Adjacent vertices cannot have the same color</li>
                    <li>🎯 Try to color the entire graph using as few colors as possible</li>
                    <li>🔄 Use the "Reset" button to start over</li>
                </ul>

                <h3>🌟 Game Modes</h3>
                <ul>
                    <li>🎲 <strong>Random Mode:</strong> Generate and solve random graphs</li>
                    <li>🎯 <strong>Challenge Mode:</strong> Try predefined graph puzzles</li>
                    <li>✏️ <strong>Sketch Mode:</strong> Create and solve your own graphs</li>
                </ul>
            </div>
            <button class="close-modal">Got it!</button>
        </div>
    `;
    
    // Add modal styles
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;

    // Add content styles
    const modalContent = modal.querySelector('.modal-content');
    modalContent.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 12px;
        max-width: 500px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    `;

    // Style the close button
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.style.cssText = `
        padding: 8px 20px;
        background: #2196F3;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        margin-top: 20px;
        transition: all 0.3s ease;
    `;

    // Add hover effect to close button
    closeBtn.onmouseover = () => closeBtn.style.background = '#1976D2';
    closeBtn.onmouseout = () => closeBtn.style.background = '#2196F3';
    
    document.body.appendChild(modal);
    
    // Close modal when clicking close button or outside
    closeBtn.onclick = () => modal.remove();
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };

    // Add specific style for the note section
    const noteSection = modal.querySelector('.note-section');
    noteSection.style.cssText = `
        margin-top: 20px;
        padding: 15px;
        background: #f8f9fa;
        border-left: 4px solid #2196F3;
        border-radius: 4px;
    `;
}