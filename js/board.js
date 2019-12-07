
import "pixi.js";
import * as player from "./player.js";
import {Human, HUMAN_LIVES} from "./human.js";
import {Robot} from "./robot.js";

export const TILE_WIDTH_PX  = 24;
export const TILE_HEIGHT_PX = 24;
export const MARGIN         = 4;
const TILE_HIDE_DELAY_MS    = 5000;

const FALL_COST = 0.9;
const BRICK_COST = TILE_HEIGHT_PX + TILE_WIDTH_PX;

const ENCODING_RUN_LENGTH_MAX = 32;

const SYMBOLS = {
    "%": "brick",
    "H": "ladder",
    "-": "rope",
    "@": "gift",
    "X": "human",
    "#": "robot"
};

const KEYS = {
    start:      [" "],
    left:       ["ArrowLeft"],
    up:         ["ArrowUp"],
    right:      ["ArrowRight"],
    down:       ["ArrowDown"],
    breakLeft:  ["s", "S"],
    breakRight: ["d", "D"]
};

export function decode(str) {
    const bytes  = atob(str).split("").map(c => c.charCodeAt(0));
    const width  = bytes[0];
    const height = bytes[1];
    const data   = [];
    let row      = [];

    for (let i = 2; i < bytes.length; i ++) {
        const symbolIndex = Math.floor(bytes[i] / ENCODING_RUN_LENGTH_MAX);
        const symbol      = symbolIndex > 0 ? Object.keys(SYMBOLS)[symbolIndex - 1] : " ";
        const count       = bytes[i] % ENCODING_RUN_LENGTH_MAX + 1;

        for (let j = 0; j < count; j ++) {
            row.push(symbol);
            if (row.length === width) {
                data.push(row.join(""));
                row = [];
            }
        }
    }

    return data;
}

export class Board {
    constructor(data, onLoad) {
        this.finish      = false;
        this.rows        = data.map(row => row.split(""));
        this.widthTiles  = Math.max(...this.rows.map(r => r.length));
        this.heightTiles = this.rows.length;
        this.gravity     = TILE_HEIGHT_PX / this.heightTiles / 18;
        this.renderer    = PIXI.autoDetectRenderer(this.widthTiles * TILE_WIDTH_PX, (this.heightTiles + 1) * TILE_HEIGHT_PX + 2 * MARGIN);
        this.stage       = new PIXI.Container();
        this.running     = false;

        const footer = document.querySelector("footer");
        footer.parentNode.insertBefore(this.renderer.view, footer);

        for (let name of Object.values(SYMBOLS)) {
            PIXI.loader.add(`assets/${name}.png`);
        }

        PIXI.loader.load(() => {
            this.setup();
            if (onLoad) {
                onLoad(this);
            }
            this.renderer.render(this.stage);
        });
    }

    encode() {
        const res = [this.widthTiles, this.heightTiles];

        let prev = this.rows[0][0];
        let count = 0;

        function push() {
            res.push((count - 1) + (Object.keys(SYMBOLS).indexOf(prev) + 1) * ENCODING_RUN_LENGTH_MAX);
        }

        for (let r of this.rows) {
            for (let c of r) {
                if (c !== prev || count === ENCODING_RUN_LENGTH_MAX) {
                    push();
                    prev = c;
                    count = 0;
                }
                count ++;
            }
        }

        push();

        return btoa(res.map(c => String.fromCharCode(c)).join(""));
    }

