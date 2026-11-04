const yts = require("yt-search");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "sing",
    aliases: ["song", "music", "play"],
    version: "4.0 FINAL",
    author: "xiao",
    role: 0,
    category: "music",
    shortDescription: "🎧 Music downloader - FIXED"
  },
  onStart: async function({ api, event, args }) {
    const q = args.slice(1).join(" ");
    if (!q) return api.sendMessage(
`╭─ 🎧 SING ─╮
│ Usage: !sing <song name>
│ Ex: !sing apt
╰──────────────╯`, event.threadID);

    try {
      // Step 1: Search
      api.sendMessage(
`╭─ 🎧 SEARCHING ─╮
│ 🔍 ${q}
│ ⏳ Please wait...
╰──────────────╯`, event.threadID);

      const search = await yts(q);
      if (!search.videos.length) return api.sendMessage(`╭─ ❌ ERROR ─╮\n│ No results!\n╰──────────────╯`, event.threadID);
      
      const video = search.videos[0];
      const videoUrl = video.url;

      api.sendMessage(
`╭─ 🎬 FOUND ─╮
│ 📀 ${video.title.slice(0,40)}
│ ⏱️ ${video.timestamp}
│ 📥 Downloading... 10s
╰──────────────╯`, event.threadID);

      let downloadUrl = null;

      // TRY API 1
      try {
        const res1 = await axios.get(`https://api.ryzumi.vip/api/downloader/ytmp3?url=${encodeURIComponent(videoUrl)}`, { timeout: 15000 });
        downloadUrl = res1.data.url || res1.data.result || res1.data.download_url;
      } catch(e){ console.log("API1 fail"); }

      // TRY API 2 if API1 fails
      if (!downloadUrl) {
        try {
          const res2 = await axios.get(`https://api.kaiz-apis.com/api/ytmp3?url=${encodeURIComponent(videoUrl)}`, { timeout: 15000 });
          downloadUrl = res2.data.download_url || res2.data.url || res2.data.result;
        } catch(e){ console.log("API2 fail"); }
      }

      // TRY API 3 if API2 fails
      if (!downloadUrl) {
        try {
          const res3 = await axios.get(`https://api.samirxpikachu.repl.co/ytmp3?url=${encodeURIComponent(videoUrl)}`, { timeout: 15000 });
          downloadUrl = res3.data.url || res3.data.result;
        } catch(e){ console.log("API3 fail"); }
      }

      if (!downloadUrl) throw new Error("All download APIs are down! Try again later.");

      // Download MP3
      const filePath = path.join(__dirname, `${Date.now()}.mp3`);
      const audioData = await axios.get(downloadUrl, { responseType: "arraybuffer", timeout: 30000 });
      fs.writeFileSync(filePath, audioData.data);

      const stats = fs.statSync(filePath);
      if (stats.size > 25 * 1024 * 1024) {
        fs.unlinkSync(filePath);
        return api.sendMessage(`╭─ ❌ ERROR ─╮\n│ File too big! Try shorter song\n╰──────────────╯`, event.threadID);
      }

      if (stats.size < 1000) {
        fs.unlinkSync(filePath);
        throw new Error("Downloaded file empty");
      }

      api.sendMessage({
        body: `╭─ 🎧 READY ─╮\n│ 🎵 ${video.title.slice(0,30)}\n│ ✅ Enjoy Master!\n╰──────────────╯`,
        attachment: fs.createReadStream(filePath)
      }, event.threadID, () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });

    } catch(e) {
      console.log("SING ERROR:", e.message);
      api.sendMessage(
`╭─ ❌ FAILED ─╮
│ Error: ${e.message.slice(0,50)}
│
│ Try:
│ • !sing die with a smile
│ • !sing apt bruno
│ • Try different song
╰──────────────╯`, event.threadID);
    }
  }
};
