// Dữ liệu tĩnh 100 câu TOEIC Listening — LISTENING REVISION 28/11/2026
// Nguồn: docs/extracted/extracted_script.md (câu hỏi, options, transcript)
// Đáp án chốt: xem PRD — đã verify từ answer key.

export type PartNumber = 1 | 2 | 3 | 4;
export type AnswerKey = "A" | "B" | "C" | "D";

export interface ExamOption {
  key: AnswerKey;
  text: string;
}

export interface ExamQuestion {
  id: number;
  part: PartNumber;
  groupId: string | null;
  /** Part I: '' (đề bằng hình). Part II/III/IV: câu hỏi in sẵn. */
  prompt: string;
  options: ExamOption[];
  answer: AnswerKey;
  image?: string;
  imageAlt?: string;
  graphic?: string;
  graphicAlt?: string;
}

export interface ExamGroup {
  id: string;
  part: PartNumber;
  category: string;
  title: string;
  questionIds: number[];
  /** Transcript gốc, mỗi dòng một lượt thoại, cue (n) giữ nguyên. */
  transcript: string;
}

export const CUE_SPLIT = /(\(\d{1,3}\))/g;
export const CUE_TEST = /^\(\d{1,3}\)$/;

export interface PartMeta {
  part: PartNumber;
  name: string;
  nameVi: string;
  count: number;
  range: string;
}

export const PART_META: PartMeta[] = [
  { part: 1, name: "Part I — Photographs", nameVi: "Part I · Nghe và chọn mệnh đề mô tả ảnh", count: 6, range: "Câu 1–6" },
  { part: 2, name: "Part II — Question & Response", nameVi: "Part II · Hỏi đáp", count: 25, range: "Câu 7–31" },
  { part: 3, name: "Part III — Conversations", nameVi: "Part III · Hội thoại", count: 39, range: "Câu 32–70" },
  { part: 4, name: "Part IV — Talks", nameVi: "Part IV · Bài nói", count: 30, range: "Câu 71–100" },
];

export const TOTAL_QUESTIONS = 100;
export const EXAM_TITLE = "LISTENING REVISION";
export const EXAM_DATE = "28/11/2026";

function makeQ(
  id: number,
  part: PartNumber,
  prompt: string,
  answer: AnswerKey,
  optionTexts: string[],
  groupId: string | null = null,
  extra: Partial<ExamQuestion> = {}
): ExamQuestion {
  const keys: AnswerKey[] = ["A", "B", "C", "D"];
  return {
    id,
    part,
    groupId,
    prompt,
    answer,
    options: optionTexts.map((text, i) => ({ key: keys[i], text })),
    ...extra,
  };
}

