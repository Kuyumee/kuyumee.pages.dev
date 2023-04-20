const config = {
  width: 224,
  height: 248,
  speed: 1,
  ticksPerSecond: 128,
  framesPerSecond: 60,
  directions: ["w", "a", "s", "d"],
  opposites: { w: "s", a: "d", s: "w", d: "a" },
  margin: 1,
};

let games = [];

const audios = {
  death_1: new Howl({ src: ["death_1.wav"], volume: 0.3 }),
  eat_ghost: new Howl({ src: ["eat_ghost.wav"], volume: 0.3 }),

  game_start: new Howl({ src: ["game_start.wav"], volume: 0.3 }),

  munch_1: new Howl({ src: ["munch_1.wav"], volume: 0.3 }),
  munch_2: new Howl({ src: ["munch_2.wav"], volume: 0.3 }),

  power_pellet: new Howl({ src: ["power_pellet.wav"], autoplay: true, mute: true, loop: true, volume: 0.3 }),
  siren: new Howl({ src: ["siren_1.wav"], autoplay: true, mute: true, loop: true, volume: 0.3 }),
};

let a = 0;
let b;
let totalTicks = 0;
let dev = false;

let pathImageData;
let pressedKeys = [];

let gameCanvas = document.createElement("canvas");
let gameCtx = gameCanvas.getContext("2d");
gameCanvas.width = config.width;
gameCanvas.height = config.height;

let tempCanvas = document.createElement("canvas");
let tempCtx = tempCanvas.getContext("2d");
tempCanvas.width = 512;
tempCanvas.height = 512;

let pathCanvas = document.createElement("canvas");
let pathCtx = pathCanvas.getContext("2d");
pathCanvas.width = config.width;
pathCanvas.height = config.height;

gameCtx.imageSmoothingEnabled = false;
tempCtx.imageSmoothingEnabled = false;
pathCtx.imageSmoothingEnabled = false;

document.body.appendChild(gameCanvas);

gameCtx.font = "20px arial";
gameCtx.fillStyle = "white";
gameCtx.fillText("Press SPACE to start", 10, 30);

class Game {
  constructor() {
    this.initialized = false;
    this.pacman = new Pacman();
    this.ghosts = [new Ghost("red"), new Ghost("pink"), new Ghost("cyan"), new Ghost("orange")];
    this.availablePowerups = [
      [4, 22],
      [203.5, 22],
      [4, 182],
      [203.5, 182],
    ];

    this.animationClock = 0;
    this.deathAnimationStart = 0;

    this.paused = false;
  }

  tick() {
    totalTicks++;

    if (totalTicks === 1) {
      b = Date.now();
      audios.siren.mute(false);
      audios.power_pellet.mute(false);
    }

    if (this.paused) return;

    if (!this.ghosts.some((a) => a.scared - totalTicks > 0)) {
      audios.power_pellet.mute(true);
      audios.siren.mute(false);
      if (timedIndex(totalTicks, 1, 40) === 0) {
        audios.munch_1.play();
      } else if (timedIndex(totalTicks, 1, 40) === 20) {
        audios.munch_2.play();
      }
    } else {
      audios.power_pellet.mute(false);
      audios.siren.mute(true);
    }

    this.pacman.move();
    this.pacman.saveWalk(totalTicks);

    if (this.pacman.x < -17) {
      this.pacman.x = gameCanvas.width + this.pacman.width;
    } else if (this.pacman.x > gameCanvas.width + 17) {
      this.pacman.x = -this.pacman.width;
    }

    for (const ghost of this.ghosts) {
      if (!ghost.isDead) {
        ghost.target = [this.pacman.x, this.pacman.y];
      } else {
        ghost.target = [104, 107.5];
      }
      ghost.chaseTarget();
    }

    const eatenPowerup = this.availablePowerups.find((a) => a[0] === this.pacman.x && a[1] === this.pacman.y);
    if (eatenPowerup) {
      this.availablePowerups = this.availablePowerups.filter((a) => !(a[0] === this.pacman.x && a[1] === this.pacman.y));
      for (let i = 0; i < this.ghosts.length; i++) {
        this.ghosts[i].scared = totalTicks + 1280;
      }
    }

    const xMin = this.pacman.x - this.pacman.width / 2;
    const xMax = this.pacman.x + this.pacman.width / 2;
    const yMin = this.pacman.y - this.pacman.height / 2;
    const yMax = this.pacman.y + this.pacman.height / 2;

    const touchedGhosts = this.ghosts.filter((a) => a.x >= xMin && a.x <= xMax && a.y >= yMin && a.y <= yMax);
    if (touchedGhosts.length) {
      for (let i = 0; i < touchedGhosts.length; i++) {
        if (touchedGhosts[i].isDead) continue;
        if (touchedGhosts[i].scared - totalTicks > 0) {
          audios.eat_ghost.play();
          touchedGhosts[i].kill();
        } else {
          console.log(a, Date.now() - b);
          audios.power_pellet.mute(true);
          audios.siren.mute(true);
          audios.death_1.play();
          this.paused = true;
          this.deathAnimationStart = totalTicks;
        }
      }
    }
  }

