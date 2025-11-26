const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "qrcard",
    version: "3.0",
    author: "Helal",
    role: 0,
    category: "graphic",
    shortDescription: "Generate neon QR code card"
  },

  onStart: async function ({ api, event, args }) {
    const threadID = event.threadID;

    const text = args.join(" ");

    if (!text) return api.sendMessage("Use: /qrcard <your text>", threadID);

    try {
      // ---------- GENERATE QR BUFFER ----------
      const qrBuffer = await QRCode.toBuffer(text, {
        errorCorrectionLevel: "H",
        margin: 1,
        width: 550
      });

      // ---------- CANVAS ----------
      const W = 900, H = 900;
      const canvas = createCanvas(W, H);
      const ctx = canvas.getContext("2d");

      // Gradient background
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, "#001f3f");
      grad.addColorStop(1, "#001020");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Center glow
      ctx.save();
      ctx.fillStyle = "rgba(0,255,255,0.25)";
      ctx.shadowBlur = 150;
      ctx.shadowColor = "#00ffff";
      ctx.beginPath();
      ctx.arc(W/2, H/2, 230, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Load QR as image
      const qrImg = await loadImage(qrBuffer);

      // Draw QR
      const qrSize = 480;
      ctx.drawImage(qrImg, (W - qrSize)/2, (H - qrSize)/2, qrSize, qrSize);

      // Neon border around QR
      ctx.save();
      ctx.strokeStyle = "#00ffff";
      ctx.lineWidth = 12;
      ctx.shadowBlur = 40;
      ctx.shadowColor = "#00ffff";
      ctx.strokeRect((W - qrSize)/2 - 10, (H - qrSize)/2 - 10, qrSize + 20, qrSize + 20);
      ctx.restore();

      // Text below QR
      ctx.font = "bold 38px sans-serif";
      ctx.fillStyle = "#bff";
      ctx.textAlign = "center";
      ctx.fillText("QR Generated Successfully ✓", W/2, H - 120);

      ctx.font = "26px sans-serif";
      ctx.fillStyle = "#8ff";
      ctx.fillText(text, W/2, H - 70);

      // Save
      const final = path.join(__dirname, "qrcard.png");
      fs.writeFileSync(final, canvas.toBuffer());

      api.sendMessage(
        { body: "", attachment: fs.createReadStream(final) },
        threadID
      );

    } catch (e) {
      return api.sendMessage("❌ Failed to generate QR Card.", threadID);
    }
  }
};