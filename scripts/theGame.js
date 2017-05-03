"use strict";

//Random level array
const levelObj = {
  start : [
  "                    ",
  "                    ",
  "                    ",
  "                    ",
  "                    ",
  "                    ",
  "                    ",
  " @x                 ",
  "gggggggggg     ggggg",
  "dddddddddd     ddddd",
  "ddddddddddwwwwwddddd"
  ],
  end : [
  "                    ",
  "                    ",
  "                   x",
  "                   x",
  "                 V x",
  "                gggg",
  "                dddd",
  "           =  g dddd",
  "gggggggggg gggd|dddd",
  "dddddddddd|ddddwdddd",
  "ddddddddddwddddddddd"
  ],
  plains : [
  [
  "                    ",
  "                    ",
  "                 o  ",
  "                    ",
  "         d    d     ",
  "                    ",
  "     d              ",
  "                    ",
  "gggggggggg     ggggg",
  "dddddddddd  |  ddddd",
  "ddddddddddwwwwwddddd"
  ], [
  "                    ",
  "                    ",
  "                    ",
  "                    ",
  "               o    ",
  "                    ",
  "         ggg        ",
  "                    ",
  "ggggggg        ggggg",
  "ddddddd |      ddddd",
  "dddddddwwwwwwwwddddd"
  ], [
  "                    ",
  "                    ",
  "                    ",
  "                    ",
  "                    ",
  "       o    o       ",
  "                    ", 
  "                    ",
  "ggggg gggg gggg gggg",
  "ddddd|dddd|dddd|dddd",
  "dddddwddddwddddwdddd"
  ], [
  "                    ",
  "                    ",
  "                    ",
  "          o         ",
  "                    ",
  "                    ",
  "      dddddddd      ",
  "                    ",
  "ggg              ggg",
  "ddd |          | ddd",
  "dddwwwwwwwwwwwwwwddd"
  ], [
  "                    ",
  "                    ",
  "                    ",
  "               o    ",
  "                    ",
  "        d   d       ",
  "    d               ",
  "                    ",
  "ggggggggggggggg gggg",
  "ddddddddddddddd|dddd",
  "dddddddddddddddwdddd"
  ], [
  "                    ",
  "                    ",
  "                    ",
  "                    ",
  "                  o ",
  "                    ",
  "               d    ",
  "           d        ",
  "gggggggg           g",
  "dddddddd     |   | d",
  "ddddddddwwwwwwwwwwwd"
  ]]
};

//Build the level from the levelplan
function Level(plan) {
  this.width = plan[0].length;
  this.height = plan.length;
  this.grid = [];
  this.elements = [];
  this.coins = 0;
  
  for(let y = 0; y < this.height; y++) {
    const line = plan[y],
          gridLine = [];
    for(let x = 0; x < this.width; x++) {
      const ch = line[x],
            Element = elementChars[ch];
      let fieldType = null;
      if(Element) {
        this.elements.push(new Element(new Vector(x, y), ch));
      }
      else {
        switch(ch) {
          case 'g':
            fieldType = 'grass';
            break;
          case 'd':
            fieldType = 'dirt';
            break;
          case 'w':
            fieldType = 'water';
            break;
          case 'x':
            fieldType = 'wall';
        }
      }
      gridLine.push(fieldType);
    }
    this.grid.push(gridLine);
  }

  this.player = this.elements.filter(elm => elm.type == 'player')[0];
  this.status = this.finishDelay = null;

  this.isFinished = () => this.status != null && this.finishDelay < 0;
  console.log(this.grid);
}

//The physics engine!
Level.prototype.obstacleAt = function(pos, size) {
  const xStart = Math.floor(pos.x),
        xEnd = Math.ceil(pos.x + size.x),
        yStart = Math.floor(pos.y),
        yEnd = Math.ceil(pos.y + size.y);
  if (xStart < 0 || xEnd > this.width || yStart < 0) {
    return 'wall';
  }
  for(let y = yStart; y < yEnd; y++) {
    for(let x = xStart; x < xEnd; x++) {
      const fieldType = this.grid[y][x];
      if(fieldType) {
        return fieldType;
      }
    }
  }
};

