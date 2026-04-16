import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const productAssetsRoot = path.join(__dirname, "..", "Assests", "products");

const productCategories = [
  {
    name: "Mobiles",
    folder: "mobiles",
    description:
      "Balanced performance, dependable cameras, and long battery life for everyday use.",
    basePrice: 19999
  },
  {
    name: "Laptops",
    folder: "laptops",
    description:
      "Portable systems tuned for work, study, streaming, and multitasking.",
    basePrice: 52999
  },
  {
    name: "Headphones",
    folder: "headphones",
    description:
      "Wireless listening with rich sound, noise reduction, and all-day comfort.",
    basePrice: 2499
  },
  {
    name: "Watches",
    folder: "watches",
    description:
      "Smart wearables and classic picks for fitness, alerts, and style.",
    basePrice: 1999
  },
  {
    name: "Shoes",
    folder: "shoes",
    description:
      "Comfort-first essentials built for daily movement, casual wear, and lifestyle styling.",
    basePrice: 1799
  },
  {
    name: "Fashion",
    folder: "fashion",
    description:
      "Modern wardrobe pieces with cleaner silhouettes and everyday-ready finishes.",
    basePrice: 999
  },
  {
    name: "Beauty",
    folder: "beauty",
    description:
      "Self-care essentials and premium daily-use products with polished presentation.",
    basePrice: 399
  },
  {
    name: "Home",
    folder: "home",
    description:
      "Useful daily picks for a polished setup, comfort, gifting, and versatile household browsing.",
    basePrice: 899
  }
];

const supportedProductImageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

const productNameFixes = {
  "Apple AirPods Pro (2nd Gen": "Apple AirPods Pro (2nd Gen)",
  "HP Envy x360HP Envy x360": "HP Envy x360"
};

const productDescriptionProfiles = {
  Mobiles: {
    openings: [
      "delivers a smooth everyday smartphone experience with a polished design and dependable battery life.",
      "is built for users who want fast performance, strong cameras, and reliable all-day usability.",
      "balances modern styling with practical speed, display clarity, and day-to-day comfort."
    ],
    features: [
      "It suits social media, photos, streaming, and gaming without feeling heavy in hand.",
      "The overall setup feels ideal for calls, content watching, quick multitasking, and travel use.",
      "It is a strong pick for users upgrading to a cleaner, more capable Android or iPhone experience."
    ]
  },
  Laptops: {
    openings: [
      "offers a reliable notebook setup for work, study, browsing, and entertainment.",
      "is designed for productive daily use with strong portability and a clean professional finish.",
      "brings the kind of laptop performance that works well for office tasks, meetings, and everyday creative work."
    ],
    features: [
      "It fits students, professionals, and home users who want smooth multitasking without unnecessary complexity.",
      "The combination of display size, keyboard comfort, and battery balance makes it easy to use for long sessions.",
      "It is a practical option for documents, classes, streaming, and light editing on the go."
    ]
  },
  Headphones: {
    openings: [
      "delivers a comfortable listening experience with clearer audio and everyday convenience.",
      "is tuned for music, calls, and travel with a strong balance of comfort and sound quality.",
      "brings a modern audio setup that feels easy to carry, connect, and enjoy throughout the day."
    ],
    features: [
      "It works well for commuting, calls, workout sessions, and long playlists without feeling tiring.",
      "The overall sound profile feels suitable for movies, focused work, and casual listening alike.",
      "It is a dependable choice for people who want better audio quality with simple everyday usability."
    ]
  },
  Watches: {
    openings: [
      "combines a smart wearable feel with stylish day-to-day usability.",
      "is designed to support fitness tracking, notifications, and a cleaner modern wrist presence.",
      "offers the right mix of smartwatch convenience and everyday style."
    ],
    features: [
      "It is well suited for activity tracking, quick alerts, and routine health-focused use.",
      "The look stays versatile enough for workouts, office use, and casual daily wear.",
      "It makes sense for users who want an easy wearable upgrade without losing comfort."
    ]
  },
  Shoes: {
    openings: [
      "is built for daily comfort with a style that works across casual and active settings.",
      "offers a dependable footwear option for walking, commuting, and everyday movement.",
      "brings a clean sporty look with comfort-focused support for regular wear."
    ],
    features: [
      "It works well for long days outside, casual outfits, and easy all-round use.",
      "The overall feel is suited for walking comfort, stable grip, and versatile styling.",
      "It is a practical pair for users who want comfort first without giving up a modern look."
    ]
  },
  Fashion: {
    openings: [
      "adds a polished wardrobe update with a modern retail-ready look.",
      "is styled for day-to-day wear with an easy balance of comfort and presentation.",
      "brings a cleaner fashion-forward touch to casual, work, or occasion dressing."
    ],
    features: [
      "It pairs well with simple everyday styling while still looking put together.",
      "The fit and finish make it a flexible piece for repeating across different looks.",
      "It is a strong option for shoppers who want wearable style without overcomplicating the outfit."
    ]
  },
  Beauty: {
    openings: [
      "supports a cleaner self-care routine with a premium everyday feel.",
      "is chosen for users who want beauty essentials that feel modern, effective, and easy to use.",
      "brings a polished personal-care option into the catalog with strong daily-use appeal."
    ],
    features: [
      "It fits well into a practical skincare, makeup, or haircare routine without feeling excessive.",
      "The product is positioned as an easy upgrade for users building a more complete beauty shelf.",
      "It works well for everyday use, gifting, and users looking for trusted personal-care picks."
    ]
  },
  Home: {
    openings: [
      "adds useful comfort and function to everyday home life with a cleaner product finish.",
      "is designed for practical household use while still feeling presentable and well chosen.",
      "brings a simple but effective improvement to daily home setup and convenience."
    ],
    features: [
      "It is a good fit for users who want reliable essentials that are easy to place and use.",
      "The overall value comes from making everyday spaces feel more organised, comfortable, or efficient.",
      "It works well as a household essential, upgrade item, or practical gifting option."
    ]
  }
};

