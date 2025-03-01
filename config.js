module.exports = {
    prefix: '.',  // Command prefix
    ownerNumber: process.env.OWNER_NUMBER || '4915561048015@s.whatsapp.net',
    ownerName: process.env.OWNER_NAME || 'BLACKSKY',
    botName: '𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻',
    botNumber: '', // Will be set after connection
    menuImage: 'https://raw.githubusercontent.com/your-repo/assets/main/f9.jpg',
    commands: {
        // AI Commands (Updated)
        ai: { description: 'Chat with AI assistant (GPT-3.5)', category: 'AI' },
        gpt: { description: 'Advanced chat with GPT-4', category: 'AI' },
        imagine: { description: 'Generate images with Stable Diffusion', category: 'AI' },
        dalle: { description: 'Generate images with DALL-E 3', category: 'AI' },
        remini: { description: 'Enhance image quality', category: 'AI' },
        blackbox: { description: 'AI code generation and explanation', category: 'AI' },
        img2txt: { description: 'Analyze and describe images', category: 'AI' },
        tts: { description: 'Convert text to speech', category: 'AI' },
        cleargpt: { description: 'Clear GPT chat history', category: 'AI' },

        // Media Commands
        sticker: { description: 'Create sticker from image/video', category: 'Media' },
        toimg: { description: 'Convert sticker to image', category: 'Media' },
        tomp3: { description: 'Convert video to audio', category: 'Media' },
        tovn: { description: 'Convert audio to voice note', category: 'Media' },
        togif: { description: 'Convert video sticker to gif', category: 'Media' },
        tourl: { description: 'Upload media to url', category: 'Media' },
        play: { description: 'Play audio from YouTube', category: 'Media' },
        song: { description: 'Download and play songs', category: 'Media' },
        video: { description: 'Download and play videos', category: 'Media' },
        playlist: { description: 'Create and play playlists', category: 'Media' },
        cropimg: { description: 'Crop image to square', category: 'Media' },
        invert: { description: 'Invert image colors', category: 'Media' },
        grayscale: { description: 'Convert image to grayscale', category: 'Media' },
        pixelate: { description: 'Pixelate an image', category: 'Media' },
        rotate: { description: 'Rotate image by specified degrees', category: 'Media' },
        blur: { description: 'Apply blur effect to image', category: 'Media' },
        circle: { description: 'Make image circular', category: 'Media' },

        // Basic Commands
        menu: { description: 'Show main menu with all commands', category: 'Basic' },
        help: { description: 'Get detailed help for specific commands', category: 'Basic' },
        ping: { description: 'Check bot response time and status', category: 'Basic' },
        info: { description: 'View bot information and stats', category: 'Basic' },
        owner: { description: 'View bot creator info', category: 'Basic' },
        runtime: { description: 'Check bot uptime', category: 'Basic' },
        speed: { description: 'Test bot response speed', category: 'Basic' },
        status: { description: 'View bot status and info', category: 'Basic' },
        dashboard: { description: 'View bot statistics dashboard', category: 'Basic' },

        // Game Commands
        rpg: { description: 'View RPG game status', category: 'Game' },
        quest: { description: 'Start a new RPG quest', category: 'Game' },
        battle: { description: 'Battle another player', category: 'Game' },
        tictactoe: { description: 'Play TicTacToe with a friend', category: 'Game' },
        chess: { description: 'Play chess with a friend (Coming Soon)', category: 'Game' },
        suit: { description: 'Play Rock Paper Scissors', category: 'Game' },
        truth: { description: 'Get a truth question', category: 'Game' },
        dare: { description: 'Get a dare challenge', category: 'Game' },
        quiz: { description: 'Show available quiz games', category: 'Game' },
        family100: { description: 'Play Family 100 quiz game', category: 'Game' },
        asahotak: { description: 'Play Brain Teaser quiz', category: 'Game' },
        tebakkata: { description: 'Play Word Guessing game', category: 'Game' },
        tebakgambar: { description: 'Play Picture Quiz game', category: 'Game' },
        tebaklirik: { description: 'Play Lyrics Quiz game', category: 'Game' },
        tebakkimia: { description: 'Play Chemistry Quiz game', category: 'Game' },
        tebakbendera: { description: 'Play Flag Quiz game', category: 'Game' },
        tebakkabupaten: { description: 'Play Region Quiz game', category: 'Game' },
        werewolf: { description: 'Play Werewolf game (Coming Soon)', category: 'Game' },

        // Updated Downloader Commands
        ytmp3: { description: 'Download YouTube audio in high quality', category: 'Downloader' },
        ytmp4: { description: 'Download YouTube videos in HD', category: 'Downloader' },
        ythdmp4: { description: 'Download YouTube videos in highest quality', category: 'Downloader' },
        ytsearch: { description: 'Search YouTube videos', category: 'Downloader' },
        ytplaylist: { description: 'Get YouTube playlist info and download options', category: 'Downloader' },
        instagram: { description: 'Download Instagram photos and videos', category: 'Downloader' },
        igdl: { description: 'Download Instagram posts, reels, and stories', category: 'Downloader' },
        igreel: { description: 'Download Instagram reels in high quality', category: 'Downloader' },
        igstory: { description: 'Download Instagram stories (Coming Soon)', category: 'Downloader' },
        fb: { description: 'Download Facebook videos', category: 'Downloader' },
        fbhd: { description: 'Download Facebook videos in HD quality', category: 'Downloader' },
        tiktok: { description: 'Download TikTok videos without watermark', category: 'Downloader' },
        tiktokmp3: { description: 'Extract audio from TikTok videos', category: 'Downloader' },
        spotify: { description: 'Get Spotify track information', category: 'Downloader' },
        mediafire: { description: 'Download files from MediaFire', category: 'Downloader' },
        gitclone: { description: 'Clone GitHub repositories', category: 'Downloader' },
        apk: { description: 'Download Android APK files', category: 'Downloader' },


        // User & Profile Commands
        profile: { description: 'View user profile', category: 'User' },
        me: { description: 'View your profile', category: 'User' },
        register: { description: 'Register your account', category: 'User' },
        level: { description: 'Check your level and XP', category: 'User' },
        daily: { description: 'Claim daily rewards', category: 'User' },
        bio: { description: 'Set your profile bio', category: 'User' },

        // Economy Commands
        balance: { description: 'Check your balance', category: 'Economy' },
        transfer: { description: 'Transfer coins to users', category: 'Economy' },
        shop: { description: 'View available items in shop', category: 'Economy' },
        buy: { description: 'Buy items from shop', category: 'Economy' },
        inventory: { description: 'View your inventory', category: 'Economy' },
        work: { description: 'Work to earn coins', category: 'Economy' },
        rob: { description: 'Rob other users', category: 'Economy' },
        gamble: { description: 'Gamble your coins', category: 'Economy' },

        // Group Commands
        kick: { description: 'Kick member from group', category: 'Group' },
        add: { description: 'Add member to group', category: 'Group' },
        promote: { description: 'Promote member to admin', category: 'Group' },
        demote: { description: 'Demote admin to member', category: 'Group' },
        tagall: { description: 'Tag all group members', category: 'Group' },
        hidetag: { description: 'Tag all members secretly', category: 'Group' },
        group: { description: 'Group settings (open/close)', category: 'Group' },
        setname: { description: 'Change group name', category: 'Group' },
        setdesc: { description: 'Change group description', category: 'Group' },
        setppgc: { description: 'Set group profile picture', category: 'Group' },
        revoke: { description: 'Reset group invite link', category: 'Group' },
        leave: { description: 'Make bot leave the group', category: 'Group' },


        // Fun Commands
        reaction: { description: 'Add reaction to message', category: 'Fun' },
        dare: { description: 'Get a dare challenge', category: 'Fun' },
        truth: { description: 'Get a truth question', category: 'Fun' },
        joke: { description: 'Get random jokes', category: 'Fun' },
        meme: { description: 'Get random memes', category: 'Fun' },
        quote: { description: 'Get inspirational quotes', category: 'Fun' },
        fact: { description: 'Get random facts', category: 'Fun' },
        couple: { description: 'Tag random couples', category: 'Fun' },
        magic8ball: { description: 'Ask the magic 8 ball', category: 'Fun' },
        wordgame: { description: 'Play word guessing game', category: 'Fun' },
        guess: { description: 'Make a guess in word game', category: 'Fun' },
        trivia: { description: 'Start a trivia quiz', category: 'Fun' },
        answer: { description: 'Answer trivia question', category: 'Fun' },
        emojiart: { description: 'Get random emoji art', category: 'Fun' },

        // Reaction Commands
        slap: { description: 'Slap someone', category: 'Reactions' },
        hug: { description: 'Hug someone', category: 'Reactions' },
        pat: { description: 'Pat someone', category: 'Reactions' },
        kiss: { description: 'Kiss someone', category: 'Reactions' },
        punch: { description: 'Punch someone', category: 'Reactions' },
        kill: { description: 'Eliminate someone (joke)', category: 'Reactions' },
        highfive: { description: 'Give a high five', category: 'Reactions' },
        facepalm: { description: 'Show disappointment', category: 'Reactions' },
        poke: { description: 'Poke someone', category: 'Reactions' },
        cuddle: { description: 'Cuddle with someone', category: 'Reactions' },
        yeet: { description: 'Yeet someone', category: 'Reactions' },
        boop: { description: 'Boop someone\'s nose', category: 'Reactions' },
        bonk: { description: 'Bonk someone', category: 'Reactions' },
        wave: { description: 'Wave at someone', category: 'Reactions' },
        wink: { description: 'Wink at someone', category: 'Reactions' },
        wasted: { description: 'Apply wasted effect', category: 'Reactions' },

        // Tool Commands
        calc: { description: 'Calculator', category: 'Tools' },
        translate: { description: 'Translate text', category: 'Tools' },
        tts: { description: 'Text to speech', category: 'Tools' },
        weather: { description: 'Check weather info', category: 'Tools' },
        dictionary: { description: 'Look up word definitions', category: 'Tools' },
        styletext: { description: 'Style text formatting', category: 'Tools' },
        ss: { description: 'Take website screenshot', category: 'Tools' },
        shortlink: { description: 'Shorten URLs', category: 'Tools' },

        // AI Commands (Original, now moved after new commands)
        ai: { description: 'Chat with AI', category: 'AI' },
        imagine: { description: 'Generate AI images', category: 'AI' },
        remini: { description: 'Enhance image quality', category: 'AI' },
        dalle: { description: 'Generate images with DALL-E', category: 'AI' },
        gpt: { description: 'Chat with GPT', category: 'AI' },
        blackbox: { description: 'AI code generation', category: 'AI' },

        // NSFW Commands
        nsfwcheck: { description: 'Check NSFW status', category: 'NSFW' },
        setnsfw: { description: 'Enable/disable NSFW in group', category: 'NSFW' },
        waifu: { description: 'Get NSFW waifu image', category: 'NSFW' },
        neko: { description: 'Get NSFW neko image', category: 'NSFW' },
        trap: { description: 'Get NSFW trap image', category: 'NSFW' },
        blowjob: { description: 'Get NSFW image', category: 'NSFW' },
        ass: { description: 'Get NSFW ass image', category: 'NSFW' },
        hentai: { description: 'Get NSFW hentai image', category: 'NSFW' },
        milf: { description: 'Get NSFW milf image', category: 'NSFW' },
        oral: { description: 'Get NSFW oral image', category: 'NSFW' },
        paizuri: { description: 'Get NSFW paizuri image', category: 'NSFW' },
        ecchi: { description: 'Get NSFW ecchi image', category: 'NSFW' },
        ero: { description: 'Get NSFW ero image', category: 'NSFW' },

        // Owner Commands
        broadcast: { description: 'Send message to all chats', category: 'Owner' },
        block: { description: 'Block a user', category: 'Owner' },
        unblock: { description: 'Unblock a user', category: 'Owner' },
        setbotpp: { description: 'Set bot profile picture', category: 'Owner' },
        setbotbio: { description: 'Set bot bio', category: 'Owner' },
        eval: { description: 'Evaluate JavaScript code', category: 'Owner' },
        restart: { description: 'Restart bot system', category: 'Owner' },
        shutdown: { description: 'Shutdown bot system', category: 'Owner' },
        join: { description: 'Join a group via invite link', category: 'Owner' },
        leave: { description: 'Leave a group', category: 'Owner' },
        clearall: { description: 'Clear all chats', category: 'Owner' },
        update: { description: 'Update bot from source', category: 'Owner' },
        setprefix: { description: 'Change bot prefix', category: 'Owner' },
        setstatus: { description: 'Set WhatsApp status', category: 'Owner' },
        setname: { description: 'Change bot display name', category: 'Owner' },
        ban: { description: 'Ban user from using bot', category: 'Owner' },
        unban: { description: 'Unban user from using bot', category: 'Owner' },
        addpremium: { description: 'Add user to premium list', category: 'Owner' },
        delpremium: { description: 'Remove user from premium list', category: 'Owner' },
        listpremium: { description: 'Show list of premium users', category: 'Owner' },
        listban: { description: 'Show list of banned users', category: 'Owner' },
        bc: { description: 'Broadcast message to specific groups', category: 'Owner' },
        bcgc: { description: 'Broadcast message to all groups', category: 'Owner' },
        bcpc: { description: 'Broadcast message to private chats', category: 'Owner' },
        getcase: { description: 'Get command source code', category: 'Owner' },
        addcmd: { description: 'Add custom command', category: 'Owner' },
        delcmd: { description: 'Delete custom command', category: 'Owner' },
        listcmd: { description: 'List all custom commands', category: 'Owner' }
    }
};