Level.prototype.elementAt = function(elm) {
  for(let i = 0; i < this.elements.length; i++) {
    const other = this.elements[i];
    if(other != elm &&
                elm.pos.x + elm.size.x > other.pos.x &&
                elm.pos.x < other.pos.x + other.size.x &&
                elm.pos.y + elm.size.y > other.pos.y &&
                elm.pos.y < other.pos.y + other.size.y)
      return other;
  }
};

Level.prototype.playerTouched = function(type, elm) {
  if((type == 'water' || type == 'floater' || type == 'jumper') && this.status == null) {
    this.status = 'lost';
    this.finishDelay = 0;
  } else if(type == 'coin') {
    this.elements = this.elements.filter(other => other != elm);
    this.coins++;
    this.coinText = document.querySelector('.coinCount');
    this.coinText.innerHTML = this.coins + (this.coins == 1 ? ' coin!' : ' coins!');
    if(this.coinText.style.opacity == 0) {
      this.coinText.style.opacity = 1;
    }
  } else if(type == 'victory') {
    this.elements = this.elements.filter(other => other != elm);
    this.status = 'won';
    this.finishDelay = 1;
  }
};

//Check if elements are inside the active range
Level.prototype.isActive = function(elm) {
  if(elm.type == 'player' ||
     elm.type == 'floater' ||
    (elm.pos.x > this.player.pos.x - 5 &&
     elm.pos.x < this.player.pos.x + 25)) {
    return true;
  }
  return false;
};

//Animate the active elements
Level.prototype.animate = function(step, keys) {
  if(this.status != null) {
    this.finishDelay -= step;
  }
  while (step > 0) {
    const thisStep = Math.min(step, 0.05);
    this.elements.forEach(elm => {
      if(this.isActive(elm)) {
        elm.act(thisStep, this, keys), this;
      }
    });
    step -= thisStep;
  }
};

//The vector is used for drawing, movement, positioning etc.
function Vector(x, y) {
  this.x = x;
  this.y = y;
}

Vector.prototype.plus = function(other) {
  return new Vector(this.x + other.x, this.y + other.y);
};

Vector.prototype.times = function(factor) {
  return new Vector(this.x * factor, this.y * factor);
};

//The elements are constructed from their ch in the leveldrawing
const elementChars = {
  '@': Player,
  'o': Coin,
  'V': Victory,
  '=': Floater,
  '|': Jumper
};

//Player class and methods
function Player(pos) {
  this.type = 'player';
  this.pos = pos.plus(new Vector(0.1, 0.1));
  this.size = new Vector(0.9, 0.9);
  this.speed = new Vector(0, 0);
}

Player.prototype.move = function(step, level, keys) {
  this.speed.x = keys.left ? 2 : 8;

  const motion = new Vector(this.speed.x * step, 0),
        newPos = this.pos.plus(motion),
        obstacle = level.obstacleAt(newPos, this.size);

  obstacle ? level.playerTouched(obstacle) : this.pos = newPos;
};

//Physics constants are set manually
const gravity = 36,
      jumpSpeed = 13;

Player.prototype.jump = function(step, level, keys) {
  this.speed.y += step * gravity;
  
  const motion = new Vector(0, this.speed.y * step),
        newPos = this.pos.plus(motion),
        obstacle = level.obstacleAt(newPos, this.size);

  if(obstacle) {
    this.double = false;
    level.playerTouched(obstacle);
    if(keys.up) {
      this.speed.y = -jumpSpeed;
      this.double = true;
    } else {
      this.speed.y = 0;
    }
  } else if(keys.up && this.double) {
      this.speed.y = -jumpSpeed;
      this.double = false;
  } else {
    this.pos = newPos;
  }
};

