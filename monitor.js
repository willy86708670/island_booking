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
    // 這是模擬手機 App 的請求標頭
    const options = {
        hostname: 'inline.app',
        path: '/booking/-NeqTSgDQOAYi30lg4a7:inline-live-3/-OUYVD5L8af9l-fOxBi5',
        headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
            'Accept': 'text/html'
        }
    };

    return new Promise((resolve) => {
        https.get(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', (e) => resolve(null));
    });
}

(async () => {
    const html = await checkBooking();
    if (!html) {
        await sendTelegram("⚠️ 監控失敗：無法連線至網站。");
        return;
    }

    // 檢查回傳的網頁內容是否包含 "訂位" 或時間字樣
    if (html.includes("預約") || html.includes("時間")) {
        await sendTelegram("🔍 系統掃描回報：監控網頁連線正常，持續監控中...");
    } else {
        await sendTelegram("⚠️ 系統似乎被擋了，或是網站結構已更動。");
    }
})();