const productPriceMap = {
  Mobiles: {
    "vivo V29 Pro": 39999,
    "iPhone SE": 49900,
    "Samsung Galaxy A54": 38999,
    "OnePlus Nord CE 4": 24999,
    "Redmi Note 13 Pro": 26999,
    "Realme 12 Pro+": 29999,
    "iQOO Neo 9 Pro": 37999,
    "Motorola Edge 50 Fusion": 22999,
    "OPPO Reno 11": 29999,
    "Samsung Galaxy S23 FE": 44999,
    "Nothing Phone (2a)": 23999,
    "OnePlus 12R": 39999,
    "Xiaomi 14 Civi": 42999,
    "POCO X6 Pro": 26999,
    "Google Pixel 7a": 43999,
    "vivo T3 5G": 19999,
    "Redmi 13 5G": 14999,
    "Realme Narzo 70 Pro": 18999,
    "Samsung Galaxy M35": 20999,
    "iPhone 13": 52900
  },
  Laptops: {
    "MacBook Air M2": 89900,
    "HP Pavilion 15": 62999,
    "Dell Inspiron 14": 57999,
    "Lenovo IdeaPad Slim 5": 64999,
    "ASUS VivoBook 15": 54999,
    "Acer Aspire 7": 56999,
    "HP Victus 15": 72999,
    "Dell XPS 13": 129999,
    "Lenovo LOQ 15": 78999,
    "ASUS TUF Gaming F15": 75999,
    "MSI Modern 14": 52999,
    "Acer Nitro V": 74999,
    "MacBook Pro 14": 149900,
    "Lenovo Yoga Slim 7": 82999,
    "Dell Latitude 5440": 94999,
    "HP Envy x360": 88999,
    "ASUS Zenbook 14": 84999,
    "Samsung Galaxy Book4": 69999,
    "MSI Cyborg 15": 79999,
    "Acer Swift Go 14": 76999
  },
  Headphones: {
    "Sony WH-1000XM5": 29990,
    "Apple AirPods Pro (2nd Gen)": 24900,
    "JBL Tune 770NC": 6999,
    "boAt Nirvana 751 ANC": 3999,
    "Realme Buds Air 5 Pro": 4999,
    "OnePlus Buds 3": 5499,
    "Samsung Galaxy Buds FE": 6999,
    "Sony WF-C700N": 8990,
    "JBL Wave Beam": 2999,
    "boAt Airdopes 141": 1299,
    "Noise Buds X Prime": 1499,
    "Nothing Ear (a)": 7999,
    "Apple AirPods (3rd Gen)": 18900,
    "Skullcandy Hesh ANC": 8499,
    "Bose QuietComfort Ultra": 34900,
    "Sennheiser Accentum": 10990,
    "Oppo Enco Air 3 Pro": 4999,
    "Redmi Buds 5": 2999,
    "Anker Soundcore Life Q30": 7999,
    "Marshall Major IV": 11999
  },
  Watches: {
    "Apple Watch SE": 29900,
    "Apple Watch Series 9": 41900,
    "Samsung Galaxy Watch6": 22999,
    "OnePlus Watch 2": 24999,
    "Noise ColorFit Pro 5": 3999,
    "Fire-Boltt Ninja Call Pro": 1499,
    "boAt Wave Elevate": 1999,
    "Amazfit GTR 4": 16999,
    "Fastrack Revoltt FS1": 1995,
    "Titan Smart 3": 4995,
    "Garmin Forerunner 165": 28990,
    "Huawei Watch GT 4": 16999,
    "NoiseFit Halo": 3499,
    "Pebble Cosmos Luxe": 2499,
    "Fire-Boltt Phoenix Ultra": 1799,
    "Amazfit Bip 5": 7499,
    "Samsung Galaxy Watch4": 9999,
    "Apple Watch Ultra 2": 89900,
    "Realme Watch 3 Pro": 4999,
    "Titan Neo Splash": 3995
  },
  Shoes: {
    "Nike Air Max Alpha Trainer": 7495,
    "Adidas Ultraboost Light": 15999,
    "Puma Velocity Nitro": 8999,
    "Skechers Go Walk 6": 6999,
    "Reebok Floatride Energy": 5999,
    "ASICS Gel-Contend 8": 4999,
    "New Balance 574": 8999,
    "Converse Chuck Taylor All Star": 4299,
    "Vans Old Skool": 5999,
    "Crocs Classic Clog": 3495,
    "Nike Revolution 7": 3695,
    "Adidas Grand Court 2.0": 4999,
    "Puma Smashic": 3299,
    "Skechers Arch Fit": 7999,
    "Woodland Leather Boots": 3995,
    "Red Tape Sports Sneakers": 1899,
    "Bata Power Running Shoes": 1599,
    "Campus Oxyfit": 1399,
    "Liberty Gliders": 1299,
    "Sparx Running Shoes": 1199
  },
  Fashion: {
    "Levi's 511 Slim Jeans": 2799,
    "H&M Regular Fit T-Shirt": 799,
    "Allen Solly Polo T-Shirt": 1299,
    "Van Heusen Formal Shirt": 1899,
    "W for Woman Printed Kurta": 1999,
    "Biba Anarkali Kurta Set": 3499,
    "ZARA Solid Blazer": 5590,
    "U.S. Polo Assn. Casual Shirt": 2299,
    "Jack & Jones Slim Fit Jeans": 2999,
    "ONLY Ribbed Top": 1499,
    "Forever New Midi Dress": 4299,
    "Roadster Denim Jacket": 2199,
    "MAX Cotton Hoodie": 1299,
    "Fabindia Kurta Set": 2990,
    "Peter England Trousers": 1799,
    "Pantaloons Ethnic Dress": 2499,
    "Mango Satin Shirt": 3290,
    "Vero Moda Skater Dress": 2799,
    "Louis Philippe Formal Shirt": 2499,
    "Marks & Spencer Chinos": 2999
  },
  Beauty: {
    "Lakme 9to5 Primer + Matte Lipstick": 599,
    "Maybelline Fit Me Foundation": 649,
    "L'Oreal Paris Hyaluron Moisture Serum": 699,
    "Mamaearth Ubtan Face Wash": 299,
    "Cetaphil Gentle Skin Cleanser": 649,
    "Plum Green Tea Night Gel": 575,
    "Dot & Key Sunscreen SPF 50": 445,
    "Minimalist 10% Vitamin C Serum": 699,
    "The Derma Co 1% Hyaluronic Sunscreen": 499,
    "Nivea Soft Light Moisturizer": 185,
    "Dove Intense Repair Shampoo": 349,
    "Tresemme Keratin Smooth Conditioner": 399,
    "Garnier Micellar Cleansing Water": 249,
    "M.A.C Studio Fix Powder Foundation": 3900,
    "Biotique Bio Cucumber Toner": 210,
    "Neutrogena Hydro Boost Gel": 950,
    "Nykaa Wanderlust Body Lotion": 350,
    "Aqualogica Glow+ Dewy Sunscreen": 449,
    "Himalaya Neem Face Pack": 170,
    "BBlunt Hot Shot Hair Spray": 595
  },
  Home: {
    "Philips LED Smart Bulb": 799,
    "Prestige Electric Kettle": 1499,
    "Havells Dry Iron": 1199,
    "Usha Mist Air Icy Fan": 2499,
    "Wakefit Memory Foam Pillow": 899,
    "Sleepyhead Bedsheet Set": 1299,
    "Home Centre Table Lamp": 1599,
    "IKEA Storage Basket": 499,
    "Milton Thermosteel Bottle": 799,
    "Cello Plastic Drawer Unit": 1899,
    "Dyson V8 Vacuum Cleaner": 29900,
    "Kent Gold Water Purifier": 1699,
    "Amazon Basics Foldable Study Table": 2399,
    "Solimo Laundry Basket": 699,
    "Urban Ladder Wall Shelf": 1499,
    "Borosil Glass Storage Jar Set": 999,
    "Atomberg Renesa Ceiling Fan": 3899,
    "Syska LED Desk Lamp": 1199,
    "Nilkamal Plastic Cabinet": 3499,
    "Eureka Forbes Wet & Dry Vacuum": 8999
  }
};

