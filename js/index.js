
import "pixi.js";

const BOARD_WIDTH_TL           = 40;
const BOARD_HEIGHT_TL          = 22;
const TILE_WIDTH_PX            = 24;
const TILE_HEIGHT_PX           = 24;
const HUMAN_WIDTH_PX           = 21;
const HUMAN_HEIGHT_PX          = 24;
const HUMAN_SPEED_PX_PER_FRAME = 2; // Pixels / 60 ms
const HUMAN_LIVES              = 3;
const GRAVITY                  = TILE_HEIGHT_PX / BOARD_HEIGHT_TL / 18;
const TILE_HIDE_DELAY_MS       = 5000;
const MARGIN                   = 4;

// TODO add animation for breaking
const HUMAN_POS = {
    "standing": [6],
    "running-left": [0, 1, 2, 3, 4, 5],
    "running-right": [7, 8, 9, 10, 11, 12],
    "hanging": [19],
    "hanging-left": [19, 20, 21, 22],
    "hanging-right": [19, 20, 21, 22],
    "ladder": [18],
    "climbing-up": [15, 16, 17, 18],
    "climbing-down": [15, 16, 17, 18],
    "falling": [13, 13, 13, 14, 14, 14]
};

const FRAMES_PER_ANIMATION_STEP = 5;

const SYMBOLS = {
    "%": "brick",
    "H": "ladder",
    "-": "rope",
    "@": "gift",
    "X": "human",
    "#": "robot"
};

const KEYS = {
    left:       37,
    up:         38,
    right:      39,
    down:       40,
    breakLeft:  87, // W
    breakRight: 88  // X
};

const board1 = [
    "%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%",
    "%       X                              %",
    "%   H%%%%%%%%                          %",
    "%   H%       ------H                   %",
    "%   H%   @  %      H                   %",
    "%   H%%%%%%%%      H     ----H         %",
    "%   H              %%%%%%    H         %",
    "%  H%%%%%%%%%%%%%H %    %    H         %",
    "%  H%           %H % @  %    %%%%%%    %",
    "%  H%           %H %%%%%%    %    %    %",
    "%  H%           %H           % @  %    %",
    "%  H%           %H  # @      %%%%%%    %",
    "%  H%         %%%%%%%%%%%%%%H          %",
    "%  H%         % %          %H          %",
    "%  H%         % %          %H          %",
    "%  H%         % %          %H  @       %",
    "%  H%         % %        %%%%%%%%%%%H  %",
    "%  H%         % %        % %       %H  %",
    "%  H%         % %        % %       %H  %",
    "%  H%         % %        % %       %H  %",
    "%  H%         %%%        %%%       %H  %",
    "%%%H                                H%%%"
];

