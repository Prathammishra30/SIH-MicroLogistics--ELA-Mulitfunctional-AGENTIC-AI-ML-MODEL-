// Multilingual Entity Extraction Engine
// Parses crops, quantities, units, prices, locations, grades, vehicles, and dates across 7 Indian languages

export interface CanonicalEntities {
  product?: string;
  quantity?: number;
  unit?: string;
  formattedQuantity?: string;
  price?: number;
  targetPrice?: string;
  grade?: 'A' | 'B' | 'Premium' | 'Standard';
  pickupLocation?: string;
  destination?: string;
  vehicleType?: string;
  vehicleRegistration?: string;
  requiredBy?: string;
  harvestDate?: string;
  tripId?: string;
}

export class EntityExtractor {
  // Multilingual Crop Dictionary
  private static cropKeywords: Record<string, string> = {
    // English
    tomato: 'Tomatoes',
    tomatoes: 'Tomatoes',
    onion: 'Onions',
    onions: 'Onions',
    potato: 'Potatoes',
    potatoes: 'Potatoes',
    wheat: 'Wheat',
    rice: 'Rice',
    grape: 'Grapes',
    grapes: 'Grapes',
    cotton: 'Cotton',
    pomegranate: 'Pomegranate',
    cauliflower: 'Cauliflower',
    cabbage: 'Cabbage',
    // Hindi & Marathi
    टमाटर: 'Tomatoes',
    टोमॅटो: 'Tomatoes',
    कांदा: 'Onions',
    प्याज: 'Onions',
    बटाटा: 'Potatoes',
    आलू: 'Potatoes',
    गहू: 'Wheat',
    गेहूं: 'Wheat',
    गेहूँ: 'Wheat',
    गेहू: 'Wheat',
    तांदूळ: 'Rice',
    चावल: 'Rice',
    द्राक्षे: 'Grapes',
    अंगूर: 'Grapes',
    डाळिंब: 'Pomegranate',
    अनार: 'Pomegranate',
    // Tamil
    தக்காளி: 'Tomatoes',
    வெங்காயம்: 'Onions',
    உருளைக்கிழங்கு: 'Potatoes',
    கோதுமை: 'Wheat',
    அரிசி: 'Rice',
    திராட்சை: 'Grapes',
    // Telugu
    టమాటా: 'Tomatoes',
    ఉల్లిపాయ: 'Onions',
    బంగాళాదుంప: 'Potatoes',
    గోధుమలు: 'Wheat',
    బియ్యం: 'Rice',
    ద్రాక్ష: 'Grapes',
    // Bengali
    টমেটো: 'Tomatoes',
    পেঁয়াজ: 'Onions',
    আলু: 'Potatoes',
    গম: 'Wheat',
    চাল: 'Rice',
    আঙুর: 'Grapes',
    // Kannada
    ಟೊಮ್ಯಾಟೊ: 'Tomatoes',
    ಈರುಳ್ಳಿ: 'Onions',
    ಆಲೂಗಡ್ಡೆ: 'Potatoes',
    ಗೋಧಿ: 'Wheat',
    ಅಕ್ಕಿ: 'Rice',
    ದ್ರಾಕ್ಷಿ: 'Grapes',
  };

  // Location Normalizer
  private static locationKeywords: Record<string, string> = {
    pune: 'Pune APMC Mandi',
    mumbai: 'Navi Mumbai APMC Mandi',
    'navi mumbai': 'Navi Mumbai APMC Mandi',
    vashi: 'Navi Mumbai APMC Mandi',
    nashik: 'Nashik Krishi Mandi',
    nagpur: 'Nagpur APMC Mandi',
    kolhapur: 'Kolhapur Mandi',
    solapur: 'Solapur APMC',
    sangli: 'Sangli Mandi',
    satara: 'Satara Mandi',
    पुणे: 'Pune APMC Mandi',
    मुंबई: 'Navi Mumbai APMC Mandi',
    नासिक: 'Nashik Krishi Mandi',
    नागपूर: 'Nagpur APMC Mandi',
    कोल्हापूर: 'Kolhapur Mandi',
    புனே: 'Pune APMC Mandi',
    மும்பை: 'Navi Mumbai APMC Mandi',
    పూణే: 'Pune APMC Mandi',
    ముంబై: 'Navi Mumbai APMC Mandi',
    পুনে: 'Pune APMC Mandi',
    মুম্বাই: 'Navi Mumbai APMC Mandi',
    ಪುಣೆ: 'Pune APMC Mandi',
    ಮುಂಬೈ: 'Navi Mumbai APMC Mandi',
  };

  private static normalizeIndicNumerals(str: string): string {
    const indicDigits: Record<string, string> = {
      '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
      '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
      '౦': '0', '౧': '1', '౨': '2', '౩': '3', '౪': '4', '౫': '5', '౬': '6', '౭': '7', '౮': '8', '౯': '9',
      '೦': '0', '೧': '1', '೨': '2', '೩': '3', '೪': '4', '೫': '5', '೬': '6', '೭': '7', '೮': '8', '೯': '9',
      '௦': '0', '௧': '1', '௨': '2', '௩': '3', '௪': '4', '௫': '5', '௬': '6', '௭': '7', '௮': '8', '௯': '9',
    };
    return str.replace(/[०-९০-৯౦-౯೦-೯௦-௯]/g, (ch) => indicDigits[ch] || ch);
  }

