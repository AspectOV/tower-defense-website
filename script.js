// Tower Defense Game - Main JavaScript File

// ==================== Game State & Variables ====================
let gameState = "menu"; // menu, howToPlay, playing, gameOver, victory
let canvas, ctx;
let gameLoop;
let money = 100;
let lives = 10;
let wave = 1;
let maxWaves = 10;
let waveInProgress = false;
let enemiesLeft = 0;
let enemiesDefeated = 0;
let gameMap = [];
let towers = [];
let enemies = [];
let projectiles = [];
let selectedTower = null;
let selectedTowerOption = null;
let mapPath = [];
let tileSize = 30; // Size of each tile in pixels
let mouseX = 0;
let mouseY = 0;

// ==================== Initialization ====================
document.addEventListener("DOMContentLoaded", function() {
    // Initialize canvas
    canvas = document.getElementById("game-canvas");
    ctx = canvas.getContext("2d");
    resizeCanvas();

    // Event listeners
    document.getElementById("start-game").addEventListener("click", startGame);
    document.getElementById("how-to-play").addEventListener("click", showHowToPlay);
    document.getElementById("back-to-menu").addEventListener("click", showMainMenu);
    document.getElementById("back-to-main").addEventListener("click", confirmBackToMenu);
    document.getElementById("start-wave").addEventListener("click", startWave);
    document.getElementById("retry-game").addEventListener("click", restartGame);
    document.getElementById("game-over-menu").addEventListener("click", showMainMenu);
    document.getElementById("victory-menu").addEventListener("click", showMainMenu);
    
    // Tower selection
    const towerOptions = document.querySelectorAll(".tower-option");
    towerOptions.forEach(option => {
        option.addEventListener("click", () => {
            selectTowerOption(option);
        });
    });
    
    // Tower upgrade panel
    document.getElementById("damage-upgrade").addEventListener("click", upgradeTowerDamage);
    document.getElementById("range-upgrade").addEventListener("click", upgradeTowerRange);
    document.getElementById("speed-upgrade").addEventListener("click", upgradeTowerSpeed);
    document.getElementById("sell-tower").addEventListener("click", sellTower);
    document.getElementById("close-upgrade").addEventListener("click", closeUpgradePanel);
    
    // Canvas event listeners
    canvas.addEventListener("click", handleCanvasClick);
    canvas.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    });
    
    // Window resize
    window.addEventListener("resize", resizeCanvas);
    
    // Show main menu
    showMainMenu();
});

function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    // Recalculate tileSize based on new canvas dimensions
    if (gameState === "playing") {
        tileSize = Math.min(canvas.width / gameMap[0].length, canvas.height / gameMap.length);
        drawMap();
    }
}

// ==================== Menu Functions ====================
function showMainMenu() {
    gameState = "menu";
    clearInterval(gameLoop);
    
    document.querySelectorAll(".screen").forEach(screen => {
        screen.classList.add("hidden");
    });
    document.getElementById("main-menu").classList.remove("hidden");
}

function showHowToPlay() {
    gameState = "howToPlay";
    
    document.querySelectorAll(".screen").forEach(screen => {
        screen.classList.add("hidden");
    });
    document.getElementById("how-to-play-screen").classList.remove("hidden");
}

function confirmBackToMenu() {
    if (waveInProgress) {
        if (confirm("Are you sure? Current wave progress will be lost.")) {
            showMainMenu();
        }
    } else {
        showMainMenu();
    }
}

// ==================== Game Initialization ====================
function startGame() {
    gameState = "playing";
    clearInterval(gameLoop);
    
    // Reset game variables
    money = 100;
    lives = 10;
    wave = 1;
    waveInProgress = false;
    enemiesLeft = 0;
    enemiesDefeated = 0;
    towers = [];
    enemies = [];
    projectiles = [];
    selectedTower = null;
    selectedTowerOption = null;
    
    // Create game map
    createMap();
    
    // Show game screen
    document.querySelectorAll(".screen").forEach(screen => {
        screen.classList.add("hidden");
    });
    document.getElementById("game-screen").classList.remove("hidden");
    
    // Update UI
    updateGameStats();
    
    // Start game loop
    gameLoop = setInterval(update, 16); // ~60fps
}

function restartGame() {
    startGame();
}

