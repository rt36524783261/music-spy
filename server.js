const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const rooms = {}; 
const disconnectTimers = {}; 

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
    "陳奕迅 孤勇者", "陳奕迅 十年", "陳奕迅 愛情轉移", "陳奕迅 淘汰", "陳奕迅 浮誇"
  ],
  'K-POP': [
    "BLACKPINK How You Like That", "BLACKPINK Kill This Love", "BLACKPINK DDU-DU DDU-DU", "BLACKPINK Pink Venom", "BLACKPINK Shut Down",
    "BTS Butter", "BTS Dynamite", "BTS Boy With Luv", "BTS Fake Love", "BTS Blood Sweat & Tears",
    "TWICE FANCY", "TWICE Feel Special", "TWICE The Feels", "TWICE TT", "TWICE What Is Love",
    "NewJeans Hype Boy", "NewJeans OMG", "NewJeans Ditto", "NewJeans Super Shy", "NewJeans Attention",
    "aespa Next Level", "aespa Savage", "aespa Drama", "aespa Spicy", "aespa Illusion",
    "IVE I AM", "IVE LOVE DIVE", "IVE After LIKE", "IVE ELEVEN", "IVE Baddie",
    "LE SSERAFIM UNFORGIVEN", "LE SSERAFIM ANTIFRAGILE", "LE SSERAFIM FEARLESS", "LE SSERAFIM Perfect Night", "LE SSERAFIM Eve Psyche",
    "GIDLE Nxde", "GIDLE TOMBOY", "GIDLE Queencard", "GIDLE LATATA", "GIDLE Super Lady",
    "SEVENTEEN Super", "SEVENTEEN HOT", "SEVENTEEN Don't Wanna Cry", "SEVENTEEN VERY NICE", "SEVENTEEN Clap",
    "Stray Kids God's Menu", "Stray Kids MANIAC", "Stray Kids S-Class", "ITZY WANNABE", "Jungkook Seven"
  ],
  '動漫神曲': [
    "YOASOBI Idol", "YOASOBI Yoru ni Kakeru", "YOASOBI Kaibutsu", "YOASOBI Shukufuku", "YOASOBI Gunjo",
    "LiSA Gurenge", "LiSA Homura", "LiSA crossing field", "LiSA oath sign", "LiSA Catch the Moment",
    "Aimer Zankyou Sanka", "Aimer Brave Shine", "Aimer I beg you", "Aimer RE:I AM", "Aimer ninelie",
    "Kenshi Yonezu KICK BACK", "Kenshi Yonezu Lemon", "Kenshi Yonezu Peace Sign", "Kenshi Yonezu Orion", "Kenshi Yonezu LOSER",
    "RADWIMPS Zenzenzense", "RADWIMPS Sparkle", "RADWIMPS Nandemonaiya", "RADWIMPS Grand Escape", "RADWIMPS Is There Still Anything That Love Can Do",
    "King Gnu SPECIALZ", "King Gnu Hakujitsu", "King Gnu Sakayume", "King Gnu Ichizu", "King Gnu Boy",
    "Official HIGE DANdism Mixed Nuts", "Official HIGE DANdism Cry Baby", "Official HIGE DANdism Pretender", "Official HIGE DANdism Shukumei", "Official HIGE DANdism Yesterday",
    "Tatsuya Kitani Ao no Sumika", "Vaundy Chainsaw Blood", "Creepy Nuts Bling-Bang-Bang-Born", "TK unravel", "FLOW GO",
    "SPYAIR Sakura Mitsutsuki", "SPYAIR Imagination", "Eir Aoi IGNITE", "Eir Aoi INNOCENCE", "Eir Aoi Sirius",
    "KANA-BOON Silhouette", "Ikimonogakari Blue Bird", "Yui again", "Yoko Takahashi A Cruel Angel's Thesis", "Wada Koji Butter-Fly"
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
    "Billie Eilish bad guy", "Billie Eilish everything i wanted", "Billie Eilish Therefore I Am", "Billie Eilish ocean eyes", "Billie Eilish happier than ever"
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

io.on('connection', (socket) => {
  console.log(`連線建立: ${socket.id}`);

  socket.on('create_room', ({ userId, userName }) => {
    const finalName = userName || '天飛巴庫';
    const roomId = Math.random().toString(36).substring(2, 6).toUpperCase(); 

    rooms[roomId] = { 
      hostId: userId, state: 'LOBBY', players: {},
      settings: { duration: 15, category: '混合隨機' }, 
      undercoverId: null, votes: {},
      civilianSong: '', undercoverSong: '',
      playedSongs: [],
      scores: {} 
    };
    rooms[roomId].players[userId] = { name: finalName, socketId: socket.id, status: 'ONLINE', isReady: false, isLoaded: false };
    rooms[roomId].scores[userId] = 0; 

    socket.join(roomId);
    socket.emit('room_joined', roomId);
    io.to(roomId).emit('room_state_update', rooms[roomId]);
  });

  socket.on('join_room', ({ roomId, userId, userName }) => {
    const room = rooms[roomId];
    if (!room) return socket.emit('error_msg', '找不到這個房間碼！');

    if (room.players[userId]) {
      clearTimeout(disconnectTimers[userId]); 
      room.players[userId].socketId = socket.id; 
      room.players[userId].status = 'ONLINE';
    } else {
      room.players[userId] = { name: userName || '天飛巴庫', socketId: socket.id, status: 'ONLINE', isReady: false, isLoaded: false };
      if (room.scores[userId] === undefined) room.scores[userId] = 0; 
    }
    socket.join(roomId);
    socket.emit('room_joined', roomId);
    io.to(roomId).emit('room_state_update', room);
  });

  socket.on('leave_room', ({ roomId, userId }) => {
    const room = rooms[roomId];
    if (room && room.players[userId]) {
      if (room.hostId === userId) {
        io.to(roomId).emit('room_destroyed');
        delete rooms[roomId];
      } else {
        delete room.players[userId];
        delete room.scores[userId]; 
        socket.leave(roomId);
        io.to(roomId).emit('room_state_update', room);
      }
    }
  });

  socket.on('kick_player', ({ roomId, targetUserId, hostId }) => {
    const room = rooms[roomId];
    if (room && room.hostId === hostId) {
      if (room.players[targetUserId]) {
        const targetSocketId = room.players[targetUserId].socketId;
        delete room.players[targetUserId];
        delete room.scores[targetUserId];
        io.to(targetSocketId).emit('kicked_out');
        io.to(roomId).emit('room_state_update', room);
      }
    }
  });

  socket.on('update_settings', ({ roomId, userId, settings }) => {
    const room = rooms[roomId];
    if (room && room.hostId === userId) {
      room.settings = settings;
      io.to(roomId).emit('room_state_update', room);
    }
  });

  socket.on('toggle_ready', ({ roomId, userId }) => {
    const room = rooms[roomId];
    if (room && room.players[userId]) {
      room.players[userId].isReady = !room.players[userId].isReady;
      io.to(roomId).emit('room_state_update', room);
    }
  });

  socket.on('start_game', async ({ roomId, userId }) => {
    const room = rooms[roomId];
    if (room && room.hostId === userId) {
      room.state = 'PLAYING';
      room.votes = {}; 
      io.to(roomId).emit('game_starting');

      const playerIds = Object.keys(room.players);
      room.undercoverId = playerIds[Math.floor(Math.random() * playerIds.length)];
      
      let pool = [];
      if (room.settings.category === '混合隨機') {
        Object.values(POOLS).forEach(arr => pool = pool.concat(arr));
      } else {
        pool = POOLS[room.settings.category];
      }

      let availablePool = pool.filter(song => !room.playedSongs.includes(song));
      if (availablePool.length < 2) {
        room.playedSongs = [];
        availablePool = [...pool];
      }

      const shuffled = [...availablePool].sort(() => 0.5 - Math.random());
      const isFirstCivilian = Math.random() > 0.5;
      const civilianQuery = isFirstCivilian ? shuffled[0] : shuffled[1];
      const undercoverQuery = isFirstCivilian ? shuffled[1] : shuffled[0];

      room.playedSongs.push(civilianQuery, undercoverQuery);
      room.civilianSong = civilianQuery;
      room.undercoverSong = undercoverQuery;

      const [civilianUrl, undercoverUrl] = await Promise.all([
        fetchAppleMusicPreview(civilianQuery), fetchAppleMusicPreview(undercoverQuery)
      ]);

      if (!civilianUrl || !undercoverUrl) {
        room.state = 'LOBBY';
        io.to(roomId).emit('error_msg', 'Apple API 抓歌失敗，請重新開始。');
        return;
      }

      room.loadedCount = 0;
      playerIds.forEach(uid => {
        room.players[uid].isLoaded = false;
        const targetUrl = (uid === room.undercoverId) ? undercoverUrl : civilianUrl;
        io.to(room.players[uid].socketId).emit('PRELOAD_MUSIC', targetUrl);
      });
    }
  });

  socket.on('music_loaded', ({ roomId, userId }) => {
    const room = rooms[roomId];
    if (room && room.players[userId]) {
      room.players[userId].isLoaded = true;
      
      const onlinePlayers = Object.values(room.players).filter(p => p.status === 'ONLINE');
      const loadedOnlineCount = onlinePlayers.filter(p => p.isLoaded === true).length;
      
      if (loadedOnlineCount === onlinePlayers.length) {
        io.to(roomId).emit('START_PLAYING', room.settings.duration);
        
        setTimeout(() => {
          room.state = 'VOTING';
          io.to(roomId).emit('START_VOTING');
          
          setTimeout(() => {
            calculateVotes(roomId);
          }, 20000 + 1000); 

        }, room.settings.duration * 1000 + 1000);
      }
    }
  });

  socket.on('submit_vote', ({ roomId, userId, targetId }) => {
    const room = rooms[roomId];
    if (room) {
      if (targetId === null) delete room.votes[userId]; 
      else room.votes[userId] = targetId;
    }
  });

  function calculateVotes(roomId) {
    const room = rooms[roomId];
    if (!room) return;

    room.state = 'LOBBY';

    let voteCounts = {};
    for (let voter in room.votes) {
      if (room.players[voter] && room.players[voter].status === 'ONLINE') {
        let target = room.votes[voter];
        if (room.players[target]) { 
          voteCounts[target] = (voteCounts[target] || 0) + 1;
        }
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

    const undercoverDied = eliminated.includes(room.undercoverId);
    const winner = undercoverDied ? '平民勝利' : '臥底勝利';
    
    // 計算分數：平民贏所有人+1(臥底除外)，臥底贏臥底+3
    if (winner === '平民勝利') {
      Object.keys(room.players).forEach(uid => {
        if (uid !== room.undercoverId && room.players[uid].status === 'ONLINE') {
          room.scores[uid] += 1;
        }
      });
    } else {
      if (room.players[room.undercoverId] && room.players[room.undercoverId].status === 'ONLINE') {
        room.scores[room.undercoverId] += 3;
      }
    }

    const eliminatedData = eliminated.map(id => ({
      name: room.players[id]?.name || '未知',
      isUndercover: id === room.undercoverId
    }));
    
    const undercoverName = room.players[room.undercoverId]?.name || '未知';

    // 將包含分數的更新狀態一併送出
    io.to(roomId).emit('GAME_RESULT', { 
      winner, 
      eliminatedData, 
      undercoverName,
      civilianSong: room.civilianSong,
      undercoverSong: room.undercoverSong
    });

    Object.values(room.players).forEach(p => p.isReady = false);
    io.to(roomId).emit('room_state_update', room);
  }

  socket.on('disconnect', () => {
    for (const roomId in rooms) {
      const room = rooms[roomId];
      for (const userId in room.players) {
        if (room.players[userId].socketId === socket.id) {
          if (room.hostId === userId) {
            io.to(roomId).emit('room_destroyed');
            delete rooms[roomId];
            break;
          }

          if (room.state === 'LOBBY') {
            room.players[userId].status = 'OFFLINE';
            io.to(roomId).emit('room_state_update', room); 
            
            disconnectTimers[userId] = setTimeout(() => {
              if (room.players[userId]) {
                delete room.players[userId];
                delete room.scores[userId];
                io.to(roomId).emit('room_state_update', room); 
                if (Object.keys(room.players).length === 0) delete rooms[roomId];
              }
            }, 30000); 
          } else {
            delete room.players[userId];
            delete room.scores[userId];
            io.to(roomId).emit('room_state_update', room);
            if (Object.keys(room.players).length === 0) delete rooms[roomId];
          }
          break;
        }
      }
    }
  });
});

http.listen(3000, () => console.log('伺服器在 port 3000 苟延殘喘中'));