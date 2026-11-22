"""Конфигурация новостного модуля CakeBase."""

from __future__ import annotations

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
CACHE_DIR = BASE_DIR / ".cache"
CACHE_FILE = CACHE_DIR / "news_cache.json"

# Период, в течение которого ответ считается свежим (без повторного запроса к источникам).
CACHE_TTL_SECONDS = int(os.getenv("CAKEBASE_NEWS_TTL", "600"))
# Таймаут одного HTTP-запроса к RSS-источнику.
REQUEST_TIMEOUT_SECONDS = float(os.getenv("CAKEBASE_NEWS_TIMEOUT", "15"))
# Максимальное число новостей в ответе.
MAX_ITEMS = int(os.getenv("CAKEBASE_NEWS_LIMIT", "60"))
# Сколько дней назад ещё считаем материал актуальным.
MAX_AGE_DAYS = int(os.getenv("CAKEBASE_NEWS_MAX_AGE_DAYS", "540"))

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36 CakeBaseNews/1.0"
)

SOURCES = [
    {
        "id": "gastronom",
        "name": "Гастроном",
        "url": "https://www.gastronom.ru/rss",
        "homepage": "https://www.gastronom.ru",
        "language": "ru",
    },
    {
        "id": "povar",
        "name": "Повар.ру",
        "url": "https://povar.ru/rss/",
        "homepage": "https://povar.ru",
        "language": "ru",
    },
    {
        "id": "the-guardian-food",
        "name": "The Guardian · Food",
        "url": "https://www.theguardian.com/food/rss",
        "homepage": "https://www.theguardian.com/food",
        "language": "en",
    },
    {
        "id": "nyt-dining",
        "name": "The New York Times · Dining",
        "url": "https://rss.nytimes.com/services/xml/rss/nyt/DiningandWine.xml",
        "homepage": "https://www.nytimes.com/section/dining",
        "language": "en",
    },
    {
        "id": "bon-appetit",
        "name": "Bon Appétit",
        "url": "https://www.bonappetit.com/feed/rss",
        "homepage": "https://www.bonappetit.com",
        "language": "en",
    },
    {
        "id": "eater",
        "name": "Eater",
        "url": "https://www.eater.com/rss/index.xml",
        "homepage": "https://www.eater.com",
        "language": "en",
    },
    {
        "id": "bbc-goodfood",
        "name": "BBC Good Food",
        "url": "https://www.bbcgoodfood.com/feed",
        "homepage": "https://www.bbcgoodfood.com",
        "language": "en",
    },
]

# Сильные маркеры кондитерской тематики: материала достаточно, чтобы попасть в ленту.
CONFECTIONERY_KEYWORDS = [
    "торт", "торты", "десерт", "кондитер", "пирожн", "кекс", "печень", "бисквит",
    "шоколад", "какао", "карамел", "безе", "меренг", "чизкейк", "маффин",
    "капкейк", "пряник", "вафл", "мусс", "эклер", "тирамису", "павлова",
    "брауни", "конфитюр", "глазур", "пончик", "штрудел",
    "cake", "cakes", "dessert", "desserts", "pastry", "pastries", "confection",
    "chocolate", "cupcake", "muffin", "cookie", "frosting", "ganache",
    "cheesecake", "meringue", "caramel", "brownie", "torte", "doughnut",
    "donut", "eclair",
]

# Слабые маркеры (пирог, выпечка) пропускаются только при наличии сладкого контекста.
SOFT_KEYWORDS = ["пирог", "пирож", "рулет", "выпеч", "bake", "baking", "baker", "pie", "tart", "sweet treat"]

SWEET_CONTEXT_KEYWORDS = [
    "сладк", "сгущ", "сахар", "мёд", "мед", "джем", "повидл", "варень", "крем",
    "творог", "ягод", "брусник", "вишн", "малин", "клубник", "смородин", "яблок",
    "груш", "абрикос", "персик", "слив", "банан", "лимон", "апельсин", "фрукт",
    "шоколад", "какао", "ванил", "кориц", "орех", "миндал", "фисташ", "кокос",
    "sweet", "sugar", "chocolate", "berry", "berries", "fruit", "vanilla",
    "cinnamon", "caramel", "cream", "honey", "jam", "custard", "meringue",
]

# Слова, которые указывают на несладкое блюдо. Если они есть в заголовке,
# материал не считается кондитерской новостью.
SAVORY_KEYWORDS = [
    "суп", "салат", "пицц", "паста", "мяс", "куриц", "курин", "рыб", "овощ",
    "закуск", "гарнир", "соус", "бульон", "омлет", "яичниц", "тост", "сэндвич",
    "бургер", "паштет", "хумус", "фасол", "чечевиц", "картоф", "тортиль",
    "лаваш", "тако", "кесадиль", "начос", "плов", "гречк", "макароны", "рис",
    "котлет", "пельмен", "драник", "шашлык", "стейк", "рагу", "запеканк",
    "несладк", "закусочн", "картофел", "грибн", "frother", "calendar", "pickle",
    "protein powder",
    "soup", "salad", "pizza", "pasta", "chicken", "beef", "pork", "fish",
    "savoury", "savory", "garlic", "onion", "sandwich", "burger", "hummus",
    "lentil", "bean", "potato", "quiche", "frittata", "omelette", "steak",
    "roast", "curry", "ramen", "noodle", "rice", "tortilla", "taco", "nacho",
    "porridge", "oats", "breakfast", "yoghurt", "yogurt",
]
