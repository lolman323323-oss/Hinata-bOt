const fs = require("fs");

module.exports = {
  config: {
    name: "help4",
    aliases: ["menu4"],
    version: "2.0",
    author: "Helal",
    role: 0,
    shortDescription: "Show full command list with animation + fancy font",
  },

  onStart: async function ({ api, event }) {
    const commands = global.GoatBot?.commands || new Map();
    const sent = await api.sendMessage("⏳ Loading help menu...", event.threadID);

    // Animation frames
    const frames = [
      "[░░░░░░░░░░] ⚪0%",
      "[██░░░░░░░░] 🟠40%",
      "[██████░░░░] 🔴80%",
      "[██████████] 🟢100%"
    ];

    for (const frame of frames) {
      await new Promise(r => setTimeout(r, 500));
      await api.editMessage(frame, sent.messageID);
    }

    await new Promise(r => setTimeout(r, 600));

    // Category sorting
    const categories = {};
    for (const [name, cmd] of commands.entries()) {
      const cat = cmd.config?.category?.toUpperCase() || "🎮 OTHER";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(name);
    }

    let menu = "🛡️ 𝙷𝙴𝙻𝙿 𝙼𝙴𝙽𝚄\n━━━━━━━━━━━━━━━━━━━━━━\n";

    // Create boxes
    for (const [cat, cmds] of Object.entries(categories)) {
      menu += `📦 ${convertFont(cat)}\n`;
      const pairs = chunkArray(cmds, 2);
      for (const row of pairs) {
        const c1 = row[0] ? `🔹 ${convertFont(row[0])}` : "";
        const c2 = row[1] ? `   🔹 ${convertFont(row[1])}` : "";
        menu += `${c1}${c2}\n`;
      }
      menu += "\n";
    }

    menu += "━━━━━━━━━━━━━━━━━━━━━━\n" +
      `💡 ᴜꜱᴇ /help [command] ᴛᴏ ꜱᴇᴇ ᴅᴇᴛᴀɪʟꜱ\n` +
      `📦 ᴛᴏᴛᴀʟ ᴄᴏᴍᴍᴀɴᴅꜱ: ${commands.size}\n` +
      `👑 ᴏᴡɴᴇʀ: ʜᴇʟᴀʟ\n` +
      "━━━━━━━━━━━━━━━━━━━━━━";

    await api.editMessage(menu, sent.messageID);
  }
};

// Split array into pairs
function chunkArray(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

// Fancy font converter
function convertFont(text) {
  const normal = "abcdefghijklmnopqrstuvwxyz";
  const fancy = "ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ";
  return text
    .split("")
    .map(ch => {
      const idx = normal.indexOf(ch.toLowerCase());
      return idx !== -1 ? fancy[idx] : ch;
    })
    .join("");
}
