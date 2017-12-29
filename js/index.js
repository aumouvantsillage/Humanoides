
import "pixi.js";

const BOARD_WIDTH_TL           = 40;
const BOARD_HEIGHT_TL          = 22;
const TILE_WIDTH_PX            = 24;
const TILE_HEIGHT_PX           = 24;
const HUMAN_WIDTH_PX           = 21;
const HUMAN_HEIGHT_PX          = 24;
const HUMAN_SPEED_PX_PER_FRAME = 2; // Pixels / 60 ms
const GRAVITY                  = 0.1;

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
    "X": "human"
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
    "%  H%           %H    @      %%%%%%    %",
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
        return this;
    },

    get xTile() {
        return Math.floor(this.sprite.x / TILE_WIDTH_PX);
    },

    get yTile() {
        return Math.floor(this.sprite.y / TILE_HEIGHT_PX);
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

    update() {
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

        if (this.state === "falling") {
            this.vyPix += GRAVITY;
            console.log(this.vyPix);
        }
        this.sprite.x += this.vxPix;
        this.sprite.y += this.vyPix;

        switch (this.state) {
            case "standing":
                if (this.canHang) {
                    this.hang();
                }
                else if (!this.canStand) {
                    this.fall();
                }
                else if (Game.key.left && this.canMoveLeft) {
                    this.runLeft();
                }
                else if (Game.key.right && this.canMoveRight) {
                    this.runRight();
                }
                else if (Game.key.up && this.canClimbUp) {
                    this.climbUp();
                }
                else if (Game.key.down && this.canClimbDown) {
                    this.climbDown();
                }
                break;
            case "running-left":
                if (this.canHang) {
                    this.finishMove(this.hang);
                }
                else if (!this.canStand) {
                    this.finishMove(this.fall);
                }
                else if (Game.key.right && this.canMoveRight) {
                    this.runRight();
                }
                else if (Game.key.up && this.canClimbUp) {
                    this.finishMove(this.climbUp);
                }
                else if (Game.key.down && this.canClimbDown) {
                    this.finishMove(this.climbDown);
                }
                else if (!Game.key.left || !this.canMoveLeft) {
                    this.finishMove(this.stand);
                }
                break;
            case "running-right":
                if (this.canHang) {
                    this.finishMove(this.hang);
                }
                else if (!this.canStand) {
                    this.finishMove(this.fall);
                }
                else if (Game.key.left && this.canMoveLeft) {
                    this.runLeft();
                }
                else if (Game.key.up && this.canClimbUp) {
                    this.finishMove(this.climbUp);
                }
                else if (Game.key.down && this.canClimbDown) {
                    this.finishMove(this.climbDown);
                }
                else if (!Game.key.right || !this.canMoveRight) {
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
                if (Game.key.down) {
                    this.fall();
                }
                else if (Game.key.left && this.canMoveLeft) {
                    this.hangLeft();
                }
                else if (Game.key.right && this.canMoveRight) {
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
                else if (Game.key.right && this.canMoveRight) {
                    this.hangRight();
                }
                else if (Game.key.up && this.canClimbUp) {
                    this.finishMove(this.climbUp);
                }
                else if (Game.key.down && this.canClimbDown) {
                    this.finishMove(this.climbDown);
                }
                else if (!Game.key.left || !this.canMoveLeft) {
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
                else if (Game.key.left && this.canMoveLeft) {
                    this.hangLeft();
                }
                else if (Game.key.up && this.canClimbUp) {
                    this.finishMove(this.climbUp);
                }
                else if (Game.key.down && this.canClimbDown) {
                    this.finishMove(this.climbDown);
                }
                else if (!Game.key.right || !this.canMoveRight) {
                    this.finishMove(this.hang);
                }
                break;
            case "ladder":
                if (Game.key.left && this.canMoveLeft) {
                    this.runLeft();
                }
                else if (Game.key.right && this.canMoveRight) {
                    this.runRight();
                }
                else if (Game.key.up && this.canClimbUp) {
                    this.climbUp();
                }
                else if (Game.key.down && this.canClimbDown) {
                    this.climbDown();
                }
                else if (Game.key.down && !this.canStand) {
                    this.fall();
                }
                break;
            case "climbing-up":
                if (Game.key.left && this.canMoveLeft) {
                    this.finishMove(this.runLeft);
                }
                else if (Game.key.right && this.canMoveRight) {
                    this.finishMove(this.runRight);
                }
                else if (Game.key.down && this.canClimbDown) {
                    this.climbDown();
                }
                else if (this.canHang) {
                    this.finishMove(this.hang);
                }
                else if (!Game.key.up || !this.canClimbUp) {
                    this.finishMove(this.stand);
                }
                break;
            case "climbing-down":
                if (Game.key.left && this.canMoveLeft) {
                    this.finishMove(this.runLeft);
                }
                else if (Game.key.right && this.canMoveRight) {
                    this.finishMove(this.runRight);
                }
                else if (Game.key.up && this.canClimbUp) {
                    this.climbUp();
                }
                else if (this.canHang) {
                    this.finishMove(this.hang);
                }
                else if (!this.canClimbUp && !this.canClimbDown && !this.canStand) {
                    this.finishMove(this.fall);
                }
                else if (!Game.key.down || !this.canClimbDown) {
                    this.finishMove(this.stand);
                }
                break;
        }
    }
};

const Game = {
    init(board) {
        this.board = board;

        this.renderer = PIXI.autoDetectRenderer(BOARD_WIDTH_TL * TILE_WIDTH_PX, BOARD_HEIGHT_TL * TILE_HEIGHT_PX);
        document.body.appendChild(this.renderer.view);

        this.stage = new PIXI.Container();

        Object.values(SYMBOLS).forEach(name => PIXI.loader.add(`assets/${name}.png`));
        PIXI.loader.load(() => this.setup());

        this.key = {
            left: false,
            right: false,
            up: false,
            down: false
        };
    },

    setup() {
        // For each tile
        this.board.forEach((row, ytl) => {
            row.split("").forEach((symbol, xtl) => {
                if (symbol in SYMBOLS) {
                    // Create a sprite for the current symbol
                    const spriteName = SYMBOLS[symbol];
                    const sprite = new PIXI.Sprite(PIXI.loader.resources[`assets/${spriteName}.png`].texture)

                    // Center the sprite in the current tile
                    sprite.anchor.x = sprite.anchor.y = 0.5;
                    sprite.x = (xtl + 0.5) * TILE_WIDTH_PX;
                    sprite.y = (ytl + 0.5) * TILE_HEIGHT_PX;
                    this.stage.addChild(sprite);

                    // Keep a reference to the human sprite
                    if (spriteName === "human") {
                        this.player = Object.create(Player).init(sprite);
                    }
                }
           });
       });

       this.loop();
   },

    loop() {
        // Loop this function every 60 ms
        requestAnimationFrame(() => this.loop());
        this.update();
    },

    onKeyChange(evt, down) {
        switch (evt.keyCode) {
            case 37: this.key.left  = down; break;
            case 38: this.key.up    = down; break;
            case 39: this.key.right = down; break;
            case 40: this.key.down  = down; break;
        }
    },

    update() {
        this.player.update();
        this.renderer.render(this.stage);
    }
};

window.addEventListener("load", () => Game.init(board1));
window.addEventListener("keydown", (evt) => Game.onKeyChange(evt, true));
window.addEventListener("keyup", (evt) => Game.onKeyChange(evt, false));