  async init() {
    this.initialized = true;

    let img = await loadImage("./sprites.png");

    this.sprites = {
      background: await loadImage(img, 0, 0, 224, 248),
      backgroundClear: await loadImage(img, 228, 0, 224, 248),
      path: await loadImage(img, 680, 0, 224, 248),

      pacman: {
        d: [await loadImage(img, 456, 0, 15, 15), await loadImage(img, 472, 0, 15, 15)],
        a: [await loadImage(img, 456, 16, 15, 15), await loadImage(img, 472, 16, 15, 15)],
        w: [await loadImage(img, 456, 32, 15, 15), await loadImage(img, 472, 32, 15, 15)],
        s: [await loadImage(img, 456, 49, 15, 15), await loadImage(img, 472, 49, 15, 15)],

        deathAnimation: [
          await loadImage(img, 504, 0, 15, 15),
          await loadImage(img, 520, 0, 15, 15),
          await loadImage(img, 536, 0, 15, 15),
          await loadImage(img, 552, 0, 15, 15),
          await loadImage(img, 568, 0, 15, 15),
          await loadImage(img, 584, 0, 15, 15),
          await loadImage(img, 600, 0, 15, 15),
          await loadImage(img, 616, 0, 15, 15),
          await loadImage(img, 632, 0, 15, 15),
          await loadImage(img, 648, 0, 15, 15),
          await loadImage(img, 664, 1, 15, 15),
          await loadImage(img, 680, 1, 15, 15),
        ],
      },

      ghosts: {
        red: {
          d: [await loadImage(img, 456, 64, 16, 16), await loadImage(img, 472, 64, 16, 16)],
          a: [await loadImage(img, 488, 64, 16, 16), await loadImage(img, 504, 64, 16, 16)],
          w: [await loadImage(img, 520, 64, 16, 16), await loadImage(img, 536, 64, 16, 16)],
          s: [await loadImage(img, 552, 64, 16, 16), await loadImage(img, 568, 64, 16, 16)],
        },
        pink: {
          d: [await loadImage(img, 456, 80, 16, 16), await loadImage(img, 472, 80, 16, 16)],
          a: [await loadImage(img, 488, 80, 16, 16), await loadImage(img, 504, 80, 16, 16)],
          w: [await loadImage(img, 520, 80, 16, 16), await loadImage(img, 536, 80, 16, 16)],
          s: [await loadImage(img, 552, 80, 16, 16), await loadImage(img, 568, 80, 16, 16)],
        },
        cyan: {
          d: [await loadImage(img, 456, 96, 16, 16), await loadImage(img, 472, 96, 16, 16)],
          a: [await loadImage(img, 488, 96, 16, 16), await loadImage(img, 504, 96, 16, 16)],
          w: [await loadImage(img, 520, 96, 16, 16), await loadImage(img, 536, 96, 16, 16)],
          s: [await loadImage(img, 552, 96, 16, 16), await loadImage(img, 568, 96, 16, 16)],
        },
        orange: {
          d: [await loadImage(img, 456, 112, 16, 16), await loadImage(img, 472, 112, 16, 16)],
          a: [await loadImage(img, 488, 112, 16, 16), await loadImage(img, 504, 112, 16, 16)],
          w: [await loadImage(img, 520, 112, 16, 16), await loadImage(img, 536, 112, 16, 16)],
          s: [await loadImage(img, 552, 112, 16, 16), await loadImage(img, 568, 112, 16, 16)],
        },

        scared: [await loadImage(img, 584, 64, 16, 16), await loadImage(img, 600, 64, 16, 16)],
        warning: [await loadImage(img, 584, 64, 16, 16), await loadImage(img, 616, 64, 16, 16), await loadImage(img, 600, 64, 16, 16), await loadImage(img, 632, 64, 16, 16)],
        dead: {
          d: await loadImage(img, 586, 82, 16, 16),
          a: await loadImage(img, 600, 82, 16, 16),
          w: await loadImage(img, 616, 82, 16, 16),
          s: await loadImage(img, 632, 82, 16, 16),
        },
      },
    };

    pathCtx.drawImage(this.sprites.path, 0, 0, gameCanvas.width, gameCanvas.height);
    pathImageData = pathCtx.getImageData(0, 0, gameCanvas.width, gameCanvas.height).data.filter((v, i) => i % 4 === 0);

    setInterval(() => this.render(), 1000 / config.framesPerSecond);

    audios.game_start.play();

    setTimeout(() => {
      setInterval(() => this.tick(), 1000 / config.ticksPerSecond);
      setInterval(() => this.animationClock++, 50);
    }, 4500);
  }

