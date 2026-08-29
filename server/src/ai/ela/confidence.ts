// ELA Multi-Dimensional Confidence & Clarification Engine (Phase 4 Intelligence Core)
// Computes inference confidence and resolves missing entity ambiguities through natural language clarification

import type { SupportedLanguage, ElaIntent, UserRole } from '../ela.types.js';
import type { CanonicalEntities } from './entities.js';
import type { ConfidenceScore } from './state.types.js';

export interface ClarificationCheckResult {
  needsClarification: boolean;
  missingEntities: string[];
  clarificationQuestion?: string;
  confidence: ConfidenceScore;
}

export class ConfidenceEngine {
  public static evaluate(
    intent: ElaIntent,
    entities: CanonicalEntities,
    rawConfidence: number,
    lang: SupportedLanguage = 'en',
    _role?: UserRole
  ): ClarificationCheckResult {
    const missing: string[] = [];

    // 1. Determine Required Entities based on Intent
    if (intent === 'CREATE_LOGISTICS_WORKFLOW') {
      if (!entities.destination) missing.push('destination');
      if (!entities.product && !entities.quantity) missing.push('product_or_quantity');
    } else if (intent === 'CREATE_PRODUCT_WORKFLOW') {
      if (!entities.product) missing.push('product');
    } else if (intent === 'CREATE_PROCUREMENT_WORKFLOW') {
      if (!entities.product) missing.push('product');
      if (!entities.quantity) missing.push('quantity');
    } else if (intent === 'CREATE_VEHICLE_WORKFLOW') {
      if (!entities.vehicleType && !entities.vehicleRegistration) missing.push('vehicle_details');
    }

    // 2. Compute Segmented Confidences
    const intentConfidence = Math.min(1.0, Math.max(0.1, rawConfidence));
    const entityConfidence = missing.length === 0 ? 0.95 : Math.max(0.4, 0.95 - missing.length * 0.25);
    const languageConfidence = 0.92;
    const roleConfidence = 0.90;

    const overallConfidence =
      intentConfidence * 0.4 + entityConfidence * 0.35 + languageConfidence * 0.15 + roleConfidence * 0.1;

    const confidence: ConfidenceScore = {
      intentConfidence: Number(intentConfidence.toFixed(2)),
      entityConfidence: Number(entityConfidence.toFixed(2)),
      languageConfidence: Number(languageConfidence.toFixed(2)),
      roleConfidence: Number(roleConfidence.toFixed(2)),
      overallConfidence: Number(overallConfidence.toFixed(2)),
    };

    // 3. Evaluate Need for Clarification
    // If critical information is missing, do NOT guess. Ask targeted clarification.
    if (missing.length > 0) {
      const question = this.generateClarificationQuestion(intent, missing, entities, lang);
      return {
        needsClarification: true,
        missingEntities: missing,
        clarificationQuestion: question,
        confidence,
      };
    }

    return {
      needsClarification: false,
      missingEntities: [],
      confidence,
    };
  }

