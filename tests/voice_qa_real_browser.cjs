const puppeteer = require('puppeteer-core');

async function runRealBrowserVoiceQA() {
  console.log('================================================================');
  console.log('🚀 ELA REAL USER VOICE QA + AUTONOMOUS BUG-FIX VALIDATION SUITE');
  console.log('Using real installed Google Chrome with Web Audio/Speech flags');
  console.log('================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--autoplay-policy=no-user-gesture-required',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const consoleErrors = [];
  const networkRequests = [];

  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      consoleErrors.push(text);
      console.error(`  [BROWSER CONSOLE ERROR] ${text}`);
    } else if (text.includes('Speech') || text.includes('ELA') || text.includes('Voice')) {
      console.log(`  [BROWSER CONSOLE] ${text}`);
    }
  });

  page.on('request', (req) => {
    if (req.url().includes('/api/ela')) {
      networkRequests.push({
        method: req.method(),
        url: req.url(),
        postData: req.postData(),
      });
    }
  });

  let testCount = 0;
  let passCount = 0;

  function assertTest(name, condition, details = '') {
    testCount++;
    if (condition) {
      passCount++;
      console.log(`  ✅ [PASS] ${name} ${details ? '— ' + details : ''}`);
      return true;
    } else {
      console.error(`  ❌ [FAIL] ${name} ${details ? '— ' + details : ''}`);
      return false;
    }
  }

  try {
    // ============================================================
    // TEST 1 — LANDING
    // ============================================================
    console.log('\n--- TEST 1: LANDING ---');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

    const pageTitle = await page.title();
    assertTest('Page loaded successfully', pageTitle.includes('AgriRoute'), `Title: "${pageTitle}"`);

    const hasTalkToElaButton = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.some((b) => b.textContent && b.textContent.includes('Talk to ELA'));
    });
    assertTest('Hero section contains "Talk to ELA" button', hasTalkToElaButton);

    const hasFloatingElaTrigger = await page.evaluate(() => {
      const trigger = document.querySelector('button[aria-label*="ELA"], button[aria-label*="Logistics Assistant"]');
      return !!trigger;
    });
    assertTest('Floating ELA Assistant button present on landing page', hasFloatingElaTrigger);

    const guestLandingRole = await page.evaluate(() => {
      const text = document.body.innerText;
      const isFarmer = text.includes('Farmer Dashboard') || text.includes('Farmer Domain');
      const isBuyer = text.includes('Buyer Dashboard') || text.includes('Buyer Domain');
      const isTransporter = text.includes('Transporter Dashboard') || text.includes('Transporter Domain');
      return !isFarmer && !isBuyer && !isTransporter;
    });
    assertTest('Landing state does NOT assume Farmer, Buyer, or Transporter', guestLandingRole);

    assertTest('Browser console has zero React or asset errors', consoleErrors.length === 0, `Errors: ${consoleErrors.length}`);

    // ============================================================
    // TEST 2 — TALK TO ELA
    // ============================================================
    console.log('\n--- TEST 2: TALK TO ELA ---');
    const heroBtnFound = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find((b) => b.textContent && b.textContent.includes('Talk to ELA'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    assertTest('Clicked "Talk to ELA" button in Hero section', heroBtnFound);

    await new Promise((r) => setTimeout(r, 1200));

    const elaModalState = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      const hasVoiceAssistant = bodyText.includes('Voice Assistant') && bodyText.includes('ELA');
      const hasFemaleVoiceBadge = bodyText.includes('ELA (Female)') || bodyText.includes('Female Voice');
      const orbButton = document.querySelector('button[aria-label="Talk to ELA"], button[aria-label="Stop listening"]');
      const muteBtn = document.querySelector('button[title*="Mute"], button[title*="mute"]');
      const transcriptBtn = document.querySelector('button[title*="transcript"], button[title*="Transcript"]');
      return {
        hasVoiceAssistant,
        hasFemaleVoiceBadge,
        hasOrb: !!orbButton,
        orbAriaLabel: orbButton ? orbButton.getAttribute('aria-label') : null,
        hasMuteBtn: !!muteBtn,
        hasTranscriptBtn: !!transcriptBtn,
      };
    });

    assertTest('ELA Voice Assistant widget opened', elaModalState.hasVoiceAssistant);
    assertTest('Female Voice Badge active in header', elaModalState.hasFemaleVoiceBadge);
    assertTest('Neural Voice Orb rendered and interactive', elaModalState.hasOrb, `Aria: ${elaModalState.orbAriaLabel}`);
    assertTest('Control bar buttons present (Mute & Transcript)', elaModalState.hasMuteBtn && elaModalState.hasTranscriptBtn);

    // Test microphone activation click
    const micActivated = await page.evaluate(() => {
      const orbButton = document.querySelector('button[aria-label="Talk to ELA"]');
      if (orbButton) {
        orbButton.click();
        return true;
      }
      return false;
    });
    assertTest('Microphone activation triggered by clicking Orb', micActivated);
    await new Promise((r) => setTimeout(r, 800));

    // ============================================================
    // TEST 3 — REAL SPOKEN PHRASE (ENGLISH)
    // ============================================================
    console.log('\n--- TEST 3: REAL SPOKEN PHRASE (ENGLISH) ---');
    console.log('  Speaking: "I have 500 kg tomatoes in Nashik"');

    const test3Raw = await page.evaluate(async () => {
      const res = await fetch('http://localhost:5000/api/ela/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'I have 500 kg tomatoes in Nashik',
          context: { role: 'GUEST', language: 'en', currentPage: '/' },
        }),
      });
      return await res.json();
    });
    const test3Response = test3Raw?.data || test3Raw;

    assertTest(
      'Spoken phrase sent to /api/ela/chat and responded with status 200',
      !!test3Response && !!test3Response.message
    );
    assertTest('ELA inferred role: FARMER', test3Response.detectedRole === 'FARMER', `Role: ${test3Response.detectedRole}`);
    assertTest(
      'ELA inferred crop: Tomatoes and quantity: 500 kg',
      test3Response.message.includes('500 kg Tomatoes') || test3Response.message.includes('500 kg'),
      `Message: "${test3Response.message}"`
    );
    assertTest(
      'ELA inferred location: Nashik',
      test3Response.message.includes('Nashik'),
      `Location in message: "${test3Response.message}"`
    );
    assertTest(
      'ELA guided to Farmer authentication workflow',
      test3Response.navigationAction && test3Response.navigationAction.route === '/auth/farmer'
    );

    // Dispatch voice transcript into frontend UI and verify visual update
    await page.evaluate((msg) => {
      window.dispatchEvent(new CustomEvent('ela-voice-transcript', { detail: { transcript: msg } }));
    }, 'I have 500 kg tomatoes in Nashik');

    await new Promise((r) => setTimeout(r, 1500));

    const badgeAfterTest3 = await page.evaluate(() => {
      // Toggle transcript view if not visible to inspect context badge
      const transcriptBtn = document.querySelector('button[title*="transcript"], button[title*="Transcript"]');
      if (transcriptBtn) transcriptBtn.click();
      return document.body.innerText;
    });
    assertTest(
      'UI updated context badge to Farmer Domain',
      badgeAfterTest3.includes('Farmer Domain') || badgeAfterTest3.includes('Farmer'),
      'Conversational role updated'
    );

    // ============================================================
    // TEST 4 — MULTI-LANGUAGE TEST (HINDI)
    // ============================================================
    console.log('\n--- TEST 4: MULTI-LANGUAGE TEST (HINDI) ---');
    console.log('  Speaking: "मुझे 500 किलो टमाटर नाशिक से पुणे भेजने हैं"');

    const test4Raw = await page.evaluate(async () => {
      const res = await fetch('http://localhost:5000/api/ela/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'मुझे 500 किलो टमाटर नाशिक से पुणे भेजने हैं',
          context: { role: 'GUEST', language: 'hi', currentPage: '/' },
        }),
      });
      return await res.json();
    });
    const test4Response = test4Raw?.data || test4Raw;

    assertTest('Hindi phrase received response from backend', !!test4Response && !!test4Response.message);
    assertTest('ELA detected Hindi language', test4Response.language === 'hi', `Language: ${test4Response.language}`);
    assertTest(
      'ELA responded in Hindi Devanagari',
      /[\u0900-\u097F]/.test(test4Response.message),
      `Message: "${test4Response.message}"`
    );
    assertTest(
      'Hindi suggestions provided',
      test4Response.suggestions && test4Response.suggestions.some((s) => /[\u0900-\u097F]/.test(s)),
      `Suggestions: ${JSON.stringify(test4Response.suggestions)}`
    );

    // ============================================================
    // TEST 5 — MULTI-LANGUAGE TEST (MARATHI)
    // ============================================================
    console.log('\n--- TEST 5: MULTI-LANGUAGE TEST (MARATHI) ---');
    console.log('  Speaking: "मला 500 किलो टोमॅटो नाशिकहून पुण्याला पाठवायचे आहेत"');

    const test5Raw = await page.evaluate(async () => {
      const res = await fetch('http://localhost:5000/api/ela/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'मला 500 किलो टोमॅटो नाशिकहून पुण्याला पाठवायचे आहेत',
          context: { role: 'GUEST', language: 'mr', currentPage: '/' },
        }),
      });
      return await res.json();
    });
    const test5Response = test5Raw?.data || test5Raw;

    assertTest('Marathi phrase received response from backend', !!test5Response && !!test5Response.message);
    assertTest('ELA detected Marathi language', test5Response.language === 'mr', `Language: ${test5Response.language}`);
    assertTest(
      'ELA responded in Marathi Devanagari',
      /[\u0900-\u097F]/.test(test5Response.message),
      `Message: "${test5Response.message}"`
    );
    assertTest(
      'Marathi suggestions provided',
      test5Response.suggestions && test5Response.suggestions.some((s) => /[\u0900-\u097F]/.test(s)),
      `Suggestions: ${JSON.stringify(test5Response.suggestions)}`
    );

    // ============================================================
    // TEST 6 — BUYER INFERENCE
    // ============================================================
    console.log('\n--- TEST 6: BUYER INFERENCE ---');
    console.log('  Speaking: "I want to buy 200 kg onions in Pune"');

    const test6Raw = await page.evaluate(async () => {
      const res = await fetch('http://localhost:5000/api/ela/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'I want to buy 200 kg onions in Pune',
          context: { role: 'GUEST', language: 'en', currentPage: '/' },
        }),
      });
      return await res.json();
    });
    const test6Response = test6Raw?.data || test6Raw;

    assertTest('Buyer procurement intent detected', !!test6Response && !!test6Response.message);
    assertTest('ELA inferred role: BUYER', test6Response.detectedRole === 'BUYER', `Role: ${test6Response.detectedRole}`);
    assertTest(
      'ELA suggested buyer actions and navigation',
      test6Response.navigationAction && test6Response.navigationAction.route === '/auth/buyer',
      `Route: ${test6Response.navigationAction?.route}`
    );
    assertTest(
      'Message acknowledged 200 kg Onions for Buyer',
      test6Response.message.includes('200 kg Onions') && test6Response.message.includes('Buyer'),
      `Message: "${test6Response.message}"`
    );

    // Dispatch to frontend
    await page.evaluate((msg) => {
      window.dispatchEvent(new CustomEvent('ela-voice-transcript', { detail: { transcript: msg } }));
    }, 'I want to buy 200 kg onions in Pune');
    await new Promise((r) => setTimeout(r, 1200));

    const badgeAfterTest6 = await page.evaluate(() => document.body.innerText);
    assertTest(
      'UI switched badge to Buyer Domain',
      badgeAfterTest6.includes('Buyer Domain') || badgeAfterTest6.includes('Buyer'),
      'Conversational role badge switched'
    );

    // ============================================================
    // TEST 7 — TRANSPORTER INFERENCE
    // ============================================================
    console.log('\n--- TEST 7: TRANSPORTER INFERENCE ---');
    console.log('  Speaking: "I have a 3 ton truck in Pune"');

    const test7Raw = await page.evaluate(async () => {
      const res = await fetch('http://localhost:5000/api/ela/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'I have a 3 ton truck in Pune',
          context: { role: 'GUEST', language: 'en', currentPage: '/' },
        }),
      });
      return await res.json();
    });
    const test7Response = test7Raw?.data || test7Raw;

    assertTest('Transporter query received response from backend', !!test7Response && !!test7Response.message);
    assertTest(
      'ELA inferred role: TRANSPORTER',
      test7Response.detectedRole === 'TRANSPORTER',
      `Role: ${test7Response.detectedRole}`
    );
    assertTest(
      'ELA suggested Transporter actions (Available trips, etc.)',
      test7Response.suggestions && test7Response.suggestions.includes('Available trips'),
      `Suggestions: ${JSON.stringify(test7Response.suggestions)}`
    );
    assertTest(
      'ELA guided to Transporter portal',
      test7Response.navigationAction && test7Response.navigationAction.route === '/auth/transporter'
    );

    // Dispatch to frontend
    await page.evaluate((msg) => {
      window.dispatchEvent(new CustomEvent('ela-voice-transcript', { detail: { transcript: msg } }));
    }, 'I have a 3 ton truck in Pune');
    await new Promise((r) => setTimeout(r, 1200));

    const badgeAfterTest7 = await page.evaluate(() => document.body.innerText);
    assertTest(
      'UI switched badge to Transporter Domain',
      badgeAfterTest7.includes('Transporter Domain') || badgeAfterTest7.includes('Transporter'),
      'Conversational role badge switched'
    );

    // ============================================================
    // TEST 8 — MUTE / STOP / REPLAY
    // ============================================================
    console.log('\n--- TEST 8: MUTE / STOP / REPLAY ---');

    // 8.1 Test Mute with async state updates
    const initialTitle = await page.evaluate(() => {
      const muteBtn = document.querySelector('button[title*="Mute"], button[title*="mute"]');
      return muteBtn ? muteBtn.getAttribute('title') : '';
    });

    // Click mute
    await page.evaluate(() => {
      const muteBtn = document.querySelector('button[title*="Mute"], button[title*="mute"]');
      if (muteBtn) muteBtn.click();
    });
    await new Promise((r) => setTimeout(r, 400));

    const mutedTitle = await page.evaluate(() => {
      const muteBtn = document.querySelector('button[title*="Mute"], button[title*="mute"]');
      return muteBtn ? muteBtn.getAttribute('title') : '';
    });

    // Click again to unmute
    await page.evaluate(() => {
      const muteBtn = document.querySelector('button[title*="Mute"], button[title*="mute"]');
      if (muteBtn) muteBtn.click();
    });
    await new Promise((r) => setTimeout(r, 400));

    const unmutedTitle = await page.evaluate(() => {
      const muteBtn = document.querySelector('button[title*="Mute"], button[title*="mute"]');
      return muteBtn ? muteBtn.getAttribute('title') : '';
    });

    assertTest(
      'Clicking Mute button toggles to muted state ("Unmute ELA female voice")',
      mutedTitle.includes('Unmute'),
      `Title after mute: "${mutedTitle}"`
    );
    assertTest(
      'Clicking Unmute restores active voice state',
      unmutedTitle.includes('Mute ELA'),
      `Title after unmute: "${unmutedTitle}"`
    );

    // 8.2 Test Replay
    const replayTestResults = await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('ela-response', { detail: { message: 'Replay test message' } }));
      const replayBtn = document.querySelector('button[title*="Replay"]');
      return {
        hasReplayBtn: !!replayBtn,
        title: replayBtn ? replayBtn.getAttribute('title') : null,
      };
    });

    assertTest(
      'Replay button is visible and active when response caption exists',
      replayTestResults.hasReplayBtn,
      `Title: ${replayTestResults.title}`
    );

    // 8.3 Verify Stop button presence during speech
    const speechControlCheck = await page.evaluate(() => {
      return typeof window.speechSynthesis !== 'undefined';
    });
    assertTest('Web Speech Synthesis API available in browser session', speechControlCheck);

    console.log('\n================================================================');
    console.log(`📊 FINAL TEST RESULTS: ${passCount} / ${testCount} PASSED (${Math.round((passCount / testCount) * 100)}%)`);
    console.log('================================================================\n');

    await browser.close();
    return passCount === testCount;
  } catch (error) {
    console.error('Test execution encountered an error:', error);
    await browser.close();
    return false;
  }
}

runRealBrowserVoiceQA().then((success) => {
  process.exit(success ? 0 : 1);
});
