const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const tempCanvas = document.getElementById("tempCanvas");
const tempCtx = tempCanvas.getContext("2d");

let game, sprites, seed;

class Game {
  constructor() {
    // 0 = pregame, 1 = playing, 2 = death animation, 3 = game over
    this.status = 0;
    this.ticks = 0;
    this.tickDied = 0;

    this.tps = 60; // max is 250
    this.fps = 60;

    this.bird = new Bird();
    this.pipes = [];
    this.generatedPipes = 0;

    this.score = 0;
    this.topScore = 0;

    this.nextPipe = null;
    this.lastPipe = null;

    this.ai = false;

    this.debug = { enabled: false, fps: 0, partialFps: 0, tps: 0, partialTps: 0 };
  }

  tick() {
    this.debug.partialTps++;
    if (this.status === 0) {
      this.bird.y = this.bird.y + Math.sin(this.ticks / 10) * 0.75;
    } else if (this.status === 1) {
      if (this.pipes.length) {
        this.nextPipe = this.pipes.find((pipe) => pipe.x > this.bird.x);
        for (let i = 0; i < this.pipes.length; i++) {
          if (this.pipes[i].x < this.bird.x) {
            this.lastPipe = this.pipes[i];
          }
        }

        if (this.lastPipe && this.score <= this.lastPipe.id) {
          this.score++;
        }
      }

      if (this.bird.y + sprites.bird[0].height > canvas.height - sprites.base.height) {
        this.end();
      }

      this.bird.y = this.bird.y + this.bird.vy;
      if (this.bird.vy < 10) this.bird.vy += 0.2;

      if (this.pipes.length > 0) {
        for (let i = 0; i < this.pipes.length; i++) {
          const minX = this.pipes[i].x - sprites.bird[0].width;
          const minY = this.pipes[i].y;
          const maxX = this.pipes[i].x + sprites.pipeUp.width;
          const maxY = this.pipes[i].y + this.pipes[i].gap - sprites.bird[0].height;

          if (this.bird.x > minX && this.bird.x < maxX && (this.bird.y < minY || this.bird.y > maxY)) {
            this.end();
          }

          this.pipes[i].x -= 2;
        }
      }

      if (this.ticks % 100 === 0) {
        this.generatePipe();
        this.pipes = this.pipes.filter((pipe) => pipe.x > -sprites.pipeUp.width);
      }

      if (this.ai) {
        if (this.nextPipe) {
          const n = 150;
          if (this.nextPipe.x - this.bird.x < n && this.bird.y > this.nextPipe.y + this.nextPipe.gap / 2) {
            console.log("Next pipe");
            this.bird.flap();
          } else if (this.nextPipe.x - this.bird.x > n) {
            if (this.lastPipe) {
              if (this.bird.y > this.lastPipe.y + this.lastPipe.gap / 2) {
                console.log("Balancing");
                this.bird.flap();
              }
            } else if (this.bird.y > canvas.height / 2) {
              console.log("Flapping: No pipes");
              this.bird.flap();
            }
          }
        } else {
          // no pipes try stay in the middle
          if (this.bird.y > canvas.height / 2) {
            console.log("Flapping: No pipes");
            this.bird.flap();
          }
        }
      }
    } else {
      this.bird.y = this.bird.y + this.bird.vy;
      if (this.bird.vy < 10) this.bird.vy += 0.4;
    }

    this.ticks++;
  }

  end() {
    this.status = 2;
    this.tickDied = this.ticks;

    setTimeout(() => {
      this.status = 3;
    }, 1000);
  }

  reset() {
    this.status = 0;
    this.ticks = 0;
    this.tickDied = 0;

    this.bird = new Bird();
    this.pipes = [];
    this.generatedPipes = 0;

    this.score = 0;

    this.nextPipe = null;
    this.lastPipe = null;
  }

  generatePipe() {
    this.pipes.push(new Pipe());
  }

  start() {
    console.log("Starting");
    this.status = 1;
  }

