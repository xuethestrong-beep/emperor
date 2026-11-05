const fs = require("fs");
const path = require("path");
const BANK_FILE = path.join(__dirname, "bank.json");

function loadBank() {
  if (!fs.existsSync(BANK_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(BANK_FILE)); } catch { return {}; }
}
function saveBank(data) { fs.writeFileSync(BANK_FILE, JSON.stringify(data, null, 2)); }
function getWallet(id) {
  const all = loadBank();
  if (!all[id]) all[id] = { wallet: 1000, bank: 0, lastDaily: 0, lastWork: 0, lastInterest: Date.now() };
  return { all, me: all[id] };
}

module.exports.config = { name: "game", version: "5.0 BANK v2", role: 0 };

module.exports.onStart = async ({ api, event, args }) => {
  const type = (args[0]||"").toLowerCase();
  const id = event.senderID;
  const threadID = event.threadID;

  let { all, me } = getWallet(id);

  if (!type) {
    return api.sendMessage(
`🎰 CASINO + BANK v2
Wallet: $${me.wallet} | Bank: $${me.bank}

!game slot 100 - 7️⃣7️⃣7️⃣ = 10x!
!game roulette red 50 - color 2x
!game roulette 17 100 - number 35x!
!game blackjack 200
!game flip heads 50
!game dice 50

Earn: !bank daily + !bank work`,
      threadID, event.messageID
    );
  }

  let bet = 50;
  if (type === "roulette" || type === "flip") bet = parseInt(args[2]) || 50;
  else bet = parseInt(args[1]) || 50;

  if (me.wallet < bet) {
    return api.sendMessage(`❌ Kulang wallet! $${me.wallet} lang! Do !bank withdraw ${bet} or !bank daily`, threadID, event.messageID);
  }

  if (type === "slot") {
    const icons = ["🍒","🍋","🍊","🍉","⭐","💎","7️⃣"];
    const a = icons[Math.floor(Math.random()*icons.length)], b = icons[Math.floor(Math.random()*icons.length)], c = icons[Math.floor(Math.random()*icons.length)];
    let win = 0;
    if (a===b && b===c && a==="7️⃣") win = bet*10;
    else if (a===b && b===c) win = bet*5;
    else if (a===b || b===c || a===c) win = bet*2;
    if (win>0) me.wallet += win; else me.wallet -= bet;
    saveBank(all);
    return api.sendMessage(`🎰 [ ${a} | ${b} | ${c} ]\n${win>0?`WIN +$${win} 🎉`:`LOSE -$${bet}`}\nWallet: $${me.wallet} | Bank: $${me.bank}`, threadID, event.messageID);
  }

  if (type === "roulette") {
    let pick = (args[1]||"").toLowerCase();
    if (!pick) return api.sendMessage("Use: !game roulette red/black/number 100", threadID, event.messageID);
    const num = Math.floor(Math.random()*37);
    const isRed = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(num);
    const color = num===0 ? "green" : isRed ? "red" : "black";
    let win = pick===color || parseInt(pick)===num;
    let payout = win ? (isNaN(parseInt(pick)) ? bet : bet*35) : 0;
    if (win) me.wallet += payout; else me.wallet -= bet;
    saveBank(all);
    return api.sendMessage(`🎡 Result: ${num} ${color}\nYour pick: ${pick}\n${win?`WIN +$${payout} 💰`:`LOSE -$${bet}`}\nWallet: $${me.wallet}`, threadID, event.messageID);
  }

  if (type === "blackjack" || type === "bj") {
    const card = () => Math.min(Math.floor(Math.random()*13)+1,10);
    let player = card()+card(), dealer = card()+card();
    let win = player>dealer && player<=21;
    let draw = player===dealer;
    if (win) me.wallet+=bet; else if (!draw) me.wallet-=bet;
    saveBank(all);
    return api.sendMessage(`🃏 BLACKJACK\nYou: ${player} vs FENG: ${dealer}\n${draw?`DRAW!` : win?`WIN +$${bet} 🎉`:`LOSE -$${bet} Tch!`}\nWallet: $${me.wallet}`, threadID, event.messageID);
  }

  if (type === "flip") {
    let pick = (args[1]||"").toLowerCase();
    const result = Math.random()<0.5?"heads":"tails";
    let win = pick===result;
    if (win) me.wallet+=bet; else me.wallet-=bet;
    saveBank(all);
    return api.sendMessage(`🪙 Result: ${result}\nYou: ${pick}\n${win?`WIN +$${bet}`:`LOSE -$${bet}`}\nWallet: $${me.wallet}`, threadID, event.messageID);
  }

  if (type === "dice") {
    const roll = Math.floor(Math.random()*6)+1;
    let win = roll>=4;
    if (win) me.wallet+=bet; else me.wallet-=bet;
    saveBank(all);
    return api.sendMessage(`🎲 Rolled: ${roll} (${win?"HIGH":"LOW"})\n${win?`WIN +$${bet}`:`LOSE -$${bet}`}\nWallet: $${me.wallet}`, threadID, event.messageID);
  }
};
