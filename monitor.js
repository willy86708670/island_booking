const { chromium } = require('playwright');
const https = require('https');

async function sendTelegram(message) {
    const token = process.env.TELEGRAM_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(message)}`;
    
    return new Promise((resolve) => {
        https.get(url, (res) => {
            res.on('data', () => {}); 
            res.on('end', () => resolve());
        }).on('error', (err) => {
            console.log("通知發送忽略小錯誤:", err.message);
            resolve(); 
        });
    });
}

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    // 模擬真實使用者行為
    await page.setExtraHTTPHeaders({ 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
    });

    try {
        // 使用 networkidle 等待頁面所有腳本載入完成
        await page.goto('https://inline.app/booking/-NeqTSgDQOAYi30lg4a7:inline-live-3/-OUYVD5L8af9l-fOxBi5', { timeout: 60000, waitUntil: 'networkidle' });
        
        console.log("網頁載入完成，開始進行空位掃描...");
        await page.waitForTimeout(10000); // 強制等待 10 秒讓動態內容呈現

        // 直接掃描頁面上的所有按鈕，檢查是否有時間格式的文字
        const hasSlot = await page.evaluate(() => {
            const btns = document.querySelectorAll('button');
            for(let b of btns) { 
                if(/\d{1,2}:\d{2}/.test(b.innerText)) return true; 
            }
            return false;
        });

        if (hasSlot) {
            await sendTelegram("🎉 島語高漢神店偵測到空位！請立即前往預約：\nhttps://inline.app/booking/-NeqTSgDQOAYi30lg4a7:inline-live-3/-OUYVD5L8af9l-fOxBi5");
        } else {
            await sendTelegram("🔍 掃描結果：目前尚未偵測到空位。");
        }
    } catch (e) {
        console.error("爬蟲錯誤:", e);
        await sendTelegram("⚠️ 監控程式遇到阻礙，可能是網站反爬蟲機制升級，或是載入時間過長。");
    } finally {
        await browser.close();
    }
})();
