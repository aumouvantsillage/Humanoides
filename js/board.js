
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
       // Initialize the map with empty cells.
       this.hintMaps = this.gifts.map(g => this.rows.map(r => r.map(c => '?')));

       this.gifts.forEach((g, gi) => {
           this.hintMaps[gi][g.y][g.x] = '@';

           // Compute the hint map for the current gift.
           this.hintMaps[gi].forEach((r, y) => r.forEach((c, x) => {
               // If a path passes by (x, y), move to the next cell.
               if (c !== '?' || this.getTileType(x, y) === "brick") {
                   return;
               }

               // Compute a path from (x, y) to (g.x, g.y) using the A* algorithm.
               const closedList = [];
               const openList = [{x, y, cost: 0, distance: 0, prev: null}];
               let currentNode;
               while (openList.length) {
                   // Get the unexplored node with the lowest estimated path length.
                   currentNode = openList.shift();

                   // If the current node is the target, stop the exploration.
                   if (currentNode.x === g.x && currentNode.y === g.y) {
                       break;
                   }

                   // Add the current node to the list of explored nodes.
                   closedList.push(currentNode);

                   // Build a list of the neighbors of the current node.
                   // The list is based on the possible movements of the player at the current location.
                   const neighbors = [];
                   function addNeighbor(x, y) {
                       neighbors.push({x, y, prev: currentNode, cost: currentNode.cost + 1, distance: Math.abs(g.x - x) + Math.abs(g.y - y)})
                   }

                   if (this.canStand(currentNode.x, currentNode.y) || this.canHang(currentNode.x, currentNode.y)) {
                       if (this.canMoveRight(currentNode.x, currentNode.y)) {
                           addNeighbor(currentNode.x + 1, currentNode.y);
                       }
                       if (this.canMoveLeft(currentNode.x, currentNode.y)) {
                           addNeighbor(currentNode.x - 1, currentNode.y);
                       }
                       if (this.canClimbDown(currentNode.x, currentNode.y) || this.canHang(currentNode.x, currentNode.y)) {
                           addNeighbor(currentNode.x, currentNode.y + 1);
                       }
                   }
                   else {
                       addNeighbor(currentNode.x, currentNode.y + 1);
                   }
                   if (this.canClimbUp(currentNode.x, currentNode.y)) {
                       addNeighbor(currentNode.x, currentNode.y - 1);
                   }

                   neighbors.forEach(n => {
                       // If a neighbor has already been explored, ignore it.
                       if (closedList.some(v => v.x === n.x && v.y === n.y)) {
                           return;
                       }

                       // Check if a neighbor is already in the list of nodes to explore.
                       let other = openList.find(v => v.x === n.x && v.y === n.y);
                       if (!other) {
                           // If not, add the current neighbor to the list.
                           openList.push(n);
                       }
                       else if (other.cost > n.cost) {
                           // If the current neighbor is already in the list of nodes to explore
                           // and it improves the cost, update the cost and the link to the previous node.
                           other.cost = n.cost;
                           other.prev = n.prev;
                       }
                   });

                   // Sort the open list by increasing estimated path length.
                   openList.sort((a, b) => (a.cost + a.distance) - (b.cost + b.distance));
               }

               // TODO what if there is no valid path.
               for (let node = currentNode; node.prev; node = node.prev) {
                   this.hintMaps[gi][node.prev.y][node.prev.x] =
                       node.x < node.prev.x ? 'L' :
                       node.x > node.prev.x ? 'R' :
                       node.y < node.prev.y ? 'U' :
                       node.y > node.prev.y && this.canClimbDown(node.prev.x, node.prev.y) ? 'D' : 'F';
               }
           }));

           console.log("--");
           this.hintMaps[gi].forEach((r, y) => console.log(r.join("")));
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
