const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

process.on('uncaughtException', (err) => { console.error('未捕獲的錯誤:', err); });
process.on('unhandledRejection', (reason) => { console.error('未處理的 Promise 拒絕:', reason); });

// 允許讀取同資料夾的圖片靜態檔案 (歐泥醬與啵嚕醬的照片)
app.use(express.static(__dirname));

const rooms = {}; 

// 💡 題庫大升級！四大類別各 100 首，總計 400 首熱門神曲
const POOLS = {
  '華語流行': [
    "周杰倫 擱淺", "周杰倫 七里香", "周杰倫 晴天", "周杰倫 稻香", "周杰倫 夜曲",
    "告五人 好不容易", "告五人 披星戴月的想你", "告五人 愛人錯過", "告五人 帶我去找夜生活", "告五人 醜人多作怪",
    "林俊傑 那些你很冒險的夢", "林俊傑 修煉愛情", "林俊傑 不為誰而作的歌", "林俊傑 可惜沒如果", "林俊傑 江南",
    "鄧紫棋 倒數", "鄧紫棋 光年之外", "鄧紫棋 泡沫", "鄧紫棋 來自天堂的魔鬼", "鄧紫棋 句號",
    "韋禮安 如果可以", "韋禮安 慢慢等", "韋禮安 還是會", "韋禮安 女孩", "韋禮安 因為是你",
    "周興哲 以後別做朋友", "周興哲 你，好不好", "周興哲 怎麼了", "周興哲 如果雨之後", "周興哲 永不失聯的愛",
    "八三夭 想見你想見你想見你", "八三夭 東區東區", "八三夭 顛倒世界", "八三夭 我不想改變世界我只想不被世界改變", "八三夭 致青春",
    "茄子蛋 閣愛妳一擺", "茄子蛋 浪子回頭", "茄子蛋 浪流連", "茄子蛋 愛情你比我想的閣較偉大", "茄子蛋 恰似你的溫柔",
    "田馥甄 小幸運", "田馥甄 魔鬼中的天使", "田馥甄 寂寞寂寞就好", "田馥甄 日常", "田馥甄 無人知曉",
    "陳奕迅 孤勇者", "陳奕迅 十年", "陳奕迅 愛情轉移", "陳奕迅 淘汰", "陳奕迅 浮誇",
    "五月天 突然好想你", "五月天 倔強", "五月天 知足", "五月天 離開地球表面", "五月天 溫柔", 
    "張惠妹 連名帶姓", "張惠妹 聽海", "蔡依林 倒帶", "蔡依林 玫瑰少年", "孫燕姿 天黑黑", 
    "孫燕姿 遇見", "林宥嘉 說謊", "林宥嘉 天真有邪", "林宥嘉 兜圈", "蕭敬騰 王妃", 
    "蕭敬騰 阿飛的小蝴蝶", "薛之謙 演員", "薛之謙 醜八怪", "盧廣仲 刻在我心底的名字", "盧廣仲 魚仔", 
    "陳勢安 天后", "胡夏 那些年", "李榮浩 李白", "李榮浩 模特", "李榮浩 年少有為", 
    "周杰倫 告白氣球", "周杰倫 說好不哭", "周杰倫 等你下課", "周杰倫 青花瓷", "周杰倫 楓", 
    "林俊傑 醉赤壁", "林俊傑 背對背擁抱", "鄧紫棋 多遠都要在一起", "鄧紫棋 畫", "告五人 在這座城市遺失了你", 
    "告五人 唯一", "飛兒樂團 我們的愛", "飛兒樂團 月牙灣", "王心凌 愛你", "王心凌 當你", 
    "楊丞琳 雨愛", "楊丞琳 曖昧", "徐佳瑩 尋人啟事", "徐佳瑩 失落沙洲", "A-Lin 有一種悲傷", 
    "A-Lin 給我一個理由忘記", "周興哲 其實你並沒那麼孤單", "茄子蛋 日常", "李聖傑 痴心絕對", "動力火車 當"
  ],
  'K-POP': [
    "BLACKPINK How You Like That", "BLACKPINK Kill This Love", "BLACKPINK DDU-DU DDU-DU", "BLACKPINK Pink Venom", "BLACKPINK Shut Down",
    "BTS Butter", "BTS Dynamite", "BTS Boy With Luv", "BTS Fake Love", "BTS Blood Sweat & Tears",
    "TWICE FANCY", "TWICE Feel Special", "TWICE The Feels", "TWICE TT", "TWICE What Is Love",
    "NewJeans Hype Boy", "NewJeans OMG", "NewJeans Ditto", "NewJeans Super Shy", "NewJeans Attention",
    "aespa Next Level", "aespa Savage", "aespa Drama", "aespa Spicy", "aespa Illusion",
    "IVE I AM", "IVE LOVE DIVE", "IVE After LIKE", "IVE ELEVEN", "IVE Baddie",
    "LE SSERAFIM UNFORGIVEN", "LE SSERAFIM ANTIFRAGILE", "LE SSERAFIM FEARLESS", "LE SSERAFIM Perfect Night", "LE SSERAFIM Eve Psyche",
    "(G)I-DLE Nxde", "(G)I-DLE TOMBOY", "(G)I-DLE Queencard", "(G)I-DLE LATATA", "(G)I-DLE Super Lady",
    "SEVENTEEN Super", "SEVENTEEN HOT", "SEVENTEEN Don't Wanna Cry", "SEVENTEEN VERY NICE", "SEVENTEEN Clap",
    "Stray Kids God's Menu", "Stray Kids MANIAC", "Stray Kids S-Class", "ITZY WANNABE", "Jungkook Seven",
    "BIGBANG BANG BANG BANG", "BIGBANG FANTASTIC BABY", "BIGBANG LOSER", "EXO Love Shot", "EXO Growl", 
    "Red Velvet Psycho", "Red Velvet Bad Boy", "Red Velvet Peek-A-Boo", "ITZY DALLA DALLA", "ITZY LOCO", 
    "TXT Sugar Rush Ride", "TXT Blue Hour", "ENHYPEN Drunk-Dazed", "ENHYPEN Bite Me", "NMIXX DASH", 
    "NMIXX O.O", "BABYMONSTER SHEESH", "BABYMONSTER BATTER UP", "ILLIT Magnetic", "MAMAMOO HIP", 
    "MAMAMOO Starry Night", "GFRIEND Me Gustas Tu", "GFRIEND Rough", "IZ*ONE FIESTA", "IZ*ONE Secret Story of the Swan", 
    "STAYC ASAP", "STAYC RUN2U", "BLACKPINK As If It's Your Last", "BLACKPINK BOOMBAYAH", "BLACKPINK Playing With Fire", 
    "BTS FIRE", "BTS DNA", "BTS IDOL", "BTS Spring Day", "TWICE CHEER UP", 
    "TWICE YES or YES", "TWICE Dance The Night Away", "NewJeans ETA", "NewJeans Cookie", "aespa Girls", 
    "aespa Supernova", "aespa Armageddon", "IVE Kitsch", "LE SSERAFIM EASY", "LE SSERAFIM SMART", 
    "(G)I-DLE HWAA", "(G)I-DLE Oh my god", "SEVENTEEN Left & Right", "Stray Kids Thunderous", "NCT DREAM Hot Sauce"
  ],
  '動漫神曲': [
    "YOASOBI アイドル", "YOASOBI 夜に駆ける", "YOASOBI 怪物", "YOASOBI 祝福", "YOASOBI 群青",
    "LiSA 紅蓮華", "LiSA 炎", "LiSA crossing field", "LiSA oath sign", "LiSA Catch the Moment",
    "Aimer 残響散歌", "Aimer Brave Shine", "Aimer I beg you", "Aimer RE:I AM", "Aimer ninelie",
    "米津玄師 KICK BACK", "米津玄師 Lemon", "米津玄師 ピースサイン", "米津玄師 Orion", "米津玄師 LOSER",
    "RADWIMPS 前前前世", "RADWIMPS スパークル", "RADWIMPS なんでもないや", "RADWIMPS グランドエスケープ", "RADWIMPS 愛にできることはまだあるかい",
    "King Gnu SPECIALZ", "King Gnu 白日", "King Gnu 逆夢", "King Gnu 一途", "King Gnu BOY",
    "Official髭男dism ミックスナッツ", "Official髭男dism Cry Baby", "Official髭男dism Pretender", "Official髭男dism 宿命", "Official髭男dism イエスタデイ",
    "キタニタツヤ 青のすみか", "Vaundy CHAINSAW BLOOD", "Creepy Nuts Bling-Bang-Bang-Born", "TK from 凛として時雨 unravel", "FLOW GO!!!",
    "SPYAIR サクラミツツキ", "SPYAIR イマジネーション", "藍井エイル IGNITE", "藍井エイル INNOCENCE", "藍井エイル シリウス",
    "KANA-BOON シルエット", "いきものがかり ブルーバード", "YUI again", "高橋洋子 残酷な天使のテーゼ", "和田光司 Butter-Fly",
    "YOASOBI 勇者", "YOASOBI たぶん", "LiSA シルシ", "LiSA だってアタシのヒーロー。", "Aimer 蝶々結び", 
    "Aimer カタオモイ", "米津玄師 M八七", "米津玄師 地球儀", "米津玄師 打上花火", "RADWIMPS 夢灯籠", 
    "RADWIMPS 祝祭", "King Gnu 飛行艇", "King Gnu カメレオン", "Official髭男dism ホワイトノイズ", "Official髭男dism 115万キロのフィルム", 
    "ヨルシカ ただ君に晴れ", "ヨルシカ だから僕は音楽を辞めた", "ヨルシカ 春泥棒", "ずっと真夜中でいいのに。 秒針を噛む", "ずっと真夜中でいいのに。 勘冴えて悔しいわ", 
    "Ado うっせぇわ", "Ado 新時代", "Ado 唱", "Ado 踊", "Eve 廻廻奇譚", 
    "Eve ドラマツルギー", "Eve ナンセンス文学", "星野源 喜劇", "星野源 恋", "yama 春を告げる", 
    "優里 ドライフラワー", "優里 ベテルギウス", "Vaundy 怪獣の花唄", "Vaundy 踊り子", "マカロニえんぴつ なんでもないよ、", 
    "Saucy Dog シンデレラボーイ", "Mrs. GREEN APPLE インフェルノ", "Mrs. GREEN APPLE ダンスホール", "Mrs. GREEN APPLE 青と夏", "BUMP OF CHICKEN 天体観測", 
    "BUMP OF CHICKEN アカシア", "UNISON SQUARE GARDEN シュガーソングとビターステップ", "DOES 曇天", "DOES 修羅", "UVERworld 核心", 
    "UVERworld Touch off", "ポルノグラフィティ メリッサ", "ポルノグラフィティ サウダージ", "スキマスイッチ 奏(かなで)", "supercell 君の知らない物語"
  ],
  '流行英語': [
    "Taylor Swift Cruel Summer", "Taylor Swift Anti-Hero", "Taylor Swift Blank Space", "Taylor Swift Shake It Off", "Taylor Swift Love Story",
    "Ed Sheeran Shape of You", "Ed Sheeran Perfect", "Ed Sheeran Bad Habits", "Ed Sheeran Thinking Out Loud", "Ed Sheeran Photograph",
    "Bruno Mars Uptown Funk", "Bruno Mars That's What I Like", "Bruno Mars Just the Way You Are", "Bruno Mars Locked Out of Heaven", "Bruno Mars 24K Magic",
    "Adele Rolling in the Deep", "Adele Someone Like You", "Adele Hello", "Adele Easy On Me", "Adele Set Fire to the Rain",
    "Coldplay Viva La Vida", "Coldplay Yellow", "Coldplay Something Just Like This", "Coldplay A Sky Full of Stars", "Coldplay Fix You",
    "Dua Lipa Don't Start Now", "Dua Lipa Levitating", "Dua Lipa Dance The Night", "Dua Lipa New Rules", "Dua Lipa Physical",
    "Justin Bieber Peaches", "Justin Bieber Sorry", "Justin Bieber Love Yourself", "Justin Bieber Baby", "Justin Bieber Ghost",
    "The Weeknd Blinding Lights", "The Weeknd Starboy", "The Weeknd Save Your Tears", "The Weeknd The Hills", "The Weeknd Can't Feel My Face",
    "Harry Styles As It Was", "Harry Styles Watermelon Sugar", "Harry Styles Sign of the Times", "Harry Styles Adore You", "Harry Styles Late Night Talking",
    "Billie Eilish bad guy", "Billie Eilish everything i wanted", "Billie Eilish Therefore I Am", "Billie Eilish ocean eyes", "Billie Eilish happier than ever",
    "Taylor Swift You Belong With Me", "Taylor Swift I Knew You Were Trouble", "Taylor Swift We Are Never Ever Getting Back Together", "Ed Sheeran Galway Girl", "Ed Sheeran Shivers", 
    "Bruno Mars Grenade", "Bruno Mars Treasure", "Adele Water Under the Bridge", "Adele Make You Feel My Love", "Coldplay Paradise", 
    "Coldplay The Scientist", "Dua Lipa IDGAF", "Dua Lipa One Kiss", "Justin Bieber Intentions", "Justin Bieber Yummy", 
    "The Weeknd Die For You", "The Weeknd Earned It", "Harry Styles Falling", "Harry Styles Golden", "Billie Eilish when the party's over", 
    "Billie Eilish lovely", "Ariana Grande 7 rings", "Ariana Grande thank u, next", "Ariana Grande positions", "Ariana Grande Into You", 
    "Olivia Rodrigo drivers license", "Olivia Rodrigo good 4 u", "Olivia Rodrigo vampire", "Shawn Mendes Senorita", "Shawn Mendes Treat You Better", 
    "Shawn Mendes Stitches", "Charlie Puth Attention", "Charlie Puth We Don't Talk Anymore", "Charlie Puth Light Switch", "Maroon 5 Sugar", 
    "Maroon 5 Payphone", "Maroon 5 Girls Like You", "Imagine Dragons Believer", "Imagine Dragons Radioactive", "Imagine Dragons Demons", 
    "Post Malone Circles", "Post Malone Sunflower", "Katy Perry Roar", "Katy Perry Dark Horse", "Katy Perry Firework", 
    "Lady Gaga Bad Romance", "Lady Gaga Poker Face", "Lady Gaga Shallow", "Sam Smith Stay With Me", "Sam Smith Unholy"
  ]
};

