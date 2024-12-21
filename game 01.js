const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Configuración del juego
const game = {
    width: canvas.width,
    height: canvas.height,
    enemies: [],
    towers: [],
    maxTowers: 5,
    enemyInterval: 1000, // 1 segundo
    nextEnemyTime: 1000, // Tiempo para el próximo enemigo
    life: 10, // Contador de vida inicial
    gameOver: false, // Indicador de fin de juego
    enemiesNeutralized: 0 // Contador de enemigos neutralizados
};

// Clase para los enemigos
class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 10;
        this.height = 10;
        this.speed = 3;
        this.health = 10; // Salud del enemigo
        this.targetX = game.width;
        this.targetY = Math.random() * game.height;
    }

    update() {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.hypot(dx, dy);
        this.x += (dx / distance) * this.speed;
        this.y += (dy / distance) * this.speed;

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
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'white';
        ctx.fillText(this.health, this.x + this.width / 2 - 5, this.y + this.height / 2 + 5);
    }
}

// Clase para las torres
class Tower {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.damage = 1;
        this.health = 50; // Salud de la torre
    }

    get range() {
        return this.health * 2 + 50; // Rango proporcional a la vida restante más 50
    }

    draw() {
        ctx.fillStyle = 'blue';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'white';
        ctx.fillText(this.health, this.x + this.width / 2 - 5, this.y + this.height / 2 + 5);

        // Dibujar el rango de acción
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.range, 0, Math.PI * 2);
        ctx.strokeStyle = 'teal'; // Color del rango de acción
        ctx.stroke();
    }

    attack(enemies) {
        enemies.forEach(enemy => {
            const distance = Math.hypot(this.x + this.width / 2 - enemy.x, this.y + this.height / 2 - enemy.y);
            if (distance < this.range) {
                enemy.health -= this.damage;
                this.health -= 0.5; // La torre también pierde vida al atacar
                if (enemy.health <= 0) {
                    const index = enemies.indexOf(enemy);
                    if (index > -1) {
                        enemies.splice(index, 1);
                        game.enemiesNeutralized++; // Incrementar el contador de enemigos neutralizados
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
        if (game.nextEnemyTime <= 0) {
            addEnemy();
            game.nextEnemyTime = game.enemyInterval;
        }
    }
}

// Función para dibujar el juego
function draw() {
    ctx.clearRect(0, 0, game.width, game.height);
    ctx.fillStyle = 'darkcyan';
    ctx.fillRect(0, 0, game.width, game.height);

    if (!game.gameOver) {
        game.enemies.forEach(enemy => enemy.draw());
        game.towers.forEach(tower => tower.draw());

        // Dibujar el contador de vida
        ctx.fillStyle = 'black';
        ctx.fillText(`Life: ${game.life}`, 10, 20);
    } else {
        // Mostrar mensaje de enemigos neutralizados
        ctx.fillStyle = 'black';
        ctx.font = '48px serif';
        ctx.fillText(`Enemigos neutralizados: ${game.enemiesNeutralized}`, game.width / 2 - 250, game.height / 2);
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

init();
