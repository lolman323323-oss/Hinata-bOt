const axios = require("axios");
const fs = require("fs");
const path = require("path");

let repoCache = {};

module.exports = {
  config: {
    name: "repo",
    version: "3.0",
    author: "Helal",
    category: "tools",
    shortDescription: "Fetch command files from public GitHub repo",
    guide: "/repo <GitHub repo link>"
  },

  onStart: async function ({ message, event, args }) {
    const link = args[0];
    if (!link) return message.reply("❌ Please provide a GitHub repo link.");

    // clean .git suffix
    const cleanLink = link.replace(/\.git$/, "").replace(/\/$/, "");
    const match = cleanLink.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) return message.reply("❌ Invalid GitHub repo URL.");

    const owner = match[1];
    const repo = match[2];

    const folders = [
      "scripts/cmds",
      "scripts/cmd",
      "script/cmds",
      "script/cmd",
      "cmds",
      "commands",
      "modules",
      "plugins"
    ];

    let allFiles = [];

    try {
      // detect default branch
      const branchRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}`);
      const branch = branchRes.data.default_branch;

      for (let folder of folders) {
        try {
          const url = `https://api.github.com/repos/${owner}/${repo}/contents/${folder}?ref=${branch}`;
          const res = await axios.get(url);

          res.data.forEach(f => {
            if (f.type === "file" && f.name.endsWith(".js")) {
              allFiles.push({ path: `${folder}/${f.name}`, download_url: f.download_url });
            }
          });
        } catch (e) {
          continue; // folder may not exist
        }
      }

      if (allFiles.length === 0) return message.reply("⚠ No command files found in the repo.");

      repoCache[event.senderID] = { files: allFiles };

      let list = "📦 Command files found:\n\n";
      allFiles.forEach((f, i) => {
        list += `${i + 1}) ${f.path}\n`;
      });
      list += "\n➡ Reply with number to download file.";

      return message.reply(list);

    } catch (err) {
      return message.reply("❌ Cannot fetch repo. Check if it's public and URL is correct.");
    }
  },

  onChat: async function ({ message, event }) {
    const cache = repoCache[event.senderID];
    if (!cache) return;

    const num = parseInt(event.body);
    if (!num || num < 1 || num > cache.files.length) return;

    const file = cache.files[num - 1];

    try {
      const res = await axios.get(file.download_url);
      const buffer = Buffer.from(res.data, "utf-8");

      await message.reply({
        body: `📄 File: ${file.path}`,
        attachment: buffer
      });

      delete repoCache[event.senderID];
    } catch (e) {
      return message.reply("❌ Failed to download file.");
    }
  }
};