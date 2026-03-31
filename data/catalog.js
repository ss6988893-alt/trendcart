const productCategories = [
  {
    name: "Mobiles",
    prefix: "Phone",
    description:
      "Balanced performance, dependable cameras, and long battery life for everyday use."
  },
  {
    name: "Laptops",
    prefix: "Laptop",
    description:
      "Portable systems tuned for work, study, streaming, and multitasking."
  },
  {
    name: "Headphones",
    prefix: "Audio",
    description:
      "Wireless listening with rich sound, noise reduction, and all-day comfort."
  },
  {
    name: "Watches",
    prefix: "Watch",
    description:
      "Smart wearables and classic picks for fitness, alerts, and style."
  },
  {
    name: "Shoes",
    prefix: "Runner",
    description:
      "Comfort-first essentials built for daily movement, casual wear, and lifestyle styling."
  },
  {
    name: "Fashion",
    prefix: "Style",
    description:
      "Modern wardrobe pieces with cleaner silhouettes and everyday-ready finishes."
  },
  {
    name: "Beauty",
    prefix: "Glow",
    description:
      "Lifestyle picks presented with a softer premium visual tone for self-care and style shoppers."
  },
  {
    name: "Home",
    prefix: "Home",
    description:
      "Useful daily picks for a polished setup, comfort, gifting, and versatile household browsing."
  },
  {
    name: "Kitchen",
    prefix: "Kitchen",
    description:
      "Practical everyday selections positioned for frequent-use spaces and daily convenience."
  },
  {
    name: "Gaming",
    prefix: "Game",
    description:
      "High-energy tech-forward picks suited for entertainment, performance, and immersive sessions."
  }
];

const productAdjectives = [
  "Prime",
  "Ultra",
  "Neo",
  "Edge",
  "Pulse",
  "Core",
  "Elite",
  "Nova",
  "Max",
  "Aura"
];

const productAssets = {
  mobiles: [
    "Assests/products/Product-mobile01.webp",
    "Assests/products/mobile02.avif",
    "Assests/products/mobile03.webp",
    "Assests/products/mobile04.webp",
    "Assests/products/mobile05.jpg",
    "Assests/products/mobile06.jpg",
    "Assests/products/mobile07.jpg",
    "Assests/products/mobile09.webp",
    "Assests/products/mobile10.webp"
  ],
  laptops: [
    "Assests/products/laptop01.jpg",
    "Assests/products/laptop02.jpg",
    "Assests/products/laptop03.webp",
    "Assests/products/laptop04.webp",
    "Assests/products/laptop05.webp",
    "Assests/products/laptop06.avif",
    "Assests/products/laptop07.avif"
  ],
  headphones: [
    "Assests/products/headphone01.webp",
    "Assests/products/headphone02.avif",
    "Assests/products/headphone03.avif",
    "Assests/products/headphone04.jpg",
    "Assests/products/headphone05.webp",
    "Assests/products/headphone06.webp",
    "Assests/products/headphone07.webp",
    "Assests/products/headphone08.webp",
    "Assests/products/headphone09.webp",
    "Assests/products/headphone10.webp"
  ],
  watches: [
    "Assests/products/watch01.webp",
    "Assests/products/watch02.webp",
    "Assests/products/watch04.jpg",
    "Assests/products/watch05.avif",
    "Assests/products/watch06.jpg",
    "Assests/products/watch07.webp",
    "Assests/products/watch08.avif",
    "Assests/products/watch09.jpg",
    "Assests/products/watch10.jpg"
  ],
  mens: [
    "Assests/products/men01.webp",
    "Assests/products/mens02.jpg",
    "Assests/products/mens03.jpg",
    "Assests/products/mens04.jpg",
    "Assests/products/mens05.jpg",
    "Assests/products/mens06.webp",
    "Assests/products/mens07.jpg",
    "Assests/products/mens08.jpg",
    "Assests/products/mens10.jpg"
  ],
  womens: [
    "Assests/products/couples ddress.jpg",
    "Assests/products/womens01.jpg",
    "Assests/products/womens02.jpg",
    "Assests/products/womens03.webp",
    "Assests/products/womens04.jpg",
    "Assests/products/womens05.jpg",
    "Assests/products/womens06.jpg",
    "Assests/products/womens07.webp",
    "Assests/products/womens08.webp",
    "Assests/products/womens09.jpg"
  ],
  kids: [
    "Assests/products/kids01.jpg",
    "Assests/products/kids02.jpg",
    "Assests/products/kids03.jpg",
    "Assests/products/kids04.jpg",
    "Assests/products/kids05.jpg",
    "Assests/products/kids06.jpg",
    "Assests/products/kids07.jpg",
    "Assests/products/kids08.webp",
    "Assests/products/kids09.webp",
    "Assests/products/kids10.webp"
  ]
};

const productImagePools = {
  Mobiles: productAssets.mobiles,
  Laptops: productAssets.laptops,
  Headphones: productAssets.headphones,
  Watches: productAssets.watches,
  Shoes: [...productAssets.kids, ...productAssets.mens],
  Fashion: [...productAssets.womens, ...productAssets.mens],
  Beauty: [...productAssets.womens, ...productAssets.kids],
  Home: [...productAssets.womens, ...productAssets.kids, ...productAssets.mens],
  Kitchen: [...productAssets.mens, ...productAssets.womens, ...productAssets.kids],
  Gaming: [...productAssets.headphones, ...productAssets.mobiles, ...productAssets.laptops]
};

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

function pickFromPool(pool, seed) {
  return pool[seed % pool.length];
}

function pickProductImage(categoryName, itemIndex) {
  const pool = productImagePools[categoryName] || productAssets.mobiles;
  return pickFromPool(pool, itemIndex);
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
  return productCategories.flatMap((category, categoryIndex) =>
    Array.from({ length: 30 }, (_, itemIndex) => {
      const number = itemIndex + 1;
      const adjective = productAdjectives[(categoryIndex + itemIndex) % productAdjectives.length];
      return {
        name: `${category.prefix} ${adjective} ${number}`,
        category: category.name,
        description: `${category.description} ${category.name} pick ${number} brings a polished finish with dependable quality for everyday shoppers.`,
        image_url: pickProductImage(category.name, categoryIndex * 30 + itemIndex),
        price: 899 + categoryIndex * 425 + itemIndex * 119,
        rating: 4 + ((categoryIndex + itemIndex) % 2)
      };
    })
  );
}

function buildFoodItems() {
  return hotelCatalog.flatMap((hotel, hotelIndex) =>
    hotel.items.map(([name, price, description], itemIndex) => {
      const pool = selectFoodPool(name);
      return {
        name,
        restaurant: hotel.name,
        delivery_time: hotel.deliveryTime,
        image_url: pickFromPool(pool, hotelIndex * 20 + itemIndex),
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
