
import "pixi.js";

const BOARD_WIDTH_TL  = 40;
const BOARD_HEIGHT_TL = 22;
const TILE_WIDTH_PX   = 24;
const TILE_HEIGHT_PX  = 24;
const HUMAN_WIDTH_PX  = 21;
const HUMAN_HEIGHT_PX = 24;
const GRAVITY = 300;

const HUMAN_STANDING    = 6;
const HUMAN_LEFT_ANIM   = [0, 1, 2, 3, 4, 5];
const HUMAN_RIGHT_ANIM  = [7, 8, 9, 10, 11, 12];
const HUMAN_ROPE_ANIM   = [19, 20, 21, 22];
const HUMAN_LADDER_ANIM = [15, 16, 17, 18];

const SYMBOLS = {
    "%": "brick",
    "H": "ladder",
    "-": "rope",
    "@": "gift",
    "X": "human"
};

const board1 = [
    "%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%",
    "%       X                              %",
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

const game = {
    init(board) {
        this.board = board;

        this.renderer = PIXI.autoDetectRenderer(BOARD_WIDTH_TL * TILE_WIDTH_PX, BOARD_HEIGHT_TL * TILE_HEIGHT_PX);
        document.body.appendChild(this.renderer.view);

        this.stage = new PIXI.Container();

        Object.values(SYMBOLS).forEach(name => PIXI.loader.add(`assets/${name}.png`));
        PIXI.loader.load(() => this.setup());
    },

    set humanPosition(index) {
        this.human.texture.frame = new PIXI.Rectangle(index * HUMAN_WIDTH_PX + 0.5, 0, HUMAN_WIDTH_PX, HUMAN_HEIGHT_PX);
    },

    setup() {
        // For each tile
        this.board.forEach((row, ytl) => {
            row.split("").forEach((symbol, xtl) => {
                if (symbol in SYMBOLS) {
                    // Create a sprite for the current symbol
                    const spriteName = SYMBOLS[symbol];
                    const sprite = new PIXI.Sprite(PIXI.loader.resources[`assets/${spriteName}.png`].texture)

                    // Center the sprite in the current tile
                    sprite.anchor.x = sprite.anchor.y = 0.5;
                    sprite.x = (xtl + 0.5) * TILE_WIDTH_PX;
                    sprite.y = (ytl + 0.5) * TILE_HEIGHT_PX;
                    this.stage.addChild(sprite);

                    // Keep a reference to the human sprite
                    if (spriteName === "human") {
                        this.human = sprite;
                    }
                }
           });
       });

       this.humanPosition = HUMAN_STANDING;

       this.renderer.render(this.stage);

       this.loop();
   },

    loop() {

    }
};

window.addEventListener("load", () => game.init(board1));


function obsolete() {
    let player, cursors, groups;
    let lastDir = "right";
    let onLadderPrev = false, onRopePrev = false;
    let board = board1;

    function preload() {
        Object.values(SYMBOLS).forEach(name => game.load.image(name, `assets/${name}.png`));
        game.load.spritesheet("human", "assets/human.png", HUMAN_WIDTH, HUMAN_HEIGHT);
    }

    function createBoard() {
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

        createBoard();
    }

    function centerPlayer() {
        const tileIndex = Math.round((player.body.x + HUMAN_WIDTH / 2) / CELL_WIDTH - 0.5);
        player.body.x = CELL_WIDTH * (tileIndex + 0.5) - HUMAN_WIDTH / 2;
    }

    function collectGift(player, gift) {
        gift.kill();
    }

    function getTileType(offsetX = 0, offsetY = 0) {
        const x = Math.floor((player.body.left + player.body.halfWidth) / CELL_WIDTH)  + offsetX;
        if (x < 0 || x >= BOARD_WIDTH) {
            return "empty";
        }

        const y = Math.floor((player.body.top + player.body.halfHeight) / CELL_HEIGHT) + offsetY;
        if (y < 0 || y >= BOARD_HEIGHT) {
            return "empty";
        }

        const s = board[y][x];
        return s in SYMBOLS ? SYMBOLS[s] : "empty";
    }

    function update() {
        const onBrick = game.physics.arcade.collide(player, groups.brick) && player.body.bottom % CELL_HEIGHT === 0;
        const onLadder = getTileType() === "ladder";
        const onTopOfLadder = !onLadder && getTileType(0, 1) === "ladder";
        const onRope = getTileType() === "rope";
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
        else if ((onLadder || onTopOfLadder) && !onBrick && cursors.down.isDown){
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
}
