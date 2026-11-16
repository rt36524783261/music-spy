const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

process.on('uncaughtException', (err) => { console.error('未捕獲的錯誤:', err); });
process.on('unhandledRejection', (reason) => { console.error('未處理的 Promise 拒絕:', reason); });

// 允許讀取同資料夾的靜態檔案 (歐泥醬與啵嚕醬的照片)
app.use(express.static(__dirname));

const rooms = {}; 

// 💡 5大分類總計 500 首高律動、高反應派對神曲（已全面剔除催眠慢歌）
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
  ],
  '派對洗腦＆台語': [
    "伍佰 你是我的花朵", "伍佰 樹枝孤鳥", "伍佰 世界第一等", "伍佰 挪威的森林", "伍佰 Last Dance",
    "伍佰 煞到你", "伍佰 愛情限時批", "伍佰 衝衝衝", "伍佰 心愛的再會啦", "伍佰 背叛",
    "謝金燕 姐姐", "謝金燕 練舞功", "謝金燕 嗶嗶嗶", "謝金燕 含淚跳恰恰", "謝金燕 叉燒包",
    "陳雷 歡喜就好", "陳雷 風真透", "葉啟田 愛拚才會贏", "蔡小虎 愛人醉落去", "王識賢 勝者為王",
    "荒山亮 轟動武林", "黃妃 追追追", "張秀卿 車站", "羅時豐 歡喜來恰恰", "閃靈 皇軍",
    "玖壹壹 Local", "玖壹壹 鄉下來的", "玖壹壹 來個蹦蹦", "玖壹壹 打鐵", "玖壹壹 9453",
    "玖壹壹 癡情男子漢", "玖壹壹 歪國人", "玖壹壹 派對俠", "玖壹壹 嘎勒阿勒", "玖壹壹 明年見",
    "美秀集團 捲菸", "美秀集團 電火王", "美秀集團 我要你愛", "美秀集團 擋一根", "美秀集團 懲罰",
    "美秀集團 心悶", "滅火器 島嶼天光", "滅火器 長途夜車", "滅火器 繼續向前行", "滅火器 海上的人",
    "怕胖團 魚", "怕胖團 當你在最需要的時候", "茄子蛋 浪流連", "茄子蛋 恰似你的溫柔", "茄子蛋 閣愛妳一擺",
    "草東沒有派對 大風吹", "草東沒有派對 山海", "草東沒有派對 爛泥", "血肉果汁機 關閉太陽", "康士坦的變化球 美好的事可不可以發生在我身上",
    "黃明志 漂向北方", "黃明志 玻璃心", "黃明志 擊敗人", "黃明志 買包包換鮑鮑", "黃明志 不想上班",
    "卜學亮 超跑情人夢", "卜學亮 子曰", "中國娃娃 單眼皮女生", "中國娃娃 發財發福中國年", "王蓉 小雞小雞",
    "筷子兄弟 小蘋果", "大張偉 陽光彩虹小白馬", "鳳凰傳奇 最炫民族風", "寶石Gem 野狼Disco", "ASMRZ 晚安大小姐",
    "張震嶽 愛我別走", "張震嶽 自由", "張震嶽 乾妹妹", "MC HotDog 差不多先生", "MC HotDog 貧民百萬歌星",
    "頑童MJ116 South Side", "頑童MJ116 少年董", "五堅情 兵變", "五堅情 All Day", "九澤CP 天黑請閉眼",
    "鼓鼓 為愛而愛", "芭比 使勁搖", "羅百吉 吹喇叭", "麻吉 麻吉", "麻吉 跳痛",
    "動力火車 我很好騙", "高爾宣 Without You", "婁峻碩 Colorful", "派偉俊 I Hate Myself Sometimes", "理想混蛋 離開的一路上",
    "Pikotaro PPAP", "Ylvis The Fox", "O-Zone Dragostea Din Tei", "Aqua Barbie Girl", "Crazy Frog Axel F",
    "Boney M. Rasputin", "PSY Gentleman", "Luis Fonsi Despacito", "Rick Astley Never Gonna Give You Up", "Earth Wind Fire September"
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

function getArtistName(songQuery) {
  return String(songQuery || '').trim().split(/\s+/)[0];
}

// 智慧抽歌與自動重試機制（防抓歌失敗、防同歌手）
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

// 撞名自動編號防呆（預設：飛天巴庫）
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

// 💡 根據房間人數與模式決定「臥底」與「白板」人數（確保永遠至少有平民）
function assignRoles(playerIds, roleMode) {
  const count = playerIds.length;
  const shuffled = [...playerIds].sort(() => 0.5 - Math.random());
  let spyCount = 0;
  let wbCount = 0;

  if (roleMode === '標準模式') {
    spyCount = count >= 5 ? 2 : 1;
    wbCount = 0;
  } else if (roleMode === '純白板模式') {
    spyCount = 0;
    wbCount = count >= 5 ? 2 : 1;
  } else {
    // 預設：加入白板模式
    if (count <= 3) {
      // 2~3人：隨機 1 臥底 或 1 白板，讓異常者自己也猜不透全場配置
      if (Math.random() < 0.5) {
        spyCount = 1; wbCount = 0;
      } else {
        spyCount = 0; wbCount = 1;
      }
    } else if (count <= 5) {
      // 4~5人：1 臥底 + 1 白板
      spyCount = 1;
      wbCount = 1;
    } else {
      // 6人以上：2 臥底 + 1 白板
      spyCount = 2;
      wbCount = 1;
    }
  }

  const undercoverIds = shuffled.slice(0, spyCount);
  const whiteboardIds = shuffled.slice(spyCount, spyCount + wbCount);
  return { undercoverIds, whiteboardIds };
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
  delete safeRoom.reactionTimestamps;
  delete safeRoom.undercoverIds;
  delete safeRoom.whiteboardIds;
  
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
    // 💡 遊戲中途若退到只剩 1 人，自動中止本局返回大廳防呆
    if (room.state !== 'LOBBY' && remaining.length < 2) {
      if (room.playTimeout) clearTimeout(room.playTimeout);
      if (room.votingTimeout) clearTimeout(room.votingTimeout);
      if (room.globalLoadingTimeout) clearTimeout(room.globalLoadingTimeout);
      room.state = 'LOBBY';
      room.phaseEndTime = null;
      Object.values(room.players).forEach(p => p.isReady = false);
      io.to(roomId).emit('round_aborted', '其他玩家已離開，人數不足自動返回房間');
    } else if (room.state === 'LOADING') {
      checkDownloadProgress(roomId);
    } else if (room.state === 'VOTING') {
      io.to(roomId).emit('votes_live_update', { votes: room.votes });
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

  // 個別通知每位玩家開播（白板玩家收到 isWhiteboard: true 會自動靜音並顯示白板提示）
  for (const uid in room.players) {
    const isWb = room.whiteboardIds.includes(uid);
    io.to(room.players[uid].socketId).emit('START_PLAYING_MUSIC', { isWhiteboard: isWb });
  }
  
  room.playTimeout = setTimeout(() => {
    if (rooms[roomId]) {
      rooms[roomId].state = 'VOTING';
      rooms[roomId].phaseEndTime = Date.now() + 20000;
      broadcastRoomState(roomId);
      
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

// 全新個人戰計分與明細結算邏輯（含臥底與白板）
function calculateVotes(roomId) {
  try {
    const room = rooms[roomId];
    if (!room) return;

    if (room.playTimeout) clearTimeout(room.playTimeout);
    if (room.votingTimeout) clearTimeout(room.votingTimeout);

    room.state = 'LOBBY';
    room.phaseEndTime = null;

    const participantIds = Object.keys(room.roundPlayers || room.players);
    const badGuyIds = [...room.undercoverIds, ...room.whiteboardIds];

    const votesReceived = {};
    participantIds.forEach(uid => { votesReceived[uid] = 0; });

    for (const voterId in room.votes) {
      const targetId = room.votes[voterId];
      if (targetId && targetId !== voterId && votesReceived[targetId] !== undefined) {
        votesReceived[targetId]++;
      }
    }

    let survivingBadCount = 0;
    let caughtBadCount = 0;
    badGuyIds.forEach(badId => {
      if ((votesReceived[badId] || 0) === 0) {
        survivingBadCount++;
      } else {
        caughtBadCount++;
      }
    });

    let winnerText = '';
    if (caughtBadCount === 0) {
      winnerText = '🔥 潛伏者完美勝出！';
    } else if (survivingBadCount === 0) {
      winnerText = '🎯 潛伏者全數識破！';
    } else {
      winnerText = '⚡ 有人潛伏、有人被抓！';
    }

    const playerResults = [];
    participantIds.forEach(uid => {
      const pInfo = (room.roundPlayers && room.roundPlayers[uid]) || room.players[uid] || { name: '未知玩家' };
      const isUndercover = room.undercoverIds.includes(uid);
      const isWhiteboard = room.whiteboardIds.includes(uid);
      const isBadGuy = isUndercover || isWhiteboard;
      const role = isUndercover ? 'UNDERCOVER' : (isWhiteboard ? 'WHITEBOARD' : 'CIVILIAN');

      const targetId = room.votes[uid] || null;
      const targetInfo = targetId ? ((room.roundPlayers && room.roundPlayers[targetId]) || room.players[targetId]) : null;
      const votedForName = targetInfo ? targetInfo.name : null;

      let earnedScore = 0;
      const notes = [];

      // 規則 1：臥底或白板 0 票完美潛伏得 2 分
      if (isBadGuy) {
        const myVotes = votesReceived[uid] || 0;
        if (myVotes === 0) {
          earnedScore += 2;
          notes.push('0票潛伏+2');
        } else {
          notes.push(`被投${myVotes}票`);
        }
      }

      // 規則 2：任何人投中臥底或白板皆得 1 分
      if (targetId && targetId !== uid && badGuyIds.includes(targetId)) {
        earnedScore += 1;
        if (room.undercoverIds.includes(targetId)) {
          notes.push('抓中臥底+1');
        } else {
          notes.push('抓中白板+1');
        }
      }

      if (room.scores[uid] !== undefined) {
        room.scores[uid] += earnedScore;
      }

      playerResults.push({
        uid,
        name: pInfo.name,
        role,
        votedForName,
        earnedScore,
        note: notes.join('、')
      });
    });

    // 排序：臥底 -> 白板 -> 平民，同身分依本局得分高到低
    const rolePriority = { UNDERCOVER: 1, WHITEBOARD: 2, CIVILIAN: 3 };
    playerResults.sort((a, b) => {
      if (rolePriority[a.role] !== rolePriority[b.role]) {
        return rolePriority[a.role] - rolePriority[b.role];
      }
      return b.earnedScore - a.earnedScore;
    });

    const undercoverNames = room.undercoverIds
      .map(id => ((room.roundPlayers && room.roundPlayers[id]) || room.players[id])?.name || '未知')
      .join('、');

    const whiteboardNames = room.whiteboardIds
      .map(id => ((room.roundPlayers && room.roundPlayers[id]) || room.players[id])?.name || '未知')
      .join('、');

    const hasUndercover = room.undercoverIds.length > 0;

    if (!room.historyList) room.historyList = [];
    room.historyList.push({
      round: room.historyList.length + 1,
      category: room.settings.category,
      civilianSong: room.civilianSong,
      undercoverSong: hasUndercover ? room.undercoverSong : '',
      winner: winnerText
    });

    const resultData = {
      winner: winnerText,
      undercoverName: undercoverNames,
      whiteboardName: whiteboardNames,
      civilianSong: room.civilianSong,
      undercoverSong: hasUndercover ? room.undercoverSong : '',
      civilianUrl: room.civilianUrl,
      undercoverUrl: hasUndercover ? room.undercoverUrl : '',
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
      settings: { duration: 15, category: '全部', roleMode: '加入白板' }, 
      undercoverIds: [], whiteboardIds: [], votes: {},
      civilianSong: '', undercoverSong: '',
      civilianUrl: '', undercoverUrl: '',
      playedSongs: [], scores: {}, lastResult: null, historyList: [],
      roundPlayers: {}, reactionTimestamps: {},
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
      room.settings = {
        duration: parseInt(settings.duration) || 15,
        category: settings.category || '全部',
        roleMode: settings.roleMode || '加入白板'
      };
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
    if (!room || room.hostId !== userId || room.state !== 'LOBBY') return;

    const playerIds = Object.keys(room.players);
    if (playerIds.length < 2) return;

    room.state = 'LOADING';
    room.votes = {}; 
    if (room.singlePlayerIdleTimer) {
      clearTimeout(room.singlePlayerIdleTimer);
      room.singlePlayerIdleTimer = null;
    }

    room.roundPlayers = {};
    playerIds.forEach(uid => {
      room.roundPlayers[uid] = { name: room.players[uid].name };
    });

    io.to(roomId).emit('game_starting');

    // 依角色模式分配臥底與白板
    const { undercoverIds, whiteboardIds } = assignRoles(playerIds, room.settings.roleMode);
    room.undercoverIds = undercoverIds;
    room.whiteboardIds = whiteboardIds;
    
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

    // 💡 白板玩家一樣會收到 civilianTrack.url 進行預載，讓全場下載速度一致不穿幫
    Object.keys(room.players).forEach(uid => {
      if (!room.players[uid]) return; 
      room.players[uid].isLoaded = false;
      const targetUrl = room.undercoverIds.includes(uid) ? undercoverTrack.url : civilianTrack.url;
      io.to(room.players[uid].socketId).emit('PRELOAD_MUSIC', targetUrl);
    });

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
    if (targetId === userId) return;

    if (targetId === null || !room.players[targetId]) {
      delete room.votes[userId]; 
    } else {
      room.votes[userId] = targetId;
    }

    io.to(roomId).emit('votes_live_update', {
      votes: room.votes
    });
  });

  // 💡 心理戰快捷氣泡（含後端防洗版冷卻驗證）
  const ALLOWED_REACTIONS = ['🤣 演很大喔', '👀 我看穿了', '😱 別亂投我', '🤫 別跟風！'];
  socket.on('send_reaction', ({ roomId, userId, text }) => {
    const room = rooms[roomId];
    if (!room || !room.players[userId]) return;
    if (room.state !== 'PLAYING' && room.state !== 'VOTING') return;
    if (!ALLOWED_REACTIONS.includes(text)) return;

    const now = Date.now();
    const lastTime = room.reactionTimestamps[userId] || 0;
    if (now - lastTime < 1200) return;
    room.reactionTimestamps[userId] = now;

    io.to(roomId).emit('reaction_bubble', {
      senderName: room.players[userId].name,
      text
    });
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`伺服器正在 port ${PORT} 運行中`));