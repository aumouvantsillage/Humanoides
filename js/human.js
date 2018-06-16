
import {Player} from "./player.js";

export const Human = Object.create(Player);

Human.update = function () {
    Player.update.call(this);

    if (this.board.getTileType(this.xTile, this.yTile) === "gift") {
        this.board.collectGift(this.xTile, this.yTile);
    }
};