  render() {
    this.debug.partialFps++;

    ctx.imageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;

    if (this.status < 2) {
      ctx.drawImage(sprites.backgroundDay, (-this.ticks / 2) % (sprites.backgroundDay.width / 2), 0);
    } else {
      ctx.drawImage(sprites.backgroundDay, (-this.tickDied / 2) % (sprites.backgroundDay.width / 2), 0);
    }

    if (this.pipes.length > 0) {
      for (let i = 0; i < this.pipes.length; i++) {
        const pipe = this.pipes[i];
        ctx.drawImage(sprites.pipeUp, pipe.x, pipe.y - sprites.pipeUp.height);
        ctx.drawImage(sprites.pipeDown, pipe.x, pipe.y + pipe.gap);
      }
    }

    if (this.status < 2) {
      ctx.drawImage(sprites.base, (-this.ticks * 2) % (sprites.base.width / 2), canvas.height - sprites.base.height);
    } else {
      ctx.drawImage(sprites.base, (-this.tickDied * 2) % (sprites.base.width / 2), canvas.height - sprites.base.height);
    }

    if (this.status !== 0) {
      const spacing = 2;
      const scoreString = this.score.toString().split("");
      tempCanvas.width = scoreString.length * sprites.font[0].width + scoreString.length * spacing;
      tempCanvas.height = sprites.font[0].height;
      for (let i = 0; i < scoreString.length; i++) {
        tempCtx.drawImage(sprites.font[scoreString[i]], spacing + i * sprites.font[0].width, 0);
      }
      ctx.drawImage(tempCanvas, canvas.width / 2 - tempCanvas.width / 2, 10);
    }

    let degrees = this.bird.vy * 30 - 90;
    if (degrees > 90) degrees = 90;
    if (degrees < -30) degrees = -30;

    if (degrees > 45) {
      ctx.drawImage(rotateImage(sprites.bird[1], degrees), this.bird.x, this.bird.y);
    } else {
      ctx.drawImage(rotateImage(sprites.bird[Math.floor((this.ticks / 7) % 3)], degrees), this.bird.x, this.bird.y);
    }

    if (this.status === 0) {
      ctx.drawImage(sprites.message, canvas.width / 2 - sprites.message.width / 2, canvas.height / 2 - sprites.message.height / 2);
    }

    if (this.status > 1) {
      ctx.fillStyle = `rgba(0, 0, 0, 0.2)`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = `rgba(255, 255, 255, ${(30 - (this.ticks - this.tickDied)) / 30})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (this.status > 1) {
      ctx.drawImage(sprites.gameover, canvas.width / 2 - sprites.gameover.width / 2, canvas.height / 2 - sprites.gameover.height / 2);
    }

    if (this.debug.enabled) {
      ctx.fillStyle = "white";
      ctx.font = "20px Arial";
      ctx.fillText(`TPS: ${this.debug.tps}`, 10, 20);
      ctx.fillText(`FPS: ${this.debug.fps}`, 10, 40);
    }

    window.requestAnimationFrame(this.render.bind(this));
  }

  async init() {
    await loadSprites();

    setInterval(() => {
      this.tick();
    }, 1000 / this.tps);

    window.requestAnimationFrame(this.render.bind(this));

    setInterval(() => {
      this.debug.fps = this.debug.partialFps;
      this.debug.partialFps = 0;
      this.debug.tps = this.debug.partialTps;
      this.debug.partialTps = 0;
    }, 1000);
  }
}

class Bird {
  constructor() {
    this.x = 97;
    this.y = 291;

    this.vy = 3;
  }

  flap() {
    this.vy = -5;
  }
}

class Pipe {
  constructor() {
    this.gap = sprites.bird[0].height * 6;

    this.x = canvas.width;
    this.y = pseudoRNG(seed + game.ticks) * (canvas.height - sprites.base.height * 3 - this.gap) + sprites.base.height;

    this.id = game.generatedPipes++;
  }
}

async function loadGame() {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  seed = urlParams.get("seed");

  if (seed) {
    game = new Game();
    await game.init();
  } else {
    seed = Math.floor(Math.random() * 1000000);
    window.location.search = `?seed=${seed}`;

    game = new Game();
    await game.init();
  }
}

async function loadSprites() {
  sprites = {
    base: await loadImage("sprites/base.png"),
    gameover: await loadImage("sprites/gameover.png"),
    message: await loadImage("sprites/message.png"),
    backgroundDay: await loadImage("sprites/background-day.png"),
    pipeUp: await loadImage("sprites/pipe-up.png"),
    pipeDown: await loadImage("sprites/pipe-down.png"),
    bird: [await loadImage("sprites/yellowbird-downflap.png"), await loadImage("sprites/yellowbird-midflap.png"), await loadImage("sprites/yellowbird-upflap.png")],
    font: [
      await loadImage("sprites/0.png"),
      await loadImage("sprites/1.png"),
      await loadImage("sprites/2.png"),
      await loadImage("sprites/3.png"),
      await loadImage("sprites/4.png"),
      await loadImage("sprites/5.png"),
      await loadImage("sprites/6.png"),
      await loadImage("sprites/7.png"),
      await loadImage("sprites/8.png"),
      await loadImage("sprites/9.png"),
    ],
  };
}

async function loadImage(img) {
  const image = new Image();
  image.src = img;
  return new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  }).then(() => image);
}

function rotateImage(img, degrees) {
  tempCanvas.width = img.width;
  tempCanvas.height = img.height;
  tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
  tempCtx.save();
  tempCtx.translate(img.width / 2, img.height / 2);
  tempCtx.rotate((degrees * Math.PI) / 180);
  tempCtx.drawImage(img, -img.width / 2, -img.height / 2);
  tempCtx.restore();
  return tempCanvas;
}

function pseudoRNG(x) {
  const i =
    Math.sqrt(x) +
    Math.cos(x) +
    Math.tanh(x) +
    Math.hypot(x) +
    Math.trunc(x) +
    Math.log10(x) +
    Math.log(x) +
    Math.cbrt(x) +
    Math.log1p(x) +
    Math.sin(x) +
    Math.clz32(x) +
    Math.acosh(x) +
    Math.imul(x) +
    Math.fround(x) +
    Math.log2(x) +
    Math.tan(x);

  return i - Math.floor(i);
}

window.addEventListener("load", loadGame);

window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    if (game.status === 0) {
      game.start();
      game.bird.flap();
    } else if (game.status === 1) {
      game.bird.flap();
    } else if (game.status === 3) {
      game.reset();
    }
  } else if (e.code === "KeyL") {
    console.log("ai enabled");
    game.ai = true;
  } else if (e.code === "KeyK") {
    console.log("debug enabled");
    game.debug.enabled = true;
  }
});
