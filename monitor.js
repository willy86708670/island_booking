const https = require('https');

async function sendTelegram(message) {
    const token = process.env.TELEGRAM_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(message)}`;
    
    return new Promise((resolve) => {
        https.get(url, (res) => {
            res.on('data', () => {});
            res.on('end', () => resolve());
        }).on('error', () => resolve());
    });
}

async function checkBooking() {
    const options = {
        hostname: 'inline.app',
        path: '/booking/-NeqTSgDQOAYi30lg4a7:inline-live-3/-OUYVD5L8af9l-fOxBi5',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Referer': 'https://inline.app/',
            'Accept-Language': 'zh-TW,zh;q=0.9'
        }
    };

    return new Promise((resolve) => {
        https.get(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', () => resolve(null));
    });
}

(async () => {
    const html = await checkBooking();
    if (!html) {
        // 連線失敗才通知，平常保持安靜
        return;
    }

    // 搜尋是否有時間格式 (例如 11:30, 17:30 等)
    // Inline 網頁若有空位，通常會出現類似時間的字串
    const hasSlot = /\d{2}:\d{2}/.test(html);

    if (hasSlot) {
        await sendTelegram("🎉 島語高漢神店偵測到疑似空位！請立即手動確認：\nhttps://inline.app/booking/-NeqTSgDQOAYi30lg4a7:inline-live-3/-OUYVD5L8af9l-fOxBi5");
    } else {
        // 這裡我們不發送「連線正常」的訊息，讓 Telegram 保持安靜，只有抓到空位才通知
        console.log("目前無空位，保持安靜。");
    }
})();
