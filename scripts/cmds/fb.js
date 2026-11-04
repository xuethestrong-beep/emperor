const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
module.exports = {
  config: { name: "fb", aliases: ["facebook"], version: "1.0", author: "Emperor", role: 0, shortDescription: "FB video download" },
  onStart: async function({ api, event, args }) {
    const url = args[1];
    if (!url) return api.sendMessage("👑 Usage: !fb <facebook video link>", event.threadID);
    try {
      api.sendMessage("👑 Downloading FB video... 📥", event.threadID);
      const res = await axios.get(`https://api.ryzumi.vip/api/downloader/fb?url=${encodeURIComponent(url)}`);
      const videoUrl = res.data.sd || res.data.hd;
      if (!videoUrl) return api.sendMessage("❌ Can't download this FB video!", event.threadID);
      const filePath = path.join(__dirname, `${Date.now()}.mp4`);
      const vid = await axios.get(videoUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, vid.data);
      api.sendMessage({ body: "👑 FB Video Done!", attachment: fs.createReadStream(filePath) }, event.threadID, () => fs.unlinkSync(filePath));
    } catch(e){ api.sendMessage(`❌ Error: ${e.message}`, event.threadID); }
  }
};
