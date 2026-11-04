const yts = require("yt-search");
const ytdl = require("ytdl-core");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "sing",
    aliases: ["song", "music", "play"],
    version: "2.0",
    author: "Emperor",
    role: 0,
    shortDescription: "Download song from YouTube",
    longDescription: "Search and download MP3",
    category: "music",
    guide: "{pn} <song name>"
  },
  onStart: async function({ api, event, args }) {
    const q = args.slice(1).join(" ");
    if (!q) return api.sendMessage("👑 Usage: !song <song name>\nEx: !song die with a smile", event.threadID);

    try {
      api.sendMessage(`👑 Searching: "${q}"... 🎵`, event.threadID);

      const search = await yts(q);
      if (!search.videos.length) return api.sendMessage("❌ No results found!", event.threadID);
      
      const video = search.videos[0];
      const filePath = path.join(__dirname, `${Date.now()}.mp3`);

      api.sendMessage(`🎧 Found: ${video.title}\n⏱️ ${video.timestamp}\n📥 Downloading...`, event.threadID);

      const stream = ytdl(video.url, { filter: "audioonly", quality: "highestaudio" });
      const writeStream = fs.createWriteStream(filePath);
      stream.pipe(writeStream);

      writeStream.on("finish", () => {
        if (fs.statSync(filePath).size > 25 * 1024 * 1024) {
          fs.unlinkSync(filePath);
          return api.sendMessage("❌ File too large (>25MB), can't send!", event.threadID);
        }
        api.sendMessage({
          body: `👑 ${video.title}\n🎵 Enjoy Master!`,
          attachment: fs.createReadStream(filePath)
        }, event.threadID, () => fs.unlinkSync(filePath));
      });

      stream.on("error", () => {
        api.sendMessage("❌ Download failed! Try another song.", event.threadID);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });

    } catch(e) {
      console.log(e);
      api.sendMessage(`❌ Error: ${e.message}`, event.threadID);
    }
  }
};