export const GROUPS: ExamGroup[] = [
  {
    id: "g32",
    part: 3,
    category: "Conversation",
    title: "Questions 32–34",
    questionIds: [32, 33, 34],
    transcript:
      "M-Au: Hi Sarah, have you reviewed the (32) updated timeline for the overseas marketing launch? The board wants us to accelerate the final phase by two weeks.\n" +
      "W-Am: I saw the email, but (33) it’s going to be difficult because our lead data analyst, David, is on medical leave until next month. We don't have enough staff to handle the extra workload right now.\n" +
      "M-Au: That's a valid point. (34) Why don't we temporarily assign some of David's data entry duties to Jessica? She recently finished her onboarding training and has the capacity to help.\n" +
      "W-Am: That would work perfectly. I'll reach out to her this afternoon to explain the priorities.",
  },
  {
    id: "g35",
    part: 3,
    category: "Conversation",
    title: "Questions 35–37",
    questionIds: [35, 36, 37],
    transcript:
      "W-Br: Mark, I just received several urgent phone calls from (35) tenants on the fourth floor of the commercial complex. (36) The central heating system stopped working early this morning, and the office spaces are freezing.\n" +
      "M-Cn: That's not good, especially since it's freezing outside today. Did you try restarting the main boiler in the basement?\n" +
      "W-Br: Yes, I did, but the system pressure is still dropping rapidly. I suspect there is a major pipe leak somewhere.\n" +
      "M-Cn: Understood. (37) I'll call our emergency plumbing contractor right away to have a technician come out and inspect the building's infrastructure before noon.",
  },
  {
    id: "g38",
    part: 3,
    category: "Conversation",
    title: "Questions 38–40",
    questionIds: [38, 39, 40],
    transcript:
      "M-Am: Hi Brenda, how are the arrangements going for (38) our upcoming internal software training seminar next Tuesday?\n" +
      "W-Br: Mostly good, but I’m a bit worried about the location. Over forty employees have already registered, and (39) the small conference hall we reserved can only comfortably seat thirty people.\n" +
      "M-Am: Oh, I didn't realize the attendance would be that high. Is there any larger space open in the building?\n" +
      "W-Br: Well, (40) Room 204 is available all day. It has double the capacity and already has a high-definition projector installed, so it would suit our group much better.\n" +
      "M-Am: Perfect. Let's switch the reservation to that room before someone else books it.",
  },
  {
    id: "g41",
    part: 3,
    category: "Conversation",
    title: "Questions 41–43",
    questionIds: [41, 42, 43],
    transcript:
      "M-Au: Excuse me, Jessica. I'm (41) having trouble connecting my corporate laptop to the main screen in the boardroom, and (42) I have an important presentation in ten minutes with the executive board.\n" +
      "W-Am: Let me see. It looks like your laptop isn't receiving any signal from the wall outlet. Are you using the blue display cable?\n" +
      "M-Au: Yes, I plugged it in securely, but the monitor is still completely blank.\n" +
      "W-Am: Ah, that specific blue cable has been faulty lately. (43) You should unplug it and use the silver HDMI cord stored in the black basket underneath the table instead. That usually solves the connection issue.\n" +
      "M-Au: Thanks, I'll try that right away!",
  },
  {
    id: "g44",
    part: 3,
    category: "Conversation",
    title: "Questions 44–46",
    questionIds: [44, 45, 46],
    transcript:
      "W-Br: Now that we’ve been at our (44) new office downtown for a full week, how are you settling in, David?\n" +
      "M-Cn: I absolutely love it here. My favorite part is that (45) the subway station is just a two-minute walk from the front entrance, which makes my morning commute so much shorter than before.\n" +
      "W-Br: I agree, the location is incredibly convenient. Plus, there are so many great local restaurants and coffee shops in this neighborhood.\n" +
      "M-Cn: Definitely. In fact, (46) a few of us are planning to try that new Italian bistro down the street right after our shift ends today. Would you care to join us?\n" +
      "W-Br: I’d love to! Let me just finish saving these spreadsheets.",
  },
  {
    id: "g47",
    part: 3,
    category: "Conversation",
    title: "Questions 47–49",
    questionIds: [47, 48, 49],
    transcript:
      "W-Br: Excuse me, Tom. (47) Since the IT team updated our client dashboard yesterday, I haven't been able to log in to track our data metrics. The screen just freezes on the loading page.\n" +
      "M-Cn: Ah, yes. A few other analysts reported the same glitch this morning. The software developer suggested that (48) users just need to clear their internet browser cache and cookies, and that should resolve the login error.\n" +
      "W-Br: Oh, I didn't think of that. I've just been restarting my device over and over.\n" +
      "M-Cn: Try clearing the cache first. If it still doesn't load, let me know and I'll look into your account settings.\n" +
      "W-Br: Thanks. (49) I'll head back to my desk right now and try that solution on my desktop computer.",
  },
  {
    id: "g50",
    part: 3,
    category: "Conversation",
    title: "Questions 50–52",
    questionIds: [50, 51, 52],
    transcript:
      "W-Br: Thanks for meeting with me, Kevin. I'm looking over our web metrics, and (50) user engagement on our official website has dropped significantly over the past few weeks.\n" +
      "M-Cn: That's surprising, especially since (51) we just launched our updated online ordering platform last month to make purchases easier for clients.\n" +
      "W-Br: Exactly. I think customers just aren't aware of the new features yet. We need a fast way to drive more traffic to the site.\n" +
      "M-Cn: In that case, (52) why don't we email a ten-percent discount code to our existing subscribers? We can include a direct link to the new platform in the message to encourage them to visit.",
  },
  {
    id: "g53",
    part: 3,
    category: "Conversation",
    title: "Questions 53–55",
    questionIds: [53, 54, 55],
    transcript:
      "M-Am: Hi Linda, I'm reviewing the (53) vehicle logs for our fleet. Do we have enough luxury sedans available for the corporate executives arriving from Tokyo this Friday?\n" +
      "W-Am: Let me check the schedule. Unfortunately, (54) most of our premium executive cars have already been reserved for a major wedding event happening this weekend. We only have one sedan left in the lot.\n" +
      "M-Am: That's a problem. We need at least three vehicles to transport the entire delegation comfortably.\n" +
      "W-Am: Well, we do have two other sedans, but they are currently scheduled for their routine safety inspections.\n" +
      "M-Am: I see. (55) I'll contact the auto garage next week to reschedule those inspections for a later date so we can use the cars this weekend instead.",
  },
  {
    id: "g56",
    part: 3,
    category: "Conversation",
    title: "Questions 56–58",
    questionIds: [56, 57, 58],
    transcript:
      "W-Br: Brian, the management board gave us permission to (56) remodel the office reception area to make it look more modern for visiting clients.\n" +
      "M-Au: That's wonderful news! Did they specify the spending limit for the new furniture and decorations?\n" +
      "W-Br: Yes, we have a maximum budget of five thousand dollars.\n" +
      "M-Au: Okay, we need to keep in mind that (57) amount must include all shipping and delivery fees, not just the price of the furniture itself. Freight charges for heavy items can be quite high.\n" +
      "W-Br: Good point. (58) I’ll contact the fabric supplier this afternoon to ask for some free material samples so we can check the quality before placing a large order.",
  },
  {
    id: "g59",
    part: 3,
    category: "Conversation",
    title: "Questions 59–61",
    questionIds: [59, 60, 61],
    transcript:
      "M-Au: Hi Chloe, have you finalized the (59) catering arrangements for our company’s upcoming anniversary celebration next month?\n" +
      "W-Am: I’m still evaluating options. I contacted Apex Catering first because they have excellent reviews for corporate events, but (60) they are completely booked on the weekend we selected. They only have open slots on weekdays.\n" +
      "M-Au: That's unfortunate since our event is on a Saturday. What about Delight Bites? A colleague in the travel department recommended them last week.\n" +
      "W-Am: I haven't reached out to them yet, but their online menu looks very diverse and professional.\n" +
      "M-Au: Great. (61) I'll give them a call right now to request a detailed price quote for fifty guests so we can compare it with our remaining budget.",
  },
  {
    id: "g62",
    part: 3,
    category: "Conversation with Graphic",
    title: "Questions 62–64",
    questionIds: [62, 63, 64],
    transcript:
      "W-Am: Arthur, have you booked your plane tickets to Detroit yet? Remember, (62) the inspection at our new manufacturing plant is scheduled for Friday morning, so you need to arrive the day before.\n" +
      "M-Cn: I'm looking at the flight options right now. I have a morning team meeting here in Chicago until 10:00 AM on Thursday, so I can't take the earliest flight. However, I still want to get there before evening.\n" +
      "W-Am: In that case, (63) Flight 205 at 11:30 AM looks perfect. It gives you just enough time to get to the airport after your meeting wraps up.\n" +
      "M-Cn: That sounds reasonable. I'll reserve a seat on that flight now.\n" +
      "W-Am: Great. (64) I’ll go ahead and schedule a corporate shuttle taxi to pick you up outside the office right after your meeting finishes so you don't have to worry about parking.",
  },
  {
    id: "g65",
    part: 3,
    category: "Conversation with Graphic",
    title: "Questions 65–67",
    questionIds: [65, 66, 67],
    transcript:
      "W-Am: Thanks for coming with me to the city museum today, Arthur. (65) I really need some visual inspiration for the digital interface project we are designing for our retail client.\n" +
      "M-Au: No problem. Since we want something futuristic and engaging, we should head straight to (66) the interactive digital art exhibition. The classical displays won't give us the modern ideas we need.\n" +
      "W-Am: Good point. According to the map, that gallery is located at the very back of the building.\n" +
      "M-Au: Great, let's go there now. (67) I’ll make sure to take plenty of photos of the color schemes and layouts with my phone so we can reference them during our team meeting tomorrow.",
  },
  {
    id: "g68",
    part: 3,
    category: "Conversation with Graphic",
    title: "Questions 68–70",
    questionIds: [68, 69, 70],
    transcript:
      "W-Am: Lucas, we need to optimize our resource allocation for the upcoming quarter. (68) Management wants our remaining funds shifted toward the channels with the highest conversion rates.\n" +
      "M-Au: Looking at last month's metrics, (69) the search engine optimization strategy outperformed everything else at over four percent. We should definitely double our investment there.\n" +
      "W-Am: I agree, but our internal team is already at maximum capacity and can't handle the extra workload.\n" +
      "M-Au: In that case, (70) why don't we contract an outside digital agency to manage the ad placements for us? That way, we can scale up without overwhelming our staff.\n" +
      "W-Am: Sounds like a plan. Let's draft a proposal for the director.",
  },
  {
    id: "g71",
    part: 4,
    category: "Broadcast",
    title: "Questions 71–73",
    questionIds: [71, 72, 73],
    transcript:
      "Good morning commuters. (71) A massive oil spill on Route 9 near the southern bridge has triggered severe gridlock extending back three miles. Highway patrol teams are currently on-site managing cleanup operations, which are (72) projected to last until noon. (73) Drivers heading toward the financial district should divert onto Expressway 4 to avoid major delays. Regular updates will be broadcast every fifteen minutes on this station.",
  },
  {
    id: "g74",
    part: 4,
    category: "Advertisement",
    title: "Questions 74–76",
    questionIds: [74, 75, 76],
    transcript:
      "Are you seeking a reliable method to monitor your home's water consumption? AquaGuard introduces (74) HydroTrack, our premier smart water meter. HydroTrack links directly to your cellular device, (75) sending instant notifications if any leak is detected in your plumbing system. Purchase your unit during our seasonal launch event this week to receive (76) complimentary professional installation. Explore our catalog at aquaguardtech.com to order yours today.",
  },
  {
    id: "g77",
    part: 4,
    category: "Public Announcement",
    title: "Questions 77–79",
    questionIds: [77, 78, 79],
    transcript:
      "Attention staff. (77) Our facility's main cafeteria will undergo an extensive kitchen upgrade starting next Monday. Consequently, no hot meals will be prepared or served on-site for (78) approximately two weeks. During this period, a local catering truck will park (79) in the western courtyard from 11:30 A.M. to 1:30 P.M. daily to offer grab-and-go options. We appreciate your patience as we modernize our dining space.",
  },
  {
    id: "g80",
    part: 4,
    category: "Talk",
    title: "Questions 80–82",
    questionIds: [80, 81, 82],
    transcript:
      "Welcome to (80) our annual community arts celebration. Tonight, we are delighted to feature (81) Professor Elena Rostova, a prominent researcher in classical music history. Professor Rostova will share rare audio clips from her extensive archival work in Eastern Europe. Following her lecture, (82) she will sign copies of her newly published textbook in the lobby. Let us extend an enthusiastic greeting to Professor Rostova.",
  },
  {
    id: "g83",
    part: 4,
    category: "Talk",
    title: "Questions 83–85",
    questionIds: [83, 84, 85],
    transcript:
      "Before entering (83) the server room, please review our strict security protocols. Magnetic badges must remain visible on your outer clothing at all times. Additionally, (84) absolutely no liquids or food items are permitted inside the server enclosure to prevent electrical damage. If you notice (85) any warning lights flashing on the cooling racks, document it on the log sheet by the exit door immediately. Let's proceed inside.",
  },
  {
    id: "g86",
    part: 4,
    category: "Telephone Message",
    title: "Questions 86–88",
    questionIds: [86, 87, 88],
    transcript:
      "Hello, this is Arthur Pendelton from Apex Legal Partners. I am leaving a message for Mr. Vance regarding (86) the lease agreement for your commercial storefront. Our legal team has successfully modified clause 4 as you requested, reflecting the adjusted maintenance responsibilities. Please visit our downtown office (87) before Friday at 4:00 P.M. to sign the finalized document. Remember to bring (88) two forms of state-issued identification for verification purposes.",
  },
  {
    id: "g89",
    part: 4,
    category: "Public Announcement",
    title: "Questions 89–91",
    questionIds: [89, 90, 91],
    transcript:
      "Attention shoppers at (89) Timberline Outdoors. Due to an unexpected malfunction with our (90) centralized digital checkout system, we are temporarily unable to process credit or debit cards. Currently, we can only complete purchases using cash. If you do not have currency on hand, an automated teller machine is located (91) right outside our main exit doors next to the bicycle rack. We expect full card processing capabilities to resume within an hour.",
  },
  {
    id: "g92",
    part: 4,
    category: "Broadcast",
    title: "Questions 92–94",
    questionIds: [92, 93, 94],
    transcript:
      "This is Chloe Whitman with your afternoon retail update. (92) Velocity Footwear, a leading producer of athletic shoes, announced plans to (93) close its manufacturing facility in Oakville. Production will consolidate into their larger, automated plant in Springfield by the end of this fiscal year. A corporate representative stated that this consolidation aims to (94) reduce overhead costs significantly. Displaced employees will be offered transition packages or positions at the Springfield location.",
  },
  {
    id: "g95",
    part: 4,
    category: "Public Announcement with Graphic",
    title: "Questions 95–97",
    questionIds: [95, 96, 97],
    transcript:
      "Welcome to the Symphony Amphitheater. (95) Symphony Amphitheater is hosting tonight's acoustic performance. We would like to inform all ticket holders that the main stage arrangement has changed slightly. Due to (96) the addition of large equipment boxes for the filming crew, the entire (97) second Premium VIP row listed in the Front Section has been completely closed off for security reasons. If your original seat was located in that row, please head to the guest services counter located right next to the refreshment station. Our staff will immediately reassign you to an open seat in the rows further back. Thank you for your cooperation.",
  },
  {
    id: "g98",
    part: 4,
    category: "Talk with Graphic",
    title: "Questions 98–100",
    questionIds: [98, 99, 100],
    transcript:
      "Good afternoon, museum visitors. I would like to welcome you to the special preview of our temporary ancient civilization exhibit. Before you begin exploring the artifacts, please note (98) a temporary shift in the gallery layout. The regular pottery gallery in Room 3 is currently locked while painters refresh the interior walls. As a result, our collection of ancient Greek clay vases has been moved directly across the hall into (99) the temporary display room currently housing the bronze statues, which sits right beside the modern sculpture pavilion. Please be careful when walking near (100) the freshly painted areas, and enjoy your visit.",
  },
];

