
import {Player} from "./player.js";

export const Robot = Object.create(Player);

Robot.update = function () {
    this.commands = {
        left: false,
        right: false,
        top: false,
        bottom: false
    };

    // The robot will move towards the gift nearest to the player.
    switch (this.board.getHint(this.xTile, this.yTile)) {
        case 'R': this.commands.right = true; break;
        case 'L': this.commands.left = true; break;
        case 'D': this.commands.down = true; break;
        case 'U': this.commands.up = true; break;
    }

    Player.update.call(this);
};