  async render() {
    gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    await draw(this.sprites.background, 0, 0);
    if (timedIndex(totalTicks, 64, 2) === 0) {
      for (let i = 0; i < this.availablePowerups.length; i++) {
        gameCtx.fillStyle = "black";
        gameCtx.fillRect(this.availablePowerups[i][0] + 2, this.availablePowerups[i][1] + 2, 11, 8);
      }
    }
    for (const coords of this.pacman.pacmanWalked) {
      gameCtx.fillStyle = "black";
      gameCtx.fillRect(...coords, this.pacman.width - 2, this.pacman.height - 2);
    }
    for (const ghost of this.ghosts) {
      if (ghost.isDead) {
        await draw(this.sprites.ghosts.dead[ghost.lookingAt], ghost.x, ghost.y);
      } else {
        const angryRemaining = ghost.scared - totalTicks;
        if (angryRemaining > 384) {
          await draw(this.sprites.ghosts.scared[timedIndex(totalTicks, 16, 2)], ghost.x, ghost.y);
        } else if (angryRemaining > 0) {
          await draw(this.sprites.ghosts.warning[timedIndex(totalTicks, 32, 2)], ghost.x, ghost.y);
        } else {
          await draw(this.sprites.ghosts[ghost.color][ghost.lookingAt][timedIndex(totalTicks, 16, 2)], ghost.x, ghost.y);
        }
      }
    }
    if (this.deathAnimationStart === 0) {
      await draw(this.sprites.pacman[this.pacman.lookingAt][timedIndex(totalTicks, 8, 2)], this.pacman.x, this.pacman.y);
    } else if (totalTicks - this.deathAnimationStart < 11 * 16) {
      await draw(this.sprites.pacman.deathAnimation[timedIndex(totalTicks - this.deathAnimationStart, 16, 11)], this.pacman.x, this.pacman.y);
    }
  }
}

class Pacman {
  constructor() {
    this.x = 104;
    this.y = 131.5;

    this.width = 15;
    this.height = 15;

    this.lookingAt = "d";

    this.pacmanWalked = [];
  }

  saveWalk(totalTicks) {
    if (totalTicks % 10 === 0) this.pacmanWalked.push([this.x + 2, this.y + 2]);
  }