// ==================== Map Generation ====================
function createMap() {
    // 0 = path, 1 = buildable area
    gameMap = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ];
    
    // Calculate tileSize
    tileSize = Math.min(canvas.width / gameMap[0].length, canvas.height / gameMap.length);
    
    // Generate path waypoints
    generatePath();
    
    // Draw initial map
    drawMap();
}

function generatePath() {
    mapPath = [];
    
    // Find the starting point (first 0 in the second row)
    let startCol = gameMap[2].indexOf(0);
    mapPath.push({x: startCol * tileSize + tileSize/2, y: 2 * tileSize + tileSize/2});
    
    // Trace through the map to find the path
    let currentRow = 2;
    let currentCol = startCol;
    let direction = "right"; // start direction
    
    // For simple fixed map, we'll manually define the path for this prototype
    // In a full game, you'd want to dynamically trace the path through the map
    mapPath = [
        {x: 1 * tileSize + tileSize/2, y: 2 * tileSize + tileSize/2},
        {x: 13 * tileSize + tileSize/2, y: 2 * tileSize + tileSize/2},
        {x: 13 * tileSize + tileSize/2, y: 5 * tileSize + tileSize/2},
        {x: 5 * tileSize + tileSize/2, y: 5 * tileSize + tileSize/2},
        {x: 5 * tileSize + tileSize/2, y: 8 * tileSize + tileSize/2},
        {x: 1 * tileSize + tileSize/2, y: 8 * tileSize + tileSize/2}
    ];
}

function drawMap() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw map tiles
    for (let row = 0; row < gameMap.length; row++) {
        for (let col = 0; col < gameMap[row].length; col++) {
            let x = col * tileSize;
            let y = row * tileSize;
            
            if (gameMap[row][col] === 0) {
                // Path
                ctx.fillStyle = "#5a4d41";
                ctx.fillRect(x, y, tileSize, tileSize);
                
                // Path border
                ctx.strokeStyle = "#4a3d31";
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, tileSize, tileSize);
            } else {
                // Buildable area
                ctx.fillStyle = "#3e885b";
                ctx.fillRect(x, y, tileSize, tileSize);
                
                // Grid lines
                ctx.strokeStyle = "#347a4d";
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, tileSize, tileSize);
            }
        }
    }
    
    // Draw towers preview (when selecting tower placement)
    if (selectedTowerOption && isValidPlacement(mouseX, mouseY)) {
        const tileX = Math.floor(mouseX / tileSize);
        const tileY = Math.floor(mouseY / tileSize);
        const centerX = tileX * tileSize + tileSize/2;
        const centerY = tileY * tileSize + tileSize/2;
        
        // Tower circle
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
        ctx.fillStyle = getTowerColor(selectedTowerOption.dataset.type);
        ctx.fill();
        
        // Tower range
        const range = getTowerRange(selectedTowerOption.dataset.type);
        ctx.beginPath();
        ctx.arc(centerX, centerY, range, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
    
    // Draw existing towers
    towers.forEach(tower => {
        // Tower base
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, 15, 0, Math.PI * 2);
        ctx.fillStyle = getTowerColor(tower.type);
        ctx.fill();
        
        // Tower turret
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = "#333";
        ctx.fill();
        
        // Tower level indicator (small dots)
        for (let i = 0; i < tower.level; i++) {
            ctx.beginPath();
            ctx.arc(tower.x + 10 - i * 5, tower.y - 12, 2, 0, Math.PI * 2);
            ctx.fillStyle = "#fff";
            ctx.fill();
        }
        
        // Draw range circle for selected tower
        if (selectedTower === tower) {
            ctx.beginPath();
            ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
            ctx.fill();
            ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Selection indicator
            ctx.beginPath();
            ctx.arc(tower.x, tower.y, 18, 0, Math.PI * 2);
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });
    
    // Draw enemies
    enemies.forEach(enemy => {
        // Enemy circle
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
        ctx.fillStyle = enemy.color;
        ctx.fill();
        
        // Health bar background
        ctx.fillStyle = "#333";
        ctx.fillRect(enemy.x - enemy.size, enemy.y - enemy.size - 6, enemy.size * 2, 4);
        
        // Health bar
        const healthPercent = enemy.health / enemy.maxHealth;
        ctx.fillStyle = healthPercent > 0.5 ? "#4ecca3" : healthPercent > 0.25 ? "#ffce54" : "#ff6b6b";
        ctx.fillRect(enemy.x - enemy.size, enemy.y - enemy.size - 6, enemy.size * 2 * healthPercent, 4);
    });
    
    // Draw projectiles
    projectiles.forEach(projectile => {
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, projectile.size, 0, Math.PI * 2);
        ctx.fillStyle = projectile.color;
        ctx.fill();
    });
}

