
import {Board} from "./board.js"

const BoardEditor = Object.create(Board);

BoardEditor.setup = function () {
    Board.setup.call(this);
};

BoardEditor.run = function () {

};

BoardEditor.onKeyChange = function (evt, down) {

};

const defaultBoard = [
    "%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%",
    "%                                      %",
    "%                                      %",
    "%                                      %",
    "%                                      %",
    "%                                      %",
    "%                                      %",
    "%                                      %",
    "%                                      %",
    "%                                      %",
    "%                                      %",
    "%                                      %",
    "%                                      %",
    "%                                      %",
    "%                                      %",
    "%                                      %",
    "%                                      %",
    "%                                      %",
    "%                                      %",
    "%                                      %",
    "%                                      %",
    "%        #          X          @       %"
];

window.addEventListener("load", () => {
    if (!window.location.hash.length) {
        BoardEditor.init(defaultBoard, b => window.location.hash = "#" + b.encode());
    }
    else {
        BoardEditor.decode(window.location.hash.slice(1));
    }
});
