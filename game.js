const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const enemiesNeutralizedElement = document.getElementById('enemiesNeutralized');

// Ajustar el tamaño del canvas a la pantalla del navegador
canvas.width = window.innerWidth * 0.8;
canvas.height = window.innerHeight * 0.7;

// Cargar los sprites
const towerImage = new Image();
towerImage.src = 'torre0.png';

const enemyImage = new Image();
enemyImage.src = 'carro0.png';

// Cargar la imagen de fondo
const backgroundImage = new Image();
backgroundImage.src = 'dunas0.jpeg';
backgroundImage.onload = init; // Inicializar el juego cuando la imagen de fondo se cargue

// Configuración del juego
const game = {
    width: canvas.width,
    height: canvas.height,
    enemies: [],
    towers: [],
    maxTowers: parseInt(document.getElementById('maxTowers').value),
    enemyInterval: parseInt(document.getElementById('enemyInterval').value), // 1 segundo
    nextEnemyTime: parseInt(document.getElementById('enemyInterval').value), // Tiempo para el próximo enemigo
    waveInterval: parseInt(document.getElementById('waveInterval').value), // Retardo entre rachas
    nextWaveTime: parseInt(document.getElementById('waveInterval').value), // Tiempo para la próxima racha
    life: 10, // Contador de vida inicial
    gameOver: false, // Indicador de fin de juego
    enemiesNeutralized: 0, // Contador de enemigos neutralizados
    enemySpeedMin: parseInt(document.getElementById('enemySpeedMin').value),
    enemySpeedMax: parseInt(document.getElementById('enemySpeedMax').value),
    enemiesPerWave: parseInt(document.getElementById('enemiesPerWave').value),
    enemyHealth: parseInt(document.getElementById('enemyHealth').value),
    towerHealth: parseInt(document.getElementById('towerHealth').value),
    waveCount: 0 // Contador de rachas
};

// Función para ajustar el tamaño según la posición en el eje y
function getSizeByPosition(y) {
    const maxSize = 120;
    const minSize = 60;
    const scale = (y / game.height);
    return Math.floor(minSize + (maxSize - minSize) * scale);
}

// Clase para los enemigos
class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = getSizeByPosition(y);
        this.speed = Math.floor(Math.random() * (game.enemySpeedMax - game.enemySpeedMin + 1)) + game.enemySpeedMin;
        this.health = game.enemyHealth; // Salud del enemigo
        this.targetX = game.width;
    }

    update() {
        const dx = this.targetX - this.x;
        const dy = this.y - this.y;
        const distance = Math.hypot(dx, dy);
        this.x += (dx / distance) * this.speed;

        // Verificar si el enemigo ha llegado a la parte derecha
        if (this.x >= game.width) {
            game.life -= 1; // Descontar vida
            const index = game.enemies.indexOf(this);
            if (index > -1) {
                game.enemies.splice(index, 1);
            }
            if (game.life <= 0) {
                game.life = 0; // Fijar vida a 0
                game.gameOver = true; // Fin del juego
            }
        }
    }

    draw() {
        ctx.drawImage(enemyImage, this.x, this.y - this.size / 2, this.size, this.size);
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial'; // Ajusta el tamaño de la letra
        ctx.fillText(this.health, this.x + this.size / 2 - 10, this.y - 10);
    }
}

// Clase para las torres
class Tower {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = getSizeByPosition(y);
        this.damage = 1;
        this.health = game.towerHealth; // Salud de la torre
    }

    get range() {
        return this.health * 2 + 120; // Rango proporcional a la vida restante más 120
    }

    draw() {
        ctx.drawImage(towerImage, this.x, this.y - this.size / 2, this.size, this.size);
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial'; // Ajusta el tamaño de la letra
        ctx.fillText(this.health, this.x + this.size / 2 - 10, this.y - 10);

        // Dibujar el rango de acción
        ctx.beginPath();
        ctx.arc(this.x + this.size / 2, this.y, this.range, 0, Math.PI * 2);
        ctx.strokeStyle = 'teal'; // Color del rango de acción
        ctx.stroke();
    }

    attack(enemies) {
        enemies.forEach(enemy => {
            const distance = Math.hypot(this.x + this.size / 2 - enemy.x, this.y - enemy.y);
            if (distance < this.range) {
                enemy.health -= this.damage;
                this.health -= 0.5; // La torre también pierde vida al atacar
                if (enemy.health <= 0) {
                    const index = enemies.indexOf(enemy);
                    if (index > -1) {
                        enemies.splice(index, 1);
                        game.enemiesNeutralized++; // Incrementar el contador de enemigos neutralizados
                        enemiesNeutralizedElement.textContent = game.enemiesNeutralized;
                        if (game.enemiesNeutralized % 50 === 0) {
                            game.maxTowers += 1;
                        }
                    }
                }
                if (this.health <= 0) {
                    const index = game.towers.indexOf(this);
                    if (index > -1) {
                        game.towers.splice(index, 1);
                    }
                }
            }
        });
    }
}

