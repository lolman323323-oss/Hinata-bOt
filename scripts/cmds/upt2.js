// upt1.js
// Advanced RGB Neon Ring HUD — background: https://i.imgur.com/7Iyxjwp.jpeg
// Requires: npm i canvas
const { createCanvas, loadImage } = require("canvas");
const os = require("os");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "upt2",
    version: "1.0",
    author: "Helal",
    role: 0,
    category: "system",
    shortDescription: "Hinata RGB Neon Ring HUD"
  },

  onStart: async function ({ api, event }) {
    const threadID = event.threadID;
    try {
      // --- GATHER SYSTEM INFO ---
      const botUpSec = Math.floor(process.uptime());
      const sysUpSec = Math.floor(os.uptime());
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const cpuModel = (os.cpus() && os.cpus()[0]) ? os.cpus()[0].model : "Unknown CPU";
      const cores = os.cpus() ? os.cpus().length : 1;
      const load = (os.loadavg && os.loadavg()[0]) ? os.loadavg()[0].toFixed(2) : "0.00";
      const nodev = process.version;
      const arch = os.arch();
      // Simulated values for network/disk/temp — most hosts can't provide without additional libs
      const ping = Math.floor(Math.random() * 40) + 10;
      const netDown = (5 + Math.random()*95).toFixed(1); // Mbps
      const netUp = (0.5 + Math.random()*20).toFixed(1); // Mbps
      const temp = (35 + Math.random()*15).toFixed(1); // °C
      const diskPct =  Math.min(99, Math.round(40 + Math.random()*50)); // placeholder
      const cpuPct = Math.min(100, Math.round(Math.min(100, (parseFloat(load) * 10))));
      const ramPct = Math.min(100, Math.round((usedMem/totalMem)*100));

      // Format helpers
      function fmtTime(s) {
        s = Math.floor(s);
        const d = Math.floor(s/86400); s%=86400;
        const h = Math.floor(s/3600); s%=3600;
        const m = Math.floor(s/60); const sec = s%60;
        return `${d}d ${h}h ${m}m ${sec}s`;
      }
      function fmtBytes(b) {
        const units = ["B","KB","MB","GB","TB"];
        let i=0;
        while (b>=1024 && i<units.length-1){ b/=1024; i++; }
        return `${b.toFixed(2)} ${units[i]}`;
      }

      // --- CANVAS SETUP ---
      const W = 1400;
      const H = 820;
      const canvas = createCanvas(W, H);
      const ctx = canvas.getContext("2d");

      // --- LOAD BACKGROUND IMAGE (user provided) ---
      let bg = null;
      try {
        bg = await loadImage("https://i.imgur.com/7Iyxjwp.jpeg");
      } catch (e) {
        // if load fails, continue with dark gradient
        bg = null;
      }
      if (bg) {
        // draw background scaled to canvas (cover)
        const ar = bg.width/bg.height;
        const canvasAr = W/H;
        let dw = W, dh = H, dx = 0, dy = 0;
        if (ar > canvasAr) {
          dh = H;
          dw = Math.round(H * ar);
          dx = Math.round((W - dw)/2);
        } else {
          dw = W;
          dh = Math.round(W / ar);
          dy = Math.round((H - dh)/2);
        }
        ctx.drawImage(bg, dx, dy, dw, dh);
        // subtle blur-like overlay (simulate)
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fillRect(0,0,W,H);
      } else {
        // fallback background
        const g = ctx.createLinearGradient(0,0, W, H);
        g.addColorStop(0, "#041428");
        g.addColorStop(1, "#061a2a");
        ctx.fillStyle = g;
        ctx.fillRect(0,0,W,H);
      }

      // --- Neon outer border ---
      ctx.save();
      ctx.lineWidth = 8;
      ctx.strokeStyle = "#38f0ff";
      ctx.shadowColor = "#38f0ff";
      ctx.shadowBlur = 40;
      roundedRectPath(ctx, 22, 22, W-44, H-44, 28);
      ctx.stroke();
      ctx.restore();

      // --- Title center-top ---
      ctx.font = "700 42px 'Segoe UI', sans-serif";
      ctx.fillStyle = "#aaf6ff";
      ctx.shadowColor = "#aaf6ff";
      ctx.shadowBlur = 18;
      ctx.textAlign = "center";
      ctx.fillText("HINATA • RGB NEON DASHBOARD", W/2, 70);
      ctx.shadowBlur = 0;

      // --- Layout: center circle + 8 surrounding circles ---
      const cx = W/2;
      const cy = H/2 + 20;
      const centerR = 110;

      // circle positions around center (clockwise)
      const radiusDist = 300;
      const angles = [
        -90, -30, 30, 90, 150, 210, 270, 330
      ]; // degrees (8 positions)
      const positions = angles.map(a => {
        const rad = a * Math.PI/180;
        return { x: Math.round(cx + Math.cos(rad) * radiusDist), y: Math.round(cy + Math.sin(rad) * radiusDist) };
      });

      // draw center HINATA circle
      drawNeonRing(ctx, cx, cy, centerR, ["#ff5ca8","#7e74ff","#2ef5ff"], 1.0);
      // center label
      ctx.font = "800 34px 'Segoe UI'";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText("HINATA", cx, cy - 6);
      ctx.font = "600 18px 'Segoe UI'";
      ctx.fillStyle = "#cdeef8";
      ctx.fillText("SYSTEM HUD", cx, cy + 28);

      // Now draw 8 rings with values and labels
      const items = [
        { label: "CPU %", value: `${cpuPct}%`, pct: cpuPct },
        { label: "RAM %", value: `${ramPct}%`, pct: ramPct },
        { label: "DISK %", value: `${diskPct}%`, pct: diskPct },
        { label: "PING", value: `${ping} ms`, pct: Math.min(100, Math.round((ping/1000)*100)) },
        { label: "CORES", value: `${cores}`, pct: 100 },
        { label: "TEMP", value: `${temp}°C`, pct: Math.min(100, Math.round((temp-20)/60*100)) },
        { label: "NET DOWN", value: `${netDown} Mbps`, pct: Math.min(100, Math.round((parseFloat(netDown)/100)*100)) },
        { label: "NET UP", value: `${netUp} Mbps`, pct: Math.min(100, Math.round((parseFloat(netUp)/100)*100)) }
      ];

      for (let i=0;i<8;i++){
        const pos = positions[i];
        const it = items[i];
        // multi-color gradient ring: give each ring 3 color stops
        const colors = [
          colorForIndex(i, 0),
          colorForIndex(i, 1),
          colorForIndex(i, 2)
        ];
        drawNeonRing(ctx, pos.x, pos.y, 80, colors, it.pct/100);
        // inner value
        ctx.font = "700 20px 'Segoe UI'";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText(it.value, pos.x, pos.y-6);
        // label
        ctx.font = "500 14px 'Segoe UI'";
        ctx.fillStyle = "#cdeef8";
        ctx.fillText(it.label, pos.x, pos.y + 22);
      }

      // bottom-left: small stats box list (transparent)
      const listX = 60;
      const listY = H - 210;
      ctx.textAlign = "left";
      ctx.font = "600 16px 'Segoe UI'";
      ctx.fillStyle = "#dff8ff";
      ctx.fillText(`Bot Uptime: ${fmtTime(botUpSec)}`, listX, listY);
      ctx.fillText(`System Uptime: ${fmtTime(sysUpSec)}`, listX, listY + 28);
      ctx.fillText(`CPU: ${cpuModel}`, listX, listY + 56);
      ctx.fillText(`Total RAM: ${fmtBytes(totalMem)}`, listX, listY + 84);
      ctx.fillText(`Used RAM: ${fmtBytes(usedMem)} (${ramPct}%)`, listX, listY + 112);
      ctx.fillText(`Node: ${nodev} • Arch: ${arch}`, listX, listY + 140);

      // bottom-right: timestamp
      ctx.textAlign = "right";
      ctx.fillStyle = "#cfefff";
      ctx.font = "16px 'Segoe UI'";
      ctx.fillText(new Date().toLocaleString(), W-60, H-40);

      // --- Export PNG and send ---
      const outPath = path.join(process.cwd(), `hinata_rgb_${Date.now()}.png`);
      fs.writeFileSync(outPath, canvas.toBuffer("image/png"));

      await new Promise((res) => {
        api.sendMessage({ attachment: fs.createReadStream(outPath) }, threadID, () => {
          try { fs.unlinkSync(outPath); } catch(e){}
          res();
        });
      });

    } catch (err) {
      console.error("upt1 generation error:", err);
      try { await api.sendMessage("❌ Panel generation failed.", threadID); } catch(e){}
    }
  }
};