    setup() {
        // Load textures.
        this.textures = {};
        for (let symbol in SYMBOLS) {
            const spriteName = SYMBOLS[symbol];
            this.textures[spriteName] = PIXI.BaseTexture.fromImage(`assets/${spriteName}.png`);
        }

        this.robots  = [];
        this.tiles   = [];
        this.gifts   = [];
        this.targets = [];

        // For each tile
        this.rows.forEach((row, ytl) => {
            const tileRow = [];
            this.tiles.push(tileRow);

            row.forEach((symbol, xtl) => {
                if (symbol in SYMBOLS) {
                    // Create a sprite for the current symbol
                    const spriteName = SYMBOLS[symbol];
                    const texture    = new PIXI.Texture(this.textures[spriteName]);
                    const sprite     = new PIXI.Sprite(texture);

                    // Center the sprite in the current tile
                    sprite.anchor.x = sprite.anchor.y = 0.5;
                    sprite.x        = this.xTileToPix(xtl);
                    sprite.y        = this.yTileToPix(ytl);
                    this.stage.addChild(sprite);

                    // Keep a reference to the human sprite
                    switch (spriteName) {
                        case "human":
                            this.player = new Human(this, sprite, xtl, ytl);
                            tileRow.push(null);
                            break;
                        case "robot":
                            this.robots.push(new Robot(this, sprite, xtl, ytl));
                            tileRow.push(null);
                            break;
                        case "gift":
                            this.gifts.push({x: xtl, y: ytl, active: true});
                            tileRow.push(sprite);
                            break;
                        default:
                            tileRow.push(sprite);
                    }
                }
                else {
                    tileRow.push(null);
                }

                // Put a target at each end of a platform.
                if (symbol !== '%' && symbol !== 'H' && symbol !== '@') {
                    if (ytl + 1 === this.heightTiles) {
                        if (xtl === 0 || xtl + 1 === this.widthTiles || row[xtl - 1] === '%' || row[xtl + 1] === '%') {
                            this.targets.push({x: xtl, y: ytl, active: true});
                        }
                    }
                    else if (this.rows[ytl + 1][xtl] === '%') {
                        if (xtl === 0 || xtl + 1 === this.widthTiles || this.rows[ytl + 1][xtl - 1] !== '%' || this.rows[ytl + 1][xtl + 1] !== '%') {
                           this.targets.push({x: xtl, y: ytl, active: true});
                        }
                    }
                }
                // Put a target at each end of a rope.
                if (symbol === '-' && (xtl === 0 || xtl + 1 === this.widthTiles || row[xtl - 1] !== '-' || row[xtl + 1] !== '-')) {
                    this.targets.push({x: xtl, y: ytl, active: true});
                }
                // Put a target at each end of a ladder.
                if (symbol === 'H' && (ytl === 0 || ytl + 1 === this.heightTiles || this.rows[ytl - 1][xtl] !== 'H' ||  this.rows[ytl + 1][xtl] !== 'H')) {
                    this.targets.push({x: xtl, y: ytl, active: true});
                }
           });
       });

       // Show remaining lives at the bottom of the screen.
       this.lifeSprites = [];
       const texture = new PIXI.Texture(this.textures.human, player.getDefaultFrame());
       for (let i = 0; i < HUMAN_LIVES; i ++) {
           const sprite    = new PIXI.Sprite(texture);
           sprite.anchor.x = sprite.anchor.y = 0.5;
           sprite.x        = (i + 0.5) * TILE_WIDTH_PX + MARGIN;
           sprite.y        = (this.heightTiles + 0.5) * TILE_HEIGHT_PX + MARGIN;
           this.stage.addChild(sprite);

           this.lifeSprites.push(sprite);
       }

       this.remainingGifts = this.gifts.length;
       this.targets        = this.targets.concat(this.gifts);

       this.computeHints();

       window.addEventListener("keydown", (evt) => this.onKeyChange(evt, true));
       window.addEventListener("keyup",   (evt) => this.onKeyChange(evt, false));
   }

