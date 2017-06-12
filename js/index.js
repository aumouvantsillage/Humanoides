
const BOARD_WIDTH  = 40;
const BOARD_HEIGHT = 22;
const CELL_WIDTH   = 24;
const CELL_HEIGHT  = 24;
const HUMAN_WIDTH  = 21;
const HUMAN_HEIGHT = 24;
const GRAVITY = 300;

const SYMBOLS = {
    "%": "brick",
    "H": "ladder",
    "-": "rope",
    "@": "gift"
};

const board1 = [
    "%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%",
    "%                                      %",
    "%   H%%%%%%%%                          %",
    "%   H%       ------H                   %",
    "%   H%   @  %      H                   %",
    "%   H%%%%%%%%      H     ----H         %",
    "%   H              %%%%%%    H         %",
    "%  H%%%%%%%%%%%%%H %    %    H         %",
    "%  H%           %H % @  %    %%%%%%    %",
    "%  H%           %H %%%%%%    %    %    %",
    "%  H%           %H           % @  %    %",
    "%  H%           %H    @      %%%%%%    %",
    "%  H%         %%%%%%%%%%%%%%H          %",
    "%  H%         % %          %H          %",
    "%  H%         % %          %H          %",
    "%  H%         % %          %H  @       %",
    "%  H%         % %        %%%%%%%%%%%H  %",
    "%  H%         % %        % %       %H  %",
    "%  H%         % %        % %       %H  %",
    "%  H%         % %        % %       %H  %",
    "%  H%         %%%        %%%       %H  %",
    "%%%H                                H%%%"
];

const game = new Phaser.Game(BOARD_WIDTH * CELL_WIDTH, BOARD_HEIGHT * CELL_HEIGHT, Phaser.AUTO, "", {preload, create, update});

let player, cursors, groups;
let lastDir = "right";
let onLadderPrev = false;

function preload() {
    Object.values(SYMBOLS).forEach(name => game.load.image(name, `assets/${name}.png`));
    game.load.spritesheet("human", "assets/human.png", HUMAN_WIDTH, HUMAN_HEIGHT);
}

function createBoard(board) {
    groups = {};
    Object.values(SYMBOLS).forEach(name => {
        const g = game.add.group();
        g.enableBody = true;
        groups[name] = g;
    });

    board.forEach((row, i) => {
        row.split("").forEach((c, j) => {
            if (c in SYMBOLS) {
                const g = SYMBOLS[c];
                const b = groups[g].create(j * CELL_WIDTH, i * CELL_HEIGHT, g);
                b.body.immovable = true;
            }
        });
    });
}

function create() {
    // Start physics system.
    game.physics.startSystem(Phaser.Physics.ARCADE);

    // Use keyboard input.
    cursors = game.input.keyboard.createCursorKeys();

    // Create player sprite.
    player = game.add.sprite(6*CELL_WIDTH, CELL_HEIGHT, "human");
    game.physics.arcade.enable(player);
    player.body.bounce.y = 0;
    player.body.gravity.y = GRAVITY;
    player.body.collideWorldBounds = false;

    player.animations.add("left", [0, 1, 2, 3, 4, 5], 10, true);
    player.animations.add("right", [7, 8, 9, 10, 11, 12], 10, true);
    player.animations.add("rope", [19, 20, 21, 22], 10, true);
    player.animations.add("updown", [15, 16, 17, 18], 10, true);

    createBoard(board1);
}

function centerPlayer() {
    const tileIndex = Math.round((player.body.x + HUMAN_WIDTH / 2) / CELL_WIDTH - 0.5);
    player.body.x = CELL_WIDTH * (tileIndex + 0.5) - HUMAN_WIDTH / 2;
}

function collectGift(player, gift) {
    gift.kill();
}

function update() {
    const onBrick = game.physics.arcade.collide(player, groups.brick);
    const onLadder = game.physics.arcade.overlap(player, groups.ladder);
    const onRope = game.physics.arcade.overlap(player, groups.rope);
    game.physics.arcade.overlap(player, groups.gift, collectGift);

    player.body.velocity.x = 0;

    if (onRope || onLadder && !onBrick) {
        player.body.velocity.y = 0;
        player.body.gravity.y = 0;
    }
    else {
        player.body.gravity.y = GRAVITY;
    }

    // FIXME prevent bouncing when climbing past the top of a ladder
    if (onLadderPrev && !onLadder) {
        player.body.velocity.y = 0;
    }
    onLadderPrev = onLadder;

    if (onLadder && cursors.up.isDown) {
        // Animate climb up
        player.body.velocity.y = -150;
        centerPlayer();
        player.animations.play("updown");
    }
    else if (onLadder && cursors.down.isDown){
        // Animate climb down
        player.body.velocity.y = 150;
        centerPlayer();
        player.animations.play("updown");
    }
    else if ((onBrick || onLadder) && cursors.left.isDown) {
        // Animate run left
        player.body.velocity.x = -150;
        player.animations.play("left");
        lastDir = "left";
    }
    else if ((onBrick || onLadder) && cursors.right.isDown) {
        // Animate run right
        player.body.velocity.x = 150;
        player.animations.play("right");
        lastDir = "right";
    }
    else if (onRope && cursors.left.isDown) {
        // Animate run left
        player.body.velocity.x = -150;
        player.animations.play("rope");
        lastDir = "left";
    }
    else if (onRope && cursors.right.isDown) {
        // Animate run right
        player.body.velocity.x = 150;
        player.animations.play("rope");
        lastDir = "right";
    }
    else if (onBrick) {
        // Standing still
        player.animations.stop();
        player.frame = 6;
    }
    else if (onLadder) {
        // Climbing still
        player.animations.stop();
        player.frame = 18;
    }
    else if (onRope) {
        // Suspended still
        player.animations.stop();
        player.frame = 19;
    }
    else {
        // Falling
        player.animations.stop();
        if (lastDir === "right") {
            player.frame = 13;
        }
        else {
            player.frame = 14;
        }
    }
}
