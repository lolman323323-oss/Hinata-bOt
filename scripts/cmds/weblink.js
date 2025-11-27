const axios = require("axios");
const FormData = require("form-data");

module.exports = {
  config: {
    name: "weblink",
    version: "5.0",
    author: "Helal",
    role: 0,
    category: "web",
    shortDescription: "Fetch website source and auto upload to multiple paste servers"
  },

  onStart: async function ({ api, event, args }) {
    const url = args[0];
    const threadID = event.threadID;

    if (!url) return api.sendMessage("Use: /weblink <url>", threadID);

    try {
      // FETCH SOURCE
      const { data } = await axios.get(url, {
        timeout: 20000,
        headers: { "User-Agent": "Mozilla/5.0 (WebLinkBot)" }
      });

      const text = String(data);

      // 1️⃣ UPLOAD TO 0x0.st
      try {
        const form = new FormData();
        form.append("file", text, "source.txt");

        const res = await axios.post("https://0x0.st", form, {
          headers: form.getHeaders()
        });

        const link = res.data.trim();
        return api.sendMessage(link, threadID);
      } catch (err) {}

      // 2️⃣ FALLBACK: Hastebin
      try {
        const res = await axios.post("https://hastebin.skyra.pw/documents", text, {
          headers: { "Content-Type": "text/plain" }
        });

        const key = res.data.key;
        return api.sendMessage(`https://hastebin.skyra.pw/${key}`, threadID);
      } catch (err) {}

      // 3️⃣ FALLBACK: Mystb.in
      try {
        const res = await axios.post(
          "https://mystb.in/api/paste",
          { files: [{ content: text }] },
          { headers: { "Content-Type": "application/json" } }
        );

        return api.sendMessage(
          `https://mystb.in/${res.data.id}`,
          threadID
        );
      } catch (err) {}

      // If all fail
      return api.sendMessage("All upload servers failed.", threadID);

    } catch (e) {
      return api.sendMessage("Error fetching website.", threadID);
    }
  }
};