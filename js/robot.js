
import {Player} from "./player.js";

export const Robot = Object.create(Player);

Robot.getHint = function () {
    // Find if a path to the player is available.
    let target = this.board.targets.find(t => {
        let rx = this.xTile;
        let ry = this.yTile;
        // Limit the path length.
        for (let i = 0; i < 2 * this.board.widthTiles + 2 * this.board.heightTiles; i ++) {
            // If the current path passes by the player location, OK.
            if (rx === this.board.player.xTile && ry === this.board.player.yTile) {
                return true;
            }
            // Else, check next location along the current path.
            switch (this.getMoveToTarget(t, rx, ry)) {
                case 'L': rx --; break;
                case 'R': rx ++; break;
                case 'U': ry --; break;
                case 'D':
                case 'F': ry ++; break;
                default: return false;
            }
        }
        return false;
    });

    // If no path was found, then move to the current target of the player.
    if (!target) {
        target = this.board.player.nearestTarget;
    }

    // Return the move to the target, if applicable.
    return target ? this.getMoveToTarget(target) : '?';
},


Robot.update = function () {
    this.commands = {
        left: false,
        right: false,
        top: false,
        bottom: false
    };

    // The robot will move towards the target nearest to the player.
    switch (this.getHint()) {
        case 'R': this.commands.right = true; break;
        case 'L': this.commands.left = true; break;
        case 'D': this.commands.down = true; break;
        case 'U': this.commands.up = true; break;
    }

    Player.update.call(this);
};