  move() {
    const moveTo = pressedKeys.find((a) => config.directions.includes(a));
    if (moveTo) {
      if (!this.isBlocked(moveTo)) this.lookingAt = moveTo;
    }

    if (this.lookingAt === "w" && !this.isBlocked(this.lookingAt)) {
      this.y = this.y - 0.5;
    } else if (this.lookingAt === "a" && !this.isBlocked(this.lookingAt)) {
      this.x = this.x - 0.5;
    } else if (this.lookingAt === "s" && !this.isBlocked(this.lookingAt)) {
      this.y = this.y + 0.5;
    } else if (this.lookingAt === "d" && !this.isBlocked(this.lookingAt)) {
      this.x = this.x + 0.5;
    }
  }

  isBlocked(direction) {
    if ([107.5, 108].includes(this.y) && ["a", "d"].includes(this.lookingAt) && (this.x < 1 || 206.5 < this.x)) return false;

    if (direction === "w") {
      return getPixel(this.x, this.y - config.margin) === 33 || getPixel(this.x + this.width, this.y - config.margin) === 33 || getPixel(this.x + this.width / 2, this.y - config.margin) === 33;
    } else if (direction === "a") {
      return getPixel(this.x - config.margin, this.y) === 33 || getPixel(this.x - config.margin, this.y + this.height) === 33 || getPixel(this.x - config.margin, this.y + this.height / 2) === 33;
    } else if (direction === "s") {
      return getPixel(this.x, this.y + this.height + config.margin) === 33 || getPixel(this.x + this.width, this.y + this.height + config.margin) === 33 || getPixel(this.x + this.width / 2, this.y + this.height + config.margin) === 33;
    } else if (direction === "d") {
      return getPixel(this.x + this.width + config.margin, this.y) === 33 || getPixel(this.x + this.width + config.margin, this.y + this.height / 2) === 33 || getPixel(this.x + this.width + config.margin, this.y + this.height) === 33;
    }
  }
}

class Ghost {
  constructor(color) {
    this.x = 104;
    this.y = 107.5;

    this.width = 15;
    this.height = 15;

    this.lookingAt = "d";

    this.color = color;
    this.isDead = false;

    this.speed = 1;

    this.target = [];
    this.pathfinding = false;
    this.pathfinders = [];
    this.path = [];
  }

  kill() {
    this.isDead = true;
    this.speed = 1;
  }

  changePath(path) {
    for (const pathfinder of this.pathfinders) {
      pathfinder.done = true;
    }
    this.pathfinding = false;
    this.path = path;
  }

  chaseTarget() {
    if (this.x === 104 && this.y === 107.5 && this.isDead) {
      this.speed = 1;
      this.isDead = false;
      this.scared = -1;
    }

    if (this.path.length) {
      let [x, y] = this.path[0];

      if (this.x === x && this.y === y) {
        this.path.shift();
        if (!this.path.length) return;
        [x, y] = this.path[0];
      }

      let distances = [
        { direction: "w", difference: this.y - y },
        { direction: "a", difference: this.x - x },
        { direction: "s", difference: y - this.y },
        { direction: "d", difference: x - this.x },
      ];

      distances = distances.sort((a, b) => b.difference - a.difference);
      if (distances.length) this.lookingAt = distances[0].direction;

      if (this.lookingAt === "w") {
        this.y = this.y - 0.5 * this.speed;
      } else if (this.lookingAt === "a") {
        this.x = this.x - 0.5 * this.speed;
      } else if (this.lookingAt === "s") {
        this.y = this.y + 0.5 * this.speed;
      } else if (this.lookingAt === "d") {
        this.x = this.x + 0.5 * this.speed;
      }
    } else {
      if (this.pathfinding === false) {
        console.log("Creating Pathfinders");
        this.pathfinding = true;
        this.pathfinders = Array.from({ length: 50 }, () => new Pathfinder(this.x, this.y, this.target[0], this.target[1], Date.now() + 100, this));
        for (const pathfinder of this.pathfinders) {
          pathfinder.findPath();
        }
      }
    }
  }
}

class Pathfinder {
  constructor(x, y, dX, dY, expire, ghost) {
    this.x = x;
    this.y = y;

    this.dX = dX;
    this.dY = dY;

    this.width = 15;
    this.height = 15;

    this.lookingAt = "d";

    this.path = [];
    this.ghost = ghost;
    this.done = false;
  }

