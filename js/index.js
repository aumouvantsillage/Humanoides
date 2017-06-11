
const BOARD_WIDTH  = 40;
const BOARD_HEIGHT = 22;
const CELL_WIDTH   = 24;
const CELL_HEIGHT  = 24;
const HUMAN_WIDTH  = 21;
const HUMAN_HEIGHT = 24;

const SYMBOLS = {
    "X": "brick",
    "+": "ladder",
    "-": "rope",
    "@": "gift"
};

const board1 = [
    "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "X                                      X",
    "X   +XXXXXXXX                          X",
    "X   +X      -------+                   X",
    "X   +X   @  X      +                   X",
    "X   +XXXXXXXX      +    -----+         X",
    "X   +              XXXXXX    +         X",
    "X  +XXXXXXXXXXXXX+ X    X    +         X",
    "X  +X           X+ X @  X    XXXXXX    X",
    "X  +X           X+ XXXXXX    X    X    X",
    "X  +X           X+           X @  X    X",
    "X  +X           X+    @      XXXXXX    X",
    "X  +X         XXXXXXXXXXXXXX+          X",
    "X  +X         X X          X+          X",
    "X  +X         X X          X+          X",
    "X  +X         X X          X+  @       X",
    "X  +X         X X        XXXXXXXXXXX+  X",
    "X  +X         X X        X X       X+  X",
    "X  +X         X X        X X       X+  X",
    "X  +X         X X        X X       X+  X",
    "X  +X         XXX        XXX       X+  X",
    "XXX+                                +XXX"
];

const game = new Phaser.Game(BOARD_WIDTH * CELL_WIDTH, BOARD_HEIGHT * CELL_HEIGHT, Phaser.AUTO, "", {preload, create, update});

let player, cursors, groups;

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
    player = game.add.sprite(CELL_WIDTH, CELL_HEIGHT, "human");
    game.physics.arcade.enable(player);
    player.body.bounce.y = 0.2;
    player.body.gravity.y = 300;
    player.body.collideWorldBounds = false;

    player.animations.add("left", [0, 1, 2, 3, 4, 5], 10, true);
    player.animations.add("right", [7, 8, 9, 10, 11, 12], 10, true);

    createBoard(board1);
}

function update() {
    player.body.velocity.x = 0;

    if (game.physics.arcade.collide(player, groups.brick)) {
        if (cursors.left.isDown) {
            player.body.velocity.x = -150;
            player.animations.play("left");
        }
        else if (cursors.right.isDown) {
            player.body.velocity.x = 150;
            player.animations.play("right");
        }
        else {
            player.animations.stop();
            player.frame = 6;
        }
    }
    else {
        player.frame = 13;
    }
}