function isProductImageAsset(fileName) {
  return supportedProductImageExtensions.has(path.extname(fileName).toLowerCase());
}

function normaliseProductName(fileName) {
  const baseName = path.parse(fileName).name.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return productNameFixes[baseName] || baseName;
}

function readProductAssets(folderName) {
  const absoluteFolder = path.join(productAssetsRoot, folderName);
  if (!fs.existsSync(absoluteFolder)) {
    return [];
  }

  return fs
    .readdirSync(absoluteFolder)
    .filter(isProductImageAsset)
    .sort((left, right) => normaliseProductName(left).localeCompare(normaliseProductName(right)))
    .map((fileName) => ({
      name: normaliseProductName(fileName),
      image_url: ["Assests", "products", folderName, fileName].map(encodeURIComponent).join("/")
    }));
}

function buildProductDescription(category, productName, itemIndex) {
  const profile = productDescriptionProfiles[category.name];
  if (!profile) {
    return `${productName} is a curated ${category.name.toLowerCase()} pick selected for a cleaner catalog experience.`;
  }

  const opening = profile.openings[itemIndex % profile.openings.length];
  const feature = profile.features[itemIndex % profile.features.length];
  return `${productName} ${opening} ${feature}`;
}

const hotelCatalog = [
  {
    name: "A2B Signature",
    deliveryTime: "24 mins",
    cuisine: "South Indian Classics",
    items: [
      ["Mini Tiffin", 180, "South Indian breakfast platter with pongal, mini idli, and vada."],
      ["Ghee Roast Dosa", 155, "Golden dosa with ghee finish and coconut chutney."],
      ["Masala Dosa", 145, "Crisp dosa folded over a seasoned potato masala."],
      ["Rava Onion Dosa", 150, "Lacy semolina dosa finished with caramelised onion."],
      ["Idli Plate", 95, "Soft idlis served with sambar and two chutneys."],
      ["Mini Idli Sambar", 110, "Bite-sized idlis soaked in hot sambar."],
      ["Pongal Vada Combo", 135, "Pepper pongal paired with a crisp medu vada."],
      ["Poori Masala", 130, "Fluffy pooris with turmeric potato curry."],
      ["Curd Rice", 120, "Cooling curd rice with tempering and pickle."],
      ["Tomato Rice", 128, "Spiced rice finished with roasted peanuts."],
      ["Lemon Rice", 118, "Bright citrus rice with curry leaves tempering."],
      ["Veg Meals", 220, "Full lunch with rice, sambar, poriyal, kootu, and dessert."],
      ["Sambar Rice", 132, "Comfort rice simmered with vegetables and lentils."],
      ["Bisibelabath", 145, "Rich Karnataka-style lentil rice with vegetables."],
      ["Paneer Butter Masala", 220, "Creamy tomato curry with paneer cubes."],
      ["Butter Naan", 60, "Soft naan brushed with melted butter."],
      ["Chapati Kurma", 135, "Light chapatis with vegetable kurma."],
      ["Filter Coffee", 45, "Traditional strong filter coffee."],
      ["Badam Milk", 70, "Warm almond milk with saffron notes."],
      ["Gulab Jamun", 85, "Soft milk dumplings in warm syrup."]
    ]
  },
  {
    name: "Chettinad Grill House",
    deliveryTime: "32 mins",
    cuisine: "Spice-led Grill & Curry",
    items: [
      ["Chicken Biryani", 265, "Aromatic basmati biryani layered with spiced chicken."],
      ["Mutton Biryani", 330, "Slow-cooked biryani with tender mutton pieces."],
      ["Chicken 65", 210, "Crisp fried chicken tossed in house masala."],
      ["Pepper Chicken", 225, "Wok-tossed chicken with black pepper and curry leaves."],
      ["Grill Chicken Half", 290, "Char-grilled chicken with smoky spice rub."],
      ["Parotta", 28, "Soft layered parotta served hot."],
      ["Kothu Parotta", 185, "Minced parotta stir-fried with masala and egg."],
      ["Egg Kothu Parotta", 195, "Street-style chopped parotta with egg."],
      ["Mutton Chukka", 295, "Dry-style mutton roast with robust spice finish."],
      ["Fish Fry", 250, "Shallow-fried fish fillet in coastal masala."],
      ["Prawn Masala", 310, "Prawns simmered in thick onion-tomato masala."],
      ["Plain Naan", 55, "Fresh tandoor naan."],
      ["Butter Chicken", 245, "Creamy mildly spiced chicken curry."],
      ["Chicken Curry", 220, "Home-style gravy with juicy chicken pieces."],
      ["Mutton Curry", 280, "Deeply spiced curry with slow-cooked mutton."],
      ["Jeera Rice", 145, "Fragrant cumin rice."],
      ["Veg Fried Rice", 170, "Wok-fried rice with vegetables and aromatics."],
      ["Chicken Fried Rice", 210, "Fried rice with chicken, egg, and sauces."],
      ["Lime Juice", 55, "Fresh sweet-salt lime cooler."],
      ["Elaneer Payasam", 95, "Tender coconut dessert with milk and nuts."]
    ]
  },
  {
    name: "Urban Slice Pizza",
    deliveryTime: "29 mins",
    cuisine: "Pizza, Pasta & Sides",
    items: [
      ["Margherita Pizza", 199, "Classic mozzarella pizza with basil finish."],
      ["Farmhouse Pizza", 265, "Loaded pizza with bell peppers, onion, and mushroom."],
      ["Paneer Tikka Pizza", 279, "Indian-spiced paneer pizza with capsicum."],
      ["Pepperoni Pizza", 315, "Pepperoni pizza with melted cheese pull."],
      ["Chicken Supreme Pizza", 329, "Chicken-topped pizza with house seasoning."],
      ["White Sauce Pasta", 225, "Creamy penne pasta with herbs and cheese."],
      ["Red Sauce Pasta", 210, "Tomato basil pasta with garlic notes."],
      ["Lasagna", 260, "Layered baked pasta with rich sauce."],
      ["Garlic Breadsticks", 125, "Buttery baked sticks with garlic seasoning."],
      ["Cheese Garlic Bread", 155, "Garlic bread topped with cheese."],
      ["Stuffed Veg Pocket", 140, "Baked pocket with vegetable stuffing."],
      ["Stuffed Chicken Pocket", 165, "Flaky pocket filled with chicken and cheese."],
      ["Loaded Fries", 150, "Crisp fries topped with sauce and seasoning."],
      ["Peri Peri Fries", 135, "Fries dusted with spicy peri peri."],
      ["Veg Burger", 165, "Soft bun with patty, lettuce, and sauce."],
      ["Chicken Burger", 190, "Chicken burger with crunchy coating."],
      ["Choco Lava Cake", 110, "Warm cake with molten chocolate centre."],
      ["Tiramisu Cup", 135, "Coffee dessert layered with cream."],
      ["Cold Coffee", 95, "Chilled coffee with creamy finish."],
      ["Brownie Shake", 145, "Chocolate brownie blended into a thick shake."]
    ]
  },
  {
    name: "Burger Yard",
    deliveryTime: "21 mins",
    cuisine: "Burgers & Fast Bites",
    items: [
      ["Classic Veg Burger", 135, "Vegetable patty burger with creamy sauce."],
      ["Crispy Chicken Burger", 175, "Crunchy chicken burger with lettuce."],
      ["Double Patty Burger", 230, "Loaded burger with double patties and cheese."],
      ["Paneer Crunch Burger", 165, "Spiced paneer fillet burger with slaw."],
      ["BBQ Chicken Burger", 195, "Smoky barbecue chicken burger."],
      ["Loaded Chicken Wrap", 185, "Soft wrap filled with chicken and sauces."],
      ["Veg Mexican Wrap", 165, "Veg wrap with beans, salsa, and cheese."],
      ["Classic Fries", 110, "Golden salted fries."],
      ["Cheese Fries", 145, "Fries topped with cheese sauce."],
      ["Spicy Wings", 215, "Hot and sticky chicken wings."],
      ["Chicken Nuggets", 170, "Bite-sized chicken nuggets with dip."],
      ["Onion Rings", 120, "Crisp battered onion rings."],
      ["Peri Peri Paneer Pops", 160, "Spicy paneer bites with seasoning."],
      ["Mojito Lime", 95, "Mint lime cooler."],
      ["Watermelon Blast", 90, "Fresh watermelon juice."],
      ["Chocolate Shake", 130, "Rich chocolate milkshake."],
      ["Strawberry Shake", 125, "Creamy strawberry shake."],
      ["Cheesecake Jar", 140, "Jar dessert with cream cheese layers."],
      ["Brownie Fudge", 150, "Dense brownie topped with fudge."],
      ["Combo Meal", 299, "Burger, fries, and drink bundle."]
    ]
  },
  {
    name: "Coastal Bowl",
    deliveryTime: "34 mins",
    cuisine: "Seafood & Rice Bowls",
    items: [
      ["Prawn Biryani", 315, "Fragrant biryani with masala-coated prawns."],
      ["Fish Curry Meal", 265, "Rice, fish curry, and sides."],
      ["Crab Masala", 340, "Spicy crab masala with coastal aromatics."],
      ["Fish Finger Basket", 220, "Crumb-fried fish fingers with dip."],
      ["Lemon Fish Rice", 245, "Tangy fish rice bowl with herbs."],
      ["Prawn Fried Rice", 255, "Wok-tossed rice with prawns and vegetables."],
      ["Calamari Fry", 240, "Crispy calamari with spice dust."],
      ["Fish Tikka", 260, "Tandoor fish pieces with charred finish."],
      ["Neer Dosa Combo", 195, "Soft neer dosas with chicken curry."],
      ["Appam & Stew", 210, "Soft appams with coconut stew."],
      ["Malabar Parotta", 30, "Layered Kerala-style parotta."],
      ["Chicken Roast", 230, "Dry roasted chicken with curry leaves."],
      ["Egg Roast", 145, "Egg curry with caramelised onion masala."],
      ["Veg Kurma", 150, "Coconut-rich vegetable kurma."],
      ["Tender Coconut Water", 70, "Fresh coconut water."],
      ["Mango Cooler", 90, "Chilled mango drink."],
      ["Elaneer Pudding", 110, "Tender coconut pudding dessert."],
      ["Kesari", 75, "Classic semolina sweet."],
      ["Fried Nethili", 180, "Crispy anchovy fry."],
      ["Seafood Platter", 399, "Mixed fish, prawn, and calamari sampler."]
    ]
  }
];

