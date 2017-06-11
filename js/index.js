
const game = new Phaser.Game(800, 600, Phaser.AUTO, "", {preload, create, update});

let player, cursors;

function preload() {
    game.load.spritesheet("human", 'assets/human.png', 21, 21);
}

function create() {
    game.physics.startSystem(Phaser.Physics.ARCADE);

    cursors = game.input.keyboard.createCursorKeys();

    player = game.add.sprite(21, game.world.height - 150, "human");
    game.physics.arcade.enable(player);
    player.body.bounce.y = 0.2;
    player.body.gravity.y = 300;
    player.body.collideWorldBounds = true;

    player.animations.add('left', [0, 1, 2, 3, 4, 5], 10, true);
    player.animations.add('right', [7, 8, 9, 10, 11, 12], 10, true);
}

function update() {
    // var hitPlatform = game.physics.arcade.collide(player, platforms);

    player.body.velocity.x = 0;

    if (cursors.left.isDown) {
        player.body.velocity.x = -150;
        player.animations.play('left');
    }
    else if (cursors.right.isDown) {
        player.body.velocity.x = 150;
        player.animations.play('right');
    }
    else {
        player.animations.stop();
        player.frame = 6;
    }

}
