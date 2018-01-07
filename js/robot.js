
import {Player} from "./player.js";

export const Robot = Object.create(Player);

Robot.update = function () {
    this.commands = {
        left: false,
        right: false,
        top: false,
        bottom: false
    };

    // The robot will move towards the gift closest to the player.
    const target = this.board.player.closestGift;

    if (target.x > this.xTile && (this.canStand || this.canHang) && this.canMoveRight) {
        this.commands.right = true;
    }
    if (target.x < this.xTile && (this.canStand || this.canHang) && this.canMoveLeft) {
        this.commands.left = true;
    }
    if (target.y > this.yTile && this.canClimbDown) {
        this.commands.down = true;
    }
    if (target.y < this.yTile && this.canClimbUp) {
        this.commands.up = true;
    }

    Player.update.call(this);
};