// ==================== Game Logic ====================
function update() {
    if (gameState !== "playing") return;
    
    // Update towers
    towers.forEach(tower => {
        tower.cooldown -= 1;
        
        // Find target if tower doesn't have one or target is dead
        if (!tower.target || tower.target.isDead) {
            tower.target = findClosestEnemy(tower);
        }
        
        // Check if target is out of range
        if (tower.target && getDistance(tower.x, tower.y, tower.target.x, tower.target.y) > tower.range) {
            tower.target = null;
        }
        
        // Fire at target
        if (tower.target && tower.cooldown <= 0) {
            let projectile = {
                x: tower.x,
                y: tower.y,
                targetX: tower.target.x,
                targetY: tower.target.y,
                target: tower.target,
                speed: 7,
                damage: tower.damage,
                size: tower.type === "splash" ? 5 : 3,
                color: tower.type === "basic" ? "#4fc1e9" : tower.type === "sniper" ? "#ffce54" : "#ac92ec",
                splashRadius: tower.type === "splash" ? 50 : 0
            };
            projectiles.push(projectile);
            tower.cooldown = tower.fireRate;
        }
    });
    
    // Update enemies
    enemies.forEach(enemy => {
        if (enemy.isDead) return;
        
        // Move enemy along path
        if (enemy.pathIndex < mapPath.length) {
            let targetPoint = mapPath[enemy.pathIndex];
            let dx = targetPoint.x - enemy.x;
            let dy = targetPoint.y - enemy.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < enemy.speed) {
                // Reached waypoint, move to next
                enemy.x = targetPoint.x;
                enemy.y = targetPoint.y;
                enemy.pathIndex++;
            } else {
                // Move towards waypoint
                enemy.x += (dx / distance) * enemy.speed;
                enemy.y += (dy / distance) * enemy.speed;
            }
        } else {
            // Reached end of path
            enemy.isDead = true;
            lives -= enemy.damage;
            updateGameStats();
            
            if (lives <= 0) {
                gameOver();
            }
        }
    });
    
    // Update projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let projectile = projectiles[i];
        
        // Move projectile towards target
        let dx = projectile.targetX - projectile.x;
        let dy = projectile.targetY - projectile.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        
// Update projectiles
for (let i = projectiles.length - 1; i >= 0; i--) {
    let projectile = projectiles[i];
    
    // Move projectile towards target
    let dx = projectile.targetX - projectile.x;
    let dy = projectile.targetY - projectile.y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < projectile.speed || projectile.target.isDead) {
        // Hit target or target is dead
        if (!projectile.target.isDead) {
            if (projectile.splashRadius > 0) {
                // Splash damage to enemies in radius
                enemies.forEach(enemy => {
                    if (!enemy.isDead) {
                        let splashDist = getDistance(projectile.targetX, projectile.targetY, enemy.x, enemy.y);
                        if (splashDist <= projectile.splashRadius) {
                            // Calculate damage based on distance
                            let damageMultiplier = 1 - (splashDist / projectile.splashRadius);
                            let damage = projectile.damage * damageMultiplier;
                            enemy.health -= damage;
                            checkEnemyDeath(enemy);
                        }
                    }
                });
            } else {
                // Direct damage to target
                projectile.target.health -= projectile.damage;
                checkEnemyDeath(projectile.target);
            }
        }
        projectiles.splice(i, 1);
    } else {
        // Move projectile
        projectile.x += (dx / distance) * projectile.speed;
        projectile.y += (dy / distance) * projectile.speed;
    }
}

function getDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function checkEnemyDeath(enemy) {
    if (enemy.health <= 0) {
        enemy.isDead = true;
        money += enemy.value;
        enemiesDefeated++;
        enemiesLeft--;
        updateGameStats();
    }
}

// ==================== Tower Utility ====================
function getTowerColor(type) {
    switch (type) {
        case "basic": return "#2980b9";
        case "sniper": return "#8e44ad";
        case "splash": return "#e67e22";  // Changed from "rapid" to "splash"
        default: return "#95a5a6";
    }
}

function getTowerRange(type) {
    switch (type) {
        case "basic": return 100;
        case "sniper": return 200;
        case "rapid": return 80;
        default: return 80;
    }
}