const Player = {
    init(sprite) {
        this.sprite = sprite;
        this.state = "standing";
        this.step = 0;
        this.vxPix = 0;
        this.vyPix = 0;
        this.frameCounter = 0;
        this.commands = {};
        for (let key in KEYS) {
            this.commands[key] = false;
        }
        return this;
    },

    get xTile() {
        return Math.floor(this.sprite.x / TILE_WIDTH_PX);
    },

    set xTile(x) {
        this.sprite.x = (x + 0.5) * TILE_WIDTH_PX;
    },

    get yTile() {
        return Math.floor(this.sprite.y / TILE_HEIGHT_PX);
    },

    set yTile(y) {
        this.sprite.y = (y + 0.5) * TILE_HEIGHT_PX;
    },

    get xPix() {
        return this.sprite.x;
    },

    get yPix() {
        return this.sprite.y;
    },

    get canMoveLeft() {
        return this.xTile > 0 && Game.board[this.yTile][this.xTile - 1] !== '%';
    },

    get canMoveRight() {
        return this.xTile < BOARD_WIDTH_TL - 1 && Game.board[this.yTile][this.xTile + 1] !== '%';
    },

    get canStand() {
        return this.yTile == BOARD_HEIGHT_TL - 1 ||
               Game.board[this.yTile + 1][this.xTile] === '%' ||
               Game.board[this.yTile + 1][this.xTile] === 'H';
    },

    get canHang() {
        return Game.board[this.yTile][this.xTile] === '-';
    },

    get canClimbUp() {
        return Game.board[this.yTile][this.xTile] === 'H';
    },

    get canClimbDown() {
        return this.yTile < BOARD_HEIGHT_TL - 1 && Game.board[this.yTile + 1][this.xTile] === 'H';
    },

    get canBreakLeft() {
        return this.yTile < BOARD_HEIGHT_TL - 1 && this.xTile > 0 && Game.board[this.yTile + 1][this.xTile - 1] === '%';
    },

    get canBreakRight() {
        return this.yTile < BOARD_HEIGHT_TL - 1 && this.xTile < BOARD_WIDTH_TL - 1 && Game.board[this.yTile + 1][this.xTile + 1] === '%';
    },

    stand() {
        if (this.canClimbUp) {
            this.state = "ladder";
        }
        else {
            this.state = "standing";
        }
        this.step = 0;
        this.vxPix = 0;
        this.vyPix = 0;
    },

    runLeft() {
        this.state = "running-left";
        this.step = 0;
        this.vxPix = -HUMAN_SPEED_PX_PER_FRAME;
        this.vyPix = 0;
    },

    runRight() {
        this.state = "running-right";
        this.step = 0;
        this.vxPix = HUMAN_SPEED_PX_PER_FRAME;
        this.vyPix = 0;
    },

    fall() {
        this.state = "falling";
        this.step = 0;
        this.vxPix = 0;
        this.vyPix = 0;
    },

    hang() {
        this.state = "hanging";
        this.step = 0;
        this.vxPix = 0;
        this.vyPix = 0;
    },

    hangLeft() {
        this.state = "hanging-left";
        this.step = 0;
        this.vxPix = -HUMAN_SPEED_PX_PER_FRAME;
        this.vyPix = 0;
    },

    hangRight() {
        this.state = "hanging-right";
        this.step = 0;
        this.vxPix = HUMAN_SPEED_PX_PER_FRAME;
        this.vyPix = 0;
    },

    climbUp() {
        this.state = "climbing-up";
        this.step = 0;
        this.vxPix = 0;
        this.vyPix = -HUMAN_SPEED_PX_PER_FRAME;
    },

    climbDown() {
        this.state = "climbing-down";
        this.step = 0;
        this.vxPix = 0;
        this.vyPix = HUMAN_SPEED_PX_PER_FRAME;
    },

    finishMove(method) {
        let xTileCenterPix = (this.xTile + 0.5) * TILE_WIDTH_PX;

        if ((this.state === "running-left"  || this.state == "hanging-left")  && this.xPix > xTileCenterPix && this.xPix + this.vxPix <= xTileCenterPix ||
            (this.state === "running-right" || this.state == "hanging-right") && this.xPix < xTileCenterPix && this.xPix + this.vxPix >= xTileCenterPix) {
            this.sprite.x = xTileCenterPix;
            method.call(this);
        }

        let yTileCenterPix = (this.yTile + 0.5) * TILE_HEIGHT_PX;

        if ( this.state === "climbing-up"                               && this.yPix > yTileCenterPix && this.yPix + this.vyPix <= yTileCenterPix ||
            (this.state === "climbing-down" || this.state == "falling") && this.yPix < yTileCenterPix && this.yPix + this.vyPix >= yTileCenterPix) {
            this.sprite.y = yTileCenterPix;
            method.call(this);
        }
    },

    moveToEmptyLocation(y, x) {
        const positions = [ [y - 1, x], [y, x - 1], [y, x + 1], [y + 1, x]];

        for (let p of positions) {
            if (p[0] >= 0 && p[0] < BOARD_HEIGHT_TL &&
                p[1] >= 0 && p[1] < BOARD_WIDTH_TL  &&
                Game.board[p[0]][p[1]] !== '%') {
                this.yTile = p[0];
                this.xTile = p[1];
                this.stand();
                break;
            }
        }
    },

    update() {
        // Animate the sprite.
        this.frameCounter ++;
        if (this.frameCounter % FRAMES_PER_ANIMATION_STEP === 0) {
            // Animate the sprite
            const anim = HUMAN_POS[this.state];
            this.sprite.texture.frame = new PIXI.Rectangle(anim[this.step] * HUMAN_WIDTH_PX + 0.5, 0, HUMAN_WIDTH_PX - 1, HUMAN_HEIGHT_PX);

            // Move to next animation step
            this.step ++;
            if (this.step === anim.length) {
                this.step = 0;
            }
        }

        // Move the sprite.
        if (this.state === "falling") {
            this.vyPix += GRAVITY;
        }
        this.sprite.x += this.vxPix;
        this.sprite.y += this.vyPix;

        // Compute next state.
        switch (this.state) {
            case "standing":
                if (this.commands.breakLeft && this.canBreakLeft) {
                    Game.breakBrick(this.yTile + 1, this.xTile - 1);
                }
                else if (this.commands.breakRight && this.canBreakRight) {
                    Game.breakBrick(this.yTile + 1, this.xTile + 1);
                }
                else if (this.canHang) {
                    this.hang();
                }
                else if (!this.canStand && !this.canClimbUp) {
                    this.fall();
                }
                else if (this.commands.left && this.canMoveLeft) {
                    this.runLeft();
                }
                else if (this.commands.right && this.canMoveRight) {
                    this.runRight();
                }
                else if (this.commands.up && this.canClimbUp) {
                    this.climbUp();
                }
                else if (this.commands.down && this.canClimbDown) {
                    this.climbDown();
                }
                break;
            case "running-left":
                if (this.canHang) {
                    this.finishMove(this.hang);
                }
                else if (!this.canStand && !this.canClimbUp) {
                    this.finishMove(this.fall);
                }
                else if (this.commands.right && this.canMoveRight) {
                    this.runRight();
                }
                else if (this.commands.up && this.canClimbUp) {
                    this.finishMove(this.climbUp);
                }
                else if (this.commands.down && this.canClimbDown) {
                    this.finishMove(this.climbDown);
                }
                else if (!this.commands.left || !this.canMoveLeft) {
                    this.finishMove(this.stand);
                }
                break;
            case "running-right":
                if (this.canHang) {
                    this.finishMove(this.hang);
                }
                else if (!this.canStand && !this.canClimbUp) {
                    this.finishMove(this.fall);
                }
                else if (this.commands.left && this.canMoveLeft) {
                    this.runLeft();
                }
                else if (this.commands.up && this.canClimbUp) {
                    this.finishMove(this.climbUp);
                }
                else if (this.commands.down && this.canClimbDown) {
                    this.finishMove(this.climbDown);
                }
                else if (!this.commands.right || !this.canMoveRight) {
                    this.finishMove(this.stand);
                }
                break;
            case "falling":
                if (this.canStand) {
                    this.finishMove(this.stand);
                }
                else if (this.canHang) {
                    this.finishMove(this.hang);
                }
                break;
            case "hanging":
                if (this.commands.down) {
                    this.fall();
                }
                else if (this.commands.left && this.canMoveLeft) {
                    this.hangLeft();
                }
                else if (this.commands.right && this.canMoveRight) {
                    this.hangRight();
                }
                break;
            case "hanging-left":
                if (this.canStand) {
                    this.finishMove(this.stand);
                }
                else if (!this.canHang) {
                    this.finishMove(this.fall);
                }
                else if (this.commands.right && this.canMoveRight) {
                    this.hangRight();
                }
                else if (this.commands.up && this.canClimbUp) {
                    this.finishMove(this.climbUp);
                }
                else if (this.commands.down && this.canClimbDown) {
                    this.finishMove(this.climbDown);
                }
                else if (!this.commands.left || !this.canMoveLeft) {
                    this.finishMove(this.hang);
                }
                break;
            case "hanging-right":
                if (this.canStand) {
                    this.finishMove(this.stand);
                }
                else if (!this.canHang) {
                    this.finishMove(this.fall);
                }
                else if (this.commands.left && this.canMoveLeft) {
                    this.hangLeft();
                }
                else if (this.commands.up && this.canClimbUp) {
                    this.finishMove(this.climbUp);
                }
                else if (this.commands.down && this.canClimbDown) {
                    this.finishMove(this.climbDown);
                }
                else if (!this.commands.right || !this.canMoveRight) {
                    this.finishMove(this.hang);
                }
                break;
            case "ladder":
                if (this.commands.breakLeft && this.canBreakLeft) {
                    Game.breakBrick(this.yTile + 1, this.xTile - 1);
                }
                else if (this.commands.breakRight && this.canBreakRight) {
                    Game.breakBrick(this.yTile + 1, this.xTile + 1);
                }
                else if (this.commands.left && this.canMoveLeft) {
                    this.runLeft();
                }
                else if (this.commands.right && this.canMoveRight) {
                    this.runRight();
                }
                else if (this.commands.up && this.canClimbUp) {
                    this.climbUp();
                }
                else if (this.commands.down && this.canClimbDown) {
                    this.climbDown();
                }
                else if (this.commands.down && !this.canStand) {
                    this.fall();
                }
                break;
            case "climbing-up":
                if (this.commands.left && this.canMoveLeft) {
                    this.finishMove(this.runLeft);
                }
                else if (this.commands.right && this.canMoveRight) {
                    this.finishMove(this.runRight);
                }
                else if (this.commands.down && this.canClimbDown) {
                    this.climbDown();
                }
                else if (this.canHang) {
                    this.finishMove(this.hang);
                }
                else if (!this.commands.up || !this.canClimbUp) {
                    this.finishMove(this.stand);
                }
                break;
            case "climbing-down":
                if (this.commands.left && this.canMoveLeft) {
                    this.finishMove(this.runLeft);
                }
                else if (this.commands.right && this.canMoveRight) {
                    this.finishMove(this.runRight);
                }
                else if (this.commands.up && this.canClimbUp) {
                    this.climbUp();
                }
                else if (this.canHang) {
                    this.finishMove(this.hang);
                }
                else if (!this.canClimbUp && !this.canClimbDown && !this.canStand) {
                    this.finishMove(this.fall);
                }
                else if (!this.commands.down || !this.canClimbDown) {
                    this.finishMove(this.stand);
                }
                break;
        }
    }
};