   computeHints() {
       // Initialize the map with empty cells.
       if (!this.hints) {
           this.hints = this.targets.map(t => this.rows.map(r => r.map(c => ({
               move    : '?',
               distance: Infinity
           }))));
       }
       else {
           this.hints.forEach((m, i) => m.forEach((r, y) => r.forEach(c => {
               c.move     = '?';
               c.distance = Infinity;
           })));
       }

       this.targets.forEach((g, gi) => {
           const currentMap = this.hints[gi];

           currentMap[g.y][g.x].move     = '@';
           currentMap[g.y][g.x].distance = 0;

           // Compute the hint map for the current target.
           currentMap.forEach((r, y) => r.forEach((c, x) => {
               // Compute a path from (x, y) to (g.x, g.y) using the A* algorithm.
               const closedList = [];
               const openList = [{x, y, cost: 0, distance: 0, prev: null}];

               let currentNode;
               while (openList.length) {
                   // Get the unexplored node with the lowest estimated path length.
                   currentNode = openList.shift();

                   // If the current node already belongs to another path, or is the target, stop the exploration.
                   if (currentMap[currentNode.y][currentNode.x].move !== '?' || currentNode.x === g.x && currentNode.y === g.y) {
                       break;
                   }

                   // Add the current node to the list of explored nodes.
                   closedList.push(currentNode);

                   // Build a list of the neighbors of the current node.
                   // The list is based on the possible movements of the player at the current location.
                   const neighbors = [];
                   function addNeighbor(x, y, cost) {
                       neighbors.push({x, y, prev: currentNode, cost: currentNode.cost + cost, distance: Math.abs(g.x - x) + Math.abs(g.y - y)})
                   }

                   if (this.canStand(currentNode.x, currentNode.y) || this.canHang(currentNode.x, currentNode.y)) {
                       if (this.canMoveRight(currentNode.x, currentNode.y)) {
                           addNeighbor(currentNode.x + 1, currentNode.y, 1);
                       }
                       if (this.canMoveLeft(currentNode.x, currentNode.y)) {
                           addNeighbor(currentNode.x - 1, currentNode.y, 1);
                       }
                   }

                   if (this.canClimbDown(currentNode.x, currentNode.y)) {
                       addNeighbor(currentNode.x, currentNode.y + 1, 1);
                   }
                   else if (currentNode.y + 1 < this.heightTiles && this.canStand(currentNode.x, currentNode.y)) {
                       // Assume that we can fall through bricks, but with a higher cost.
                       addNeighbor(currentNode.x, currentNode.y + 1, BRICK_COST);
                   }
                   else if (!this.canStand(currentNode.x, currentNode.y)) {
                       // Falling has a lower cost.
                       addNeighbor(currentNode.x, currentNode.y + 1, FALL_COST);
                   }

                   if (this.canClimbUp(currentNode.x, currentNode.y)) {
                       addNeighbor(currentNode.x, currentNode.y - 1, 1);
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

               for (let node = currentNode; node.prev; node = node.prev) {
                   currentMap[node.prev.y][node.prev.x] = {
                       move: node.x < node.prev.x ? 'L' :
                             node.x > node.prev.x ? 'R' :
                             node.y < node.prev.y ? 'U' :
                             node.y > node.prev.y && (this.canHang(node.prev.x, node.prev.y) || this.canClimbDown(node.prev.x, node.prev.y)) ? 'D' : 'F',
                       distance: currentMap[node.y][node.x].distance + (node.cost - node.prev.cost)
                   };
               }
           }));
       });
    }

    run() {
        // Loop until the player has 0 lives.
        if (this.finish) {
            return;
        }
        // Loop this function every 60 ms
        requestAnimationFrame(() => this.run());
        this.update();
    }

    onKeyChange(evt, down) {
        if (!down && KEYS.start.indexOf(evt.key) >= 0 && !this.running) {
            this.renderer.view.scrollIntoView(false);
            this.run();
            evt.preventDefault();
            evt.stopPropagation();
            return;
        }

        for (let key in KEYS) {
            if (KEYS[key].indexOf(evt.key) >= 0) {
                this.player.commands[key] = down;
                evt.preventDefault();
                evt.stopPropagation();
                return;
            }
        }
    }

    update() {
        this.player.update();
        this.robots.forEach(r => r.update());
        this.renderer.render(this.stage);
    }

    xPixToTile(x) {
        return Math.floor(x / TILE_WIDTH_PX);
    }

    yPixToTile(y) {
        return Math.floor(y / TILE_HEIGHT_PX);
    }

    xTileToPix(x) {
        return (x + 0.5) * TILE_WIDTH_PX;
    }

    yTileToPix(y) {
        return (y + 0.5) * TILE_HEIGHT_PX;
    }

    getTileType(x, y) {
        const symbol = this.rows[y][x];
        if (symbol in SYMBOLS) {
            return SYMBOLS[symbol];
        }
        return "empty";
    }

    getSymbol(name) {
        for (let s in SYMBOLS) {
            if (SYMBOLS[s] === name) {
                return s;
            }
        }
        return " ";
    }

    canMoveLeft(x, y) {
        return x > 0 && this.getTileType(x - 1, y) !== "brick";
    }

    canMoveRight(x, y) {
        return x + 1 < this.widthTiles && this.getTileType(x + 1, y) !== "brick";
    }

    canStand(x, y) {
        return y + 1 === this.heightTiles ||
               this.getTileType(x, y + 1) === "brick" ||
               this.getTileType(x, y + 1) === "ladder";
    }

    canHang(x, y) {
        return this.getTileType(x, y) === "rope";
    }

    canClimbUp(x, y) {
        return this.getTileType(x, y) === "ladder";
    }

    canClimbDown(x, y) {
        return y + 1 < this.heightTiles && this.getTileType(x, y + 1) === "ladder";
    }

    canBreakLeft(x, y) {
        return y + 1 < this.heightTiles && x > 0 && this.getTileType(x - 1, y + 1) === "brick";
    }

    canBreakRight(x, y) {
        return y + 1 < this.heightTiles && x + 1 < this.widthTiles && this.getTileType(x + 1, y + 1) === "brick";
    }

    hideTile(x, y) {
        let symbol = this.rows[y][x];
        let tile = this.tiles[y][x];

        // Remove the current tile.
        this.rows[y][x] = ' ';
        tile.visible = false;

        return [symbol, tile];
    }

    breakBrick(x, y) {
        let [symbol, tile] = this.hideTile(x, y);

        this.computeHints();

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

            this.computeHints();
        }, TILE_HIDE_DELAY_MS);
    }

    collectGift(x, y) {
        const g = this.gifts.find(g => g.x === x && g.y === y);
        if (!g) {
            return;
        }
        g.active = false;
        this.remainingGifts --;
        this.rows[y][x] = ' ';
        let tile = this.tiles[y][x];
        tile.x = (this.widthTiles  - 0.5) * TILE_WIDTH_PX - this.remainingGifts * (TILE_WIDTH_PX + MARGIN) - MARGIN;
        tile.y = (this.heightTiles + 0.5) * TILE_HEIGHT_PX + MARGIN;
    }

    checkFinish() {
        // Update the displayed player lives.
        for (let i = this.player.lives; i < this.lifeSprites.length; i ++) {
            this.lifeSprites[i].visible = false;
        }

        // Check for game termination.
        if (!this.player.lives || !this.remainingGifts) {
            this.finish = true;
            return;
        }

        // Put player and robots back to their original locations.
        this.player.reset();
        this.robots.forEach(r => r.reset());
    }
}
