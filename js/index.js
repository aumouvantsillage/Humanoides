
import {Board, encode, decode} from "./board.js"

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
    "%  H%           %H  # @      %%%%%%    %",
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

const board2 = [
    "%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%",
    "%       X                              %",
    "%                            @   #     %",
    "%                       H%%%%%%%%%%%%%H%",
    "% @                     H             H%",
    "% HHHH%%%%%%%%%%%%%%%%% H             H%",
    "% HHHH        @         H             H%",
    "% HHHH     H%%%%%%%%%%%%H             H%",
    "% HHHH     H                          H%",
    "% HHHH     H                          H%",
    "% HHHH     H                          H%",
    "% %%%%%%%%%H                          H%",
    "%          H         #       @        H%",
    "%          H%%%%%%%%%%%%%%%%%%%%%%%%%%H%",
    "%          H                          H%",
    "%          H                          H%",
    "%          H------------------------- H%",
    "%          H                          H%",
    "%          H                          H%",
    "%          H                          H%",
    "%          H                          H%",
    "%          H    @                     H%",
];

window.addEventListener("load", () => {
    if (!window.location.hash.length) {
        Board.init(board1);
        window.location.hash = "#" + Board.encode();
    }
    else {
        Board.decode(window.location.hash.slice(1));
    }
});
