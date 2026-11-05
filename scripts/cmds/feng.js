const Groq = require("groq-sdk");

module.exports.config = { name: "feng", version: "3.0" };

module.exports.onStart = async ({ api, event, args }) => {
  const key = process.env.GROQ_API_KEY;
  if(!key) return api.sendMessage("❌ No GROQ_API_KEY", event.threadID, event.messageID);
  
  let prompt = args.join(" ") || "hi";
  
  try{
    const groq = new Groq({ apiKey: key });
    const res = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", // FIXED MODEL!
      messages: [{role:"user", content: prompt}],
      max_tokens: 500
    });
    api.sendMessage(res.choices[0].message.content, event.threadID, event.messageID);
  }catch(e){
    console.log("GROQ ERROR:", e.message);
    api.sendMessage(`❌ ${e.message}`, event.threadID, event.messageID);
  }
};