function getTowerDamage(type) {
    switch (type) {
        case "basic": return 10;
        case "sniper": return 25;
        case "rapid": return 5;
        default: return 5;
    }
}

function getTowerFireRate(type) {
    switch (type) {
        case "basic": return 1000;
        case "sniper": return 2000;
        case "rapid": return 300;
        default: return 1000;
    }
}

// ==================== Tower Selection ====================
function selectTowerOption(option) {
    selectedTowerOption = option;
}

// ==================== Tower Placement ====================
function handleCanvasClick(e) {
    if (!selectedTowerOption || gameState !== "playing") return;

    const tileX = Math.floor(mouseX / tileSize);
    const tileY = Math.floor(mouseY / tileSize);

    if (gameMap[tileY] && gameMap[tileY][tileX] === 1) {
        const centerX = tileX * tileSize + tileSize / 2;
        const centerY = tileY * tileSize + tileSize / 2;

        // Check if a tower already exists here
        for (let tower of towers) {
            if (tower.tileX === tileX && tower.tileY === tileY) return;
        }

        const cost = 50;
        if (money >= cost) {
            towers.push({
                type: selectedTowerOption.dataset.type,
                x: centerX,
                y: centerY,
                tileX: tileX,
                tileY: tileY,
                range: getTowerRange(selectedTowerOption.dataset.type),
                damage: getTowerDamage(selectedTowerOption.dataset.type),
                fireRate: getTowerFireRate(selectedTowerOption.dataset.type),
                lastShot: 0
            });
            money -= cost;
            updateGameStats();
        }
    }
}

// ==================== UI ====================
function updateGameStats() {
    document.getElementById("money").innerText = money;
    document.getElementById("lives").innerText = lives;
    document.getElementById("wave").innerText = `${wave}/${maxWaves}`;
}

// ==================== Game Loop ====================
function update() {
    drawMap();
    drawEnemies();
    drawProjectiles();
    updateTowers();
    updateEnemies();
    updateProjectiles();

    checkGameOver();
    updateGameStats();
}

// ==================== Enemy Handling (Placeholder) ====================
function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, 12, 0, Math.PI * 2);
        ctx.fillStyle = "red";
        ctx.fill();
    });
}

function updateEnemies() {
    // Implement movement logic here
}

// ==================== Projectile Handling (Placeholder) ====================
function drawProjectiles() {
    projectiles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "yellow";
        ctx.fill();
    });
}

function updateProjectiles() {
    // Implement projectile movement and collision here
}

function updateTowers() {
    const now = Date.now();
    towers.forEach(tower => {
        if (now - tower.lastShot >= tower.fireRate) {
            const target = enemies.find(e => {
                const dx = tower.x - e.x;
                const dy = tower.y - e.y;
                return Math.sqrt(dx * dx + dy * dy) <= tower.range;
            });

            if (target) {
                projectiles.push({ x: tower.x, y: tower.y, target, damage: tower.damage });
                tower.lastShot = now;
            }
        }
    });
}

// ==================== Upgrades & Selling (Placeholder) ====================
function upgradeTowerDamage() {
    if (selectedTower) {
        selectedTower.damage += 5;
        money -= 25;
        updateGameStats();
    }
}

function upgradeTowerRange() {
    if (selectedTower) {
        selectedTower.range += 10;
        money -= 25;
        updateGameStats();
    }
}

function upgradeTowerSpeed() {
    if (selectedTower) {
        selectedTower.fireRate = Math.max(100, selectedTower.fireRate - 100);
        money -= 25;
        updateGameStats();
    }
}

function sellTower() {
    if (selectedTower) {
        money += 25;
        towers = towers.filter(t => t !== selectedTower);
        selectedTower = null;
        updateGameStats();
    }
}

function closeUpgradePanel() {
    selectedTower = null;
}

// ==================== Game Over ====================
function checkGameOver() {
    if (lives <= 0) {
        clearInterval(gameLoop);
        gameState = "gameOver";
        document.querySelectorAll(".screen").forEach(screen => screen.classList.add("hidden"));
        document.getElementById("game-over-screen").classList.remove("hidden");
    }

    if (wave > maxWaves && enemiesLeft <= 0) {
        clearInterval(gameLoop);
        gameState = "victory";
        document.querySelectorAll(".screen").forEach(screen => screen.classList.add("hidden"));
        document.getElementById("victory-screen").classList.remove("hidden");
    }
}
