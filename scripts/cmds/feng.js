const Groq = require("groq-sdk");

module.exports.config = {
  name: "feng",
  version: "1.0",
  author: "Feng"
};

module.exports.onStart = async ({ api, event, args }) => {
  let prompt = args.join(" ");
  if (!prompt) prompt = "hi";

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const res = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300
    });
    api.sendMessage(res.choices[0].message.content, event.threadID, event.messageID);
  } catch (err) {
    api.sendMessage("AI busy, check GROQ_API_KEY", event.threadID, event.messageID);
  }
};
