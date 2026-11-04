module.exports = {
  config: {
    name: "ai",
    aliases: ["gpt","xiao"],
    version: "1.0",
    author: "Emperor",
    role: 0,
    shortDescription: "Talk to xiao AI"
  },
  onStart: async function({ api, event, args }) {
    const q = args.slice(1).join(" ");
    if (!q) return api.sendMessage("👑 Ask something! Ex: !ai who are you?", event.threadID);
    // Simple AI reply - you can upgrade later with real API
    api.sendMessage(`👑 xiao AI:\n\nYou asked: "${q}"\n\nI am xiao, ruler of all chats! How can I help you peasant?`, event.threadID);
  }
};
