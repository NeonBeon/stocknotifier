// lib/discordNotifier.js
const axios = require('axios');
const {
    SCRAPER_API_URL, DISCORD_WEBHOOK_URL, SEEDS, EGGS, GEAR,
    SEED_EMOJIS, EGG_EMOJIS, GEAR_EMOJIS, EMBED_COLOR, REQUEST_TIMEOUT, RARE_ITEMS,
    DISCORD_ROLE_IDS_TO_PING
} = require('./config');

class GardenStockNotifier {
    constructor() {
        this.lastStockData = null; // This will be managed by the API route if persistence across calls is needed
        this.session = axios.create({
            headers: {
                'User-Agent': 'Garden-Stock-Notifier/1.0 (Node.js; Vercel)'
            }
        });
    }

    async fetchStockData() {
        try {
            console.log("📡 Fetching stock data from API...");
            const response = await this.session.get(SCRAPER_API_URL, { timeout: REQUEST_TIMEOUT });

            if (response.status !== 200) {
                console.log(`🚫 HTTP error while fetching stock data: ${response.status} ${response.statusText}`);
                return null;
            }
            const data = response.data;
            if (!data || !data.result || !Array.isArray(data.result.span)) {
                console.log("❌ Invalid API response structure");
                return null;
            }
            const spans = data.result.span;
            console.log(`✅ Retrieved ${spans.length} span elements`);
            return spans;
        } catch (error) {
            if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                console.log("⏰ Request timed out while fetching stock data");
            } else if (error.response) {
                console.log(`🚫 HTTP error while fetching stock data: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            } else if (error.request) {
                console.log("🌐 Connection error while fetching stock data (no response received)");
            } else {
                console.log(`💥 Unexpected error fetching stock data: ${error.message}`);
            }
            return null;
        }
    }

    parseStockItems(spans) {
        const stockData = { seeds: {}, eggs: {}, gear: {} };
        console.log("🔍 Parsing stock items...");
        let i = 0;
        while (i < spans.length - 1) {
            const itemName = spans[i] ? spans[i].trim() : "";
            const quantityText = spans[i + 1] ? spans[i + 1].trim() : "";

            if (["Cookie Policy", "&nbsp;VulcanValues", "|"].includes(itemName) || !quantityText.startsWith('x')) {
                i += 1;
                continue;
            }
            try {
                const quantity = parseInt(quantityText.substring(1), 10);
                if (isNaN(quantity)) {
                    i += 1;
                    continue;
                }
                if (SEEDS.includes(itemName)) {
                    stockData.seeds[itemName] = quantity;
                } else if (EGGS.includes(itemName)) {
                    stockData.eggs[itemName] = quantity;
                } else if (GEAR.includes(itemName)) {
                    stockData.gear[itemName] = quantity;
                }
            } catch (e) {
                i += 1;
                continue;
            }
            i += 2;
        }
        // console.log("Parsed stock data:", stockData); // Optional: for more detailed logging
        return stockData;
    }

    formatDiscordMessage(stockData) {
        console.log("💬 Formatting Discord message...");
        const rareItemsFound = [];
        const allItems = { ...stockData.seeds, ...stockData.eggs, ...stockData.gear };

        for (const item in allItems) {
            if (RARE_ITEMS.includes(item)) {
                rareItemsFound.push(`${item} (x${allItems[item]})`);
            }
        }

        const messageParts = [];

        if (rareItemsFound.length > 0) {
            messageParts.push("🚨 **RARE ITEMS IN STOCK** 🚨");
            rareItemsFound.forEach(rareItem => messageParts.push(`⭐ ${rareItem}`));
            messageParts.push("");
        }

        if (Object.keys(stockData.seeds).length > 0) {
            messageParts.push("🌱 **Seed Stock**");
            Object.entries(stockData.seeds).sort().forEach(([item, quantity]) => {
                const emoji = SEED_EMOJIS[item] || "🌱";
                const rareIndicator = RARE_ITEMS.includes(item) ? " ⭐" : "";
                messageParts.push(`${emoji} ${item} - ${quantity} units${rareIndicator}`);
            });
            messageParts.push("");
        }

        if (Object.keys(stockData.eggs).length > 0) {
            messageParts.push("🥚 **Egg Stock**");
            Object.entries(stockData.eggs).sort().forEach(([item, quantity]) => {
                const emoji = EGG_EMOJIS[item] || "🥚";
                const rareIndicator = RARE_ITEMS.includes(item) ? " ⭐" : "";
                messageParts.push(`${emoji} ${item} - ${quantity} units${rareIndicator}`);
            });
            messageParts.push("");
        }

        if (Object.keys(stockData.gear).length > 0) {
            messageParts.push("⚙️ **Gear Stock**");
            Object.entries(stockData.gear).sort().forEach(([item, quantity]) => {
                const emoji = GEAR_EMOJIS[item] || "⚙️";
                const rareIndicator = RARE_ITEMS.includes(item) ? " ⭐" : "";
                messageParts.push(`${emoji} ${item} - ${quantity} units${rareIndicator}`);
            });
            messageParts.push(""); // Ensure a blank line if gear is the last section
        }
        
        // Remove last empty line if it exists
        if (messageParts.length > 0 && messageParts[messageParts.length -1] === "") {
            messageParts.pop();
        }

        const embed = {
            title: "🌱 Garden Stock Update",
            description: messageParts.join("\n") || "No items currently in stock.",
            color: EMBED_COLOR,
            timestamp: new Date().toISOString(),
            footer: { text: "Grow a Garden Stock Tracker" }
        };

        const payload = { embeds: [embed] };

        if (rareItemsFound.length > 0 && DISCORD_ROLE_IDS_TO_PING && DISCORD_ROLE_IDS_TO_PING.length > 0) {
            const roleMentions = DISCORD_ROLE_IDS_TO_PING.join(" ");
            payload.content = `${roleMentions} 🚨 RARE ITEMS DETECTED! 🚨`;
            console.log(`🔔 Adding ping for roles: ${DISCORD_ROLE_IDS_TO_PING.join(', ')} for rare items: ${rareItemsFound.join(', ')}`);
        } else if (rareItemsFound.length > 0) {
             console.log(`🔔 Rare items detected, but no specific roles configured for ping: ${rareItemsFound.join(', ')}`);
        }
        return payload;
    }

    async sendDiscordWebhook(payload) {
        if (!DISCORD_WEBHOOK_URL || DISCORD_WEBHOOK_URL === "YOUR_FALLBACK_DISCORD_WEBHOOK_URL_HERE") {
            console.error("❌ DISCORD_WEBHOOK_URL is not configured. Skipping send.");
            return false;
        }
        try {
            console.log("📤 Sending Discord webhook...");
            const response = await axios.post(DISCORD_WEBHOOK_URL, payload, {
                timeout: REQUEST_TIMEOUT,
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.status >= 200 && response.status < 300) {
                console.log("✅ Discord webhook sent successfully!");
                return true;
            } else {
                console.log(`🚫 HTTP error while sending Discord webhook: ${response.status} ${response.statusText}`);
                console.log(`Response: ${JSON.stringify(response.data)}`);
                return false;
            }
        } catch (error) {
            if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                console.log("⏰ Request timed out while sending Discord webhook");
            } else if (error.response) {
                console.log(`🚫 HTTP error while sending Discord webhook: ${error.response.status}`);
                console.log(`Response Data: ${JSON.stringify(error.response.data)}`);
            } else if (error.request) {
                console.log("🌐 Connection error while sending Discord webhook (no response received)");
            } else {
                console.log(`💥 Unexpected error sending Discord webhook: ${error.message}`);
            }
            return false;
        }
    }
}

module.exports = GardenStockNotifier;