const Human = Object.create(Player);

Human.init = function (sprite) {
    Player.init.call(this, sprite);
    this.score = 0;
    return this;
};

Human.update = function () {
    Player.update.call(this);

    // Collect gifts
    if (Game.board[this.yTile][this.xTile] === '@') {
        Game.board[this.yTile][this.xTile] = ' ';
        let tile = Game.tiles[this.yTile][this.xTile];
        tile.x = (BOARD_WIDTH_TL  - 0.5) * TILE_WIDTH_PX - this.score * (TILE_WIDTH_PX + MARGIN) - MARGIN;
        tile.y = (BOARD_HEIGHT_TL + 0.5) * TILE_HEIGHT_PX + MARGIN;
        this.score ++;
    }
};

const Robot = Object.create(Player);

Robot.update = function () {
    this.commands = {
        left: false,
        right: false,
        top: false,
        bottom: false
    };

    if (Game.player.xTile > this.xTile && (this.canStand || this.canHang) && this.canMoveRight) {
        this.commands.right = true;
    }
    if (Game.player.xTile < this.xTile && (this.canStand || this.canHang) && this.canMoveLeft) {
        this.commands.left = true;
    }
    if (Game.player.yTile > this.yTile && this.canClimbDown) {
        this.commands.down = true;
    }
    if (Game.player.yTile < this.yTile && this.canClimbUp) {
        this.commands.up = true;
    }

    Player.update.call(this);
};