async function fetchAppleMusicPreview(keyword) {
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(keyword)}&country=tw&media=music&limit=1`;
    const res = await fetch(url);
    const data = await res.json();
    return (data.results && data.results.length > 0) ? data.results[0].previewUrl : null;
  } catch (error) {
    console.error("Apple API 抓取失敗:", error);
    return null;
  }
}

app.get('/', (req, res) => { res.sendFile(__dirname + '/index.html'); });

function broadcastRoomState(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  const safeRoom = { ...room };
  delete safeRoom.playTimeout;
  delete safeRoom.votingTimeout;
  delete safeRoom.globalLoadingTimeout;
  delete safeRoom.singlePlayerIdleTimer;
  
  if (room.phaseEndTime) {
    safeRoom.phaseRemaining = Math.max(0, room.phaseEndTime - Date.now());
  }
  
  safeRoom.players = {};
  for (const uid in room.players) {
    safeRoom.players[uid] = { ...room.players[uid] };
    delete safeRoom.players[uid].offlineTimer;
  }

  io.to(roomId).emit('room_state_update', safeRoom);
}

function resetSinglePlayerIdleTimer(roomId) {
  const room = rooms[roomId];
  if (!room) return;
  
  if (room.singlePlayerIdleTimer) {
    clearTimeout(room.singlePlayerIdleTimer);
    room.singlePlayerIdleTimer = null;
  }
  
  if (room.state === 'LOBBY' && Object.keys(room.players).length === 1) {
    const singleUserId = Object.keys(room.players)[0];
    room.singlePlayerIdleTimer = setTimeout(() => {
      removePlayer(roomId, singleUserId, '單人閒置超過 10 分鐘，已自動關閉房間進入休眠。');
    }, 10 * 60 * 1000);
  }
}

function removePlayer(roomId, userId, kickMsg = null) {
  const room = rooms[roomId];
  if (!room || !room.players[userId]) return;

  if (kickMsg && room.players[userId].socketId) {
    io.to(room.players[userId].socketId).emit('error_to_home', kickMsg);
  }

  delete room.players[userId];
  delete room.scores[userId];
  delete room.votes[userId];

  const remaining = Object.keys(room.players);
  if (remaining.length === 0) {
    if (room.singlePlayerIdleTimer) clearTimeout(room.singlePlayerIdleTimer);
    if (room.playTimeout) clearTimeout(room.playTimeout);
    if (room.votingTimeout) clearTimeout(room.votingTimeout);
    if (room.globalLoadingTimeout) clearTimeout(room.globalLoadingTimeout);
    delete rooms[roomId];
  } else {
    if (room.hostId === userId) {
      room.hostId = remaining[0]; 
    }
    broadcastRoomState(roomId);
    resetSinglePlayerIdleTimer(roomId);
  }
}

function handlePlayerOffline(roomId, userId) {
  const room = rooms[roomId];
  if (!room || !room.players[userId]) return;
  
  const p = room.players[userId];
  p.status = 'OFFLINE';

  if (room.state === 'LOBBY') {
    p.isReady = false;
  }
  
  broadcastRoomState(roomId);
  resetSinglePlayerIdleTimer(roomId);
}

function handlePlayerOnline(roomId, userId, socketId) {
  const room = rooms[roomId];
  if (!room || !room.players[userId]) return false; 
  
  const p = room.players[userId];
  p.status = 'ONLINE';
  p.socketId = socketId;
  
  broadcastRoomState(roomId);
  if (room.state === 'LOADING') checkDownloadProgress(roomId);
  resetSinglePlayerIdleTimer(roomId);
  return true;
}

function checkDownloadProgress(roomId) {
  const room = rooms[roomId];
  if (!room || room.state !== 'LOADING') return;
  
  const playerIds = Object.keys(room.players);
  if (playerIds.length === 0) return;

  const allLoaded = playerIds.every(uid => room.players[uid].isLoaded);
  
  if (allLoaded) {
    if (room.globalLoadingTimeout) clearTimeout(room.globalLoadingTimeout);
    
    room.state = 'PLAYING';
    room.phaseEndTime = Date.now() + (room.settings.duration * 1000); 
    broadcastRoomState(roomId);
    io.to(roomId).emit('START_PLAYING_MUSIC');
    
    room.playTimeout = setTimeout(() => {
      if(rooms[roomId]) {
        rooms[roomId].state = 'VOTING';
        room.isVotingLocked = false;
        room.phaseEndTime = Date.now() + 20000;
        broadcastRoomState(roomId);
        
        rooms[roomId].votingTimeout = setTimeout(() => {
          calculateVotes(roomId);
        }, 20000); 
      }
    }, room.settings.duration * 1000);
  }
}

function calculateVotes(roomId) {
  try {
    const room = rooms[roomId];
    if (!room) return;

    if (room.playTimeout) clearTimeout(room.playTimeout);
    if (room.votingTimeout) clearTimeout(room.votingTimeout);

    room.state = 'LOBBY';
    room.isVotingLocked = false;
    room.phaseEndTime = null;

    let voteCounts = {};
    for (let voter in room.votes) {
      let target = room.votes[voter];
      if (room.players[target]) { 
        voteCounts[target] = (voteCounts[target] || 0) + 1;
      }
    }

    let maxVotes = 0;
    let eliminated = [];
    for (let target in voteCounts) {
      if (voteCounts[target] > maxVotes) {
        maxVotes = voteCounts[target];
        eliminated = [target];
      } else if (voteCounts[target] === maxVotes) {
        eliminated.push(target); 
      }
    }

    if (maxVotes === 0) eliminated = [];

    // 全新雙臥底與勝負判斷邏輯
    const deadUndercovers = room.undercoverIds.filter(id => eliminated.includes(id));
    const survivingUndercovers = room.undercoverIds.filter(id => !eliminated.includes(id));
    const civilians = Object.keys(room.players).filter(id => !room.undercoverIds.includes(id));

    let winnerText = '';

    if (room.undercoverIds.length === 1) {
      // 單臥底局
      if (deadUndercovers.length > 0) {
        winnerText = '平民勝利';
        civilians.forEach(uid => room.scores[uid] = (room.scores[uid] || 0) + 1);
      } else {
        winnerText = '臥底勝利';
        room.scores[room.undercoverIds[0]] = (room.scores[room.undercoverIds[0]] || 0) + 3;
      }
    } else {
      // 多人局 (雙臥底)
      if (deadUndercovers.length === 0) {
        winnerText = '雙臥底大獲全勝'; // 臥底都沒被抓
        room.undercoverIds.forEach(uid => room.scores[uid] = (room.scores[uid] || 0) + 3);
      } else if (deadUndercovers.length === 1) {
        winnerText = '平民與倖存臥底獲勝'; // 抓到一個臥底，另一個臥底背叛隊友一起贏
        civilians.forEach(uid => room.scores[uid] = (room.scores[uid] || 0) + 1);
        survivingUndercovers.forEach(uid => room.scores[uid] = (room.scores[uid] || 0) + 1);
      } else if (deadUndercovers.length === 2) {
        winnerText = '平民完全勝利'; // 兩個臥底同時被抓出 (完美局)
        civilians.forEach(uid => room.scores[uid] = (room.scores[uid] || 0) + 2); // 完美抓出雙臥底給 2 分獎勵
      }
    }

    const eliminatedData = eliminated.map(id => ({
      name: room.players[id]?.name || '未知',
      isUndercover: room.undercoverIds.includes(id)
    }));
    
    const undercoverNames = room.undercoverIds.map(id => room.players[id]?.name || '未知').join('、');

    if (!room.historyList) room.historyList = [];
    room.historyList.push({
      round: room.historyList.length + 1,
      category: room.settings.category,
      civilianSong: room.civilianSong,
      undercoverSong: room.undercoverSong,
      winner: winnerText
    });

    const resultData = { winner: winnerText, eliminatedData, undercoverName: undercoverNames, civilianSong: room.civilianSong, undercoverSong: room.undercoverSong };
    room.lastResult = resultData;

    io.to(roomId).emit('GAME_RESULT', resultData);

    Object.values(room.players).forEach(p => p.isReady = false);
    broadcastRoomState(roomId);
    resetSinglePlayerIdleTimer(roomId);
  } catch (err) {
    console.error('結算時發生意外錯誤:', err);
  }
}

io.on('connection', (socket) => {
  socket.on('create_room', ({ userId, userName }) => {
    const finalName = userName || '天飛巴庫';
    const roomId = Math.floor(1000 + Math.random() * 9000).toString(); 

    rooms[roomId] = { 
      hostId: userId, state: 'LOBBY', players: {},
      settings: { duration: 15, category: '全部' }, 
      undercoverIds: [], votes: {}, isVotingLocked: false,
      civilianSong: '', undercoverSong: '',
      playedSongs: [], scores: {}, lastResult: null, historyList: [],
      phaseEndTime: null, playTimeout: null, votingTimeout: null, globalLoadingTimeout: null,
      singlePlayerIdleTimer: null
    };
    rooms[roomId].players[userId] = { name: finalName, socketId: socket.id, status: 'ONLINE', isReady: false, isLoaded: false };
    rooms[roomId].scores[userId] = 0; 

    socket.join(roomId);
    socket.emit('room_joined', roomId);
    broadcastRoomState(roomId);
    resetSinglePlayerIdleTimer(roomId);
  });

  socket.on('join_room', ({ roomId, userId, userName }) => {
    const room = rooms[roomId];
    if (!room) return socket.emit('error_to_home', '找不到這個房間碼！');

    if (room.players[userId]) {
      handlePlayerOnline(roomId, userId, socket.id);
    } else {
      if (room.state !== 'LOBBY') return socket.emit('error_msg', '遊戲正在進行中，無法加入！');
      room.players[userId] = { name: userName || '天飛巴庫', socketId: socket.id, status: 'ONLINE', isReady: false, isLoaded: false };
      if (room.scores[userId] === undefined) room.scores[userId] = 0; 
    }
    socket.join(roomId);
    socket.emit('room_joined', roomId);
    broadcastRoomState(roomId);
    resetSinglePlayerIdleTimer(roomId);
  });

  socket.on('wake_up', ({ roomId, userId }) => {
    const success = handlePlayerOnline(roomId, userId, socket.id);
    if (!success) socket.emit('error_to_home', '你已被房主踢出房間或房間已解散！');
  });

  socket.on('go_background', ({ roomId, userId }) => {
    handlePlayerOffline(roomId, userId);
  });

  socket.on('disconnect', () => {
    for (const roomId in rooms) {
      const room = rooms[roomId];
      for (const userId in room.players) {
        if (room.players[userId].socketId === socket.id) {
          handlePlayerOffline(roomId, userId);
          break;
        }
      }
    }
  });

  socket.on('leave_room', ({ roomId, userId }) => {
    removePlayer(roomId, userId);
  });

  socket.on('kick_player', ({ roomId, targetUserId, hostId }) => {
    const room = rooms[roomId];
    if (room && room.hostId === hostId) {
      removePlayer(roomId, targetUserId, '你已被房主請出房間！');
    }
  });

  socket.on('update_settings', ({ roomId, userId, settings }) => {
    const room = rooms[roomId];
    if (room && room.hostId === userId) {
      room.settings = settings;
      broadcastRoomState(roomId);
      resetSinglePlayerIdleTimer(roomId);
    }
  });

  socket.on('toggle_ready', ({ roomId, userId }) => {
    const room = rooms[roomId];
    if (room && room.players[userId]) {
      room.players[userId].isReady = !room.players[userId].isReady;
      broadcastRoomState(roomId);
      resetSinglePlayerIdleTimer(roomId);
    }
  });

  socket.on('cancel_ready', ({ roomId, userId }) => {
    const room = rooms[roomId];
    if (room && room.players[userId]) {
      room.players[userId].isReady = false;
      broadcastRoomState(roomId);
    }
  });

  socket.on('start_game', async ({ roomId, userId }) => {
    const room = rooms[roomId];
    if (room && room.hostId === userId) {
      room.state = 'LOADING';
      room.votes = {}; 
      room.isVotingLocked = false;
      if (room.singlePlayerIdleTimer) { clearTimeout(room.singlePlayerIdleTimer); room.singlePlayerIdleTimer = null; }
      io.to(roomId).emit('game_starting');

      const playerIds = Object.keys(room.players);
      
      // 💡 5人以上自動雙臥底機制
      const undercoverCount = playerIds.length >= 5 ? 2 : 1;
      const shuffledIds = [...playerIds].sort(() => 0.5 - Math.random());
      room.undercoverIds = shuffledIds.slice(0, undercoverCount);
      
      let pool = [];
      if (room.settings.category === '全部') {
        Object.values(POOLS).forEach(arr => pool = pool.concat(arr));
      } else {
        pool = POOLS[room.settings.category] || [];
      }

      let availablePool = pool.filter(song => !room.playedSongs.includes(song));
      if (availablePool.length < 2) {
        room.playedSongs = [];
        availablePool = [...pool];
      }

      const shuffledSongs = [...availablePool].sort(() => 0.5 - Math.random());
      const isFirstCivilian = Math.random() > 0.5;
      const civilianQuery = isFirstCivilian ? shuffledSongs[0] : shuffledSongs[1];
      const undercoverQuery = isFirstCivilian ? shuffledSongs[1] : shuffledSongs[0];

      room.playedSongs.push(civilianQuery, undercoverQuery);
      room.civilianSong = civilianQuery;
      room.undercoverSong = undercoverQuery;

      const [civilianUrl, undercoverUrl] = await Promise.all([
        fetchAppleMusicPreview(civilianQuery), fetchAppleMusicPreview(undercoverQuery)
      ]);

      if (!civilianUrl || !undercoverUrl) {
        if(rooms[roomId]) {
            rooms[roomId].state = 'LOBBY';
            io.to(roomId).emit('error_msg', 'Apple API 抓歌失敗，請重新開始。');
            resetSinglePlayerIdleTimer(roomId);
        }
        return;
      }

      playerIds.forEach(uid => {
        if (!room.players[uid]) return; 
        room.players[uid].isLoaded = false;
        const targetUrl = room.undercoverIds.includes(uid) ? undercoverUrl : civilianUrl;
        io.to(room.players[uid].socketId).emit('PRELOAD_MUSIC', targetUrl);
      });

      room.globalLoadingTimeout = setTimeout(() => {
        const currentRoom = rooms[roomId];
        if (currentRoom && currentRoom.state === 'LOADING') {
            Object.keys(currentRoom.players).forEach(uid => {
                if (!currentRoom.players[uid].isLoaded) {
                    removePlayer(roomId, uid, '下載音樂超時，你已被移出房間！');
                }
            });
            checkDownloadProgress(roomId);
        }
      }, 10000);
    }
  });

  socket.on('music_loaded', ({ roomId, userId }) => {
    const room = rooms[roomId];
    if (room && room.players[userId]) {
      room.players[userId].isLoaded = true;
      io.to(roomId).emit('PLAYER_LOADED', userId);
      checkDownloadProgress(roomId);
    }
  });

  socket.on('submit_vote', ({ roomId, userId, targetId }) => {
    const room = rooms[roomId];
    if (!room || room.state !== 'VOTING') return;
    if (room.isVotingLocked) return; 

    if (targetId === null) delete room.votes[userId]; 
    else room.votes[userId] = targetId;

    const onlinePlayers = Object.keys(room.players).filter(uid => room.players[uid].status === 'ONLINE');
    const votedOnlineCount = onlinePlayers.filter(uid => room.votes[uid] !== undefined).length;

    io.to(roomId).emit('vote_status_update', {
      votedCount: votedOnlineCount,
      totalCount: onlinePlayers.length
    });

    if (votedOnlineCount >= onlinePlayers.length && onlinePlayers.length > 0) {
      room.isVotingLocked = true; 
      const fastEndRemaining = 3000; 
      room.phaseEndTime = Date.now() + fastEndRemaining;
      
      if (room.votingTimeout) clearTimeout(room.votingTimeout);
      room.votingTimeout = setTimeout(() => {
        calculateVotes(roomId);
      }, fastEndRemaining);

      broadcastRoomState(roomId);
    }
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`伺服器正在 port ${PORT} 運行中`));