export const QUESTIONS: ExamQuestion[] = [
  // PART I — Photographs
  makeQ(1, 1, "", "A", ["The woman is standing by a window.", "The woman is polishing a window.", "The woman is opening a drawer.", "The woman is watering some plants."], null, { image: "/exam/q01.png", imageAlt: "Người phụ nữ đứng bên cửa sổ lớn" }),
  makeQ(2, 1, "", "C", ["The man is placing some fruits into a cart.", "The man is paying for his groceries.", "A man is selecting some vegetables.", "The man is arranging products on a shelf."], null, { image: "/exam/q02.png", imageAlt: "Người đàn ông chọn rau tại quầy chợ ngoài trời" }),
  makeQ(3, 1, "", "B", ["The workers are climbing a ladder.", "The workers are wearing hard hats.", "They are building a house.", "They are reviewing some construction plans."], null, { image: "/exam/q03.png", imageAlt: "Công nhân xây dựng đội mũ cứng trên công trường cầu" }),
  makeQ(4, 1, "", "D", ["A potted plant is hanging near the window.", "Some books are scattered on the floor.", "Folders are being put away in a cabinet.", "The chair is positioned in front of the table."], null, { image: "/exam/q04.png", imageAlt: "Chiếc ghế đặt trước bàn làm việc cạnh cửa sổ" }),
  makeQ(5, 1, "", "A", ["Many handbags are on display.", "Bags are being removed from the shelves.", "The shopping mall is filled with people.", "There are some shoes arranged on the floor."], null, { image: "/exam/q05.png", imageAlt: "Túi xách trưng bày trên kệ cửa hàng" }),
  makeQ(6, 1, "", "D", ["Some tires are stacked against the wall.", "Trees are casting shadow on the road.", "Two people are getting into a car.", "A car is on a pathway."], null, { image: "/exam/q06.png", imageAlt: "Xe hơi màu xanh trên cung đường đèo" }),
  // PART II — Question & Response
  makeQ(7, 2, "Why did the client request a revision of the contract?", "B", ["A senior legal advisor.", "To clarify the delivery terms.", "The contract is legally binding."]),
  makeQ(8, 2, "When will the prototype be ready for testing?", "B", ["Yes, it is working fine.", "By the end of this week.", "The test was quite difficult."]),
  makeQ(9, 2, "Should we hire a professional translator or translate this internally?", "C", ["Our team members speak fluent Japanese.", "Yes, the brochure looks great.", "It's a very technical document."]),
  makeQ(10, 2, "The paper shredder in the HR office is jammed again.", "A", ["I'll call the maintenance crew immediately.", "About twenty pages at a time.", "Yes, I put it on your desk."]),
  makeQ(11, 2, "Who is organizing the retirement party for Ms. Green?", "C", ["The venue was spectacular.", "Next Friday night.", "I think the marketing team is handling it."]),
  makeQ(12, 2, "Is the office cafeteria closed today?", "A", ["No, it stays open until 7:00 PM.", "I usually bring my own lunch.", "A great selection of healthy salads."]),
  makeQ(13, 2, "Would you like me to book a window or an aisle seat?", "A", ["Whichever is available is fine with me.", "No, the window is tightly closed.", "The flight takes about two hours."]),
  makeQ(14, 2, "What time does the keynote speaker arrive?", "B", ["He spoke about global market trends.", "His plane lands at 3:30 PM.", "No, I didn't introduce him."]),
  makeQ(15, 2, "Is Mr. Vance conducting the training workshop in Meeting Room 1 or 2?", "A", ["Neither, it has been moved to the main auditorium.", "Yes, the workshop went very well.", "Room 1 is much larger."]),
  makeQ(16, 2, "How long will the server maintenance take?", "A", ["It should be finished within an hour.", "To upgrade our internal network.", "No, I don't use that server."]),
  makeQ(17, 2, "The annual performance reviews start next Monday, right?", "A", ["No, they have been postponed to Thursday.", "I received a very positive rating.", "To evaluate our career goals."]),
  makeQ(18, 2, "Why was the flight to Chicago delayed?", "B", ["To attend a regional conference.", "Because of heavy fog at the destination airport.", "Yes, it arrived on time."]),
  makeQ(19, 2, "I can't seem to find the folder for the new advertising project.", "B", ["The budget is quite limited.", "Did you check the shared digital drive?", "No, I haven't seen the ad yet."]),
  makeQ(20, 2, "Did you lock the main entrance before leaving?", "B", ["The keys are on the desk.", "Actually, the security guard did it.", "Yes, I have a lot of keys."]),
  makeQ(21, 2, "Should we launch the new website now or wait for the board's feedback?", "B", ["The IT department is ready right now.", "Let's wait until we get formal approval.", "Yes, I really like the new web design."]),
  makeQ(22, 2, "Where should I sign this delivery invoice?", "A", ["Right at the bottom of the page.", "Yes, the package has arrived.", "I already shipped it."]),
  makeQ(23, 2, "Has the marketing team submitted their campaign proposal?", "B", ["It's a highly creative idea.", "Not yet, they are still editing the layout.", "To increase our brand awareness."]),
  makeQ(24, 2, "Where did you store the extra extension cords?", "A", ["In the bottom drawer near the printer.", "No, I didn't see it.", "The cord length is three meters."]),
  makeQ(25, 2, "Do you want me to ship this sample via express courier or regular mail?", "A", ["The deadline is urgent, so express please.", "I received your email yesterday.", "The shipping container is full."]),
  makeQ(26, 2, "Who approved the funding for the new laboratory equipment?", "B", ["It's highly advanced technology.", "Let's check with the department head.", "The laboratory is on the third floor."]),
  makeQ(27, 2, "Do you know if this cafe has a reliable Wi-Fi connection?", "B", ["I order an iced coffee every morning.", "Yes, the password is printed on the receipt.", "No, I don't need a table, thank you."]),
  makeQ(28, 2, "How can I renew my corporate parking permit?", "A", ["Just fill out the form on the HR portal.", "The garage is temporarily full.", "Around twenty dollars per month."]),
  makeQ(29, 2, "Are you planning to drive to the seminar or take a cab?", "A", ["Parking downtown is extremely expensive.", "Yes, the seminar is very informative.", "I heard the keynote speaker is famous."]),
  makeQ(30, 2, "Have you updated the inventory list for this month?", "A", ["No, I have been busy with the audit.", "The supplies are in the warehouse.", "Yes, it's a very large catalog."]),
  makeQ(31, 2, "You've double-checked the budget spreadsheet, haven't you?", "A", ["Yes, everything balances perfectly.", "Free accounting software is available.", "I prefer working with numbers."]),
  // PART III — Conversations
  makeQ(32, 3, "What is the main focus of the conversation?", "B", ["Inspecting a damaged cargo shipment", "Discussing a shift in a project deadline", "Negotiating a contract with a new vendor", "Troubleshooting a software login issue"], "g32"),
  makeQ(33, 3, "What problem does the woman point out?", "C", ["The corporate budget has been reduced.", "Some technical equipment is outdated.", "A key team member is currently on leave.", "The client rejected the initial design concept."], "g32"),
  makeQ(34, 3, "What does the man suggest doing?", "A", ["Reallocating tasks to another employee", "Requesting a timeline extension from the client", "Hiring an independent freelancer", "Canceling the weekly status meeting"], "g32"),
  makeQ(35, 3, "What field do the speakers most likely work in?", "B", ["Event planning", "Property management", "Financial consulting", "Automotive repair"], "g35"),
  makeQ(36, 3, "According to the woman, what happened this morning?", "C", ["A parking lot renovation began.", "A tenant moved out without notice.", "A heating system malfunctioned.", "A utility bill was overpaid."], "g35"),
  makeQ(37, 3, "What will the man do next?", "A", ["Contact an external contractor", "Order replacement parts online", "Create an invoice for a customer", "Update the building's safety manual"], "g35"),
  makeQ(38, 3, "What are the speakers planning?", "A", ["A professional workshop for employees", "A product demonstration for investors", "A retirement party for a director", "A charity auction for the community"], "g38"),
  makeQ(39, 3, "What is the woman concerned about?", "D", ["The high cost of catering services", "The lack of audio-visual equipment", "The bad weather forecast for the weekend", "The insufficient capacity of the venue"], "g38"),
  makeQ(40, 3, "What does the woman imply when she says, “Room 204 is available all day”?", "C", ["She wants to move her office there.", "The room needs to be cleaned immediately.", "It would be a better alternative space.", "A previous reservation was cancelled."], "g38"),
  makeQ(41, 3, "Why is the man visiting the woman's desk?", "B", ["To invite her to a corporate lunch", "To ask for technical help with a device", "To deliver a package from a client", "To submit a vacation request form"], "g41"),
  makeQ(42, 3, "Why does the man say, “I have an important presentation in ten minutes”?", "A", ["To emphasize the urgency of his request", "To express anxiety about public speaking", "To complain about his heavy workload", "To explain why he cannot attend a meeting"], "g41"),
  makeQ(43, 3, "What does the woman tell the man to do?", "B", ["Download a software update", "Swap a connection cord", "Contact the IT help desk directly", "Restart the office projector"], "g41"),
  makeQ(44, 3, "What change did the company recently make?", "C", ["They updated their online catalog.", "They hired a new catering company.", "They relocated to a new office building.", "They launched a remote work policy."], "g44"),
  makeQ(45, 3, "What does the man like most about the new location?", "B", ["The large fitness center", "The nearby public transit options", "The modern interior design", "The spacious cafeteria"], "g44"),
  makeQ(46, 3, "What will the speakers do after work?", "A", ["Explore a local dining spot", "Attend a professional networking event", "Help a colleague move some boxes", "Purchase some office decorations"], "g44"),
  makeQ(47, 3, "Why is the woman talking to the man?", "C", ["To ask for assistance with presentation slides", "To apply for a digital marketing position", "To report a technical issue with a system update", "To coordinate an international travel schedule"], "g47"),
  makeQ(48, 3, "What does the man suggest doing?", "C", ["Purchasing a new tablet for content creation", "Changing the account password immediately", "Clearing the application data cache", "Re-running the monthly analytical report"], "g47"),
  makeQ(49, 3, "What will the woman do next?", "A", ["Access a computer terminal", "Attend a staff training seminar", "Email a digital layout to a client", "Order some new footwear products"], "g47"),
  makeQ(50, 3, "What is the woman's main concern?", "D", ["The high turnover rate of department staff", "The negative feedback on a product line", "The delay in shipping customer orders", "The low engagement with the corporate website"], "g50"),
  makeQ(51, 3, "What did the company do last month?", "C", ["Hired a new social media consultant", "Redesigned the employee breakroom", "Launched an updated online ordering platform", "Reduced the cost of annual subscriptions"], "g50"),
  makeQ(52, 3, "What does the man propose?", "A", ["Offering a promotional discount code", "Conducting a public opinion survey", "Organizing a webinar for clients", "Rewriting the article headlines"], "g50"),
  makeQ(53, 3, "What business do the speakers most likely work for?", "A", ["A vehicle rental company", "A commercial real estate agency", "A corporate accounting firm", "A commercial printing shop"], "g53"),
  makeQ(54, 3, "What does the woman say about the executive fleet?", "D", ["It requires a higher insurance policy.", "All cars were recently upgraded with GPS.", "The maintenance costs have doubled.", "Several vehicles are booked for the weekend."], "g53"),
  makeQ(55, 3, "What does the man say he will do next week?", "C", ["Interview candidates for a driving position", "Order more corporate stationery", "Coordinate with the maintenance workshop", "Renew the company's business license"], "g53"),
  makeQ(56, 3, "What are the speakers mainly discussing?", "D", ["Selecting a corporate health plan", "Planning a product launch party", "Implementing a security policy", "Upgrading the office interior"], "g56"),
  makeQ(57, 3, "What does the man mention about the budget?", "C", ["It was cut by twenty percent.", "It was approved by the finance director.", "It must cover the cost of delivery.", "It is higher than last year's fund."], "g56"),
  makeQ(58, 3, "What will the woman do this afternoon?", "C", ["Meet with a local graphic designer", "Print out the final layout plans", "Request samples from a supplier", "Email the staff about a schedule change"], "g56"),
  makeQ(59, 3, "What are the speakers mainly discussing?", "C", ["Expanding a digital marketing budget", "Reviewing video editing software features", "Selecting a vendor for a corporate event", "Modifying a client's travel itinerary"], "g59"),
  makeQ(60, 3, "What problem does the woman mention about the first company?", "A", ["Their weekend availability is limited.", "Their service fees are too expensive.", "Their staff lacked professional training.", "Their office is located too far away."], "g59"),
  makeQ(61, 3, "What does the man say he will do?", "C", ["Draft a new project description", "Submit an invoice to the finance team", "Request a detailed cost estimate", "Check the online ranking of a website"], "g59"),
  makeQ(62, 3, "Why is the man taking a business trip?", "B", ["To open a new retail store", "To inspect a manufacturing facility", "To attend an annual tech conference", "To sign a partnership contract"], "g62"),
  makeQ(63, 3, "Look at the graphic. Which flight will the man most likely book?", "D", ["Flight 102", "Flight 308", "Flight 411", "Flight 205"], "g62", { graphic: "/exam/graphic-q63.png", graphicAlt: "Bảng giờ bay đi Chicago: các chuyến bay 102, 308, 411, 205 và giờ khởi hành" }),
  makeQ(64, 3, "What does the woman offer to do for the man?", "B", ["Print his boarding passes", "Arrange a taxi ride to the airport", "Reimburse his travel expenses", "Pick up his luggage from the hotel"], "g62"),
  makeQ(65, 3, "Why are the speakers at the museum?", "C", ["To deliver a keynote speech", "To attend a private corporate gala", "To research ideas for a design project", "To interview a famous artist"], "g65"),
  makeQ(66, 3, "Look at the graphic. Which area of the museum will the speakers visit first?", "D", ["Zone 1", "Zone 2", "Zone 3", "Zone 4"], "g65", { graphic: "/exam/graphic-q66.png", graphicAlt: "Sơ đồ các khu vực (Zone) của bảo tàng" }),
  makeQ(67, 3, "What does the man say he will do?", "D", ["Purchase souvenir items from the gift shop", "Review the exhibition brochure", "Call the office to check on a package", "Take photographs of the visual displays"], "g65"),
  makeQ(68, 3, "What project are the speakers working on?", "A", ["Allocating an advertising budget for the next period", "Restructuring the corporate identity guidelines", "Conducting user testing for a new mobile application", "Hiring a third-party public relations firm"], "g68"),
  makeQ(69, 3, "Look at the graphic. Which campaign strategy do the speakers agree to prioritize?", "B", ["Campaign 901", "Campaign 902", "Campaign 903", "Campaign 904"], "g68", { graphic: "/exam/graphic-q69.png", graphicAlt: "Bảng tỷ lệ chuyển đổi (conversion rate) của Campaign 901–904" }),
  makeQ(70, 3, "What does the man suggest doing to improve their overall strategy?", "A", ["Collaborating with a specialized external consultant", "Reducing the subscription prices for new consumers", "Postponing the launch of a secondary product line", "Rewriting the technical user manual for clarity"], "g68"),
  // PART IV — Talks
  makeQ(71, 4, "What problem is being reported?", "A", ["An oil spill on a highway", "A broken traffic signal", "Severe winter weather", "A bridge closure"], "g71"),
  makeQ(72, 4, "When is the issue expected to be resolved?", "B", ["By mid-afternoon", "By noon", "By tomorrow morning", "Within an hour"], "g71"),
  makeQ(73, 4, "What does the speaker recommend doing?", "A", ["Taking an alternative route", "Utilizing public transit", "Postponing a trip", "Listening to weather alerts"], "g71"),
  makeQ(74, 4, "What item is being advertised?", "C", ["A household security camera", "A wireless internet router", "A smart water meter", "A water filtration system"], "g74"),
  makeQ(75, 4, "What feature of the product is highlighted?", "A", ["It sends leak notifications.", "It has a very low price.", "It runs on solar energy.", "It comes in various colors."], "g74"),
  makeQ(76, 4, "What benefit is available for buyers this week?", "C", ["A cash-back rebate", "A lifetime warranty", "Free professional installation", "Two units for the price of one"], "g74"),
  makeQ(77, 4, "What is the announcement mainly about?", "C", ["A change in lunch breaks", "A new company chef", "A cafeteria kitchen upgrade", "A parking lot expansion"], "g77"),
  makeQ(78, 4, "How long will the modification process last?", "B", ["For three days", "For two weeks", "For one month", "Throughout the summer"], "g77"),
  makeQ(79, 4, "Where can employees purchase food next week?", "D", ["At a nearby grocery store", "From a vending machine", "At the front reception desk", "In the western courtyard"], "g77"),
  makeQ(80, 4, "What event is currently taking place?", "A", ["A community arts celebration", "A local historical play", "A university graduation", "A musical concert"], "g80"),
  makeQ(81, 4, "Who is the featured speaker?", "C", ["A famous museum curator", "A professional violinist", "A classical music researcher", "A textbook publisher"], "g80"),
  makeQ(82, 4, "What activity will occur in the lobby?", "C", ["A complimentary dinner", "A live musical performance", "A book signing session", "An art auction"], "g80"),
  makeQ(83, 4, "Where are the listeners about to enter?", "B", ["A chemical laboratory", "A secure server room", "A staff cafeteria", "A storage basement"], "g83"),
  makeQ(84, 4, "What are the listeners forbidden from doing?", "A", ["Bringing in food or liquids", "Wearing loose clothing", "Touching the computer screens", "Using cellular devices"], "g83"),
  makeQ(85, 4, "What should listeners record on the log sheet?", "B", ["Their entry and exit times", "Flashing warning lights", "Room temperature readings", "Serial numbers of equipment"], "g83"),
  makeQ(86, 4, "What is the purpose of the phone call?", "D", ["To renegotiate a job offer", "To schedule a court date", "To request a payment extension", "To discuss a lease agreement"], "g86"),
  makeQ(87, 4, "What must the listener do before Friday afternoon?", "B", ["Mail a financial check", "Sign a finalized document", "Hire a property inspector", "Email a scanned contract"], "g86"),
  makeQ(88, 4, "What is the listener required to bring?", "A", ["Two forms of identification", "A copy of a tax return", "A business license", "A cash deposit"], "g86"),
  makeQ(89, 4, "Where is the announcement being made?", "C", ["At a commercial bank", "At an indoor fitness gym", "At an outdoor gear store", "At an amusement park"], "g89"),
  makeQ(90, 4, "What system is currently malfunctioning?", "A", ["The card checkout system", "The security alarm system", "The air conditioning unit", "The overhead lighting"], "g89"),
  makeQ(91, 4, "Where can an automated teller machine be found?", "C", ["Near the customer service desk", "In the employee lounge", "Outside the main exit doors", "Next to the fitting rooms"], "g89"),
  makeQ(92, 4, "What industry is Velocity Footwear part of?", "A", ["Athletic shoe manufacturing", "Electronics assembly", "Food processing", "Automobile shipping"], "g92"),
  makeQ(93, 4, "What action does the company plan to take?", "D", ["Reduce product prices", "Launch an online store", "Merge with a competitor", "Close an older facility"], "g92"),
  makeQ(94, 4, "Why is the company making this change?", "C", ["To enter a foreign market", "To comply with green laws", "To minimize overhead costs", "To resolve a labor strike"], "g92"),
  makeQ(95, 4, "Where is the announcement most likely being made?", "A", ["At an open-air amphitheater", "Inside a recording studio", "At a high school auditorium", "At a movie theater"], "g95"),
  makeQ(96, 4, "Why is a certain area closed off?", "C", ["Because of structural floor damage", "To prepare for a private catering party", "For a video filming crew's equipment", "Due to an uninstalled lighting system"], "g95"),
  makeQ(97, 4, "Look at the graphic. Which row is no longer available for seating?", "B", ["Row A", "Row B", "Row C", "Row D"], "g95", { graphic: "/exam/graphic-q97.png", graphicAlt: "Bảng ghế theo ROW và FRONT SECTION của khán đài" }),
  makeQ(98, 4, "What is the speaker primarily announcing?", "C", ["An extended gallery opening hour", "A discount on museum merchandise", "A relocation of a collection", "An upcoming guest artist lecture"], "g98"),
  makeQ(99, 4, "Look at the graphic. In which room are the ancient Greek vases currently located?", "D", ["Room 1", "Room 2", "Room 3", "Room 4"], "g98", { graphic: "/exam/graphic-q99.png", graphicAlt: "Bảng ROOM và STATUS của các phòng trưng bày bảo tàng" }),
  makeQ(100, 4, "What are visitors cautioned about?", "D", ["Low lighting conditions", "Fragile glass display boxes", "Wet floors near restrooms", "Wet paint on walls"], "g98"),
];

const GROUP_MAP = new Map(GROUPS.map((g) => [g.id, g]));
const QUESTION_MAP = new Map(QUESTIONS.map((q) => [q.id, q]));

export function getQuestionById(id: number): ExamQuestion | undefined {
  return QUESTION_MAP.get(id);
}

export function getGroupById(id: string): ExamGroup | undefined {
  return GROUP_MAP.get(id);
}

export function getGroupForQuestion(q: ExamQuestion): ExamGroup | undefined {
  return q.groupId ? GROUP_MAP.get(q.groupId) : undefined;
}

export function getGroupsByPart(part: PartNumber): ExamGroup[] {
  return GROUPS.filter((g) => g.part === part);
}

export function getQuestionsByPart(part: PartNumber): ExamQuestion[] {
  return QUESTIONS.filter((q) => q.part === part);
}

/** Đáp án đúng dạng chuỗi "1A 2C ..." để đối chiếu nhanh với đáp án chốt. */
export function answerKeyString(): string {
  return QUESTIONS.map((q) => `${q.id}${q.answer}`).join(" ");
}