  private static generateClarificationQuestion(
    intent: ElaIntent,
    missing: string[],
    entities: CanonicalEntities,
    lang: SupportedLanguage
  ): string {
    const product = entities.product || 'produce';

    if (intent === 'CREATE_LOGISTICS_WORKFLOW') {
      if (missing.includes('destination')) {
        const questions: Record<SupportedLanguage, string> = {
          en: `Sure! Where would you like to send the ${product} (e.g., Pune APMC, Mumbai) and what is the quantity?`,
          hi: `ज़रूर! आप ${product === 'Tomatoes' ? 'टमाटर' : product} कहाँ भेजना चाहते हैं (जैसे पुणे मंडी, मुंबई) और कितनी मात्रा है?`,
          mr: `नक्कीच! तुम्ही ${product === 'Tomatoes' ? 'टोमॅटो' : 'शेतमाल'} कुठे पाठवू इच्छिता (उदा. पुणे बाजार समिती, मुंबई) आणि किती प्रमाण आहे?`,
          ta: `நிச்சயமாக! ${product} ஐ எங்கு அனுப்ப விரும்புகிறீர்கள் (எ.கா. புனே மண்டி) மற்றும் அளவு என்ன?`,
          te: `ఖచ్చితంగా! మీరు ${product}ను ఎక్కడికి పంపాలనుకుంటున్నారు (ఉదా. పూణే మండి) మరియు పరిమాణం ఎంత?`,
          bn: `অবশ্যই! আপনি ${product} কোথায় পাঠাতে চান (যেমন পুনে মান্ডি) এবং পরিমাণ কত?`,
          kn: `ಖಂಡಿತ! ನೀವು ${product} ಅನ್ನು ಎಲ್ಲಿಗೆ ಕಳುಹಿಸಲು ಬಯಸುತ್ತೀರಿ (ಉದಾ. ಪುಣೆ ಮಂಡಿ) ಮತ್ತು ಪ್ರಮಾಣ ಎಷ್ಟು?`,
        };
        return questions[lang] || questions['en'];
      }
    }

    if (intent === 'CREATE_PRODUCT_WORKFLOW' && missing.includes('product')) {
      const questions: Record<SupportedLanguage, string> = {
        en: 'Which crop or produce would you like to list (e.g., Tomatoes, Onions, Wheat)?',
        hi: 'आप कौन सी फसल या उपज जोड़ना चाहते हैं (जैसे टमाटर, प्याज, गेहूं)?',
        mr: 'तुम्ही कोणते पीक किंवा शेतमाल नोंदवू इच्छिता (उदा. टोमॅटो, कांदा, गहू)?',
        ta: 'நீங்கள் எந்த பயிர் அல்லது விளைபொருளை பட்டியலிட விரும்புகிறீர்கள் (எ.கா. தக்காளி, வெங்காயம், கோதுமை)?',
        te: 'మీరు ఏ పంట లేదా ఉత్పత్తులను జాబಿತా చేయాలనుకుంటున్నారు (ఉదా. టమాటాలు, ఉల్లిపాయలు, గోధుமలు)?',
        bn: 'আপনি কোন ফসল বা পণ্য তালিকাভুক্ত করতে চান (যেমন টমেটো, পেঁয়াজ, গম)?',
        kn: 'ನೀವು ಯಾವ ಬೆಳೆ ಅಥವಾ ಉತ್ಪನ್ನವನ್ನು ಪಟ್ಟಿ ಮಾಡಲು ಬಯಸುತ್ತೀರಿ (ಉದಾ. ಟೊಮೆಟೊ, ಈರುಳ್ಳಿ, ಗೋಧಿ)?',
      };
      return questions[lang] || questions['en'];
    }

    if (intent === 'CREATE_PROCUREMENT_WORKFLOW') {
      const questions: Record<SupportedLanguage, string> = {
        en: 'What crop and quantity would you like to procure (e.g., 500 kg Tomatoes)?',
        hi: 'आप किस फसल और कितनी मात्रा की खरीद करना चाहते हैं (जैसे 500 किलो टमाटर)?',
        mr: 'तुम्ही कोणत्या पिकाची आणि किती प्रमाणाची खरेदी करू इच्छिता (उदा. ५०० किलो टोमॅटो)?',
        ta: 'நீங்கள் எந்த பயிர் மற்றும் அளவை வாங்க விரும்புகிறீர்கள் (எ.கா. 500 கிலோ தக்காளி)?',
        te: 'మీరు ఏ పంట మరియు పరిమాణాన్ని సేకరించాలనుకుంటున్నారు (ఉదా. 500 కిలోల టమాటాలు)?',
        bn: 'আপনি কোন ফসল এবং কী পরিমাণে কিনতে চান (যেমন ৫০০ কেজি টমেটো)?',
        kn: 'ನೀವು ಯಾವ ಬೆಳೆ ಮತ್ತು ಎಷ್ಟು ಪ್ರಮಾಣವನ್ನು ಖರೀದಿಸಲು ಬಯಸುತ್ತೀರಿ (ಉದಾ. 500 ಕೆಜಿ ಟೊಮೆಟೊ)?',
      };
      return questions[lang] || questions['en'];
    }

    if (intent === 'CREATE_VEHICLE_WORKFLOW') {
      const questions: Record<SupportedLanguage, string> = {
        en: 'What type of vehicle (e.g., Pickup, Mini Truck) and registration number would you like to add?',
        hi: 'आप किस प्रकार का वाहन (जैसे पिकअप, मिनी ट्रक) और गाड़ी नंबर जोड़ना चाहते हैं?',
        mr: 'तुम्ही कोणत्या प्रकारचे वाहन (उदा. पिकअप, मिनी ट्रक) आणि वाहन क्रमांक जोडू इच्छिता?',
        ta: 'எந்த வகையான வாகனம் (எ.கா. பிக்கப், மினி டிரக்) மற்றும் பதிவு எண்ணை சேர்க்க விரும்புகிறீர்கள்?',
        te: 'మీరు ఏ రకమైన వాహనం (உதா. பிக்கப், மினி டிரக்) மற்றும் பதிவு எண்ணை சேர்க்க விரும்புகிறீர்கள்?',
        bn: 'আপনি কোন ধরনের যানবাহন (যেমন পিকআপ, মিনি ট্রাক) এবং রেজিস্ট্রেশন নম্বর যোগ করতে চান?',
        kn: 'ನೀವು ಯಾವ ರೀತಿಯ ವಾಹನ (ಉದಾ. ಪಿಕಪ್, ಮಿನಿ ಟ್ರಕ್) ಮತ್ತು ನೋಂದಣಿ ಸಂಖ್ಯೆಯನ್ನು ಸೇರಿಸಲು ಬಯಸುತ್ತೀರಿ?',
      };
      return questions[lang] || questions['en'];
    }

    return 'Could you please provide a few more details to help me process your request?';
  }
}