  async findPath() {
    //TODO: Sensors at front and back rears to check if can go. Use waypoints to be able to increase speed
    await new Promise(async (res) => {
      if (this.x === this.dX && this.y === this.dY) {
        this.path.push([this.x, this.y]);
        this.ghost.changePath(this.path);
      }

      const validDirections = config.directions.filter((a) => a !== config.opposites[this.lookingAt] && !this.isBlocked(a));

      if (validDirections.length) {
        this.path.push([this.x, this.y]);
        this.lookingAt = validDirections[Math.floor(Math.random() * validDirections.length)];
      } else if (this.isBlocked(this.lookingAt)) {
        this.path.push([this.x, this.y]);
        this.lookingAt = config.opposites[this.lookingAt];
      }

      if (this.lookingAt === "w") {
        this.y = this.y - 0.5;
      } else if (this.lookingAt === "a") {
        this.x = this.x - 0.5;
      } else if (this.lookingAt === "s") {
        this.y = this.y + 0.5;
      } else if (this.lookingAt === "d") {
        this.x = this.x + 0.5;
      }

      res();
    });

    if (!this.done) this.findPath();
  }

  isBlocked(direction) {
    if (direction === "w") {
      return getPixel(this.x, this.y - config.margin) === 33 || getPixel(this.x + this.width, this.y - config.margin) === 33 || getPixel(this.x + this.width / 2, this.y - config.margin) === 33;
    } else if (direction === "a") {
      return getPixel(this.x - config.margin, this.y) === 33 || getPixel(this.x - config.margin, this.y + this.height) === 33 || getPixel(this.x - config.margin, this.y + this.height / 2) === 33;
    } else if (direction === "s") {
      return getPixel(this.x, this.y + this.height + config.margin) === 33 || getPixel(this.x + this.width, this.y + this.height + config.margin) === 33 || getPixel(this.x + this.width / 2, this.y + this.height + config.margin) === 33;
    } else if (direction === "d") {
      return getPixel(this.x + this.width + config.margin, this.y) === 33 || getPixel(this.x + this.width + config.margin, this.y + this.height / 2) === 33 || getPixel(this.x + this.width + config.margin, this.y + this.height) === 33;
    }

    return false;
  }
}

async function main() {
  const game = new Game();
  games.push(game);
  document.addEventListener("keydown", (e) => {
    if (e.key === " " && !game.initialized) {
      game.init();
    }
  });
}

function getPixel(x, y) {
  a++;
  x = Math.round(x);
  y = Math.round(y);
  return pathImageData[x + y * gameCanvas.width];
}

function drawPixel(x, y) {
  gameCtx.fillStyle = "green";
  gameCtx.fillRect(x, y, 1, 1);
}

async function draw(img, x, y) {
  return gameCtx.drawImage(img, x, y, img.width, img.height);
}

async function loadImage(src, sx, sy, sWidth, sHeight) {
  if (!isNaN(sx)) {
    src = await crop(src, sx, sy, sWidth, sHeight);
  }

  return new Promise((res) => {
    const img = new Image();
    img.src = src;
    img.onload = () => res(img);
  });
}

async function crop(image, sx, sy, sWidth, sHeight) {
  tempCanvas.width = sWidth;
  tempCanvas.height = sHeight;
  tempCtx.drawImage(image, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
  let data = tempCanvas.toDataURL("image/png");
  tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

  return data;
}

function timedIndex(totalTicks, tickSpeed, values) {
  return Math.floor((totalTicks / tickSpeed) % values);
  w;
}

document.addEventListener("DOMContentLoaded", () => main());

document.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "l") return (dev = true);
  if (!pressedKeys.includes(e.key.toLowerCase())) return pressedKeys.unshift(e.key.toLowerCase());
});

document.addEventListener("keyup", (e) => {
  pressedKeys = pressedKeys.filter((a) => a !== e.key.toLowerCase());
});

window.addEventListener("resize", () => {
  gameCtx.imageSmoothingEnabled = false;
  tempCtx.imageSmoothingEnabled = false;
  pathCtx.imageSmoothingEnabled = false;
});