Player.prototype.act = function(step, level, keys) {
  this.move(step, level, keys);
  this.jump(step, level, keys);

  const otherActor = level.elementAt(this);
  if(otherActor) {
    level.playerTouched(otherActor.type, otherActor);
  }
};

//Enemy classes and methods
function Floater(pos, ch) {
  this.type = 'floater';
  this.pos = pos.plus(new Vector(0.1, 0.2));
  this.size = new Vector(0.8, 0.8);
  this.speed = new Vector(Math.random() * 3 + 3, 0);
};

Floater.prototype.act = function(step, level) {
  const newPos = this.pos.plus(this.speed.times(step));
  if(!level.obstacleAt(newPos, this.size)) {
    this.pos = newPos;
  }
  else {
    this.speed = this.speed.times(-1);
  }
};

function Jumper(pos, ch) {
  this.type = 'jumper';
  this.pos = pos.plus(new Vector(0.1, 0.2));
  this.size = new Vector(0.8, 0.8);
  this.speed = new Vector(0, 0);
}


Jumper.prototype.act = function(step, level) {
  const motion = new Vector(0, this.speed.y * step),
        newPos = this.pos.plus(motion);
  this.speed.y += step * gravity / 2;

  if(level.obstacleAt(newPos.plus(new Vector(0, -1)), this.size)) {
    if(this.speed.y > 0) {
      this.speed.y = -(Math.random() * 6 + 11);
    }
    else {
      this.speed.y = 0;
    }
  } else {
    this.pos = newPos;
  }
};

//Collectible classes and methods
function Coin(pos) {
  this.type = 'coin';
  this.basePos = this.pos = pos.plus(new Vector(0.2, 0.1));
  this.size = new Vector(0.6, 0.6);
  this.wobble = Math.random() * Math.PI * 2;
  //Speed and dist are set as preferred
  this.wobbleSpeed = 6,
  this.wobbleDist = 0.10;
};

Coin.prototype.act = function(step) {
  this.wobble += step * this.wobbleSpeed;
  const wobblePos = Math.sin(this.wobble) * this.wobbleDist;
  this.pos = this.basePos.plus(new Vector(0, wobblePos));
};

function Victory(pos) {
  Coin.call(this, pos);
  this.type = 'victory';
  this.basePos = this.pos = pos.plus(new Vector(0.2, -0.4));
  this.size = new Vector(0, 1);
}
Victory.prototype = Object.create(Coin.prototype);

//For displaying the game I need a quick way of inserting html elements
const insElm = (name, className, text) => {
  const elm = document.createElement(name);
  if(className) {
    elm.className = className;
  }
  if(text) {
    elm.innerHTML = text;
  }
  return elm;
}

//Functions for displaying the game and the elements
function Display(parent, level) {
  this.wrap = parent.appendChild(insElm("div", "game"));
  this.level = level;
  this.wrap.appendChild(this.drawBackground());
  this.elmLayer = null;
  this.drawFrame();
}

//Scale is set manually
const scale = 40;

Display.prototype.drawBackground = function() {
  const table = insElm("table", "background");
  table.style.width = this.level.width * scale + "px";
  this.level.grid.forEach(row => {
    const rowElt = table.appendChild(insElm("tr"));
    rowElt.style.height = scale + "px";
    row.forEach(type => {
      rowElt.appendChild(insElm("td", type));
    });
  });
  return table;
};

Display.prototype.drawElements = function() {
  const wrap = insElm('div');
  this.level.elements.forEach(elm => {
    if(this.level.isActive(elm)) {
      const rect = wrap.appendChild(insElm('div', 'element ' + elm.type));
      rect.style.width = elm.size.x * scale + 'px';
      rect.style.height = elm.size.y * scale + 'px';
      rect.style.left = elm.pos.x * scale + 'px';
      rect.style.top = elm.pos.y * scale + 'px';
      if(elm.type == 'victory') {
        rect.style.borderLeft = scale / 2 +'px solid transparent';
        rect.style.borderRight = scale / 2 + 'px solid transparent';
        rect.style.borderTop = scale + 'px solid rgb(241, 229, 89)';
      } else if (elm.type == 'coin') {
        rect.style.borderRadius = scale / 2 + 'px';
      }
    }
  });
  return wrap;
};

