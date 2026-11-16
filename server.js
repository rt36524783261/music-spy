const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

process.on('uncaughtException', (err) => { console.error('未捕獲的錯誤:', err); });
process.on('unhandledRejection', (reason) => { console.error('未處理的 Promise 拒絕:', reason); });

// 允許讀取同資料夾的靜態檔案 (歐泥醬與啵嚕醬的照片)
app.use(express.static(__dirname));

const rooms = {}; 

// 💡 題庫大升級！全面剔除催眠慢歌，400 首皆為「節奏鮮明、律動感強」的派對神曲
const POOLS = {
  '華語流行': [
    "周杰倫 本草綱目", "周杰倫 雙截棍", "周杰倫 牛仔很忙", "周杰倫 霍元甲", "周杰倫 陽光宅男",
    "周杰倫 告白氣球", "周杰倫 稻香", "周杰倫 夜曲", "周杰倫 龍捲風", "周杰倫 公公偏頭痛",
    "蔡依林 Play我呸", "蔡依林 大藝術家", "蔡依林 舞孃", "蔡依林 怪美的", "蔡依林 玫瑰少年",
    "蔡依林 看我72變", "蔡依林 愛情三十六計", "蔡依林 美人計", "蔡依林 日不落", "蔡依林 特務J",
    "五月天 離開地球表面", "五月天 派對動物", "五月天 傷心的人別聽慢歌", "五月天 戀愛ING", "五月天 倔強",
    "五月天 終結孤單", "五月天 入陣曲", "五月天 將軍令", "五月天 乾杯", "五月天 第一天",
    "告五人 愛人錯過", "告五人 帶我去找夜生活", "告五人 醜人多作怪", "告五人 披星戴月的想你", "告五人 法蘭西多士",
    "八三夭 東區東區", "八三夭 想見你想見你想見你", "八三夭 顛倒世界", "八三夭 致青春", "八三夭 眉飛色舞",
    "八三夭 來互相傷害", "八三夭 搖勒搖勒", "八三夭 馬子狗", "蕭敬騰 王妃", "蕭敬騰 阿飛的小蝴蝶",
    "鄧紫棋 光年之外", "鄧紫棋 來自天堂的魔鬼", "鄧紫棋 倒數", "鄧紫棋 句號", "鄧紫棋 摩天動物園",
    "林俊傑 不潮不用花錢", "林俊傑 曹操", "林俊傑 因你而在", "林俊傑 江南", "林俊傑 那些你很冒險的夢",
    "張惠妹 三天三夜", "張惠妹 好膽你就來", "張惠妹 火", "羅志祥 精舞門", "羅志祥 愛投羅網",
    "王心凌 愛你", "王心凌 Honey", "王心凌 睫毛彎彎", "王心凌 心電心", "謝金燕 姐姐",
    "玖壹壹 打鐵", "玖壹壹 來個蹦蹦", "玖壹壹 鄉下來的", "玖壹壹 9453", "玖壹壹 癡情男子漢",
    "兄弟本色 Fly Out", "頑童MJ116 辣台妹", "頑童MJ116 幹大事", "MC HotDog 我愛台妹", "周湯豪 帥到分手",
    "周湯豪 TURN UP", "潘瑋柏 不得不愛", "潘瑋柏 快樂崇拜", "潘瑋柏 壁虎漫步", "Energy 星期五晚上",
    "MP魔幻力量 射手", "MP魔幻力量 戰神", "飛兒樂團 我們的愛", "飛兒樂團 月牙灣", "飛兒樂團 Lydia",
    "蘇打綠 小情歌", "蘇打綠 控制狂", "盧廣仲 魚仔", "盧廣仲 早安晨之美", "韋禮安 如果可以",
    "韋禮安 女孩", "李榮浩 李白", "陳奕迅 孤勇者", "陳奕迅 浮誇", "動力火車 當",
    "動力火車 忠孝東路走九遍", "茄子蛋 浪子回頭", "茄子蛋 愛情你比我想的閣較偉大", "大支 台灣Song", "草蜢 失戀陣線聯盟"
  ],
  'K-POP': [
    "BLACKPINK How You Like That", "BLACKPINK Kill This Love", "BLACKPINK DDU-DU DDU-DU", "BLACKPINK Pink Venom", "BLACKPINK Shut Down",
    "BLACKPINK As If It's Your Last", "BLACKPINK BOOMBAYAH", "BLACKPINK Playing With Fire", "JENNIE SOLO", "ROSE APT.",
    "BTS Butter", "BTS Dynamite", "BTS Boy With Luv", "BTS FIRE", "BTS DNA",
    "BTS IDOL", "BTS Fake Love", "BTS Blood Sweat & Tears", "BTS Mic Drop", "Jungkook Seven",
    "TWICE FANCY", "TWICE Feel Special", "TWICE The Feels", "TWICE TT", "TWICE What Is Love",
    "TWICE CHEER UP", "TWICE YES or YES", "TWICE Dance The Night Away", "TWICE LIKEY", "TWICE Talk that Talk",
    "NewJeans Hype Boy", "NewJeans OMG", "NewJeans Super Shy", "NewJeans Attention", "NewJeans ETA",
    "aespa Next Level", "aespa Savage", "aespa Drama", "aespa Spicy", "aespa Supernova",
    "aespa Armageddon", "aespa Illusion", "aespa Black Mamba", "IVE I AM", "IVE LOVE DIVE",
    "IVE After LIKE", "IVE ELEVEN", "IVE Baddie", "IVE Kitsch", "IVE HEYA",
    "LE SSERAFIM UNFORGIVEN", "LE SSERAFIM ANTIFRAGILE", "LE SSERAFIM FEARLESS", "LE SSERAFIM Perfect Night", "LE SSERAFIM Eve Psyche",
    "LE SSERAFIM EASY", "LE SSERAFIM SMART", "LE SSERAFIM CRAZY", "(G)I-DLE Nxde", "(G)I-DLE TOMBOY",
    "(G)I-DLE Queencard", "(G)I-DLE LATATA", "(G)I-DLE Super Lady", "(G)I-DLE Klaxon", "(G)I-DLE MY BAG",
    "SEVENTEEN Super", "SEVENTEEN HOT", "SEVENTEEN VERY NICE", "SEVENTEEN Clap", "SEVENTEEN Left & Right",
    "SEVENTEEN God of Music", "BSS Fighting", "Stray Kids God's Menu", "Stray Kids MANIAC", "Stray Kids S-Class",
    "Stray Kids Thunderous", "Stray Kids Chk Chk Boom", "ITZY WANNABE", "ITZY DALLA DALLA", "ITZY LOCO",
    "ITZY Sneakers", "BIGBANG BANG BANG BANG", "BIGBANG FANTASTIC BABY", "EXO Love Shot", "EXO Growl",
    "Red Velvet Psycho", "Red Velvet Peek-A-Boo", "Red Velvet Russian Roulette", "TXT Sugar Rush Ride", "ENHYPEN Bite Me",
    "NMIXX DASH", "BABYMONSTER SHEESH", "ILLIT Magnetic", "MAMAMOO HIP", "GFRIEND Me Gustas Tu",
    "IZ*ONE FIESTA", "STAYC ASAP", "PSY Gangnam Style", "PSY That That", "Super Junior Sorry Sorry"
  ],
  '動漫神曲': [
    "YOASOBI アイドル", "YOASOBI 夜に駆ける", "YOASOBI 怪物", "YOASOBI 祝福", "YOASOBI 群青",
    "YOASOBI 勇者", "LiSA 紅蓮華", "LiSA crossing field", "LiSA oath sign", "LiSA Catch the Moment",
    "LiSA Rising Hope", "LiSA だってアタシのヒーロー。", "Aimer 残響散歌", "Aimer Brave Shine", "Aimer SPARK-AGAIN",
    "米津玄師 KICK BACK", "米津玄師 ピースサイン", "米津玄師 LOSER", "米津玄師 感電", "米津玄師 ドーナツホール",
    "RADWIMPS 前前前世", "RADWIMPS 夢灯籠", "RADWIMPS 祝祭", "King Gnu SPECIALZ", "King Gnu 一途",
    "King Gnu 白日", "King Gnu BOY", "King Gnu 飛行艇", "Official髭男dism ミックスナッツ", "Official髭男dism Cry Baby",
    "Official髭男dism Pretender", "Official髭男dism 宿命", "Official髭男dism ホワイトノイズ", "Official髭男dism イエスタデイ", "キタニタツヤ 青のすみか",
    "Vaundy CHAINSAW BLOOD", "Vaundy 怪獣の花唄", "Vaundy 踊り子", "Creepy Nuts Bling-Bang-Bang-Born", "Creepy Nuts オトノケ",
    "TK from 凛として時雨 unravel", "FLOW GO!!!", "FLOW Sign", "FLOW COLORS", "SPYAIR サクラミツツキ",
    "SPYAIR イマジネーション", "SPYAIR サムライハート", "藍井エイル IGNITE", "藍井エイル INNOCENCE", "藍井エイル シリウス",
    "KANA-BOON シルエット", "いきものがかり ブルーバード", "YUI again", "YUI Rolling star", "高橋洋子 残酷な天使のテーゼ",
    "和田光司 Butter-Fly", "ヨルシカ ただ君に晴れ", "ヨルシカ だから僕は音楽を辞めた", "ヨルシカ 春泥棒", "ずっと真夜中でいいのに。 秒針を噛む",
    "ずっと真夜中でいいのに。 勘冴えて悔しいわ", "ずっと真夜中でいいのに。 残機", "Ado うっせぇわ", "Ado 新時代", "Ado 唱",
    "Ado 踊", "Ado 逆光", "Eve 廻廻奇譚", "Eve ドラマツルギー", "Eve ナンセンス文学",
    "Eve ファイトソング", "星野源 恋", "星野源 喜劇", "yama 春を告げる", "優里 ベテルギウス",
    "Mrs. GREEN APPLE インフェルノ", "Mrs. GREEN APPLE ダンスホール", "Mrs. GREEN APPLE 青と夏", "Mrs. GREEN APPLE ライラック", "BUMP OF CHICKEN 天体観測",
    "BUMP OF CHICKEN アカシア", "UNISON SQUARE GARDEN シュガーソングとビターステップ", "DOES 曇天", "DOES 修羅", "UVERworld Touch off",
    "UVERworld CORE PRIDE", "ポルノグラフィティ メリッサ", "ポルノグラフィティ アゲハ蝶", "supercell 君の知らない物語", "fripSide only my railgun",
    "ClariS コネクト", "ClariS ヒトリゴト", "鈴木雅之 DADDY! DADDY! DO!", "オーイシマサヨシ 君じゃなきゃダメみたい", "大石昌良 ようこそジャパリパークへ",
    "MAN WITH A MISSION Raise your flag", "MAN WITH A MISSION 絆ノ奇跡", "Fear, and Loathing in Las Vegas Just Awake", "ASIAN KUNG-FU GENERATION リライト", "Linked Horizon 紅蓮の弓矢"
  ],
  '流行英語': [
    "Taylor Swift Cruel Summer", "Taylor Swift Anti-Hero", "Taylor Swift Blank Space", "Taylor Swift Shake It Off", "Taylor Swift Love Story",
    "Taylor Swift You Belong With Me", "Taylor Swift I Knew You Were Trouble", "Taylor Swift Bad Blood", "Taylor Swift 22", "Taylor Swift Style",
    "Ed Sheeran Shape of You", "Ed Sheeran Bad Habits", "Ed Sheeran Shivers", "Ed Sheeran Galway Girl", "Ed Sheeran Sing",
    "Bruno Mars Uptown Funk", "Bruno Mars That's What I Like", "Bruno Mars Locked Out of Heaven", "Bruno Mars 24K Magic", "Bruno Mars Treasure",
    "Bruno Mars Runaway Baby", "Bruno Mars Finesse", "Adele Rolling in the Deep", "Adele Set Fire to the Rain", "Adele Send My Love",
    "Coldplay Viva La Vida", "Coldplay Something Just Like This", "Coldplay A Sky Full of Stars", "Coldplay Adventure of a Lifetime", "Coldplay Hymn for the Weekend",
    "Dua Lipa Don't Start Now", "Dua Lipa Levitating", "Dua Lipa Dance The Night", "Dua Lipa New Rules", "Dua Lipa Physical",
    "Dua Lipa One Kiss", "Dua Lipa Break My Heart", "Justin Bieber Peaches", "Justin Bieber Sorry", "Justin Bieber Baby",
    "Justin Bieber What Do You Mean", "Justin Bieber Beauty and a Beat", "The Kid LAROI STAY", "The Weeknd Blinding Lights", "The Weeknd Starboy",
    "The Weeknd Save Your Tears", "The Weeknd Can't Feel My Face", "The Weeknd I Feel It Coming", "Harry Styles As It Was", "Harry Styles Watermelon Sugar",
    "Harry Styles Adore You", "Harry Styles Late Night Talking", "One Direction What Makes You Beautiful", "Billie Eilish bad guy", "Billie Eilish Therefore I Am",
    "Billie Eilish LUNCH", "Ariana Grande 7 rings", "Ariana Grande thank u, next", "Ariana Grande Into You", "Ariana Grande Problem",
    "Ariana Grande Side to Side", "Ariana Grande Break Free", "Olivia Rodrigo good 4 u", "Olivia Rodrigo vampire", "Olivia Rodrigo bad idea right?",
    "Shawn Mendes Senorita", "Shawn Mendes Treat You Better", "Shawn Mendes Stitches", "Shawn Mendes There's Nothing Holdin' Me Back", "Charlie Puth Attention",
    "Charlie Puth Light Switch", "Charlie Puth How Long", "Maroon 5 Sugar", "Maroon 5 Payphone", "Maroon 5 Moves Like Jagger",
    "Maroon 5 Animals", "Maroon 5 Maps", "Imagine Dragons Believer", "Imagine Dragons Radioactive", "Imagine Dragons Thunder",
    "Imagine Dragons Bones", "Imagine Dragons Natural", "Post Malone Sunflower", "Post Malone Circles", "Katy Perry Roar",
    "Katy Perry Dark Horse", "Katy Perry Firework", "Katy Perry California Gurls", "Katy Perry Hot N Cold", "Lady Gaga Bad Romance",
    "Lady Gaga Poker Face", "Lady Gaga Just Dance", "Lady Gaga Rain On Me", "Sam Smith Unholy", "Avicii Wake Me Up",
    "Calvin Harris Summer", "The Chainsmokers Closer", "Alan Walker Faded", "LMFAO Party Rock Anthem", "Carly Rae Jepsen Call Me Maybe"
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

// 取得歌手名稱（空白鍵前半部），防止平民跟臥底抽到同一個歌手
function getArtistName(songQuery) {
  return String(songQuery || '').trim().split(/\s+/)[0];
}

// 💡 智慧抽歌與自動重試機制（防抓歌失敗、防同歌手）
async function pickTwoValidSongs(availablePool) {
  const shuffled = [...availablePool].sort(() => 0.5 - Math.random());
  let firstSong = null;
  let secondSong = null;

  for (let i = 0; i < shuffled.length && i < 12; i++) {
    const candidate = shuffled[i];
    if (!firstSong) {
      const url = await fetchAppleMusicPreview(candidate);
      if (url) {
        firstSong = { query: candidate, url, artist: getArtistName(candidate) };
      }
    } else if (!secondSong) {
      // 強制不同歌手，避免曲風與聲音太過相近
      if (getArtistName(candidate) === firstSong.artist) continue;
      const url = await fetchAppleMusicPreview(candidate);
      if (url) {
        secondSong = { query: candidate, url, artist: getArtistName(candidate) };
        break;
      }
    }
  }
  return (firstSong && secondSong) ? [firstSong, secondSong] : null;
}

// 💡 撞名自動編號防呆（預設：飛天巴庫）
function getUniquePlayerName(room, rawName, currentUserId) {
  let baseName = String(rawName || '').trim();
  if (!baseName) baseName = '飛天巴庫';

  const existingNames = new Set();
  for (const uid in room.players) {
    if (uid !== currentUserId) {
      existingNames.add(room.players[uid].name);
    }
  }

  if (!existingNames.has(baseName)) return baseName;

  let counter = 2;
  while (existingNames.has(`${baseName} ${counter}`)) {
    counter++;
  }
  return `${baseName} ${counter}`;
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
  delete safeRoom.roundPlayers;
  
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

  // 清除其他人投給該名已離開玩家的票
  for (const voter in room.votes) {
    if (room.votes[voter] === userId) {
      delete room.votes[voter];
    }
  }

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
    if (room.state === 'LOADING') checkDownloadProgress(roomId);
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

function startPlayingPhase(roomId) {
  const room = rooms[roomId];
  if (!room || room.state !== 'LOADING') return;

  if (room.globalLoadingTimeout) {
    clearTimeout(room.globalLoadingTimeout);
    room.globalLoadingTimeout = null;
  }
  
  room.state = 'PLAYING';
  room.phaseEndTime = Date.now() + (room.settings.duration * 1000); 
  broadcastRoomState(roomId);
  io.to(roomId).emit('START_PLAYING_MUSIC');
  
  room.playTimeout = setTimeout(() => {
    if (rooms[roomId]) {
      rooms[roomId].state = 'VOTING';
      rooms[roomId].phaseEndTime = Date.now() + 20000;
      broadcastRoomState(roomId);
      
      // 完整 20 秒投票時間，不提早結束，讓玩家自由換票心理戰
      rooms[roomId].votingTimeout = setTimeout(() => {
        calculateVotes(roomId);
      }, 20000); 
    }
  }, room.settings.duration * 1000);
}

function checkDownloadProgress(roomId) {
  const room = rooms[roomId];
  if (!room || room.state !== 'LOADING') return;
  
  const playerIds = Object.keys(room.players);
  if (playerIds.length === 0) return;

  const allLoaded = playerIds.every(uid => room.players[uid].isLoaded);
  if (allLoaded) {
    startPlayingPhase(roomId);
  }
}

// 💡 全新個人戰計分與明細結算邏輯
function calculateVotes(roomId) {
  try {
    const room = rooms[roomId];
    if (!room) return;

    if (room.playTimeout) clearTimeout(room.playTimeout);
    if (room.votingTimeout) clearTimeout(room.votingTimeout);

    room.state = 'LOBBY';
    room.phaseEndTime = null;

    // 使用開局時的玩家快照（加上目前房內玩家），確保中途有人斷線也不會報錯
    const participantIds = Object.keys(room.roundPlayers || room.players);

    // 統計每個人被投了幾票
    const votesReceived = {};
    participantIds.forEach(uid => { votesReceived[uid] = 0; });

    for (const voterId in room.votes) {
      const targetId = room.votes[voterId];
      if (targetId && targetId !== voterId && votesReceived[targetId] !== undefined) {
        votesReceived[targetId]++;
      }
    }

    // 判斷臥底生死狀態（得票 == 0 為潛伏成功，>= 1 為被識破）
    let survivingSpyCount = 0;
    let caughtSpyCount = 0;
    room.undercoverIds.forEach(spyId => {
      if ((votesReceived[spyId] || 0) === 0) {
        survivingSpyCount++;
      } else {
        caughtSpyCount++;
      }
    });

    let winnerText = '';
    if (caughtSpyCount === 0) {
      winnerText = '🔥 臥底完美潛伏！';
    } else if (survivingSpyCount === 0) {
      winnerText = '🎯 臥底遭到識破！';
    } else {
      winnerText = '⚡ 一潛伏、一被識破！';
    }

    // 計算每位玩家的個人得分與結算明細
    const playerResults = [];
    participantIds.forEach(uid => {
      const pInfo = (room.roundPlayers && room.roundPlayers[uid]) || room.players[uid] || { name: '未知玩家' };
      const isUndercover = room.undercoverIds.includes(uid);
      const targetId = room.votes[uid] || null;
      const targetInfo = targetId ? ((room.roundPlayers && room.roundPlayers[targetId]) || room.players[targetId]) : null;
      const votedForName = targetInfo ? targetInfo.name : null;

      let earnedScore = 0;
      const notes = [];

      // 規則 1：臥底 0 票完美潛伏得 2 分；被投 1 票以上潛伏失敗 (0分)
      if (isUndercover) {
        const myVotes = votesReceived[uid] || 0;
        if (myVotes === 0) {
          earnedScore += 2;
          notes.push('0票潛伏+2');
        } else {
          notes.push(`被投${myVotes}票`);
        }
      }

      // 規則 2：任何人（平民或另一位臥底）投中臥底皆得 1 分
      if (targetId && targetId !== uid && room.undercoverIds.includes(targetId)) {
        earnedScore += 1;
        notes.push('抓中臥底+1');
      }

      if (room.scores[uid] !== undefined) {
        room.scores[uid] += earnedScore;
      }

      playerResults.push({
        uid,
        name: pInfo.name,
        isUndercover,
        votedForName,
        earnedScore,
        note: notes.join('、')
      });
    });

    // 排序結算明細：臥底排最上面，接著依本局得分高到低排列
    playerResults.sort((a, b) => {
      if (a.isUndercover !== b.isUndercover) return a.isUndercover ? -1 : 1;
      return b.earnedScore - a.earnedScore;
    });

    const undercoverNames = room.undercoverIds
      .map(id => ((room.roundPlayers && room.roundPlayers[id]) || room.players[id])?.name || '未知')
      .join('、');

    if (!room.historyList) room.historyList = [];
    room.historyList.push({
      round: room.historyList.length + 1,
      category: room.settings.category,
      civilianSong: room.civilianSong,
      undercoverSong: room.undercoverSong,
      winner: winnerText
    });

    const resultData = {
      winner: winnerText,
      undercoverName: undercoverNames,
      civilianSong: room.civilianSong,
      undercoverSong: room.undercoverSong,
      civilianUrl: room.civilianUrl,
      undercoverUrl: room.undercoverUrl,
      playerResults
    };
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
    const roomId = Math.floor(1000 + Math.random() * 9000).toString(); 

    rooms[roomId] = { 
      hostId: userId, state: 'LOBBY', players: {},
      settings: { duration: 15, category: '全部' }, 
      undercoverIds: [], votes: {},
      civilianSong: '', undercoverSong: '',
      civilianUrl: '', undercoverUrl: '',
      playedSongs: [], scores: {}, lastResult: null, historyList: [],
      roundPlayers: {},
      phaseEndTime: null, playTimeout: null, votingTimeout: null, globalLoadingTimeout: null,
      singlePlayerIdleTimer: null
    };

    const finalName = getUniquePlayerName(rooms[roomId], userName, userId);
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
      const finalName = getUniquePlayerName(room, userName, userId);
      room.players[userId] = { name: finalName, socketId: socket.id, status: 'ONLINE', isReady: false, isLoaded: false };
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

  socket.on('reset_scores', ({ roomId, userId }) => {
    const room = rooms[roomId];
    if (room && room.hostId === userId) {
      Object.keys(room.scores).forEach(uid => {
        room.scores[uid] = 0;
      });
      broadcastRoomState(roomId);
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
    // 💡 防連點防呆：嚴格限制只有 LOBBY 狀態可啟動遊戲
    if (!room || room.hostId !== userId || room.state !== 'LOBBY') return;

    const playerIds = Object.keys(room.players);
    if (playerIds.length < 2) return;

    room.state = 'LOADING';
    room.votes = {}; 
    if (room.singlePlayerIdleTimer) {
      clearTimeout(room.singlePlayerIdleTimer);
      room.singlePlayerIdleTimer = null;
    }

    // 建立本局玩家名單快照
    room.roundPlayers = {};
    playerIds.forEach(uid => {
      room.roundPlayers[uid] = { name: room.players[uid].name };
    });

    io.to(roomId).emit('game_starting');

    // 5人以上自動雙臥底機制（雙臥底聽同一首臥底歌）
    const undercoverCount = playerIds.length >= 5 ? 2 : 1;
    const shuffledIds = [...playerIds].sort(() => 0.5 - Math.random());
    room.undercoverIds = shuffledIds.slice(0, undercoverCount);
    
    // 當選擇「全部」時，先隨機抽一個分類，確保平民與臥底曲風同語系但不同歌手
    let targetCategory = room.settings.category;
    if (targetCategory === '全部') {
      const categories = Object.keys(POOLS);
      targetCategory = categories[Math.floor(Math.random() * categories.length)];
    }
    const pool = POOLS[targetCategory] || POOLS['華語流行'];

    let availablePool = pool.filter(song => !room.playedSongs.includes(song));
    if (availablePool.length < 6) {
      room.playedSongs = [];
      availablePool = [...pool];
    }

    const picked = await pickTwoValidSongs(availablePool);
    if (!picked || !rooms[roomId]) {
      if (rooms[roomId]) {
        rooms[roomId].state = 'LOBBY';
        broadcastRoomState(roomId);
        io.to(roomId).emit('error_msg', 'Apple 音樂伺服器連線逾時，請再按一次開始。');
        resetSinglePlayerIdleTimer(roomId);
      }
      return;
    }

    const [civilianTrack, undercoverTrack] = picked;
    room.playedSongs.push(civilianTrack.query, undercoverTrack.query);
    room.civilianSong = civilianTrack.query;
    room.undercoverSong = undercoverTrack.query;
    room.civilianUrl = civilianTrack.url;
    room.undercoverUrl = undercoverTrack.url;

    Object.keys(room.players).forEach(uid => {
      if (!room.players[uid]) return; 
      room.players[uid].isLoaded = false;
      const targetUrl = room.undercoverIds.includes(uid) ? undercoverTrack.url : civilianTrack.url;
      io.to(room.players[uid].socketId).emit('PRELOAD_MUSIC', targetUrl);
    });

    // 💡 溫和超時防呆：12秒後若有人網路卡住未回報完成，直接強制全員開播，不踢人、不刪分
    room.globalLoadingTimeout = setTimeout(() => {
      const currentRoom = rooms[roomId];
      if (currentRoom && currentRoom.state === 'LOADING') {
        startPlayingPhase(roomId);
      }
    }, 12000);
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
    // 禁止投給自己
    if (targetId === userId) return;

    if (targetId === null || !room.players[targetId]) {
      delete room.votes[userId]; 
    } else {
      room.votes[userId] = targetId;
    }

    // 即時向全房間廣播最新亮票狀態（誰投了誰）
    io.to(roomId).emit('votes_live_update', {
      votes: room.votes
    });
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`伺服器正在 port ${PORT} 運行中`));