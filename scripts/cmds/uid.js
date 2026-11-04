module.exports = {
  config: {
    name: "uid",
    version: "1.0",
    author: "Emperor",
    role: 0,
    shortDescription: "Get UID"
  },
  onStart: async function({ api, event }) {
    const uid = event.senderID;
    const threadID = event.threadID;
    api.sendMessage(`👑 Your UID: ${uid}\nThread ID: ${threadID}`, threadID);
  }
};
