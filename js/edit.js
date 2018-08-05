
import "pixi.js";
import {Board, TILE_WIDTH_PX, TILE_HEIGHT_PX, MARGIN} from "./board.js"
import * as player from "./player.js";

const BoardEditor = Object.create(Board);

BoardEditor.setup = function () {
    this.link = document.querySelector("a");

    Board.setup.call(this);

    // Create sprite palette.
    this.palette = {};
    this.addPaletteTile("human",  -6);
    this.addPaletteTile("robot",  -5);
    this.addPaletteTile("brick",  -4);
    this.addPaletteTile("ladder", -3);
    this.addPaletteTile("rope",   -2);
    this.addPaletteTile("gift",   -1);
    this.selectSprite("human");

    const rect = this.renderer.view.getBoundingClientRect();
    this.renderer.view.addEventListener("click", (evt) => {
        const x = this.xPixToTile(evt.clientX - rect.left);
        const y = this.yPixToTile(evt.clientY - rect.top);
        if (evt.shiftKey) {
            this.removeTile(x, y);
        }
        else {
            this.changeTile(x, y);
        }
        evt.stopPropagation();
    });

    this.updateLink();
};

BoardEditor.addPaletteTile = function (name, index) {
    const texture = name === "human" || name === "robot" ?
        new PIXI.Texture(this.textures[name], player.getDefaultFrame()) :
        new PIXI.Texture(this.textures[name]);
    const sprite = new PIXI.Sprite(texture);
    sprite.anchor.x = sprite.anchor.y = 0.5;
    sprite.x = (this.widthTiles  + 0.5) * TILE_WIDTH_PX  + index * (TILE_WIDTH_PX + MARGIN);
    sprite.y = (this.heightTiles + 0.5) * TILE_HEIGHT_PX + MARGIN;
    this.stage.addChild(sprite);

    sprite.interactive = true;
    sprite.addListener("click", (evt) => {
        this.selectSprite(name);
        evt.stopPropagation();
    });
    this.palette[name] = sprite;
};

BoardEditor.selectSprite = function (name) {
    this.currentSpriteName = name;
    // TODO highlight selected sprite in palette.
};

BoardEditor.removeTile = function (x, y) {
    // Ignore coordinates outside the board, and empty tiles.
    if (x >= this.widthTiles || y >= this.heightTiles || this.getTileType(x, y) === "empty") {
        return;
    }

    this.stage.removeChild(this.tiles[y][x]);
    this.tiles[y][x] = null;
    this.rows[y][x] = this.getSymbol("empty");

    this.renderer.render(this.stage);
    this.updateLink();
};

BoardEditor.changeTile = function (x, y) {
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
    this.updateLink();
};

BoardEditor.updateLink = function () {
    this.link.setAttribute("href", "index.html#" + this.encode());
};

BoardEditor.run = function () {

};

BoardEditor.onKeyChange = function (evt, down) {

};

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
    if (!window.location.hash.length) {
        BoardEditor.init(defaultBoard, b => window.location.hash = "#" + b.encode());
    }
    else {
        BoardEditor.decode(window.location.hash.slice(1));
    }
});
