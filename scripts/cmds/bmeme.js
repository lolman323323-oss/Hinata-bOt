const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "bmeme",
    version: "1.0",
    author: "Helal",
    countDown: 5,
    role: 0,
    description: { en: "Get a random Bangla meme image." },
    category: "meme",
    guide: { en: "/bmeme - Get 1 random Bangla meme image" },
  },

  onStart: async function ({ api, event }) {
    try {
      const query = "Bangla Meme"; // Fixed search query
      const count = 1;

      const GITHUB_RAW = "https://raw.githubusercontent.com/Saim-x69x/sakura/main/ApiUrl.json";
      const rawRes = await axios.get(GITHUB_RAW);
      const apiBase = rawRes.data.apiv1;

      const apiUrl = `${apiBase}/api/googleimage?query=${encodeURIComponent(query)}`;
      const res = await axios.get(apiUrl);
      const images = res.data?.images || [];

      if (!images.length)
        return api.sendMessage(`❌ No Bangla memes found for "${query}"`, event.threadID, event.messageID);

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);

      // Pick a random image
      const url = images[Math.floor(Math.random() * images.length)];
      const imgRes = await axios.get(url, { responseType: "arraybuffer" });
      const imgPath = path.join(cacheDir, `bmeme.jpg`);
      await fs.writeFile(imgPath, imgRes.data);

      await api.sendMessage(
        { body: `😂 Here's a random Bangla meme!`, attachment: fs.createReadStream(imgPath) },
        event.threadID,
        event.messageID
      );

      // Cleanup
      if (fs.existsSync(cacheDir)) await fs.remove(cacheDir);

    } catch (err) {
      console.error("Bangla Meme Img Error:", err.message);
      return api.sendMessage("❌ Something went wrong. Try again later.", event.threadID, event.messageID);
    }
  },
};