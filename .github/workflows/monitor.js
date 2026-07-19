const https = require('https');

// 既有的 Telegram 通知函數
async function sendTelegram(message) {
    const token = process.env.TELEGRAM_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(message)}`;
    
    return new Promise((resolve) => {
        https.get(url, (res) => { res.on('data', () => {}); res.on('end', () => resolve()); }).on('error', () => resolve());
    });
}

// 新增 LINE 通知函數
async function sendLine(message) {
    const token = process.env.LINE_TOKEN;
    const data = `message=${encodeURIComponent(message)}`;
    const options = {
        hostname: 'notify-api.line.me',
        path: '/api/notify',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(data)
        }
    };
    
    return new Promise((resolve) => {
        const req = https.request(options, (res) => { res.on('data', () => {}); res.on('end', () => resolve()); });
        req.write(data);
        req.end();
    });
}

async function checkBooking() {
    const options = {
        hostname: 'inline.app',
        path: '/booking/-NeqTSgDQOAYi30lg4a7:inline-live-3/-OUYVD5L8af9l-fOxBi5',
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' }
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
    if (!html) { return; }

    const hasSlot = /\d{2}:\d{2}/.test(html);

    if (hasSlot) {
        const msg = "🎉 島語高漢神店偵測到疑似空位！請立即手動確認：\nhttps://inline.app/booking/-NeqTSgDQOAYi30lg4a7:inline-live-3/-OUYVD5L8af9l-fOxBi5";
        await sendTelegram(msg);
        await sendLine(msg); // 同時發送到 LINE
    } else {
        await sendTelegram("🔍 系統掃描回報：目前尚未偵測到空位，持續監控中...");
    }
})();