const Game = {
    init(board) {
        this.board = board.map(row => row.split(""));

        this.renderer = PIXI.autoDetectRenderer(BOARD_WIDTH_TL * TILE_WIDTH_PX, (BOARD_HEIGHT_TL + 1) * TILE_HEIGHT_PX + 2 * MARGIN);
        document.body.appendChild(this.renderer.view);

        this.stage = new PIXI.Container();

        Object.values(SYMBOLS).forEach(name => PIXI.loader.add(`assets/${name}.png`));
        PIXI.loader.load(() => this.setup());
    },

    setup() {
        // Load textures.
        let textures = {};
        for (let symbol in SYMBOLS) {
            const spriteName = SYMBOLS[symbol];
            textures[spriteName] = PIXI.BaseTexture.fromImage(`assets/${spriteName}.png`);
        }

        this.robots = [];
        this.tiles = [];

        // For each tile
        this.board.forEach((row, ytl) => {
            const tileRow = [];
            this.tiles.push(tileRow);

            row.forEach((symbol, xtl) => {
                if (symbol in SYMBOLS) {
                    // Create a sprite for the current symbol
                    const spriteName = SYMBOLS[symbol];
                    const texture = new PIXI.Texture(textures[spriteName]);
                    const sprite = new PIXI.Sprite(texture);

                    // Center the sprite in the current tile
                    sprite.anchor.x = sprite.anchor.y = 0.5;
                    sprite.x = (xtl + 0.5) * TILE_WIDTH_PX;
                    sprite.y = (ytl + 0.5) * TILE_HEIGHT_PX;
                    this.stage.addChild(sprite);

                    // Keep a reference to the human sprite
                    switch (spriteName) {
                        case "human":
                            this.player = Object.create(Human).init(sprite);
                            tileRow.push(null);
                            break;
                        case "robot":
                            this.robots.push(Object.create(Robot).init(sprite));
                            tileRow.push(null);
                            break;
                        default:
                            tileRow.push(sprite);
                    }
                }
                else {
                    tileRow.push(null);
                }
           });

           // Show remaining lives at the bottom of the screen.
           this.lifeSprites = [];
           const frame = new PIXI.Rectangle(HUMAN_POS.standing[0] * HUMAN_WIDTH_PX + 0.5, 0, HUMAN_WIDTH_PX - 1, HUMAN_HEIGHT_PX)
           const texture = new PIXI.Texture(textures.human, frame);
           for (let i = 0; i < HUMAN_LIVES; i ++) {
               const sprite = new PIXI.Sprite(texture);
               sprite.anchor.x = sprite.anchor.y = 0.5;
               sprite.x = (i               + 0.5) * TILE_WIDTH_PX  + MARGIN;
               sprite.y = (BOARD_HEIGHT_TL + 0.5) * TILE_HEIGHT_PX + MARGIN;
               this.stage.addChild(sprite);

               this.lifeSprites.push(sprite);
           }
       });

       this.loop();
   },

    loop() {
        // Loop this function every 60 ms
        requestAnimationFrame(() => this.loop());
        this.update();
    },

    onKeyChange(evt, down) {
        for (let key in KEYS) {
            if (KEYS[key] === evt.keyCode) {
                this.player.commands[key] = down;
                evt.preventDefault();
                evt.stopPropagation();
                return;
            }
        }
    },

    update() {
        this.player.update();
        this.robots.forEach(r => r.update());
        this.renderer.render(this.stage);
    },

    removeTile(y, x) {
        let symbol = this.board[y][x];
        let tile = this.tiles[y][x];

        // Remove the current tile.
        this.board[y][x] = ' ';
        tile.visible = false;

        return [symbol, tile];
    },

    breakBrick(y, x) {
        let [symbol, tile] = this.removeTile(y, x);

        // Show it again after a given delay.
        window.setTimeout(() => {
            this.board[y][x] = symbol;
            tile.visible = true;

            if (this.player.xTile === x && this.player.yTile === y) {
                this.player.moveToEmptyLocation(y, x);
            }

            this.robots.forEach(r => {
                if (r.xTile === x && r.yTile === y) {
                    r.moveToEmptyLocation(y, x);
                }
            });
        }, TILE_HIDE_DELAY_MS);
    }
};

window.addEventListener("load", () => Game.init(board1));
window.addEventListener("keydown", (evt) => Game.onKeyChange(evt, true));
window.addEventListener("keyup", (evt) => Game.onKeyChange(evt, false));