  public static extractEntities(text: string): CanonicalEntities {
    const entities: CanonicalEntities = {};
    const normalizedText = this.normalizeIndicNumerals(text);
    const normalized = normalizedText.toLowerCase();

    // 1. Crop Extraction
    for (const [key, standardized] of Object.entries(this.cropKeywords)) {
      if (normalized.includes(key.toLowerCase())) {
        entities.product = standardized;
        break;
      }
    }

    // 2. Quantity & Unit Extraction (e.g., 500 kg, 2.5 MT, 10 tonnes, 20 quintals, 500 किलो, 2 टन)
    const qtyRegex = /([\d.,]+)\s*(kg|kilo|quintal|quintals|ton|tons|tonne|tonnes|mt|किलो|टन|క్వింటా|கிலோ)/i;
    const qtyMatch = normalizedText.match(qtyRegex);
    if (qtyMatch) {
      const num = parseFloat(qtyMatch[1].replace(',', ''));
      let unit = qtyMatch[2].toLowerCase();
      if (unit === 'kilo' || unit === 'किलो' || unit === 'கிலோ') unit = 'kg';
      if (unit === 'ton' || unit === 'tons' || unit === 'tonne' || unit === 'tonnes' || unit === 'टन') unit = 'MT';
      if (unit === 'quintals' || unit === 'క్వింటా') unit = 'quintal';

      entities.quantity = num;
      entities.unit = unit;
      entities.formattedQuantity = `${num} ${unit}`;
    }

    // 3. Price Extraction (e.g. ₹40, 40 rs, 35 rupaye, ₹40/kg)
    const priceRegex = /(?:₹|rs\.?|inr|रु\.?|रुपये)\s*([\d.,]+)|([\d.,]+)\s*(?:₹|rs\.?|inr|रु\.?|रुपये|\/kg|per kg)/i;
    const priceMatch = normalizedText.match(priceRegex);
    if (priceMatch) {
      const valStr = priceMatch[1] || priceMatch[2];
      const p = parseFloat(valStr.replace(',', ''));
      if (!isNaN(p) && p > 0) {
        entities.price = p;
        entities.targetPrice = `₹${p}/kg`;
      }
    }

    // 4. Grade Extraction (Grade A, Premium, Standard, Grade B)
    if (/premium|उच्च दर्जेदार|उत्कृष्ट|ప్రీమియం|பிரீமியம்/i.test(text)) {
      entities.grade = 'Premium';
    } else if (/grade\s*a|दर्जा\s*अ|ए ग्रेड|గ్రేడ్ ఎ|கிரேடு ஏ/i.test(text)) {
      entities.grade = 'A';
    } else if (/grade\s*b|दर्जा\s*ब|बी ग्रेड/i.test(text)) {
      entities.grade = 'B';
    } else if (!entities.grade) {
      entities.grade = 'A'; // Standard default
    }

    // 5. Destination Extraction
    for (const [key, fullLocation] of Object.entries(this.locationKeywords)) {
      if (normalized.includes(key.toLowerCase())) {
        entities.destination = fullLocation;
        break;
      }
    }

    // 6. Vehicle Registration (e.g., MH 12 AB 1234, MH12RF4567, DL 01 A 9999)
    const regRegex = /([A-Z]{2}[\s-]?[0-9]{1,2}[\s-]?[A-Z]{1,2}[\s-]?[0-9]{4})/i;
    const regMatch = text.match(regRegex);
    if (regMatch) {
      entities.vehicleRegistration = regMatch[1].toUpperCase();
    }

    // 7. Vehicle Type (Pickup, Mini Truck, 3-Wheeler, Truck)
    if (/pickup|पिकअप|पिक अप/i.test(text)) {
      entities.vehicleType = 'Pickup (1.5 MT)';
    } else if (/mini truck|chota hathi|छोटा हाथी|छोटा ट्रक/i.test(text)) {
      entities.vehicleType = 'Mini Truck (750 kg)';
    } else if (/3 wheeler|three wheeler|तीन चाकी/i.test(text)) {
      entities.vehicleType = '3-Wheeler Loader (500 kg)';
    } else if (/truck|लॉरी|ट्रक/i.test(text)) {
      entities.vehicleType = 'Heavy Truck (5 MT)';
    }

    // 8. Harvest Date / Required By
    if (/tomorrow|कल|उद्या|நாளை|రేపు|আগামীকাল|ನಾಳೆ/i.test(text)) {
      entities.requiredBy = 'Tomorrow, 5:00 PM';
    } else if (/today|आज|இன்று|ఈ రోజు|আজকে|ಇಂದು/i.test(text)) {
      entities.requiredBy = 'Today, 6:00 PM';
    }

    return entities;
  }
}
