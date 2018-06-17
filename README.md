
Humanoïdes is a game similar to [Androides](https://youtu.be/S4ewY7xWzKY),
a French game developed in 1985 for the microcomputer Thomson MO5.

This is a work in progress: it currently has only one level; nothing happens
when you win or get caught; there is no sound.

Usage
=====

The main character is controlled by the keyboard:

| Key         | Action                                   |
|:------------|:-----------------------------------------|
| Left arrow  | Move to the left (running or hanging)    |
| Right arrow | Move to the right (running or hanging)   |
| Up arrow    | Climb up a ladder                        |
| Down arrow  | Climb down a ladder, or fall from a rope |
| S           | Break a brick on the left                |
| D           | Break a brick on the right               |

Build instructions
==================

Install `node.js` and `npm`. Linux users can get recent versions from
the [NodeSource distributions](https://github.com/nodesource/distributions).

Install [Grunt](https://gruntjs.com/):

```
sudo npm install -g grunt
```

Clone this repository and build:

```
git clone https://github.com/senshu/Humanoides.git
cd Humanoides
npm install
grunt
```

Open the `index.html` file in a web browser.
