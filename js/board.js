
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
    left:       37,
    up:         38,
    right:      39,
    down:       40,
    breakLeft:  87, // W
    breakRight: 88  // X
};

export const Board = {
    init(data) {
        this.rows = data.map(row => row.split(""));
        this.widthTiles = Math.max(...this.rows.map(r => r.length));
        this.heightTiles = this.rows.length;
        this.gifts = [];
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
                            this.gifts.push({x: xtl, y: ytl});
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

       window.addEventListener("keydown", (evt) => this.onKeyChange(evt, true));
       window.addEventListener("keyup", (evt)   => this.onKeyChange(evt, false));

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

    removeTile(y, x) {
        let symbol = this.rows[y][x];
        let tile = this.tiles[y][x];

        // Remove the current tile.
        this.rows[y][x] = ' ';
        tile.visible = false;

        return [symbol, tile];
    },

    breakBrick(y, x) {
        let [symbol, tile] = this.removeTile(y, x);

        // Show it again after a given delay.
        window.setTimeout(() => {
            this.rows[y][x] = symbol;
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
    },

    collectGift({x, y, index}) {
        this.gifts.splice(index, 1);
        this.rows[y][x] = ' ';
        let tile = this.tiles[y][x];
        tile.x = (this.widthTiles  - 0.5) * TILE_WIDTH_PX - this.gifts.length * (TILE_WIDTH_PX + MARGIN) - MARGIN;
        tile.y = (this.heightTiles + 0.5) * TILE_HEIGHT_PX + MARGIN;
    }
};
