// lib/config.js
// Configuration settings for the Garden Stock Notifier

// API Endpoints
const SCRAPER_API_URL = "https://web.scraper.workers.dev/?url=https%3A%2F%2Fvulcanvalues.com%2Fgrow-a-garden%2Fstock&selector=span&scrape=text&pretty=true";
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || "YOUR_FALLBACK_DISCORD_WEBHOOK_URL_HERE"; // IMPORTANT: Use Environment Variable

// Item Categories
const SEEDS = [
    "Carrot", "Strawberry", "Blueberry", "Orange Tulip", "Tomato", "Bamboo",
    "Watermelon", "Apple", "Pepper", "Mango", "Daffodil", "Pumpkin", "Corn",
    "Coconut", "Cactus", "Cacao", "Dragon Fruit", "Grape", "Mushroom", "Beanstalk"
];

const EGGS = [
    "Common Egg", "Rare Egg", "Uncommon Egg", "Legendary Egg", "Bug Egg", "Mythical Egg"
];

const GEAR = [
    "Watering Can", "Trowel", "Favorite Tool", "Basic Sprinkler", "Godly Sprinkler",
    "Advanced Sprinkler", "Master Sprinkler", "Lightning Rod", "Recall Wrench"
];

// Emoji mappings
const SEED_EMOJIS = {
    "Carrot": "🥕", "Strawberry": "🍓", "Blueberry": "🫐", "Orange Tulip": "🌷",
    "Tomato": "🍅", "Bamboo": "🎋", "Watermelon": "🍉", "Apple": "🍎",
    "Pepper": "🌶️", "Mango": "🥭", "Daffodil": "🌼", "Pumpkin": "🎃",
    "Corn": "🌽", "Coconut": "🥥", "Cactus": "🌵", "Cacao": "🫘",
    "Dragon Fruit": "🐉", "Grape": "🍇", "Mushroom": "🍄", "Beanstalk": "🌱"
};

const EGG_EMOJIS = {
    "Common Egg": "🥚", "Rare Egg": "🥚", "Uncommon Egg": "🥚",
    "Legendary Egg": "🥚", "Bug Egg": "🥚", "Mythical Egg": "🥚"
};

const GEAR_EMOJIS = {
    "Watering Can": "🚿", "Trowel": "🛠️", "Favorite Tool": "❤️",
    "Basic Sprinkler": "💦", "Godly Sprinkler": "✨", "Advanced Sprinkler": "🌊",
    "Master Sprinkler": "💎", "Lightning Rod": "⚡", "Recall Wrench": "🔧"
};

// Discord embed color (green)
const EMBED_COLOR = 0x00FF00;

// Request timeout settings
const REQUEST_TIMEOUT = 30000; // milliseconds (30 seconds)

// Rare items that should trigger ping notifications
const RARE_ITEMS = [
    "Beanstalk", "Mushroom", "Dragon Fruit", "Cacao", "Cactus", "Coconut",
    "Mango", "Pepper", "Bamboo", "Mythical Egg", "Bug Egg", "Legendary Egg",
    "Lightning Rod", "Master Sprinkler", "Godly Sprinkler"
];

// Discord Role IDs to ping for rare items
// IMPORTANT: Format as required by Discord, e.g., ["<@&ROLE_ID_1>", "<@&ROLE_ID_2>"]
// Consider making this an environment variable if it changes often or is sensitive.
const DISCORD_ROLE_IDS_TO_PING_STRING = process.env.DISCORD_ROLE_IDS_TO_PING || ""; // e.g., "<@&ID1> <@&ID2>"
const DISCORD_ROLE_IDS_TO_PING = DISCORD_ROLE_IDS_TO_PING_STRING ? DISCORD_ROLE_IDS_TO_PING_STRING.split(' ') : [];


module.exports = {
    SCRAPER_API_URL,
    DISCORD_WEBHOOK_URL,
    SEEDS,
    EGGS,
    GEAR,
    SEED_EMOJIS,
    EGG_EMOJIS,
    GEAR_EMOJIS,
    EMBED_COLOR,
    REQUEST_TIMEOUT,
    RARE_ITEMS,
    DISCORD_ROLE_IDS_TO_PING
};