Display.prototype.drawFrame = function() {
  if(this.elmLayer) {
    this.wrap.removeChild(this.elmLayer);
  }
  this.elmLayer = this.wrap.appendChild(this.drawElements());
  this.wrap.className = "game " + (this.level.status || "");
  this.scrollPlayerIntoView();
};

Display.prototype.scrollPlayerIntoView = function() {
  const width = this.wrap.clientWidth,
        margin = width / 6,
        left = this.wrap.scrollLeft,
        player = this.level.player,
        center = player.pos.plus(player.size.times(0.5)).times(scale);

  if(center.x > left + margin) {
    this.wrap.scrollLeft = center.x - margin;
  }
};

//The action handler handles touch or keyboard controls
const action = () => {
  const pressed = Object.create(null), 
        keys = {37: 'left', 38: 'up'};
  
  const touchHandler = event => {
    const length = event.touches.length;
    if(length >= 1) {
      event.preventDefault();
    }
    if(length == 1) {
      if(event.touches[0].pageX > window.innerWidth / 2) {
        pressed['up'] = true, pressed['left'] = false;
      } else {
        pressed['up'] = false, pressed['left'] = true;
      }
    } else if(length > 1) {
      for(let i = 0; i < event.touches.length; i++) {
        const touch = event.touches[i];
        touch.pageX > window.innerWidth / 2 ? pressed['up'] = true : pressed['left'] = true;
      }
    } else {
      pressed['up'] = false, pressed['left'] = false;
    }
  };
    
  const keyHandler = event => {
    if(keys.hasOwnProperty(event.keyCode)) {
      pressed[keys[event.keyCode]] = event.type == 'keydown';
      event.preventDefault();
    }
  };
  addEventListener('keydown', keyHandler);
  addEventListener('keyup', keyHandler);
  addEventListener('touchstart', touchHandler, {passive: false});
  addEventListener('touchend', touchHandler);
  return pressed;
};

const runAnimation = frameFunc => {
  let lastTime = null;
  const frame = time => {
    let stop = false;
    if(lastTime != null) {
      const timeStep = Math.min(time - lastTime, 100) / 1000;
      stop = frameFunc(timeStep) === false;
    }
    lastTime = time;
    if(!stop) {
      requestAnimationFrame(frame);
    }
  } 
  requestAnimationFrame(frame);
};

const controls = action();

//Given a levelplan object, the randomizer will start at start plan, end at end plan and randomize the rest.
const levelRandomizer = levelPlan => {
  let randomLevel = levelPlan.start.slice(0);
  for(let i = 0; i < 10; i++) {
    const randomPlan = Math.round(Math.random() * (levelPlan.plains.length - 1));
    for(let j = 0; j < randomLevel.length; j++)
      randomLevel[j] = randomLevel[j].concat(levelPlan.plains[randomPlan][j]);
  }
  for(let i = 0; i < randomLevel.length; i++)
      randomLevel[i] = randomLevel[i].concat(levelPlan.end[i]);
  return randomLevel;
};

const runGame = () => {
  const level = new Level(levelRandomizer(levelObj)),
        display = new Display(document.body, level);
  runAnimation(step => {
    level.animate(step, controls);
    display.drawFrame();
    if(level.isFinished()) {
      if(level.coinText) {
        level.coinText.style.opacity = 0;
      }
      display.wrap.parentNode.removeChild(display.wrap);
      if(level.status == 'lost') {
        runGame();
      }
      else {
        document.body.appendChild(insElm('h1', 'winmsg', 'You finished the level, and you collected ' +
                                      level.coins +
                                      (level.coins == 1 ? ' coin!' : ' coins!')));
      }
      return false;
    }
  });
};