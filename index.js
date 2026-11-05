const Groq = require("groq-sdk");
let login;
try { 
  let fca = require("ws3-fca");
  login = fca.default || fca.login || fca;
} catch { 
  login = require("fca-unofficial"); 
}
let appState = JSON.parse(process.env.APPSTATE);
let groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
console.log("FENG V34 NO THINKING...");

login({ appState }, (err, api) => {
  if (err) return process.exit(0);
  console.log("FENG ONLINE", api.getCurrentUserID());
  require("http").createServer((_,r)=>r.end("OK")).listen(process.env.PORT||3000);
  api.setOptions({ listenEvents: true, selfListen: false });

  api.listenMqtt((err, event) => {
    if (err || !event.body) return;
    if (event.senderID == api.getCurrentUserID()) return;

    const body = event.body || "";
    const isReplyToBot = event.messageReply && event.messageReply.senderID == api.getCurrentUserID();
    if (!body.toLowerCase().includes("feng") && !isReplyToBot) return;

    groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        { role: "system", content: "You are Feng, 20yo guy from Laoag, chill funny short 5-15 words Taglish haha lods. Never say AI." },
        { role: "user", content: body.replace(/feng/gi,"").trim() || "hi" }
      ],
      max_tokens: 80,
      temperature: 0.8
    }).then(c => {
      api.sendMessage(c.choices[0].message.content, event.threadID);
    }).catch(e => {
      api.sendMessage("Error: " + e.message.slice(0,100), event.threadID);
    });
  });
});
