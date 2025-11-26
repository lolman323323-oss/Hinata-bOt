// mttt.js – Multiplayer Neon Tic Tac Toe (username only, turn-enforced)
// Author: Helal (Credit Locked 🔒)

const fs = require("fs");
const path = require("path");
const { createCanvas } = require("canvas");

const LOCKED_AUTHOR = "Helal";
const wins = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

let games = {}; // store active games per threadID

function drawBoard(board, winCombo = null){
  const size = 600;
  const cell = size / 3;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // background
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, size, size);

  // neon border
  ctx.lineWidth = 15;
  ctx.strokeStyle = "#00ffff";
  ctx.shadowColor = "#00ffff";
  ctx.shadowBlur = 30;
  ctx.strokeRect(5, 5, size - 10, size - 10);

  // grid lines
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(cell, 0); ctx.lineTo(cell, size);
  ctx.moveTo(cell * 2, 0); ctx.lineTo(cell * 2, size);
  ctx.moveTo(0, cell); ctx.lineTo(size, cell);
  ctx.moveTo(0, cell * 2); ctx.lineTo(size, cell * 2);
  ctx.stroke();

  // draw X/O or number
  ctx.font = "120px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let i = 0; i < 9; i++){
    const x = (i % 3) * cell + cell / 2;
    const y = Math.floor(i / 3) * cell + cell / 2;

    if (board[i] === null){
      ctx.fillStyle = "#00ffff";
      ctx.shadowColor = "#00ffff";
      ctx.shadowBlur = 25;
      ctx.fillText((i + 1).toString(), x, y);
    } else if (board[i] === "X"){
      ctx.fillStyle = "#00ff00"; // Green X
      ctx.shadowColor = "#00ff00";
      ctx.shadowBlur = 25;
      ctx.fillText("X", x, y);
    } else if (board[i] === "O"){
      ctx.fillStyle = "#ff0000"; // Red O
      ctx.shadowColor = "#ff0000";
      ctx.shadowBlur = 25;
      ctx.fillText("O", x, y);
    }
  }

  if (winCombo){
    const [a,,c] = winCombo;
    const ax = (a % 3) * cell + cell / 2;
    const ay = Math.floor(a / 3) * cell + cell / 2;
    const cx = (c % 3) * cell + cell / 2;
    const cy = Math.floor(c / 3) * cell + cell / 2;

    ctx.strokeStyle = "#ff00ff"; // magenta neon for win line
    ctx.lineWidth = 15;
    ctx.shadowColor = "#ff00ff";
    ctx.shadowBlur = 40;

    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(cx, cy);
    ctx.stroke();
  }

  return canvas.toBuffer();
}

function checkWin(board){
  for (let w of wins){
    if (board[w[0]] && board[w[0]] === board[w[1]] && board[w[1]] === board[w[2]]){
      return w;
    }
  }
  return null;
}

module.exports = {
  config:{
    name: "mttt",
    version: "1.4",
    author: "Helal",
    category: "game",
    shortDescription: "Multiplayer Neon Tic Tac Toe",
    guide: "/mttt @user"
  },

  onStart: async function({ message, event, api }){
    if (this.config.author !== LOCKED_AUTHOR) return message.reply("❌ Credit locked!");

    const mentions = Object.keys(event.mentions);
    if (!mentions[0]) return message.reply("❌ Please mention a user to start the game!");

    const player1 = event.senderID;
    const player2 = mentions[0];
    if (player1 === player2) return message.reply("❌ You cannot play against yourself!");

    // assign X and O
    const assign = ["X","O"];
    if (Math.random() < 0.5) assign.reverse();
    const playerX = (assign[0] === "X" ? player1 : player2);
    const playerO = (assign[0] === "X" ? player2 : player1);

    const board = Array(9).fill(null);

    games[event.threadID] = {
      playerX,
      playerO,
      board,
      turn: "X",
      lastMsg: null,
      names: {}
    };

    // get names safely
    const info = await api.getUserInfo([player1, player2]);
    for (const id in info){
      if (info.hasOwnProperty(id)){
        games[event.threadID].names[id] = info[id].name || "Unknown";
      }
    }

    // draw initial board
    const buffer = drawBoard(board);
    const out = path.join(__dirname, "mttt_board.png");
    fs.writeFileSync(out, buffer);

    return message.reply({
      body: `🎮 Multiplayer Tic Tac Toe started!\nPlayer X: ${games[event.threadID].names[playerX]}\nPlayer O: ${games[event.threadID].names[playerO]}\nReply 1‑9 to place your move.\nIt’s ${games[event.threadID].names[playerX]}’s turn.`,
      attachment: fs.createReadStream(out)
    }, (err, info) => {
      games[event.threadID].lastMsg = info.messageID;
    });
  },

  onChat: async function({ message, event }){
    const game = games[event.threadID];
    if (!game) return;

    const choice = parseInt(event.body);
    if (!choice || choice < 1 || choice > 9) return;

    const currentPlayerID = (game.turn === "X" ? game.playerX : game.playerO);
    if (event.senderID !== currentPlayerID) return; // not their turn

    if (game.board[choice - 1] !== null) return message.reply("❌ That cell is already taken!");

    game.board[choice - 1] = game.turn;

    let winCombo = checkWin(game.board);
    if (winCombo){
      const buffer = drawBoard(game.board, winCombo);
      const out = path.join(__dirname, "mttt_win.png");
      fs.writeFileSync(out, buffer);
      try{ await message.unsend(game.lastMsg); }catch(e){}
      delete games[event.threadID];
      return message.reply({
        body: `🏆 ${game.names[currentPlayerID]} wins!`,
        attachment: fs.createReadStream(out)
      });
    }

    if (game.board.every(c => c !== null)){
      const buffer = drawBoard(game.board);
      const out = path.join(__dirname, "mttt_draw.png");
      fs.writeFileSync(out, buffer);
      try{ await message.unsend(game.lastMsg); }catch(e){}
      delete games[event.threadID];
      return message.reply({
        body: "🤝 Draw!",
        attachment: fs.createReadStream(out)
      });
    }

    // switch turn
    game.turn = (game.turn === "X" ? "O" : "X");
    const nextPlayerID = (game.turn === "X" ? game.playerX : game.playerO);

    const buffer = drawBoard(game.board);
    const out = path.join(__dirname, "mttt_board.png");
    fs.writeFileSync(out, buffer);

    try{ await message.unsend(game.lastMsg); }catch(e){}

    return message.reply({
      body: `🎮 Tic Tac Toe continues! It’s ${game.names[nextPlayerID]}’s turn.`,
      attachment: fs.createReadStream(out)
    }, (err, info) => {
      game.lastMsg = info.messageID;
    });
  }
};