// Función para actualizar el juego
function update() {
    if (!game.gameOver) {
        game.enemies.forEach(enemy => enemy.update());
        game.towers.forEach(tower => tower.attack(game.enemies));

        // Verificar si es tiempo de añadir un nuevo enemigo
        game.nextEnemyTime -= 16; // Aproximadamente 60 FPS
        if (game.nextEnemyTime <= 0 && game.enemies.length < game.enemiesPerWave) {
            addEnemy();
            game.nextEnemyTime = game.enemyInterval;
        }

        // Verificar si es tiempo de añadir una nueva racha de enemigos
        game.nextWaveTime -= 16; // Aproximadamente 60 FPS
        if (game.nextWaveTime <= 0 && game.enemies.length === 0) {
            game.nextWaveTime = game.waveInterval;
            game.waveCount++;
            game.enemySpeedMax += 1;
            document.getElementById('enemySpeedMax').value = game.enemySpeedMax;
            game.enemiesPerWave += 1;
            document.getElementById('enemiesPerWave').value = game.enemiesPerWave;
            game.towerHealth += 5;
            document.getElementById('towerHealth').value = game.towerHealth;
        }
    }
}

// Función para dibujar el juego
function draw() {
    ctx.drawImage(backgroundImage, 0, 0, game.width, game.height); // Dibujar la imagen de fondo

    if (!game.gameOver) {
        game.enemies.forEach(enemy => enemy.draw());
        game.towers.forEach(tower => tower.draw());

        // Dibujar el contador de vida
        ctx.fillStyle = 'black';
        ctx.font = '40px Arial'; // Ajusta el tamaño de la letra
        ctx.fillText(`Life: ${game.life}`, game.width / 2 - 100, 50);
    } else {
        // Mostrar mensaje de enemigos neutralizados
        ctx.fillStyle = 'black';
        ctx.font = '96px serif'; // Ajusta el tamaño de la letra
        ctx.fillText(`Enemigos neutralizados: ${game.enemiesNeutralized}`, game.width / 2 - 500, game.height / 2);
    }
}

// Función principal del juego
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Inicializar el juego
function init() {
    addEnemy();
    gameLoop();
}

// Función para añadir un enemigo
function addEnemy() {
    const weakestTower = game.towers.reduce((weakest, tower) => {
        return (weakest.health < tower.health) ? weakest : tower;
    }, game.towers[0]);
    game.enemies.push(new Enemy(0, weakestTower ? weakestTower.y : Math.random() * game.height));
}

// Evento de clic para colocar torres
canvas.addEventListener('click', (event) => {
    if (game.towers.length < game.maxTowers && !game.gameOver) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        game.towers.push(new Tower(x, y));
    }
});

// Evento para actualizar los parámetros del juego
document.getElementById('enemySpeedMin').addEventListener('input', (event) => {
    game.enemySpeedMin = parseInt(event.target.value);
});

document.getElementById('enemySpeedMax').addEventListener('input', (event) => {
    game.enemySpeedMax = parseInt(event.target.value);
});

document.getElementById('enemiesPerWave').addEventListener('input', (event) => {
    game.enemiesPerWave = parseInt(event.target.value);
});

document.getElementById('enemyInterval').addEventListener('input', (event) => {
    game.enemyInterval = parseInt(event.target.value);
});

document.getElementById('waveInterval').addEventListener('input', (event) => {
    game.waveInterval = parseInt(event.target.value);
});

document.getElementById('enemyHealth').addEventListener('input', (event) => {
    game.enemyHealth = parseInt(event.target.value);
});

document.getElementById('towerHealth').addEventListener('input', (event) => {
    game.towerHealth = parseInt(event.target.value);
});

document.getElementById('maxTowers').addEventListener('input', (event) => {
    game.maxTowers = parseInt(event.target.value);
});
