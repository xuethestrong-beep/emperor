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

console.log("STARTING FENG V31 REPLY FIX...");

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
    
    // TRIGGER: contains "feng" OR replying to Feng
    let shouldReply = body.toLowerCase().includes("feng") || isReplyToBot;
    if (!shouldReply) return;

    console.log("TRIGGERED by:", isReplyToBot ? "REPLY" : "FENG KEYWORD", body);

    api.sendMessage("Feng is thinking haha...", event.threadID);

    groq.chat.completions.create({
      model: "llama-3.1-8b-instant", // FIXED MODEL!
      messages: [
        { role: "system", content: "You are Feng, 20yo guy from Laoag, chill funny short 5-15 words Taglish haha lods gagi. Never say AI." },
        { role: "user", content: body.replace(/feng/gi,"").trim() || "hi" }
      ],
      max_tokens: 80,
      temperature: 0.8
    }).then(c => {
      let reply = c.choices[0].message.content;
      console.log("REPLY:", reply);
      api.sendMessage(reply, event.threadID);
    }).catch(e => {
      console.log("GROQ ERR:", e.message);
      api.sendMessage("Feng error: " + e.message.slice(0,120), event.threadID);
    });
  });
});
