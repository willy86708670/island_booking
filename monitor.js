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
    // 這次我們加上更完整的瀏覽器特徵 (Cookies/Referer)
    const options = {
        hostname: 'inline.app',
        path: '/booking/-NeqTSgDQOAYi30lg4a7:inline-live-3/-OUYVD5L8af9l-fOxBi5',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Referer': 'https://www.google.com/',
            'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
            'Connection': 'keep-alive'
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
        await sendTelegram("⚠️ 監控失敗：無法連線，可能 IP 被阻擋。");
        return;
    }

    // 判斷網頁內容，如果回傳內容很短，很可能就是被擋了
    if (html.length > 2000) { 
        await sendTelegram("✅ 監控系統運行中：網站連線正常！");
    } else {
        await sendTelegram("⚠️ 偵測到網頁內容過短，可能被觸發了防爬蟲機制。");
    }
})();
