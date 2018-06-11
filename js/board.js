
import "pixi.js";
import * as player from "./player.js";
import {Human} from "./human.js";
import {Robot} from "./robot.js";

const TILE_WIDTH_PX      = 24;
const TILE_HEIGHT_PX     = 24;
const MARGIN             = 4;
const HUMAN_LIVES        = 3;
const TILE_HIDE_DELAY_MS = 5000;

const SYMBOLS = {
    "%": "brick",
    "H": "ladder",
    "-": "rope",
    "@": "gift",
    "X": "human",
    "#": "robot"
};

const KEYS = {
    left:       ["ArrowLeft"],
    up:         ["ArrowUp"],
    right:      ["ArrowRight"],
    down:       ["ArrowDown"],
    breakLeft:  ["s", "S"],
    breakRight: ["d", "D"]
};

export const Board = {
    init(data) {
        this.rows = data.map(row => row.split(""));
        this.widthTiles = Math.max(...this.rows.map(r => r.length));
        this.heightTiles = this.rows.length;
        this.gifts = [];
        this.hintMaps = [];
        this.distanceMaps = [];
        this.gravity = TILE_HEIGHT_PX / this.heightTiles / 18;

        this.renderer = PIXI.autoDetectRenderer(this.widthTiles * TILE_WIDTH_PX, (this.heightTiles + 1) * TILE_HEIGHT_PX + 2 * MARGIN);
        document.body.appendChild(this.renderer.view);

        this.stage = new PIXI.Container();

        Object.values(SYMBOLS).forEach(name => PIXI.loader.add(`assets/${name}.png`));
        PIXI.loader.load(() => this.setup());

        return this;
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
        this.rows.forEach((row, ytl) => {
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
                    sprite.x = this.xTileToPix(xtl);
                    sprite.y = this.yTileToPix(ytl);
                    this.stage.addChild(sprite);

                    // Keep a reference to the human sprite
                    switch (spriteName) {
                        case "human":
                            this.player = Object.create(Human).init(this, sprite);
                            tileRow.push(null);
                            break;
                        case "robot":
                            this.robots.push(Object.create(Robot).init(this, sprite));
                            tileRow.push(null);
                            break;
                        case "gift":
                            this.gifts.push({x: xtl, y: ytl, collected: false});
                            tileRow.push(sprite);
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
           const texture = new PIXI.Texture(textures.human, player.getDefaultFrame());
           for (let i = 0; i < HUMAN_LIVES; i ++) {
               const sprite = new PIXI.Sprite(texture);
               sprite.anchor.x = sprite.anchor.y = 0.5;
               sprite.x = (i                + 0.5) * TILE_WIDTH_PX  + MARGIN;
               sprite.y = (this.heightTiles + 0.5) * TILE_HEIGHT_PX + MARGIN;
               this.stage.addChild(sprite);

               this.lifeSprites.push(sprite);
           }
       });

       this.remainingGifts = this.gifts.length;

       this.setupHintMaps();
       this.setupDistanceMaps();

       window.addEventListener("keydown", (evt) => this.onKeyChange(evt, true));
       window.addEventListener("keyup", (evt)   => this.onKeyChange(evt, false));

       this.loop();
   },

   setupHintMaps() {
       // TODO create hintMaps using a path-finding algorithm.
       this.hintMaps = this.gifts.map(({x, y}) => {
           return this.rows.map((r, yt) => r.map((c, xt) => {
               if (!this.canStand(xt, yt)) {
                   return 'F';
               }
               if (x > xt && (this.canStand(xt, yt) || this.canHang(xt, yt)) && this.canMoveRight(xt, yt)) {
                   return 'R';
               }
               if (x < xt && (this.canStand(xt, yt) || this.canHang(xt, yt)) && this.canMoveLeft(xt, yt)) {
                   return 'L';
               }
               if (y > yt && this.canClimbDown(xt, yt)) {
                   return 'D';
               }
               if (y < yt && this.canClimbUp(xt, yt)) {
                   return 'U';
               }
               return 'X';
           }));
       });
   },

   setupDistanceMaps() {
       // TODO use hintMaps to compute distance
       this.distanceMaps = this.gifts.map(({x, y}) => {
           return this.rows.map((r, yt) => r.map((c, xt) => {
               // Use the Manhattan distance.
               return Math.abs(x - xt) + Math.abs(y - yt);
           }));
       })
   },

   loop() {
        // Loop this function every 60 ms
        requestAnimationFrame(() => this.loop());
        this.update();
    },

    onKeyChange(evt, down) {
        for (let key in KEYS) {
            if (KEYS[key].indexOf(evt.key) >= 0) {
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

    xPixToTile(x) {
        return Math.floor(x / TILE_WIDTH_PX);
    },

    yPixToTile(y) {
        return Math.floor(y / TILE_HEIGHT_PX);
    },

    xTileToPix(x) {
        return (x + 0.5) * TILE_WIDTH_PX;
    },

    yTileToPix(y) {
        return (y + 0.5) * TILE_HEIGHT_PX;
    },

    getTileType(x, y) {
        const symbol = this.rows[y][x];
        if (symbol in SYMBOLS) {
            return SYMBOLS[symbol];
        }
        return "empty";
    },

    getDistanceToGift(x, y, g) {
        return this.distanceMaps[this.gifts.indexOf(g)][y][x];
    },

    getNearestGift(x, y) {
        return this.gifts.filter(g => !g.collected).reduce((a, b) => {
            return this.getDistanceToGift(x, y, a) < this.getDistanceToGift(x, y, b) ?
                a : b;
        });
    },

    getHint(x, y) {
        const gift = this.player.nearestGift;
        if (!gift) {
            return 'X';
        }
        const hintMap = this.hintMaps[this.gifts.indexOf(gift)];
        return hintMap[y][x];
    },

    canMoveLeft(x, y) {
        return x > 0 && this.getTileType(x - 1, y) !== "brick";
    },

    canMoveRight(x, y) {
        return x < this.widthTiles - 1 && this.getTileType(x + 1, y) !== "brick";
    },

    canStand(x, y) {
        return y == this.heightTiles - 1 ||
               this.getTileType(x, y + 1) === "brick" ||
               this.getTileType(x, y + 1) === "ladder";
    },

    canHang(x, y) {
        return this.getTileType(x, y) === "rope";
    },

    canClimbUp(x, y) {
        return this.getTileType(x, y) === "ladder";
    },

    canClimbDown(x, y) {
        return y < this.heightTiles - 1 && this.getTileType(x, y + 1) === "ladder";
    },

    canBreakLeft(x, y) {
        return y < this.heightTiles - 1 && x > 0 && this.getTileType(x - 1, y + 1) === "brick";
    },

    canBreakRight(x, y) {
        return y < this.heightTiles - 1 && x < this.widthTiles - 1 && this.getTileType(x + 1, y + 1) === "brick";
    },

    removeTile(x, y) {
        let symbol = this.rows[y][x];
        let tile = this.tiles[y][x];

        // Remove the current tile.
        this.rows[y][x] = ' ';
        tile.visible = false;

        return [symbol, tile];
    },

    breakBrick(x, y) {
        let [symbol, tile] = this.removeTile(x, y);

        // Show it again after a given delay.
        window.setTimeout(() => {
            this.rows[y][x] = symbol;
            tile.visible = true;

            if (this.player.xTile === x && this.player.yTile === y) {
                this.player.moveToEmptyLocation(x, y);
            }

            this.robots.forEach(r => {
                if (r.xTile === x && r.yTile === y) {
                    r.moveToEmptyLocation(x, y);
                }
            });
        }, TILE_HIDE_DELAY_MS);
    },

    collectGift(g) {
        g.collected = true;
        this.remainingGifts --;
        this.rows[g.y][g.x] = ' ';
        let tile = this.tiles[g.y][g.x];
        tile.x = (this.widthTiles  - 0.5) * TILE_WIDTH_PX - this.remainingGifts * (TILE_WIDTH_PX + MARGIN) - MARGIN;
        tile.y = (this.heightTiles + 0.5) * TILE_HEIGHT_PX + MARGIN;
    }
};
