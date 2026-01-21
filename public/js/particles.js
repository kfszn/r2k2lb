const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
class Particle {
    constructor(x, y, size, color) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 2 + 0.5;
    }
    update() {
        this.x += this.speedX;
        this.y -= this.speedY;
        if (this.size > 0.2) this.size -= 0.01;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}
const particlesArray = [];
let spawnCounter = 0;

function spawnParticles() {
    if (spawnCounter % 10 === 0) {
        const xPos = Math.random() * canvas.width;
        const yPos = canvas.height;
        const size = Math.random() * 3 + 1;
        const color = `rgba(39, 117, 202, ${Math.random()})`;
        particlesArray.push(new Particle(xPos, yPos, size, color));
    }
    spawnCounter++;
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particlesArray.forEach((particle, index) => {
        particle.update();
        particle.draw();
        if (particle.size <= 0.2) {
            particlesArray.splice(index, 1);
        }
    });
    spawnParticles();
    requestAnimationFrame(animate);
}
animate();
