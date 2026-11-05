const Groq = require("groq-sdk");

module.exports.config = { name: "feng", version: "2.0" };

module.exports.onStart = async ({ api, event, args }) => {
  const key = process.env.GROQ_API_KEY;
  
  // Check 1: Key exists?
  if(!key){
    console.log("❌ GROQ_API_KEY NOT FOUND IN ENV");
    return api.sendMessage("❌ GROQ_API_KEY not set! Go Railway > Variables > Add GROQ_API_KEY", event.threadID, event.messageID);
  }
  
  // Check 2: Key format?
  if(!key.startsWith("gsk_")){
    console.log("❌ KEY WRONG FORMAT:", key.slice(0,10));
    return api.sendMessage("❌ Key must start with gsk_ ! Get new key from console.groq.com", event.threadID, event.messageID);
  }

  console.log("✅ Key found:", key.slice(0,12) + "..." + key.slice(-4));
  
  let prompt = args.join(" ") || "hi";
  
  try{
    const groq = new Groq({ apiKey: key });
    const res = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{role:"user", content: prompt}],
      max_tokens: 500
    });
    api.sendMessage(res.choices[0].message.content, event.threadID, event.messageID);
  }catch(e){
    console.log("GROQ ERROR:", e.message);
    
    if(e.message.includes("Invalid API Key") || e.message.includes("401")){
      api.sendMessage("❌ Invalid API Key! Get new one at console.groq.com/keys and update Railway Variable", event.threadID, event.messageID);
    } else if(e.message.includes("429")){
      api.sendMessage("⏳ Groq rate limit! Wait 1 minute and try again", event.threadID, event.messageID);
    } else {
      api.sendMessage(`❌ Groq error: ${e.message}`, event.threadID, event.messageID);
    }
  }
};