const foodAssets = {
  mains: [
    "Assests/Foods/food01.jpg",
    "Assests/Foods/food02.webp",
    "Assests/Foods/food03.webp",
    "Assests/Foods/food04.avif",
    "Assests/Foods/food05.webp",
    "Assests/Foods/food06.jpg",
    "Assests/Foods/food07.jpg",
    "Assests/Foods/food08.jpg",
    "Assests/Foods/food09.webp",
    "Assests/Foods/food10.jpeg"
  ],
  chinese: [
    "Assests/Foods/chinese01.jpg",
    "Assests/Foods/chinese02.jpg",
    "Assests/Foods/chinese03.jpg",
    "Assests/Foods/chinese04.jpg",
    "Assests/Foods/chinese05.jpg",
    "Assests/Foods/chinese06.jpg",
    "Assests/Foods/chinese07.jpg",
    "Assests/Foods/chinese08.jpg",
    "Assests/Foods/chinese09.jpg",
    "Assests/Foods/chinese10.jpg"
  ],
  drinks: [
    "Assests/Foods/drinks01.avif",
    "Assests/Foods/drinks02.png",
    "Assests/Foods/drinks04.jpg",
    "Assests/Foods/drinks05.jpg",
    "Assests/Foods/drinks06.jpg",
    "Assests/Foods/drinks07.avif",
    "Assests/Foods/drinks08.png",
    "Assests/Foods/drinks09.png",
    "Assests/Foods/drinks10.png"
  ],
  desserts: [
    "Assests/Foods/icecream01.jpg",
    "Assests/Foods/icecream02.jpg",
    "Assests/Foods/icecream03.jpg",
    "Assests/Foods/icecream04.jpg",
    "Assests/Foods/icecream05.avif",
    "Assests/Foods/icecream06.webp",
    "Assests/Foods/icecream07.png",
    "Assests/Foods/icecream08.png"
  ]
};

