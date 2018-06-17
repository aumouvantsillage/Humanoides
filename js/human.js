
import {Player} from "./player.js";

export const HUMAN_LIVES = 3;

export const Human = Object.create(Player);

Human.init = function (board, sprite, xtl, ytl) {
    Player.init.call(this, board, sprite, xtl, ytl);
    this.lives = HUMAN_LIVES;
    return this;
};

Human.update = function () {
    Player.update.call(this);

    if (this.board.getTileType(this.xTile, this.yTile) === "gift") {
        this.board.collectGift(this.xTile, this.yTile);
    }

    if (this.board.robots.some(r => r.xTile === this.xTile && r.yTile === this.yTile) && this.state !== "exploding") {
        this.lives --;
        this.explode();
    }
};
