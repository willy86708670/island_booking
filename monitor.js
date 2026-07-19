const { chromium } = require('playwright');
const https = require('https');

// 【重要】測試完畢後，請務必將此處改回 false，否則只會發送測試訊息
const FORCE_TEST = false; 

async function sendTelegram(message) {
    const token = process.env.TELEGRAM_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(message)}`;
    
    return new Promise((resolve) => {
        https.get(url, (res) => {
            res.on('data', () => {}); 
            res.on('end', () => resolve());
        }).on('error', (err) => {
            console.log("通知發送過程發生網路中斷，已忽略:", err.message);
            resolve(); 
        });
    });
}

(async () => {
    // 測試模式：發送測試訊息確認連線是否已完全打通
    if (FORCE_TEST) {
        await sendTelegram("測試訊息：GitHub Actions 與 Telegram 連線已完全修復成功！");
        console.log("測試訊息已發送");
        return;
    }

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({ 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36' });

    try {
        await page.goto('https://inline.app/booking/-NeqTSgDQOAYi30lg4a7:inline-live-3/-OUYVD5L8af9l-fOxBi5', { timeout: 60000 });
        await page.waitForSelector('select[id*="adult"]');
        await page.selectOption('select[id*="adult"]', '4');
        await page.click('#date_picker');
        await page.waitForTimeout(3000);

        const hasSlot = await page.evaluate(() => {
            const btns = document.querySelectorAll('button');
            for(let b of btns) { if(/\d{1,2}:\d{2}/.test(b.innerText)) return true; }
            return false;
        });

        if (hasSlot) {
            await sendTelegram("🎉 島語高漢神店偵測到空位！\nhttps://inline.app/booking/-NeqTSgDQOAYi30lg4a7:inline-live-3/-OUYVD5L8af9l-fOxBi5");
        } else {
            console.log("目前無空位");
        }
    } catch (e) {
        console.error("執行爬蟲時發生錯誤:", e);
    } finally {
        await browser.close();
    }
})();
