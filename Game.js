const canvas = document.getElementById('canvas');
const W = canvas.width = innerWidth;
const H = canvas.height = innerHeight;
const context = canvas.getContext('2d');
const scoreboardValue = document.getElementById('scoreboard-value');

// Characters
class Player {
    constructor (x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }

    draw() {
        context.beginPath();
        context.fillStyle=this.color;
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        context.fill();
        
        context.closePath();
    }

    update() {
        this.draw();
    }
}

class Projectile {
    constructor (x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw() {
        context.beginPath();
        context.fillStyle=this.color;
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        context.fill();
        context.closePath();
    }
    
    update() {
        this.draw();
        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }
}

class Particle {
    constructor (x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
    }

    draw() {
        context.save();
        context.globalAlpha = this.alpha;
        
        context.beginPath();
        context.fillStyle=this.color;
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        context.fill();
        
        context.closePath();
        context.restore();
    }
    
    update() {
        const friction = 0.99;
        this.draw();
        this.velocity.x *= friction;
        this.velocity.y *= friction;
        this.alpha -= 0.03;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }
}

class Enemy {
    constructor (x, y, radius, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = this.newColor;
        this.velocity = velocity;
    }

    draw() {
        context.beginPath();
        context.fillStyle=this.color;
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        context.fill();
        
        context.closePath();
    }

    update() {
        this.draw();
        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }

    get newColor() {
        return `hsl(${Math.random() * 360}, 50%, 50%)`
    }
}

// Start the Game!
function start() {
    let score = 0;        
    const x = W/2;
    const y = H/2;

    const player = new Player(x, y, 25, '#fff');
    player.draw();

    const projectiles = [];
    const particles = [];
    const enemies = [];

    // Spawn Enemies on screen
    function spwanEnemy() {
        setInterval(() => {
            const radius = 10 + 20 * Math.random();
            let x0;
            let y0;
            if (Math.random() < 0.5) {
                x0 = Math.random() < 0.5 ? -radius : W + radius;
                y0 = Math.random() * H;
            } else {
                x0 = Math.random() * W;
                y0 = Math.random() < 0.5 ? -radius : W + radius;
            }
            const color = 'red';
            const angle = Math.atan2(y - y0, x - x0);
            const power = 1;
            const velocity = {
                x: power*Math.cos(angle),
                y: power*Math.sin(angle)
            }

            enemies.push(new Enemy(x0, y0, radius, velocity));
        }, 1000)
    }

    spwanEnemy();

    window.addEventListener('click', (e) => {
        const angle = Math.atan2(e.y - y, e.x - x);
        const power = 8;
        const velocity = {
            x: power*Math.cos(angle),
            y: power*Math.sin(angle)
        }
        const projectile = new Projectile(W/2, H/2, 5, '#f0f0f0', {x: velocity.x, y: velocity.y});
        projectiles.push(projectile);
    })

    let animationId;
    function animate() {
        animationId = requestAnimationFrame(animate);
        context.fillStyle = 'rgba(0, 0, 0, 0.1)'
        context.fillRect(0, 0, W, H);
        context.fill();
        
        projectiles.forEach(projectile => projectile.update());
        particles.forEach((particle, p) => {
            particle.update();
            if (particle.alpha <= 0) {
                particles.splice(p, 1);
            }
        });
        enemies.forEach((enemy, e) => {
            enemy.update();

            projectiles.forEach((projectile, p) => {
                const hit_distance = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y) - (projectile.radius + enemy.radius);

                if (hit_distance < 0 ) {
                    for (let i = 0; i < enemy.radius; i++) {
                        particles.push(new Particle(projectile.x, projectile.y, 3, enemy.color, {
                            x: (Math.random() - 0.5) * 8,
                            y: (Math.random() - 0.5) * 8
                        }))
                    } 
                    if (enemy.radius - 10 > 10) {
                        gsap.to(enemy, {
                            radius: enemy.radius - 10
                        })
                        projectiles.splice(p, 1);
                        score+=10;
                        scoreboardValue.innerText = score;
                    } else {
                        const t = setTimeout(() => {
                            enemies.splice(e, 1);
                            projectiles.splice(p, 1);
                            score+=10;
                            scoreboardValue.innerText = score;
                            clearTimeout(t);
                        }, 0)
                    }
                }
                
                if (projectile.y > H || projectile.y < 0 || projectile.x < 0 || projectile.x > W) projectiles.splice(p, 1);
            })

            const safe_distance = Math.hypot(enemy.x - player.x, enemy.y - player.y) - (enemy.radius + player.radius);
            if (safe_distance + 2 <  0) {
                createScoreBoard(score);
                cancelAnimationFrame(animationId);
            };
        });
        player.update();
    }

    animate();
}

start();

// Create a scoreboard to show your result in the end.
function createScoreBoard(score) {
    const inner = `<h4 style="text-align: center; font-size: 1.15em;">Points</h4>
                    <h1 id="score-value">${score}</h1>
                `
    const div = document.createElement('div');
    div.id = "score";
    div.innerHTML = inner;
    const button = document.createElement('button');
    button.id = "restart";
    button.textContent = "Restart";
    div.appendChild(button);
    document.body.appendChild(div);

    button.addEventListener('click', () => {
        document.body.removeChild(div);
        const t = setTimeout(() => {
            start();
            clearTimeout(t);
        }, 100)
    });
}