const hotelFoodImageMap = {
  "A2B Signature": {
    "Mini Tiffin": "Assests/Foods/A2B Signature/minitiffin.jpg",
    "Ghee Roast Dosa": "Assests/Foods/A2B Signature/ghee roast.jpg",
    "Masala Dosa": "Assests/Foods/A2B Signature/masala dosa.jpg",
    "Rava Onion Dosa": "Assests/Foods/A2B Signature/onion rava dosa.jpg",
    "Idli Plate": "Assests/Foods/A2B Signature/idli plate.webp",
    "Mini Idli Sambar": "Assests/Foods/A2B Signature/mini idli sambar.jpg",
    "Pongal Vada Combo": "Assests/Foods/A2B Signature/pongal vada.avif",
    "Poori Masala": "Assests/Foods/A2B Signature/poorimasala.jpg",
    "Curd Rice": "Assests/Foods/A2B Signature/curd rice.jpg",
    "Tomato Rice": "Assests/Foods/A2B Signature/tomoto rice.jpg",
    "Lemon Rice": "Assests/Foods/A2B Signature/lemon rice.jpg",
    "Veg Meals": "Assests/Foods/A2B Signature/veg meals.avif",
    "Sambar Rice": "Assests/Foods/A2B Signature/sambar rice.jpg",
    "Bisibelabath": "Assests/Foods/A2B Signature/bisbellabth.jpg",
    "Paneer Butter Masala": "Assests/Foods/A2B Signature/Paneer Butter Masala.jpg",
    "Butter Naan": "Assests/Foods/A2B Signature/Butter Naan.jpg",
    "Chapati Kurma": "Assests/Foods/A2B Signature/Chapati Kurma.jpg",
    "Filter Coffee": "Assests/Foods/A2B Signature/Filter Coffee.avif",
    "Badam Milk": "Assests/Foods/A2B Signature/Badam Milk.webp",
    "Gulab Jamun": "Assests/Foods/A2B Signature/Gulab Jamun.jpg"
  },
  "Chettinad Grill House": {
    "Chicken Biryani": "Assests/Foods/Chettinad Grill House/Chicken Biryani.jpg",
    "Mutton Biryani": "Assests/Foods/Chettinad Grill House/Mutton Biryani.jpg",
    "Chicken 65": "Assests/Foods/Chettinad Grill House/Chicken 65.jpg",
    "Pepper Chicken": "Assests/Foods/Chettinad Grill House/Pepper Chicken.jpg",
    "Grill Chicken Half": "Assests/Foods/Chettinad Grill House/Grill Chicken Half.webp",
    "Parotta": "Assests/Foods/Chettinad Grill House/Parotta.jpg",
    "Kothu Parotta": "Assests/Foods/Chettinad Grill House/Kothu Parotta.jpg",
    "Egg Kothu Parotta": "Assests/Foods/Chettinad Grill House/Egg Kothu Parotta.jpg",
    "Mutton Chukka": "Assests/Foods/Chettinad Grill House/Mutton Chukka.avif",
    "Fish Fry": "Assests/Foods/Chettinad Grill House/Fish Fry.jpg",
    "Prawn Masala": "Assests/Foods/Chettinad Grill House/Prawn Masala.avif",
    "Plain Naan": "Assests/Foods/Chettinad Grill House/plain naan.png",
    "Butter Chicken": "Assests/Foods/Chettinad Grill House/Butter Chicken.jpg",
    "Chicken Curry": "Assests/Foods/Chettinad Grill House/Chicken Curry.jpg",
    "Mutton Curry": "Assests/Foods/Chettinad Grill House/Mutton.jpg",
    "Jeera Rice": "Assests/Foods/Chettinad Grill House/Jeera Rice.jpg",
    "Veg Fried Rice": "Assests/Foods/Chettinad Grill House/Veg Fried Rice.jpg",
    "Chicken Fried Rice": "Assests/Foods/Chettinad Grill House/Chicken Fried Rice.jpg",
    "Lime Juice": "Assests/Foods/Chettinad Grill House/Lime Juice.jpg",
    "Elaneer Payasam": "Assests/Foods/Chettinad Grill House/Elaneer Payasam.webp"
  },
  "Urban Slice Pizza": {
    "Margherita Pizza": "Assests/Foods/Urban Slice Pizza/Margherita Pizza.jpg",
    "Farmhouse Pizza": "Assests/Foods/Urban Slice Pizza/Farmhouse Pizza.jpg",
    "Paneer Tikka Pizza": "Assests/Foods/Urban Slice Pizza/Paneer Tikka Pizza.jpeg",
    "Pepperoni Pizza": "Assests/Foods/Urban Slice Pizza/Pepperoni pizza.avif",
    "Chicken Supreme Pizza": "Assests/Foods/Urban Slice Pizza/Chicken Supreme Pizza.jpg",
    "White Sauce Pasta": "Assests/Foods/Urban Slice Pizza/White Sauce Pasta.jpg",
    "Red Sauce Pasta": "Assests/Foods/Urban Slice Pizza/Red Sauce Pasta.webp",
    "Lasagna": "Assests/Foods/Urban Slice Pizza/Lasagna.jpg",
    "Garlic Breadsticks": "Assests/Foods/Urban Slice Pizza/Garlic Breadsticks.jpg",
    "Cheese Garlic Bread": "Assests/Foods/Urban Slice Pizza/Cheese Garlic Bread.jpg",
    "Stuffed Veg Pocket": "Assests/Foods/Urban Slice Pizza/Stuffed Veg Pocket.jpg",
    "Stuffed Chicken Pocket": "Assests/Foods/Urban Slice Pizza/Stuffed Chicken Pocket.webp",
    "Loaded Fries": "Assests/Foods/Urban Slice Pizza/Loaded Fries.avif",
    "Peri Peri Fries": "Assests/Foods/Urban Slice Pizza/Peri Peri Fries.jpg",
    "Veg Burger": "Assests/Foods/Urban Slice Pizza/Veg Burger.avif",
    "Chicken Burger": "Assests/Foods/Urban Slice Pizza/Chicken Burger.webp",
    "Choco Lava Cake": "Assests/Foods/Urban Slice Pizza/Choco Lava Cake.jpeg",
    "Tiramisu Cup": "Assests/Foods/Urban Slice Pizza/Tiramisu Cup.webp",
    "Cold Coffee": "Assests/Foods/Urban Slice Pizza/Cold Coffee.jpeg",
    "Brownie Shake": "Assests/Foods/Urban Slice Pizza/Brownie Shake.avif"
  },
  "Burger Yard": {
    "Classic Veg Burger": "Assests/Foods/Burger Yard/Classic Veg Burger.png",
    "Crispy Chicken Burger": "Assests/Foods/Burger Yard/Crispy Chicken Burger.jpg",
    "Double Patty Burger": "Assests/Foods/Burger Yard/Double Patty Burger.jpg",
    "Paneer Crunch Burger": "Assests/Foods/Burger Yard/Paneer Crunch Burger.jpg",
    "BBQ Chicken Burger": "Assests/Foods/Burger Yard/BBQ Chicken Burger.jpg",
    "Loaded Chicken Wrap": "Assests/Foods/Burger Yard/Loaded Chicken Wrap.jpg",
    "Veg Mexican Wrap": "Assests/Foods/Burger Yard/Veg Mexican Wrap.jpg",
    "Classic Fries": "Assests/Foods/Burger Yard/Classic Fries.jpg",
    "Cheese Fries": "Assests/Foods/Burger Yard/Cheese Fries.jpg",
    "Spicy Wings": "Assests/Foods/Burger Yard/Spicy Wings.jpg",
    "Chicken Nuggets": "Assests/Foods/Burger Yard/Chicken Nuggets.jpg",
    "Onion Rings": "Assests/Foods/Burger Yard/Onion Rings.avif",
    "Peri Peri Paneer Pops": "Assests/Foods/Burger Yard/Peri Peri Paneer Pops.jpeg",
    "Mojito Lime": "Assests/Foods/Burger Yard/Mojito Lime.jpg",
    "Watermelon Blast": "Assests/Foods/Burger Yard/Watermelon Blast.jpg",
    "Chocolate Shake": "Assests/Foods/Burger Yard/Chocolate Shake.webp",
    "Strawberry Shake": "Assests/Foods/Burger Yard/Strawberry Shake.avif",
    "Cheesecake Jar": "Assests/Foods/Burger Yard/Cheesecake Jar.webp",
    "Brownie Fudge": "Assests/Foods/Burger Yard/Brownie Fudge.jpg",
    "Combo Meal": "Assests/Foods/Burger Yard/Combo Meal.jpg"
  },
  "Coastal Bowl": {
    "Prawn Biryani": "Assests/Foods/Coastal Bowl/Prawn Biryani.jpg",
    "Fish Curry Meal": "Assests/Foods/Coastal Bowl/Fish Curry Meal.jpg",
    "Crab Masala": "Assests/Foods/Coastal Bowl/Crab Masala.jpg",
    "Fish Finger Basket": "Assests/Foods/Coastal Bowl/Fish Finger Basket.jpg",
    "Lemon Fish Rice": "Assests/Foods/Coastal Bowl/Lemon Fish Rice.jpg",
    "Prawn Fried Rice": "Assests/Foods/Coastal Bowl/Prawn Fried Rice.webp",
    "Calamari Fry": "Assests/Foods/Coastal Bowl/Calamari Fry.jpg",
    "Fish Tikka": "Assests/Foods/Coastal Bowl/Fish Tikka.webp",
    "Neer Dosa Combo": "Assests/Foods/Coastal Bowl/Neer Dosa Combo.jpg",
    "Appam & Stew": "Assests/Foods/Coastal Bowl/Appam & Stew.jpg",
    "Malabar Parotta": "Assests/Foods/Coastal Bowl/Malabar Parotta.jpg",
    "Chicken Roast": "Assests/Foods/Coastal Bowl/Chicken Roast.jpg",
    "Egg Roast": "Assests/Foods/Coastal Bowl/Egg Roast.jpg",
    "Veg Kurma": "Assests/Foods/Coastal Bowl/Veg Kurma.jpg",
    "Tender Coconut Water": "Assests/Foods/Coastal Bowl/Tender Coconut Water.jpg",
    "Mango Cooler": "Assests/Foods/Coastal Bowl/Mango Cooler.jpg",
    "Elaneer Pudding": "Assests/Foods/Coastal Bowl/Elaneer Pudding.jpg",
    "Kesari": "Assests/Foods/Coastal Bowl/Kesari.webp",
    "Fried Nethili": "Assests/Foods/Coastal Bowl/Fried Nethili.jpg",
    "Seafood Platter": "Assests/Foods/Coastal Bowl/Seafood Platter.webp"
  }
};

