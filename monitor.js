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
    
    // 模擬真實手機瀏覽器，這能大幅降低被網站阻擋的機率
    await page.setExtraHTTPHeaders({ 
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' 
    });

    try {
        // 設定更寬鬆的等待模式
        await page.goto('https://inline.app/booking/-NeqTSgDQOAYi30lg4a7:inline-live-3/-OUYVD5L8af9l-fOxBi5', { timeout: 60000, waitUntil: 'domcontentloaded' });
        
        const selector = 'select[id*="adult"]';
        await page.waitForSelector(selector, { timeout: 45000, visible: true });
        
        await page.selectOption(selector, '4');
        await page.click('#date_picker');
        await page.waitForTimeout(5000); 

        const hasSlot = await page.evaluate(() => {
            const btns = document.querySelectorAll('button');
            for(let b of btns) { if(/\d{1,2}:\d{2}/.test(b.innerText)) return true; }
            return false;
        });

        if (hasSlot) {
            await sendTelegram("🎉 島語高漢神店偵測到空位！請立即前往預約：\nhttps://inline.app/booking/-NeqTSgDQOAYi30lg4a7:inline-live-3/-OUYVD5L8af9l-fOxBi5");
        } else {
            await sendTelegram("🔍 掃描完成：目前尚未偵測到 4 人空位。持續監控中...");
        }
    } catch (e) {
        console.error("爬蟲錯誤:", e);
        await sendTelegram("⚠️ 監控程式發生錯誤，可能網站載入逾時或結構變更，請檢查 GitHub Actions Log。");
    } finally {
        await browser.close();
    }
})();
