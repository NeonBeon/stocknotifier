// pages/api/check-stock.js
import GardenStockNotifier from '../../lib/discordNotifier'; // Adjust path if your lib folder is elsewhere
import { kv } from '@vercel/kv'; // Vercel Key-Value store for state

// Simple secret to protect the endpoint, set this in your Vercel Environment Variables
const CRON_SECRET = process.env.CRON_SECRET;

export default async function handler(req, res) {
    // Check for cron secret if running in production
    if (process.env.NODE_ENV === 'production') {
        const requestCronSecret = req.headers['authorization']?.split(' ')[1];
        if (!CRON_SECRET || requestCronSecret !== CRON_SECRET) {
            console.warn("⚠️ Unauthorized attempt to access cron job without or with invalid secret.");
            return res.status(401).json({ message: 'Unauthorized' });
        }
    }
    // Allow only GET or POST (Vercel cron can use GET by default, or you can configure POST)
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    console.log("🌱 API Route: Starting stock check...");
    const notifier = new GardenStockNotifier();
    const LAST_STOCK_KEY = 'gardenLastStockData'; // Key for Vercel KV

    try {
        const spans = await notifier.fetchStockData();
        if (!spans) {
            console.log("API Route: Failed to fetch stock data.");
            // Optionally send a different kind of notification or just log
            return res.status(500).json({ status: "FAILED_FETCH", message: "Could not fetch stock data from source." });
        }

        const currentStockData = notifier.parseStockItems(spans);

        let lastStockData = null;
        try {
            lastStockData = await kv.get(LAST_STOCK_KEY);
        } catch (kvError) {
            console.error("⚠️ Vercel KV get error:", kvError.message);
            // Decide if you want to proceed without lastStockData or fail
        }


        if (lastStockData && JSON.stringify(currentStockData) === JSON.stringify(lastStockData)) {
            console.log("API Route: Stock data unchanged since last notification.");
            return res.status(200).json({ status: "UNCHANGED", message: "Stock data is the same as last time." });
        }

        console.log("API Route: Stock data changed or initial fetch - processing notification.");
        const payload = notifier.formatDiscordMessage(currentStockData);
        const success = await notifier.sendDiscordWebhook(payload);

        if (success) {
            try {
                await kv.set(LAST_STOCK_KEY, currentStockData);
                console.log("API Route: Notification sent, stock data updated in KV.");
            } catch (kvError) {
                console.error("⚠️ Vercel KV set error:", kvError.message);
                // Notification was sent, but saving state failed. Consider how to handle.
            }
            return res.status(200).json({ status: "NOTIFIED", message: "Notification sent successfully." });
        } else {
            console.log("API Route: Failed to send Discord webhook.");
            // Don't update lastStockData in KV if send failed, so it tries again with this data.
            return res.status(500).json({ status: "FAILED_SEND", message: "Failed to send Discord webhook." });
        }
    } catch (error) {
        console.error("💥 API Route: Error during stock check:", error);
        return res.status(500).json({ status: "ERROR", message: error.message || "Unknown error occurred." });
    }
}
