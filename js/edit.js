
import "pixi.js";
import {Board, decode, TILE_WIDTH_PX, TILE_HEIGHT_PX, MARGIN} from "./board.js"
import * as player from "./player.js";

class BoardEditor extends Board {
    constructor(data, onChange) {
        // Add texture for palette cursor.
        PIXI.loader.add("assets/cursor.png");

        super(data, onChange);
        this.onChange = onChange;
    }

    setup() {
        super.setup();

        // Load texture for palette cursor.
        this.textures.cursor = PIXI.BaseTexture.fromImage("assets/cursor.png");

        // Create sprite palette.
        this.palette = {};
        this.addPaletteTile("human",  -6);
        this.addPaletteTile("robot",  -5);
        this.addPaletteTile("brick",  -4);
        this.addPaletteTile("ladder", -3);
        this.addPaletteTile("rope",   -2);
        this.addPaletteTile("gift",   -1);
        this.addPaletteTile("cursor", -6);
        this.selectSprite("human");

        // Setup click handler on canvas.
        this.renderer.view.addEventListener("click", evt => {
            const rect = this.renderer.view.getBoundingClientRect();
            const x    = this.xPixToTile(evt.clientX - rect.left);
            const y    = this.yPixToTile(evt.clientY - rect.top);
            if (evt.shiftKey) {
                this.removeTile(x, y);
            }
            else {
                this.changeTile(x, y);
            }
            evt.stopPropagation();
        });

        // Remove the life markers.
        this.lifeSprites.forEach(sprite => this.stage.removeChild(sprite));
    }

    addPaletteTile(name, index) {
        const texture = name === "human" || name === "robot" ?
            new PIXI.Texture(this.textures[name], player.getDefaultFrame()) :
            new PIXI.Texture(this.textures[name]);
        const sprite = new PIXI.Sprite(texture);
        sprite.anchor.x = sprite.anchor.y = 0.5;
        sprite.x = (this.widthTiles  + 0.5) * TILE_WIDTH_PX  + index * (TILE_WIDTH_PX + MARGIN);
        sprite.y = (this.heightTiles + 0.5) * TILE_HEIGHT_PX + MARGIN;
        this.stage.addChild(sprite);

        sprite.interactive = true;
        sprite.addListener("click", evt => {
            this.selectSprite(name);
            evt.stopPropagation();
        });
        this.palette[name] = sprite;
    }

    selectSprite(name) {
        this.currentSpriteName = name;
        this.palette.cursor.x  = this.palette[name].x;
        this.renderer.render(this.stage);
    }

    removeTile(x, y) {
        // Ignore coordinates outside the board, and empty tiles.
        if (x >= this.widthTiles || y >= this.heightTiles || this.getTileType(x, y) === "empty") {
            return;
        }

        this.stage.removeChild(this.tiles[y][x]);
        this.tiles[y][x] = null;
        this.rows[y][x] = this.getSymbol("empty");

        this.renderer.render(this.stage);
        this.onChange(this);
    }

    changeTile(x, y) {
        // Ignore coordinates outside the board.
        if (x >= this.widthTiles || y >= this.heightTiles) {
            return;
        }

        // Do nothing if the selected tile already has the target type.
        const previousTileType = this.getTileType(x, y);
        if (previousTileType === this.currentSpriteName) {
            return;
        }

        // Remove the selected tile if it is not empty.
        if (previousTileType !== "empty") {
            this.stage.removeChild(this.tiles[y][x]);
        }

        // Create a new sprite at the selected location.
        const texture = this.currentSpriteName === "human" || this.currentSpriteName === "robot" ?
            new PIXI.Texture(this.textures[this.currentSpriteName], player.getDefaultFrame()) :
            new PIXI.Texture(this.textures[this.currentSpriteName]);
        const sprite = new PIXI.Sprite(texture);
        sprite.anchor.x = sprite.anchor.y = 0.5;
        sprite.x = this.xTileToPix(x);
        sprite.y = this.yTileToPix(y);
        this.stage.addChild(sprite);

        this.tiles[y][x] = sprite;
        this.rows[y][x] = this.getSymbol(this.currentSpriteName);

        this.renderer.render(this.stage);
        this.onChange(this);
    }

    // Disable the game logic
    run() {}

    // Ignore keyboard events.
    onKeyChange(evt, down) {}
}

const defaultBoard = [
    "%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%",
    "%                                      %",
    "%                                      %",
    "%                                      %",
    "%                                      %",
    "%                                      %",
    "%                                      %",
    "%                                      %",
    "%                                      %",
    "%                                      %",
    "%                                      %",
    "%                                      %",
    "%                                      %",
    "%                                      %",
    "%                                      %",
    "%                                      %",
    "%                                      %",
    "%                                      %",
    "%                                      %",
    "%                                      %",
    "%                                      %",
    "%                                      %"
];

window.addEventListener("load", () => {
    const data = window.location.hash.length ?
        decode(window.location.hash.slice(1)) :
        defaultBoard;

    new BoardEditor(data, b => {
        window.location.hash = "#" + b.encode();
        document.querySelector("#play").setAttribute("href", "index.html" + window.location.hash);
    });
});
