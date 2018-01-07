
import "pixi.js";

const FRAMES_PER_ANIMATION_STEP = 5;
const PLAYER_WIDTH_PX           = 21;
const PLAYER_HEIGHT_PX          = 24;
const PLAYER_SPEED_PX_PER_FRAME = 2; // Pixels / 60 ms

// TODO add animation for breaking
const PLAYER_STATES = {
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

export function getDefaultFrame() {
     return new PIXI.Rectangle(PLAYER_STATES.standing[0] * PLAYER_WIDTH_PX + 0.5, 0, PLAYER_WIDTH_PX - 1, PLAYER_HEIGHT_PX);
}

export const Player = {
    init(board, sprite) {
        this.board = board;
        this.sprite = sprite;
        this.state = "standing";
        this.step = 0;
        this.vxPix = 0;
        this.vyPix = 0;
        this.frameCounter = 0;
        this.commands = {};

        this.sprite.texture.frame = getDefaultFrame();

        return this;
    },

    get xTile() {
        return this.board.xPixToTile(this.sprite.x);
    },

    set xTile(x) {
        this.sprite.x = this.board.xTileToPix(x);
    },

    get yTile() {
        return this.board.yPixToTile(this.sprite.y);
    },

    set yTile(y) {
        this.sprite.y = this.board.yTileToPix(y);
    },

    get xPix() {
        return this.sprite.x;
    },

    get yPix() {
        return this.sprite.y;
    },

    get closestGift() {
        let result = {x: this.xTile, y: this.yTile, index: -1};
        let dmin = this.board.widthTiles + this.board.heightTiles;
        this.board.gifts.forEach((loc, index) => {
            // Use the Manhattan distance.
            const d = Math.abs(loc.x - this.xTile) + Math.abs(loc.y - this.yTile);
            if (d < dmin) {
                result = {x: loc.x, y: loc.y, index};
                dmin = d;
            }
        });
        return result;
    },

    get canMoveLeft() {
        return this.xTile > 0 && this.board.rows[this.yTile][this.xTile - 1] !== '%';
    },

    get canMoveRight() {
        return this.xTile < this.board.widthTiles - 1 && this.board.rows[this.yTile][this.xTile + 1] !== '%';
    },

    get canStand() {
        return this.yTile == this.board.heightTiles - 1 ||
               this.board.rows[this.yTile + 1][this.xTile] === '%' ||
               this.board.rows[this.yTile + 1][this.xTile] === 'H';
    },

    get canHang() {
        return this.board.rows[this.yTile][this.xTile] === '-';
    },

    get canClimbUp() {
        return this.board.rows[this.yTile][this.xTile] === 'H';
    },

    get canClimbDown() {
        return this.yTile < this.board.heightTiles - 1 && this.board.rows[this.yTile + 1][this.xTile] === 'H';
    },

    get canBreakLeft() {
        return this.yTile < this.board.heightTiles - 1 && this.xTile > 0 && this.board.rows[this.yTile + 1][this.xTile - 1] === '%';
    },

    get canBreakRight() {
        return this.yTile < this.board.heightTiles - 1 && this.xTile < this.board.widthTiles - 1 && this.board.rows[this.yTile + 1][this.xTile + 1] === '%';
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
        this.vxPix = -PLAYER_SPEED_PX_PER_FRAME;
        this.vyPix = 0;
    },

    runRight() {
        this.state = "running-right";
        this.step = 0;
        this.vxPix = PLAYER_SPEED_PX_PER_FRAME;
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
        this.vxPix = -PLAYER_SPEED_PX_PER_FRAME;
        this.vyPix = 0;
    },

    hangRight() {
        this.state = "hanging-right";
        this.step = 0;
        this.vxPix = PLAYER_SPEED_PX_PER_FRAME;
        this.vyPix = 0;
    },

    climbUp() {
        this.state = "climbing-up";
        this.step = 0;
        this.vxPix = 0;
        this.vyPix = -PLAYER_SPEED_PX_PER_FRAME;
    },

    climbDown() {
        this.state = "climbing-down";
        this.step = 0;
        this.vxPix = 0;
        this.vyPix = PLAYER_SPEED_PX_PER_FRAME;
    },

    finishMove(method) {
        let xTileCenterPix = this.board.xTileToPix(this.xTile);

        if ((this.state === "running-left"  || this.state == "hanging-left")  && this.xPix > xTileCenterPix && this.xPix + this.vxPix <= xTileCenterPix ||
            (this.state === "running-right" || this.state == "hanging-right") && this.xPix < xTileCenterPix && this.xPix + this.vxPix >= xTileCenterPix) {
            this.sprite.x = xTileCenterPix;
            method.call(this);
        }

        let yTileCenterPix = this.board.yTileToPix(this.yTile);

        if ( this.state === "climbing-up"                               && this.yPix > yTileCenterPix && this.yPix + this.vyPix <= yTileCenterPix ||
            (this.state === "climbing-down" || this.state == "falling") && this.yPix < yTileCenterPix && this.yPix + this.vyPix >= yTileCenterPix) {
            this.sprite.y = yTileCenterPix;
            method.call(this);
        }
    },

    moveToEmptyLocation(y, x) {
        const positions = [ [y - 1, x], [y, x - 1], [y, x + 1], [y + 1, x]];

        for (let p of positions) {
            if (p[0] >= 0 && p[0] < this.board.heightTiles &&
                p[1] >= 0 && p[1] < this.board.widthTiles  &&
                this.board.rows[p[0]][p[1]] !== '%') {
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
            const anim = PLAYER_STATES[this.state];
            this.sprite.texture.frame = new PIXI.Rectangle(anim[this.step] * PLAYER_WIDTH_PX + 0.5, 0, PLAYER_WIDTH_PX - 1, PLAYER_HEIGHT_PX);

            // Move to next animation step
            this.step ++;
            if (this.step === anim.length) {
                this.step = 0;
            }
        }

        // Move the sprite.
        if (this.state === "falling") {
            this.vyPix += this.board.gravity;
        }
        this.sprite.x += this.vxPix;
        this.sprite.y += this.vyPix;

        // Compute next state.
        switch (this.state) {
            case "standing":
                if (this.commands.breakLeft && this.canBreakLeft) {
                    this.board.breakBrick(this.yTile + 1, this.xTile - 1);
                }
                else if (this.commands.breakRight && this.canBreakRight) {
                    this.board.breakBrick(this.yTile + 1, this.xTile + 1);
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
                    this.board.breakBrick(this.yTile + 1, this.xTile - 1);
                }
                else if (this.commands.breakRight && this.canBreakRight) {
                    this.board.breakBrick(this.yTile + 1, this.xTile + 1);
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
