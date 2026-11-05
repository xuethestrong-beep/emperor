const Groq = require("groq-sdk");

module.exports.config = {
  name: "ai",
  version: "1.0",
  author: "Feng",
  role: 0
};

module.exports.onStart = async ({ api, event, args }) => {
  let prompt = args.join(" ");
  if(!prompt) return api.sendMessage("Use: !ai hi", event.threadID, event.messageID);
  
  try{
    const groq = new Groq({apiKey: process.env.GROQ_API_KEY});
    const res = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{role:"user", content: prompt}],
      max_tokens: 300
    });
    api.sendMessage(res.choices[0].message.content, event.threadID, event.messageID);
  }catch(e){
    api.sendMessage("❌ Error: " + e.message, event.threadID, event.messageID);
  }
};
