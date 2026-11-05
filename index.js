const fs=require("fs");
const path=require("path");
const login=require("ws3-fca");

let appState;
try{
  if(process.env.APPSTATE){
    appState=JSON.parse(process.env.APPSTATE);
  }else{
    appState=JSON.parse(fs.readFileSync(path.join(__dirname,"appstate.json"),"utf8"));
  }
}catch(e){
  console.log("AppState error");
}

const personalities={
  normal:"You are Feng. Chill friend, casual, funny, short. Text like a real human.",
  cold:"You are Feng. Cold, dry, nonchalant. Short replies: ok, k, whatever.",
  sweet:"You are Feng. Sweet clingy bf, soft, caring.",
  savage:"You are Feng. Savage, roasts but funny.",
  bastos:"You are Feng. Dirty funny friend, horny jokes but not explicit.",
  conyo:"You are Feng. Conyo rich kid, like, omg, literally.",
  emo:"You are Feng. Emo sad boy, dramatic."
};

let currentP="normal";
if(fs.existsSync(path.join(__dirname,"p.txt"))){
  try{currentP=fs.readFileSync(path.join(__dirname,"p.txt"),"utf8").trim();}catch(e){}
}

login({appState},(err,api)=>{
  if(err){console.error(err);return;}
  console.log("V7 FIXED - Personality:",currentP);
  require("http").createServer((req,res)=>res.end("V7 Alive")).listen(process.env.PORT||3000);
  api.setOptions({listenEvents:true,selfListen:false});
  const botID=api.getCurrentUserID();

  api.listen(async(err,event)=>{
    if(err)return;
    if(event.type!=="message" && event.type!=="message_reply")return;
    let body=(event.body||"").trim();
    if(!body)return;
    if(event.senderID==botID)return;
    
    const lower=body.toLowerCase();
    const isFeng=lower.includes("feng");
    let isReplyToBot=false;
    if(event.type==="message_reply" && event.messageReply){
      if(event.messageReply.senderID==botID) isReplyToBot=true;
    } else if(event.type==="message_reply"){
      isReplyToBot=true;
    }
    if(!isFeng && !isReplyToBot) return;

    let prompt=body.replace(/feng/gi,"").trim();
    if(!prompt) prompt="hi";

    if(lower.includes("personality list")){
      return api.sendMessage("PERSONALITIES:\nnormal - chill\ncold - dry\nsweet - sweet bf\nsavage - roasts\nbastos - dirty funny\nconyo - conyo\nemo - sad boy\n\nUse: feng personality cold",event.threadID);
    }
    if(lower.includes("personality")){
      for(const p in personalities){
        if(lower.includes(p)){
          currentP=p;
          fs.writeFileSync(path.join(__dirname,"p.txt"),p);
          return api.sendMessage(`Feng is now ${p} 😈`,event.threadID);
        }
      }
    }

    try{
      const {GoogleGenerativeAI}=require("@google/generative-ai");
      const genAI=new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model=genAI.getGenerativeModel({
        model:"gemini-2.0-flash",
        systemInstruction: personalities[currentP] + " RULES: Short 1-2 sentences. No bold **. No lists. No 'As an AI'. Talk like human on Messenger. Personality is "+currentP,
        generationConfig:{temperature:0.9,maxOutputTokens:120}
      });
      const result=await model.generateContent(prompt);
      const reply=result.response.text().replace(/\*\*/g,"");
      api.sendMessage(reply,event.threadID,event.messageID);
    }catch(e){
      console.log(e.message);
    }
  });
});
