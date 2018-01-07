
import {Player} from "./player.js";

export const Human = Object.create(Player);

Human.update = function () {
    Player.update.call(this);

    if (this.board.rows[this.yTile][this.xTile] === '@') {
        this.board.collectGift(this.closestGift);
    }
};