function pickFromPool(pool, seed) {
  return pool[seed % pool.length];
}

function selectFoodPool(itemName) {
  const value = String(itemName || "").toLowerCase();

  if (
    /(coffee|milk|juice|shake|mojito|cooler|water|payasam|drink)/.test(value)
  ) {
    return foodAssets.drinks;
  }

  if (
    /(ice|cake|tiramisu|cheesecake|brownie|pudding|jamun|dessert|kesari)/.test(value)
  ) {
    return foodAssets.desserts;
  }

  if (
    /(fried rice|noodles|manchurian|szechuan|chilli|wok|burger|wrap|fries|pizza|pasta)/.test(value)
  ) {
    return [...foodAssets.chinese, ...foodAssets.mains];
  }

  return [...foodAssets.mains, ...foodAssets.chinese];
}

function buildProducts() {
  return productCategories.flatMap((category, categoryIndex) => {
    const assets = readProductAssets(category.folder);
    return assets.map((product, itemIndex) => ({
      name: product.name,
      category: category.name,
      description: buildProductDescription(category, product.name, itemIndex),
      image_url: product.image_url,
      price:
        productPriceMap[category.name]?.[product.name] ??
        category.basePrice + itemIndex * Math.max(99, Math.round(category.basePrice * 0.025)),
      rating: 4 + ((categoryIndex + itemIndex) % 2)
    }));
  });
}

function buildFoodItems() {
  return hotelCatalog.flatMap((hotel, hotelIndex) =>
    hotel.items.map(([name, price, description], itemIndex) => {
      const pool = selectFoodPool(name);
      const exactImage = hotelFoodImageMap[hotel.name]?.[name];
      return {
        name,
        restaurant: hotel.name,
        delivery_time: hotel.deliveryTime,
        image_url: exactImage || pickFromPool(pool, hotelIndex * 20 + itemIndex),
        price,
        rating: 4 + ((hotelIndex + itemIndex) % 2),
        description,
        cuisine: hotel.cuisine
      };
    })
  );
}

export const curatedProducts = buildProducts();
export const curatedFoodItems = buildFoodItems();

