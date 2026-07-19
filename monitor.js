const { chromium } = require('playwright');
const https = require('https');

async function sendTelegram(message) {
    const token = process.env.TELEGRAM_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(message)}`;
    return new Promise((resolve) => https.get(url, (res) => resolve()));
}

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    // 模擬真實 User-Agent 避免被封鎖
    await page.setExtraHTTPHeaders({ 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36' });

    try {
        await page.goto('https://inline.app/booking/-NeqTSgDQOAYi30lg4a7:inline-live-3/-OUYVD5L8af9l-fOxBi5', { timeout: 60000 });
        await page.waitForSelector('select[id*="adult"]');
        await page.selectOption('select[id*="adult"]', '4');
        await page.click('#date_picker');
        await page.waitForTimeout(3000);

        // 偵測日期邏輯 (使用與你手機版相同的檢查)
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
        console.error(e);
    } finally {
        await browser.close();
    }
})();