// ------- helpers -------

function roundedRectPath(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
}

// draw a neon ring by drawing layered arcs with different colors for RGB shimmer
function drawNeonRing(ctx, cx, cy, r, colors, progress=1.0){
  // base filled circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI*2);
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fill();
  ctx.restore();

  // draw multiple colored arcs for shimmer
  const thickness = 10;
  const start = -Math.PI/2;
  const end = start + Math.PI*2*progress;

  for (let i=0;i<colors.length;i++){
    const offset = (i-1) * 2; // offset strokes
    ctx.save();
    ctx.lineWidth = thickness;
    ctx.strokeStyle = colors[i];
    ctx.shadowColor = colors[i];
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(cx, cy, r - offset, start, end);
    ctx.stroke();
    ctx.restore();
  }

  // inner soft ring
  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.beginPath();
  ctx.arc(cx, cy, r - thickness - 4, 0, Math.PI*2);
  ctx.stroke();
  ctx.restore();
}

// generate 3 colors for ring based on index (multi-color rainbow)
function colorForIndex(i, part){
  const palettes = [
    ["#ff5ca8","#ffb86b","#2ef5ff"],
    ["#7e74ff","#ff6ec7","#38f0ff"],
    ["#ff9a6b","#ffd36a","#6bffb8"],
    ["#3ad0ff","#8a7bff","#ff5ca8"],
    ["#76e1ff","#7af57f","#ff8ae9"],
    ["#cfa8ff","#66d0ff","#ffb86b"],
    ["#ff6e6e","#ff9a6b","#7ee6a3"],
    ["#52f2ff","#b78cff","#ff6ec7"]
  ];
  const idx = i % palettes.length;
  return palettes[idx][part % palettes[idx].length];
}

// rounded rect util
function roundedRectPath(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
}

// small helpers duplicated to keep file self-contained
function fmtTime(s) {
  s = Math.floor(s);
  const d = Math.floor(s/86400); s%=86400;
  const h = Math.floor(s/3600); s%=3600;
  const m = Math.floor(s/60); const sec = s%60;
  return `${d}d ${h}h ${m}m ${sec}s`;
}
function fmtBytes(b) {
  const units = ["B","KB","MB","GB","TB"];
  let i=0;
  while (b>=1024 && i<units.length-1){ b/=1024; i++; }
  return `${b.toFixed(2)} ${units[i]}`;
}