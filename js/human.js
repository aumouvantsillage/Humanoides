
import {Player} from "./player.js";

export const HUMAN_LIVES = 3;

export class Human extends Player {
    constructor(board, sprite, xtl, ytl) {
        super(board, sprite, xtl, ytl);
        this.lives = HUMAN_LIVES;
    }

    update() {
        super.update();

        if (this.board.getTileType(this.xTile, this.yTile) === "gift") {
            this.board.collectGift(this.xTile, this.yTile);
        }

        if (this.board.robots.some(r => r.xTile === this.xTile && r.yTile === this.yTile) && this.state !== "exploding") {
            this.lives --;
            this.explode();
        }
    }
}
