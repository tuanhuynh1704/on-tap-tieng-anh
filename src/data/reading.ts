// Dữ liệu đề TOEIC Reading — 100 câu, 3 Part (5/6/7) — READING REVISION 28/11/2026
// Nguồn: docs/extracted/reading_test_raw.md (text trích từ PDF), đáp án: docs/extracted/reading_answer_key.json
// Bất thường (giữ nguyên, không tự sửa):
//  1. Câu 78 (Part 7, Passage 11): hỏi "what can audience members do at Cole Hall?" — đoạn text message
//     không nhắc coat check, nhưng đáp án là D. "Check coats". Đáp án theo PDF đỏ.
//  2. Câu 81–85 (Passage 12): câu 85 (Q85) có đáp án D; "4. Recommendation" thứ 4 trong PDF của báo cáo
//     cảm thấy thiếu số ("More effort could be made..."). Báo cáo ở dưới hiển thị số "4." (đã khôi phục).
//  3. Câu 86–90 (Passage 13): PDF ghi "chart and emails" — thực chất receipt là bảng text, render thành table.
//  4. Giữ nguyên các lỗi gõ trong nguồn ("specialise", "colourful", "(B)donations", dấu câu…).

import type { AnswerKey, ExamOption, PartNumber } from "@/data/exam";

export type ReadingPartNumber = 5 | 6 | 7;

export interface ReadingQuestion {
  id: number;
  part: ReadingPartNumber;
  /** id bộ đoạn (Part 6/7); null với Part 5 */
  passageId: number | null;
  /** Part 5/7: câu hỏi nguyên văn; Part 6: chỗ trống nằm trong đoạn (renderer hiển thị chỉ số blank) */
  prompt: string;
  options: ExamOption[];
  answer: AnswerKey;
}

export type ReadingBlock =
  | { type: "title"; text: string }
  | { type: "subtitle"; text: string }
  | { type: "meta"; lines: string[] }
  | { type: "paragraph"; text: string } // Part 6: chứa {{31}}..{{34}}; Part 7: chứa [1]..[4]
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "email"; to: string; from: string; date: string; subject: string; body: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "box"; label: string; lines: string[] }
  | { type: "quote"; text: string; attribution: string }
  | { type: "divider" }
  | { type: "chat"; author: string; time: string; text: string };

export interface ReadingDocument {
  id: number;
  /** Nhãn hiển thị nhỏ (Email / Article / Notice / Survey response / …). */
  kind: string;
  title?: string;
  subtitle?: string;
  meta?: string[];
  blocks: ReadingBlock[];
}

export interface ReadingPassage {
  id: number;
  part: 6 | 7;
  /** Dòng nhắc thông tin "Questions 31–34 refer to…" */
  intro: string;
  documents: ReadingDocument[];
  questionIds: number[];
}

export interface ReadingPartMeta {
  part: ReadingPartNumber;
  name: string;
  nameVi: string;
  count: number;
  range: string;
  short: string;
}

export const READING_PART_META: ReadingPartMeta[] = [
  { part: 5, name: "Part 5 — Incomplete Sentences", nameVi: "Part 5 · Điền từ/cụm từ", count: 30, range: "Câu 1–30", short: "Điền từ/cụm từ" },
  { part: 6, name: "Part 6 — Text Completion", nameVi: "Part 6 · Đoạn văn", count: 16, range: "Câu 31–46", short: "Đoạn văn" },
  { part: 7, name: "Part 7 — Reading Comprehension", nameVi: "Part 7 · Đọc hiểu", count: 54, range: "Câu 47–100", short: "Đọc hiểu" },
];

export const READING_TOTAL_QUESTIONS = 100;
export const READING_TIME_SECONDS = 75 * 60;
export const READING_DATE = "28/11/2026";

function makeR(
  id: number,
  part: ReadingPartNumber,
  passageId: number | null,
  prompt: string,
  options: string[],
  answer: AnswerKey
): ReadingQuestion {
  const keys: AnswerKey[] = ["A", "B", "C", "D"];
  if (options.length !== 4) throw new Error(`Q${id}: cần đúng 4 lựa chọn, có ${options.length}`);
  return { id, part, passageId, prompt, options: options.map((text, i) => ({ key: keys[i], text })), answer };
}

export const READING_QUESTIONS: ReadingQuestion[] = [
  // ==================== PART 5 — Incomplete Sentences ====================
  makeR(1, 5, null, "One responsibility of the IT department is to ensure that the company is using ------ software.", ["updated", "updating", "updates", "update"], "A"),
  makeR(2, 5, null, "The costumes were not received ------ enough to be used in the first dress rehearsal.", ["far", "very", "almost", "soon"], "D"),
  makeR(3, 5, null, "Wheel alignments and brake system ------ are part of our vehicle service plan.", ["inspects", "inspections", "inspected", "inspector"], "B"),
  makeR(4, 5, null, "Registration for the Marketing Coalition Conference is now open ------ September 30.", ["until", "into", "yet", "while"], "A"),
  makeR(5, 5, null, "Growth in the home entertainment industry has been ------ this quarter.", ["separate", "assorted", "willing", "limited"], "D"),
  makeR(6, 5, null, "Hawson Furniture will be making ------ on the east side of town on Thursday.", ["deliver", "delivered", "deliveries", "deliverable"], "C"),
  makeR(7, 5, null, "The meeting notes were ------ deleted, but Mr. Hahm was able to recreate them from memory.", ["accident", "accidentally", "accidents", "accidental"], "B"),
  makeR(8, 5, null, "Anyone who still ------ to take the fire safety training should do so before the end of the month.", ["needs", "needing", "has needed", "were needing"], "A"),
  makeR(9, 5, null, "Emerging technologies have ------ begun to transform the shipping industry in ways that were once unimaginable.", ["already", "exactly", "hardly", "closely"], "A"),
  makeR(10, 5, null, "The company handbook outlines the high ------ that employees are expected to meet every day.", ["experts", "accounts", "standards", "recommendations"], "C"),
  makeR(11, 5, null, "The ------ information provided by Uniss Bank's brochure helps applicants understand the terms of their loans.", ["arbitrary", "supplemental", "superfluous", "potential"], "B"),
  makeR(12, 5, null, "Because ------ of the board members have scheduling conflicts, the board meeting will be moved to a date when all can attend.", ["any", "everybody", "some", "those"], "C"),
  makeR(13, 5, null, "Project Earth Group is ------ for ways to reduce transport-related greenhouse gas emissions.", ["looking", "seeing", "driving", "leaning"], "A"),
  makeR(14, 5, null, "It is wise to check a company’s dress code ------ visiting its head office.", ["so", "now", "like", "before"], "D"),
  makeR(15, 5, null, "Former Sendai Company CEO Ken Nakata spoke about ------ career experiences.", ["he", "him", "his", "himself"], "C"),
  makeR(16, 5, null, "Passengers who will be taking a ------ domestic flight should go to Terminal A.", ["connectivity", "connects", "connect", "connecting"], "D"),
  makeR(17, 5, null, "Project manager Hannah Chung has proved to be very ------ with completing company projects.", ["helpfulness", "helpful", "helpfully", "help"], "B"),
  makeR(18, 5, null, "Fresh and ------ apple-cider donuts are available at Oakcrest Orchard's retail shop for £5 per dozen.", ["eaten", "open", "tasty", "free"], "C"),
  makeR(19, 5, null, "Wexler Store's management team expects that employees will ------ support any new hires.", ["enthusiastically", "enthusiasm", "enthusiastic", "enthused"], "A"),
  makeR(20, 5, null, "Zahn Flooring has the widest selection of ------ in the United Kingdom.", ["paints", "tiles", "furniture", "curtains"], "B"),
  makeR(21, 5, null, "The project ------ the collaboration of several teams across the company.", ["passed", "decided", "required", "performed"], "C"),
  makeR(22, 5, null, "------ the closure of Verdigold Transport Services, we are looking for a new shipping company.", ["In light of", "Just as", "In spite of", "According to"], "A"),
  makeR(23, 5, null, "The Marlton City Council does not have the authority to ------ parking on city streets.", ["drive", "travel", "bother", "prohibit"], "D"),
  makeR(24, 5, null, "Our skilled tailors are happy to design a custom-made suit that fits your style and budget ------.", ["perfectly", "perfects", "perfect", "perfection"], "A"),
  makeR(25, 5, null, "Lehua Vacation Club members will receive double points ------ the month of August at participating hotels.", ["onto", "above", "during", "between"], "C"),
  makeR(26, 5, null, "As a former publicist for several renowned orchestras, Mr. Wu would excel in the role of event ------.", ["organized", "organizes", "organizer", "organizational"], "C"),
  makeR(27, 5, null, "The northbound lane on Davis Street will be ------ closed because of the city's bridge reinforcement project.", ["temporarily", "comparatively", "recently", "collectively"], "A"),
  makeR(28, 5, null, "We cannot send the store's coupon booklet to the printers until it ------ by Ms. Jeon.", ["is approving", "approves", "has been approved", "will be approved"], "C"),
  makeR(29, 5, null, "Airline representatives must handle a wide range of passenger issues, ------ missed connections to lost luggage.", ["against", "under", "on", "from"], "D"),
  makeR(30, 5, null, "The current issue of Farming Scene magazine predicts that the price of corn will rise 5 percent over the ------ year.", ["now", "with", "which", "next"], "D"),

  // ==================== PART 6 — Text Completion ====================
  makeR(31, 6, 31, "", ["safely", "safe", "safest", "safety"], "D"),
  makeR(32, 6, 31, "", ["On one hand", "Nonetheless", "Furthermore", "And yet"], "C"),
  makeR(33, 6, 31, "", ["Take advantage of dozens of useful online tools.", "Moreover, the air conditioner you chose is very popular.", "Plus, they are friendly, clean, and knowledgeable.", "Thank you for visiting our contractor showroom."], "C"),
  makeR(34, 6, 31, "", ["backs", "backed", "backing", "back"], "B"),
  makeR(35, 6, 35, "", ["seeks", "hires", "offers", "trains"], "A"),
  makeR(36, 6, 35, "", ["so", "while", "nor", "and"], "D"),
  makeR(37, 6, 35, "", ["application", "applicant", "applying", "apply"], "B"),
  makeR(38, 6, 35, "", ["Likewise, company-owned cars are a major expense for firms such as ours.", "Moreover, excellent organizational skills are essential.", "The top candidate for the position has been offered a one-year contract.", "All employees have been notified of the policy change."], "B"),
  makeR(39, 6, 39, "", ["patients", "customers", "teammates", "students"], "B"),
  makeR(40, 6, 39, "", ["The reasonable prices also make your pieces a great value.", "If you need more time, please let me know.", "I would like to show you some of my own designs.", "Unfortunately, I do not have adequate shelf space at this time."], "A"),
  makeR(41, 6, 39, "", ["repeat", "include", "double", "insure"], "C"),
  makeR(42, 6, 39, "", ["these", "you", "we", "us"], "D"),
  makeR(43, 6, 43, "", ["information", "informed", "informs", "to inform"], "D"),
  makeR(44, 6, 43, "", ["cautiously", "patiently", "largely", "quietly"], "C"),
  makeR(45, 6, 43, "", ["roles", "donations", "articles", "locations"], "A"),
  makeR(46, 6, 43, "", ["They were far away from our office.", "That time is usually critical to our work.", "The room will be theirs for six weeks.", "It will be for sale in the new cafeteria."], "C"),

  // ==================== PART 7 — Reading Comprehension ====================
  makeR(47, 7, 47, "What is the purpose of the e-mail?", ["To register for a conference", "To schedule a meeting", "To announce a new account", "To inform colleagues of an absence"], "D"),
  makeR(48, 7, 47, "What is most likely true about Ms. Soroka?", ["She will be traveling with Mr. Cullen.", "She will be out of the office until April 22.", "She is Ms. Choo's supervisor.", "She works on the Ezenx Industries account."], "D"),
  makeR(49, 7, 49, "At 8:12 A.M., what does Mr. Kwon most likely mean when he writes, \"I see an office supply store across the street\"?", ["He needs help finding a building.", "He can purchase some paper.", "He will look for a new printer.", "He is going to negotiate a delivery schedule."], "B"),
  makeR(50, 7, 49, "What will Ms. Saunders most likely do next?", ["Reschedule a meeting", "Prepare some refreshments", "Check on an arrival time", "Revise a design proposal"], "C"),
  makeR(51, 7, 51, "What will happen at Medillo Shoes on May 10?", ["Operational hours will be extended.", "Shop assistants will be hired.", "A shoe style will be discontinued.", "All shoes will be discounted."], "D"),
  makeR(52, 7, 51, "What is indicated about Medillo Shoes?", ["It is located next to a medical center.", "It specializes in athletic footwear.", "It allows customers to make appointments.", "It has been in business for ten years."], "C"),
  makeR(53, 7, 53, "What is indicated about the river tour?", ["It sells out quickly.", "It can be rescheduled.", "It is one hour long.", "It comes with a meal."], "D"),
  makeR(54, 7, 53, "How many tickets did Mr. Califf purchase?", ["1", "3", "4", "7"], "C"),
  makeR(55, 7, 53, "How can customers receive a discount on a walking tour?", ["By making a reservation online", "By mentioning a confirmation code", "By requesting a coupon from the captain", "By paying with a credit card"], "B"),
  makeR(56, 7, 56, "What change is the Building Permit Office making?", ["It is reducing the number of days it will accept permit applications.", "It is simplifying the permit application process.", "It is moving to a new location.", "It is increasing the processing time for permit applications."], "A"),
  makeR(57, 7, 56, "According to the notice, why is the change being made?", ["To improve the quality of service", "To save the city money", "To attract more residents", "To decrease the number of new permit applications"], "B"),
  makeR(58, 7, 58, "What is suggested about Ms. Omar?", ["She is an accountant.", "She is a Kipbank customer.", "She works for Mr. Piskorksi.", "She operates a small company."], "D"),
  makeR(59, 7, 58, "What is stated about the credit cards?", ["They come in a variety of colors.", "They require an annual fee.", "They include discounts on certain purchases.", "They can be used to buy personal items."], "C"),
  makeR(60, 7, 58, "In which of the positions marked [1], [2], [3], and [4] does the following sentence best belong? \"Everyday financial details only add more distractions.\"", ["[1]", "[2]", "[3]", "[4]"], "A"),
  makeR(61, 7, 61, "What is the purpose of the article?", ["To highlight a company's achievement", "To analyze a trend in the electronics industry", "To profile a newly opened business", "To discuss changes to an employee contract"], "A"),
  makeR(62, 7, 61, "What is suggested about Carila Corporation?", ["It no longer develops electronics.", "It was once a struggling business.", "It has been unable to attract more clients.", "It is seeking to replace its CEO."], "B"),
  makeR(63, 7, 61, "The word \"solution\" in paragraph 3 is closest in meaning to", ["mixture", "proof", "answer", "statement"], "C"),
  makeR(64, 7, 64, "What Commbolt benefit does the advertisement mention?", ["Its low prices", "Its lifetime contracts", "Its excellent customer service", "Its convenient installation schedule"], "C"),
  makeR(65, 7, 64, "What is the maximum amount a customer can earn when one referred person signs up for service?", ["$20.00", "$10.00", "$45.00", "$60.00"], "D"),
  makeR(66, 7, 64, "What is true about the Commbolt promotion?", ["It may not be posted on social media.", "It rewards both new and existing customers.", "It is expected to run for a full year.", "It does not provide credit for more than three referrals."], "B"),
  makeR(67, 7, 64, "In which of the positions marked [1], [2], [3], or [4] does the following sentence best belong? \"Just share your unique referral code with friends and family.\"", ["[1]", "[2]", "[3]", "[4]"], "C"),
  makeR(68, 7, 68, "Why does Mr. Steuber write to Ms. Rajan?", ["To check on the status of a meeting", "To make travel plans for a business trip", "To invite her to a professional event", "To ask about an assistant's performance"], "A"),
  makeR(69, 7, 68, "At 10:45 A.M., what does Mr. Steuber most likely mean when he writes, \"Let me check with my supervisor\"?", ["He needs final approval on a book design.", "He is uncertain how to add team members to the chat.", "He would like advice on changing an appointment.", "He requires access to the corporate calendar."], "C"),
  makeR(70, 7, 68, "Who most likely is Ms. Benoit?", ["A production editor", "A designer", "A printing plant supervisor", "A writer"], "D"),
  makeR(71, 7, 68, "What will Ms. Rajan probably do next?", ["Suggest solutions to a printing issue", "Attend a meeting with Ms. Luong", "Reschedule a video conference", "Arrange to visit the Singapore plant"], "C"),
  makeR(72, 7, 72, "What is indicated about Sarah's Catering?", ["It specializes mainly in weddings.", "It is twenty years old.", "It uses locally sourced products.", "It has an on-site dining room."], "C"),
  makeR(73, 7, 72, "The word \"taste\" in paragraph 1 is closest in meaning to", ["experience", "preference", "flavor", "sample"], "B"),
  makeR(74, 7, 72, "What is mentioned as a service provided by Sarah's Catering?", ["Entertainment planning", "Cooking demonstrations", "Cleanup after meals", "Rentals of tables and chairs"], "C"),
  makeR(75, 7, 72, "Who most likely is Mr. Liu?", ["A customer of Sarah's Catering", "A professional event manager", "An employee of Sarah's Catering", "An assistant at a marketing firm"], "A"),
  makeR(76, 7, 76, "Who was originally scheduled to perform at the Bramley Theater?", ["Johanna Greenblatt", "Jefferson Cage", "The Rolling Dozen", "The Blass Brothers Band"], "D"),
  makeR(77, 7, 76, "What does the schedule suggest about the Rambling River Festival?", ["It takes place annually.", "It features local food vendors.", "It requires a ticket for entry.", "It is mainly an outdoor event."], "D"),
  makeR(78, 7, 76, "According to the text message, what can audience members do at Cole Hall?", ["Pick up a schedule of events", "Store bulky items", "Buy concert tickets", "Check coats"], "D"),
  makeR(79, 7, 76, "In the text message, the word \"pushed\" in paragraph 2 is closest in meaning to", ["moved", "extended", "managed", "pressured"], "A"),
  makeR(80, 7, 76, "When will Kirschau perform?", ["At 3:30 P.M. on Friday", "At 8:00 P.M. on Friday", "At 2:30 P.M. on Saturday", "At 6:30 P.M. on Saturday"], "B"),
  makeR(81, 7, 81, "In his e-mail, what does Mr. Grewal indicate about the survey?", ["It does not have an end date.", "It requires the use of a password.", "It can be completed on paper.", "It should not be shared with others."], "D"),
  makeR(82, 7, 81, "According to the e-mail, what do some Woolf Flooring employees disagree with?", ["The way a survey is structured", "The plan to hire outside consultants", "The way a budget report is presented", "The departments selected to provide feedback"], "B"),
  makeR(83, 7, 81, "What can be concluded about Ms. Mair?", ["She regularly provides ideas for change.", "She has worked at Woolf Flooring for many years.", "She will be helping to collect feedback.", "She works in the production department."], "B"),
  makeR(84, 7, 81, "In the survey, what does Ms. Mair note about her suggestion?", ["It has been suggested to management before.", "It has worked well at other companies.", "It could be implemented right away.", "It may require some new equipment."], "C"),
  makeR(85, 7, 81, "What recommendation made by Miyoko Consulting corresponds with Ms. Mair's suggestion?", ["Recommendation 1", "Recommendation 2", "Recommendation 3", "Recommendation 4"], "D"),
  makeR(86, 7, 86, "What is a policy of George Street Sweets?", ["Orders placed less than 48 hours before pickup incur an extra fee.", "Orders cannot be refunded within 24 hours of pickup.", "Orders must be paid for when they are placed.", "Orders cannot be changed."], "B"),
  makeR(87, 7, 86, "What is suggested about the building at 2 Spen Lane?", ["It has parking spaces behind a bicycle shop.", "It is owned by Ms. Schwartz.", "It is a residential apartment building.", "It is located within 10 kilometers of George Street Sweets."], "D"),
  makeR(88, 7, 86, "What can be concluded about the cake?", ["It has not been paid for yet.", "It was ordered over the phone.", "It will have only chocolate icing.", "It contains ice cream."], "B"),
  makeR(89, 7, 86, "In the second e-mail, what does Mr. Ordaz request?", ["A response to an e-mail", "A different flavor", "A full refund", "An additional candle"], "A"),
  makeR(90, 7, 86, "What does Mr. Ordaz mention about the event in his e-mail?", ["It will take place on April 29.", "It is an anniversary party.", "It will be larger than expected.", "Its start time has changed."], "C"),
  makeR(91, 7, 91, "What is one purpose of the e-mail?", ["To provide details on a new privacy policy", "To propose a survey of banking habits", "To ask bank staff to test a mobile app", "To inform managers of a company problem"], "D"),
  makeR(92, 7, 91, "According to the e-mail, what percentage of the bank's customers use the mobile app?", ["39 percent", "78 percent", "23 percent", "95 percent"], "A"),
  makeR(93, 7, 91, "In the article, the word \"anticipates\" is closest in meaning to", ["prepares for", "waits for", "expects", "considers"], "C"),
  makeR(94, 7, 91, "Who most likely attended a meeting at Ogden Bank headquarters on April 12?", ["Mr. Panzius", "Ms. DeFreese", "Mr. Baum", "Ms. Reed"], "B"),
  makeR(95, 7, 91, "What is suggested about Ogden Bank's management?", ["It prefers that account holders do their banking in person.", "It is in the process of hiring more staff.", "It prioritizes improvements in customer experience.", "It is considering offering free checking to new account holders."], "C"),
  makeR(96, 7, 96, "What is the purpose of the notice?", ["To promote an activity at the library", "To announce a change in library hours", "To highlight some books in the library", "To introduce a new librarian"], "A"),
  makeR(97, 7, 96, "What is suggested about the book Wild Open Range?", ["It is a best-selling title", "It is a work of nonfiction.", "It was published ten years ago.", "It is available at a discount for library members."], "B"),
  makeR(98, 7, 96, "What author most likely wrote about a famous person?", ["Jaxon McDonald", "Kai Noble", "Peter Landers", "Lucy Xi"], "B"),
  makeR(99, 7, 96, "What can be concluded about Ms. Calle?", ["She favors historical fiction.", "She has written book reviews.", "She is Ms. Frey's supervisor.", "She is a library staff member."], "D"),
  makeR(100, 7, 96, "What does Ms. Frey indicate about the book she read?", ["It discussed a topic that was unfamiliar to her.", "It had parts that she thought were inaccurate.", "It inspired her to explore an old interest. .", "It was easy to read in the time available"], "C"),
];

// ---------- Part 7 passages ----------

export const READING_PASSAGES: ReadingPassage[] = [
  {
    id: 31, part: 6,
    intro: "Questions 31–34 refer to the following advertisement.",
    documents: [
      { id: 1, kind: "Advertisement", title: "Keep Cool Service Contractors", meta: ["67 Main Road, Edinburgh Village · Chaguanas, Trinidad and Tobago"], blocks: [
        { type: "paragraph", text: "Keep Cool Service Contractors can bring you peace of mind. As part of an annual contract, we will service your air-conditioning system, ensuring your {{31}} and comfort. This includes inspecting the system, making repairs as needed, and professionally cleaning your air ducts. {{32}}, if necessary, we can replace your old air-conditioning system with a new, cost-efficient one." },
        { type: "paragraph", text: "Our workers are highly qualified licensed technicians who stay up-to-date with ongoing training. {{33}}. We promise you fair prices and professional work, {{34}} by our Keep Cool guarantee. Call 1-868-555-0129 for a free quote today." },
      ] },
    ],
    questionIds: [31, 32, 33, 34],
  },
  {
    id: 35, part: 6,
    intro: "Questions 35–38 refer to the following job advertisement.",
    documents: [
      { id: 1, kind: "Advertisement", title: "Berestoff Ltd.", blocks: [
        { type: "paragraph", text: "Berestoff Ltd. {{35}} a professional procurement officer to oversee bidding and procurement processes in all company departments. This employee will draft advertisements, prepare contract documents, process bids, {{36}} provide training on policy and procedures to company personnel." },
        { type: "paragraph", text: "The position requires a two-year degree in business administration or a related field. The {{37}} must have a minimum of three years experience as an office manager in a corporate environment, including recent experience in procurement. {{38}}." },
      ] },
    ],
    questionIds: [35, 36, 37, 38],
  },
  {
    id: 39, part: 6,
    intro: "Questions 39–42 refer to the following email.",
    documents: [
      { id: 1, kind: "Email", meta: ["To: Jang-Ho Kwon jkwon@newart.nz", "From: Kenneth Okim k.okim@okimjewelry.nz", "Subject: Good news", "Date: 30 August"], blocks: [
        { type: "email", to: "Jang-Ho Kwon jkwon@newart.nz", from: "Kenneth Okim k.okim@okimjewelry.nz", date: "30 August", subject: "Good news", body: [
          "Dear Jang-Ho,",
          "Thank you for the shipment last month of 80 units of your jewelry pieces. I am happy to report that they have been selling very well in my shop.",
          "My {{39}} love the colourful designs as well as the quality of your workmanship. {{40}}.",
          "I would like to increase the number of units I order from you. Would you be able to {{41}} my order for the September shipment?",
          "Finally, I would like to discuss the possibility of featuring your work exclusively in my store. I believe that I could reach your target audience best and that the agreement would serve {{42}} both very well.",
          "I look forward to hearing from you.",
          "Best regards,",
          "Kenneth Okim",
          "Okim Jewelry",
        ] },
      ] },
    ],
    questionIds: [39, 40, 41, 42],
  },
  {
    id: 43, part: 6,
    intro: "Questions 43–46 refer to the following email.",
    documents: [
      { id: 1, kind: "Email", meta: ["To: Hong Kong Office Staff", "From: Wai-Lun Yeung", "Date: Monday, 4 January", "Subject: Interns"], blocks: [
        { type: "email", to: "Hong Kong Office Staff", from: "Wai-Lun Yeung", date: "Monday, 4 January", subject: "Interns", body: [
          "Dear Colleagues,",
          "I am writing {{43}} you that two university students will be arriving next week and beginning their six-week internships in the Hong Kong office. Their duties will {{44}} consist of helping the Corporate Social Responsibility team organise their plans for the coming year. Both interns have strong backgrounds in responsible business practices. As such, they will be well suited to their {{45}}.",
          "The interns will be using the vacant office in the east wing. {{46}}. Please let me know if you have any questions or concerns.",
          "All best,",
          "Wai-Lun Yeung.",
        ] },
      ] },
    ],
    questionIds: [43, 44, 45, 46],
  },
  {
    id: 47, part: 7,
    intro: "Questions 47–48 refer to the following email.",
    documents: [
      { id: 1, kind: "Email", meta: ["To: Sales Team", "From: Neil Cullen", "Date: 10 April", "Subject: My schedule next week"], blocks: [
        { type: "email", to: "Sales Team", from: "Neil Cullen", date: "10 April", subject: "My schedule next week", body: [
          "Dear Team,",
          "I will be out of the office next week, from 15 to 19 April, attending the conference of the National Technology Alliance in Glasgow. While away, I will check e-mail and voice mail infrequently. For any urgent matters, please contact my assistant, Christina Choo. If you have a specific question about the Ezenx Industries account, please e-mail Mya Soroka.",
          "I will be back in the office on 22 April and will see all of you then.",
          "Best,",
          "Neil Cullen, Director of Sales and Marketing",
          "Shallok Technology",
        ] },
      ] },
    ],
    questionIds: [47, 48],
  },
  {
    id: 49, part: 7,
    intro: "Questions 49–50 refer to the following messages.",
    documents: [
      { id: 1, kind: "Chat", blocks: [
        { type: "chat", author: "Michiko Saunders", time: "8:06 A.M.", text: "Hi, Jacob. Are you on your way to the office?" },
        { type: "chat", author: "Jacob Kwon", time: "8:08 A.M.", text: "Yes. I should be there in about 25 minutes." },
        { type: "chat", author: "Michiko Saunders", time: "8:10 A.M.", text: "OK. I was just starting to print out the design proposal for the Dansby Group, but we've run out of paper. And we don't have another delivery of it coming until Wednesday." },
        { type: "chat", author: "Jacob Kwon", time: "8:12 A.M.", text: "I see an office supply store across the street. It just opened for the day." },
        { type: "chat", author: "Michiko Saunders", time: "8:13 A.M.", text: "Fantastic. Three packs of paper should be enough." },
        { type: "chat", author: "Jacob Kwon", time: "8:15 A.M.", text: "OK. By the way, when will the representatives from the Dansby Group be coming to our office? I could also pick up some coffee and snacks for that meeting." },
      ] },
    ],
    questionIds: [49, 50],
  },
  {
    id: 51, part: 7,
    intro: "Questions 51–52 refer to the following advertisement.",
    documents: [
      { id: 1, kind: "Advertisement", title: "Medillo Shoes Celebrates Twenty Years in Cape Town!", meta: ["246 Breda Place, Wynberg, Cape Town 7800", "021 555 0149 | www.medilloshoes.co.za"], blocks: [
        { type: "paragraph", text: "Does your job require you to stand all day long? Get the support you need! At Medillo Shoes, we specialise in comfortable, supportive footwear that is stylish and suitable for any business or medical setting. Visit us on 10 May to receive 20 percent off your purchase of one or more pairs of shoes during this anniversary event. Should you need assistance finding the best shoes for your professional needs, our footwear specialists will be on hand to help. Schedule a free consultation at www.medilloshoes.co.za to avoid a long wait." },
      ] },
    ],
    questionIds: [51, 52],
  },
  {
    id: 53, part: 7,
    intro: "Questions 53–55 refer to the following notice.",
    documents: [
      { id: 1, kind: "Notice", title: "River Thames Tours", meta: ["Name: Lewis Califf", "Purchase Date: 18 April", "Confirmation Code: H102057"], blocks: [
        { type: "paragraph", text: "Thank you for reserving a River Thames tour with us. We are eager to welcome you aboard. Each tour lasts 3 hours. Your tour includes a luncheon served at 1:00 p.m. Please consult our website for a menu. Should you have any dietary restrictions and like to request a special meal, please contact our customer experience manager, Martin Torma, at least 48 hours prior to your tour. This reservation also entitles you to a 10 percent discount on a walking tour by Edgerton Walking Tours—just provide your confirmation code when booking." },
      ] },
      { id: 2, kind: "Reservation details", blocks: [
        { type: "paragraph", text: "Tour Start: 1 May, 11:30 a.m." },
        { type: "paragraph", text: "Quantity: 4" },
        { type: "paragraph", text: "Total: £180.00" },
        { type: "paragraph", text: "Payment: Credit card ending in 1037" },
        { type: "paragraph", text: "Please note: Boarding ends 10 minutes before departure time. Tours cannot be rescheduled." },
      ] },
    ],
    questionIds: [53, 54, 55],
  },
  {
    id: 56, part: 7,
    intro: "Questions 56–57 refer to the following notice.",
    documents: [
      { id: 1, kind: "Notice", title: "CITY OF BRYANTON", subtitle: "Building Permit Office", blocks: [
        { type: "paragraph", text: "Notice for residents and contractors working in Bryanton." },
        { type: "paragraph", text: "Beginning on Monday, July 1, the City of Bryanton's Building Permit Office, located at 912 Fir Avenue, will be open from Monday to Thursday, 9:00 A.M. to 5:00 P.M. Applications for permits will no longer be accepted on Fridays or Saturdays. The average processing time for permit applications will remain three business days. With this change, the city will lower its operating costs while maintaining its high standards of service for residents." },
      ] },
    ],
    questionIds: [56, 57],
  },
  {
    id: 58, part: 7,
    intro: "Questions 58–60 refer to the following email.",
    documents: [
      { id: 1, kind: "Email", meta: ["Kipbank Business Services", "548 Sycamore Lake Road", "Green Bay, WI 54301", "April 2", "Madeline Omar", "Passionflower Interior Design", "1556 Deer Run Road", "Green Bay, WI 54301"], blocks: [
        { type: "email", to: "Madeline Omar", from: "Thomas Piskorksi, Kipbank Customer Concierge", date: "April 2", subject: "", body: [
          "Dear Ms. Omar,",
          "A business owner's days are filled with juggling the wants, needs, and demands of customers, staff, and suppliers. — [1] —.",
          "Let Kipbank find the right solutions for your small business so that you can focus on your products and people. Kipbank offers checking accounts, corporate credit cards, business loans, and payroll and bookkeeping services. — [2] —. This fall, we will also add financial planners to our team to help you and your employees plan for your futures.",
          "With our corporate credit cards, Kipbank customers can take advantage of money-saving offers from selected hotel, office supply, and air travel partners. — [3] —. These deals are automatically applied to qualified purchases. And the business owner can place spending limits on each card. — [4] —.",
          "Please call us at 920-555-0122 to set up an appointment or just stop by when it is convenient. We look forward to meeting you and providing your enterprise with superior service.",
          "Sincerely,",
          "Thomas Piskorksi, Kipbank Customer Concierge",
        ] },
      ] },
    ],
    questionIds: [58, 59, 60],
  },
  {
    id: 61, part: 7,
    intro: "Questions 61–63 refer to the following article.",
    documents: [
      { id: 1, kind: "Article", title: "Waldenstone Corporate Prize", blocks: [
        { type: "paragraph", text: "OTTAWA (22 May) — Waldenstone Business Review has added a new category to its esteemed international business awards this year. The Waldenstone Corporate Prize is awarded to a business with the foresight to develop strategies that help ensure the company's long-term viability." },
        { type: "paragraph", text: "This year's award was presented to Carila Corporation, a major player in the electronics sector. Under the direction of CEO Atsak Kakar, Carila Corporation went from near bankruptcy to a high level of profitability in just three years. \"Winning this award was very gratifying, not just for me but for the entire company,\" Mr. Kakar said upon receiving the award. \"Everyone has worked extremely hard to get this company back on solid financial ground. The long-term solution has brought exceptional value to our shareholders.\"" },
      ] },
    ],
    questionIds: [61, 62, 63],
  },
  {
    id: 64, part: 7,
    intro: "Questions 64-67 refer to the following job posting.",
    documents: [
      { id: 1, kind: "Advertisement", title: "Commbolt is for Everyone!", blocks: [
        { type: "paragraph", text: "As a Commbolt customer, you've come to expect the best in reliable high-speed Internet, straightforward pricing options, and top-notch customer service from friendly professionals who are responsive to your every need. — [1] —. Unlike the competition, we promise to never lock you into inflexible contracts or suddenly raise your monthly bill without notice." },
        { type: "paragraph", text: "At Commbolt, we know you have options when it comes to choosing an Internet service provider. — [2] —. To show our gratitude for your loyalty, we are offering a special limited-time referral bonus. The way it works is simple. — [3] —. You can use e-mail, social media, or even text messages to tell everyone about Commbolt. When a new user signs up using your code, each of you will receive a monetary credit. The new customer will receive a $45 credit, while you, as the person making the referral, will receive a $60 credit. The best news? — [4] —. There is no limit to the credits; the more people you sign up, the more money you get. Your unique code is XA4R177." },
      ] },
    ],
    questionIds: [64, 65, 66, 67],
  },
  {
    id: 68, part: 7,
    intro: "Questions 68–71 refer to the following online chat discussion.",
    documents: [
      { id: 1, kind: "Chat", blocks: [
        { type: "chat", author: "Marcus Steuber", time: "10:41 A.M.", text: "Are we still planning to have the author video conference today? I haven't yet received a meeting invitation." },
        { type: "chat", author: "Brinda Rajan", time: "10:42 A.M.", text: "I do have the meeting on my calendar. Let me forward it to you; it appears our editorial assistant didn't include you." },
        { type: "chat", author: "Marcus Steuber", time: "10:43 A.M.", text: "Thanks, I just received it. The timing doesn't work for me, though. I have an appointment with Hazel Luong to discuss the printing issues at our Singapore plant." },
        { type: "chat", author: "Brinda Rajan", time: "10:44 A.M.", text: "Could you postpone that? The new author we're working with really needs your guidance on the final book design and formatting. You're our most knowledgeable production editor." },
        { type: "chat", author: "Marcus Steuber", time: "10:45 A.M.", text: "Let me check with my supervisor. I'll add Mr. Borg to our chat." },
        { type: "chat", author: "Joshua Borg", time: "10:47 A.M.", text: "Hi, team. Marcus, you should prioritize your appointment with Hazel. I'll be visiting the plant next week, and we need to have some viable solutions before then." },
        { type: "chat", author: "Brinda Rajan", time: "10:48 A.M.", text: "OK, I'll contact Ms. Benoit to find out if she can meet later in the day, then." },
        { type: "chat", author: "Marcus Steuber", time: "10:48 A.M.", text: "That would work. I'm free between 4 and 6 P.M." },
      ] },
    ],
    questionIds: [68, 69, 70, 71],
  },
  {
    id: 72, part: 7,
    intro: "Questions 72–75 refer to the following article.",
    documents: [
      { id: 1, kind: "Article", title: "Sarah's Catering - What You Serve Matters", blocks: [
        { type: "paragraph", text: "Sarah's Catering is a family-owned-and-operated company. The company was founded ten years ago with a mission to provide the highest quality catering services in our community. We work closely with local growers and use only the freshest ingredients. Our menu items can be adapted to the client's taste or dietary needs. For example, we can prepare vegetarian, vegan, and gluten-free options." },
        { type: "paragraph", text: "We provide catering for birthday parties, wedding receptions, corporate meetings, business holiday parties, and many other types of events. From planning the menu and preparing your food to engaging servers and cleanup staff for the event, Sarah's Catering has it covered. Sarah's Catering can cater lunches in your office for a minimum of twenty people. We offer delicious options to make your group's meal a satisfying experience. We're here to serve you! Ordering is fast and simple. Visit www.sarahscatering.com/quote to request a cost estimate for your next event." },
        { type: "paragraph", text: "What people are saying" },
        { type: "quote", text: "\"Sarah's Catering was very easy to work with, and the food was delicious! Everyone in the office commented on how good the food was.\" — Glen Liu, Perkins Real Estate", attribution: "" },
        { type: "quote", text: "\"All the food was perfect, and the staff was the best.\" — Annie Pierce, Kania Marketing, Inc.", attribution: "" },
      ] },
    ],
    questionIds: [72, 73, 74, 75],
  },
  {
    id: 76, part: 7,
    intro: "Questions 76-80 refer to the following article and e-mail.",
    documents: [
      { id: 1, kind: "Schedule box", blocks: [
        { type: "paragraph", text: "Rambling River Festival Schedule of Musical Events" },
        { type: "paragraph", text: "Friday, September 8" },
        { type: "paragraph", text: "● 3:30 P.M. Johanna Greenblatt" },
        { type: "paragraph", text: "● 8:00 P.M. Bethesda Radio Show featuring the Blass Brothers Band (to be recorded at the Bramley Theater)" },
        { type: "paragraph", text: "Saturday, September 9" },
        { type: "paragraph", text: "● 6:30 P.M. The Rolling Dozen" },
        { type: "paragraph", text: "● 7:45 P.M. Jefferson Cage" },
        { type: "paragraph", text: "All events take place at the Bethesda Park Open-Air Stage unless otherwise noted. Feel free to bring picnic blankets." },
      ] },
      { id: 2, kind: "Text Message", blocks: [
        { type: "paragraph", text: "This afternoon's performance will take place in Cole Hall in anticipation of inclement weather. This evening's performance is being pushed to 2:30 P.M. tomorrow; local band Kirschau will perform during the original time slot instead." },
      ] },
    ],
    questionIds: [76, 77, 78, 79, 80],
  },
  {
    id: 81, part: 7,
    intro: "Questions 81–85 refer to the following e-mail, survey, and report.",
    documents: [
      { id: 1, kind: "Email", meta: ["To: Undisclosed Recipients", "From: iqbal_grewal@woolfflooring.com.au", "Date: 12 June", "Subject: Cost-savings survey"], blocks: [
        { type: "email", to: "Undisclosed Recipients", from: "iqbal_grewal@woolfflooring.com.au", date: "12 June", subject: "Cost-savings survey", body: [
          "Dear Colleagues,",
          "At Woolf Flooring we are looking for ways to reduce day-to-day costs without sacrificing product quality, customer service, or staff morale. To this end, we are seeking input from select staff members in a variety of departments via an online survey that can be found at www.surveyquest.com.au/109820. Everyone who has been chosen to take part in the survey has been with the company for at least ten years and, therefore, is very familiar with our processes. The deadline for completing the survey is 19 June. Note that this survey is for recipients of this e-mail only. Please do not forward this e-mail to others or post the link to the survey elsewhere.",
          "We also plan to hire outside consultants to review our operations and write a report of their findings. We understand that some colleagues disagree with this approach to cutting costs; however, we have determined that getting an outside perspective is a worthwhile investment that will be likely to save us money in the long run.",
          "Best,",
          "Iqbal Grewal, Director of Business Transformation",
          "Woolf Flooring",
        ] },
      ] },
      { id: 2, kind: "Survey response", title: "Woolf Flooring Cost-Savings Survey", meta: ["Date: 18 June"], blocks: [
        { type: "paragraph", text: "Based on your experience as an employee of Woolf Flooring, please provide one idea for a change that could be implemented to improve productivity and cut costs. Thank you." },
        { type: "paragraph", text: "Name and role: Beth Mair, sales manager" },
        { type: "paragraph", text: "I have noticed that some employees grab a new pair of disposable gloves every time they return from a break. They could be using the same ones throughout the whole day. By limiting the use of gloves to one pair per day, Woolf Flooring would save thousands of dollars per year. Doing so would also reduce waste. A new policy regarding the use of personal protective items would be easy to implement immediately and would simply require sending a company-wide e-mail to explain it." },
      ] },
      { id: 3, kind: "Report summary", title: "The Consulting Report Summary", meta: ["Miyoko Consulting", "Woolf Flooring Report Summary"], blocks: [
        { type: "paragraph", text: "Thank you for allowing us to spend the last few weeks reviewing your operations. You will find a detailed expense-reduction report with projected savings in the pages that follow. Here is a list of our main recommendations." },
        { type: "list", ordered: true, items: [
          "1. Employees do not always use wood stains and other materials as efficiently as possible. More training time could be dedicated to this.",
          "2. Employees could be more mindful of electricity costs—for instance, turning off all lights and machines when not in use.",
          "3. Several Internet service providers are offering special pricing right now. Switching to one of these providers could save a considerable amount of money in the long run.",
          "4. More effort could be made to reuse supplies—for example, some basic personal protective equipment could be used more than once.",
        ] },
      ] },
    ],
    questionIds: [81, 82, 83, 84, 85],
  },
  {
    id: 86, part: 7,
    intro: "Questions 86-90 refer to the following chart and emails.",
    documents: [
      { id: 1, kind: "Email", meta: ["Order: 47892", "Date of Order: 28 April", "Pickup Date and Time: N/A", "Delivery Date and Time: 2 May, 11:30 A.M.", "Delivery Location: 2 Spen Lane, Business Suite 202", "Payment Method: Credit Card—Alejandro Ordaz", "Customisation Instructions: None"], blocks: [
        { type: "paragraph", text: "Attachment: Order receipt" },
        { type: "email", to: "Mr. Ordaz", from: "Tatiana Schwartz <orders@georgestreetsweets.co.uk>", date: "28 April", subject: "Confirmation of order number 47892", body: [
          "Dear Mr. Ordaz,",
          "Thank you for placing an order with George Street Sweets. This e-mail is to confirm that we have received your request. Your receipt has been attached to this e-mail.",
          "If you have any questions or need to make any changes to your order, please reply to this message or phone us at (091) 498 0172. Note that we are unable to accommodate order changes that are submitted less than 48 hours before your scheduled pickup time.",
          "If picking up your order, we are located at 29 George Street. Parking is available next door, directly behind Spike's Cycle Shop. We offer delivery to customers within 10 kilometres of our shop for a fee of £2.50. Please note that cancellations within 24 hours of your pickup or delivery time will not be refunded.",
          "Sincerely,",
          "Tatiana Schwartz",
          "George Street Sweets",
        ] },
      ] },
      { id: 2, kind: "Order receipt", blocks: [
        { type: "table", headers: ["Item", "Cost"], rows: [
          ["18-inch round cake (chocolate with vanilla icing)", "£32.00"],
          ["1 set of candles", "£5.00"],
          ["Delivery", "£2.50"],
          ["Total", "£39.50"],
        ] },
      ] },
      { id: 3, kind: "Email", meta: ["From: Alejandro Ordaz <aordaz@brooksidestationery.co.uk>", "To: Tatiana Schwartz <orders@georgestreetsweets.co.uk>", "Date: 29 April", "Subject: RE: Confirmation of order number 47892"], blocks: [
        { type: "email", to: "Tatiana Schwartz <orders@georgestreetsweets.co.uk>", from: "Alejandro Ordaz <aordaz@brooksidestationery.co.uk>", date: "29 April", subject: "RE: Confirmation of order number 47892", body: [
          "Dear Ms. Schwartz,",
          "I received my order confirmation e-mail and receipt, and I noticed an error. It seems that the person to whom I spoke on the phone while placing my order did not copy down the message I requested. The customisation I specified was that “Happy Retirement” be written on top. I hope it will still be possible to include this message despite the timing. Please respond to this e-mail to confirm.",
          "Also, there will be more guests than I originally expected, so I might contact your business again to place an additional order.",
          "Best,",
          "Alejandro Ordaz",
        ] },
      ] },
    ],
    questionIds: [86, 87, 88, 89, 90],
  },
  {
    id: 91, part: 7,
    intro: "Questions 91-95 refer to the following e-mails.",
    documents: [
      { id: 1, kind: "Email", meta: ["To: All Branch Managers", "From: Fran Corliss", "Date: April 7", "Subject: Survey results on mobile banking"], blocks: [
        { type: "email", to: "All Branch Managers", from: "Fran Corliss", date: "April 7", subject: "Survey results on mobile banking", body: [
          "Hello all,",
          "Ogden Bank recently conducted a survey of its customers concerning mobile banking. Here are some key takeaways. Over 95 percent of our customers own a mobile device. However, although interest in mobile banking is high, only 39 percent of our customers use our application. Some customers cite security concerns (23 percent), but a majority (78 percent) say that they simply do not think the app works well.",
          "A mandatory meeting for all branch managers will be held at our headquarters on April 12 at 4:00 P.M. to brainstorm strategies for responding to this challenge.",
          "Best,",
          "Fran Corliss",
          "Director of Mobile Banking, Ogden Bank",
        ] },
      ] },
      { id: 2, kind: "Article", title: "Boost for Mobile Banking", subtitle: "By Edward Panzius", blocks: [
        { type: "paragraph", text: "FLEMINGTON (May 25)— Ogden Bank has rolled out major improvements to its mobile banking application. It has expanded the variety of tasks that can be accomplished through the app and made it much easier to use." },
        { type: "quote", text: "“Many of our account holders have been frustrated in the past by a clunky, limited app,” said Alys DeFreese, manager of the Flemington branch of Ogden Bank. “They can now do just about any task with the app that they could over the phone or by visiting a branch in person. This is just another example of how we support our customers in any way we can.”", attribution: "" },
        { type: "quote", text: "According to Ms. DeFreese, in the few weeks since the upgrade, 20 percent of account holders have switched to depositing checks and paying bills online. She anticipates that number will rise as more customers learn about the easy-to-use app. “The convenience made a big difference for me,” said account holder Yair Baum. Another customer, Maria Reed, added, “I appreciate the flexibility of being able to do my banking whenever and wherever I want.”", attribution: "" },
      ] },
    ],
    questionIds: [91, 92, 93, 94, 95],
  },
  {
    id: 96, part: 7,
    intro: "Questions 96-100 refer to the following e-mail, article, and Web page.",
    documents: [
      { id: 1, kind: "Notice", title: "Attention, Library Members", blocks: [
        { type: "paragraph", text: "The Westwood Library is excited to announce the start of a book club, which is open to all library members. The club will meet on the last Thursday of each month, from 7:00 to 9:00 P.M. in the Harrison Meeting Room, to discuss a book chosen by one of our professional staff. From January to June, we will read recently published nonfiction works, and from July to December, we will focus on contemporary fiction titles." },
        { type: "paragraph", text: "For more information, visit www.westwoodlibrary.org or speak with the staff at the circulation desk." },
      ] },
      { id: 2, kind: "Web page", blocks: [
        { type: "paragraph", text: "We hope you will join us for the book club on the last Thursday of each month at 7:00 P.M.!" },
        { type: "paragraph", text: "Below are the titles selected for the first half of the year." },
        { type: "list", ordered: false, items: [
          "January: Wild Open Range by Jaxon McDonald",
          "February: The Journey of a Song by Lucy Xi",
          "March: Due North: Adventures in Alaska's Northern Territory by Isabel Beck",
          "April: The Art of Mindful Carpentry by Peter Landers",
          "May: Mary Swan: A Legend Before Her Time by Kai Noble",
          "June: To Be Announced",
        ] },
      ] },
      { id: 3, kind: "Email", meta: ["To: Lisa Calle", "From: Gail Frey", "Date: March 27", "Subject: Book club"], blocks: [
        { type: "email", to: "Lisa Calle", from: "Gail Frey", date: "March 27", subject: "Book club", body: [
          "Dear Ms. Calle,",
          "It was delightful to see you leading the book club yesterday evening. Ms. Beck's Due North is lengthy, and it was a challenge to finish it before the meeting. However, I have to thank you for choosing that book because it revived my childhood interest in traveling to Alaska. In fact, I've already looked up some tours!",
          "The club meeting was packed, and I hardly got to talk to you. We should catch up sometime soon. Perhaps we might try the new French restaurant on Looper Street. I hear it is amazing and reasonably priced.",
          "Sincerely,",
          "Gail Frey",
        ] },
      ] },
    ],
    questionIds: [96, 97, 98, 99, 100],
  },
];

const PART7_PASSAGE_BY_ID = new Map(READING_PASSAGES.map((p) => [p.id, p]));
const QUESTION_MAP = new Map(READING_QUESTIONS.map((q) => [q.id, q]));

export function getReadingQuestionById(id: number): ReadingQuestion | undefined {
  return QUESTION_MAP.get(id);
}

export function getReadingPassageById(id: number): ReadingPassage | undefined {
  return PART7_PASSAGE_BY_ID.get(id);
}

export function getReadingPassageForQuestion(q: ReadingQuestion): ReadingPassage | undefined {
  return q.passageId ? PART7_PASSAGE_BY_ID.get(q.passageId) : undefined;
}

export function getReadingQuestionsByPart(part: ReadingPartNumber): ReadingQuestion[] {
  return READING_QUESTIONS.filter((q) => q.part === part);
}

/** Các đoạn đọc (Part 6/7), nhóm theo passage. */
export function getReadingPassagesByPart(part: ReadingPassage["part"]): ReadingPassage[] {
  return READING_PASSAGES.filter((p) => p.part === part);
}

/** Số chỗ trống (mà câu hỏi Part 6 tham chiếu đến) trong một bộ đoạn — số trong {{n}} tăng dần. */
export function readingPassageBlanks(passage: ReadingPassage): number[] {
  const blanks = new Set<number>();
  const scan = (text: string) => {
    for (const m of text.matchAll(/\{\{(\d+)\}\}/g)) blanks.add(Number(m[1]));
  };
  for (const doc of passage.documents) {
    for (const b of doc.blocks) {
      if (b.type === "paragraph") scan(b.text);
      else if (b.type === "email") b.body.forEach(scan);
      else if (b.type === "quote") scan(b.text);
      else if (b.type === "box") b.lines.forEach(scan);
    }
  }
  return [...blanks].sort((a, b) => a - b);
}

/** Chuyển đoạn văn thành text thuần (strip {{n}} và [n], bỏ cấu trúc khác) — dùng để search trong review. */
export function readingPassagePlainText(passage: ReadingPassage): string {
  const strip = (text: string) =>
    text
      .replace(/\{\{\d+\}\}|\[\d\]/g, " ")
      .replace(/[\x00-\x1F]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  const blocks: string[] = [];
  for (const doc of passage.documents) {
    const parts: string[] = [];
    if (doc.title) parts.push(doc.title);
    if (doc.subtitle) parts.push(doc.subtitle);
    for (const line of doc.meta ?? []) parts.push(line);
    for (const b of doc.blocks) {
      switch (b.type) {
        case "title":
        case "subtitle":
        case "paragraph":
          parts.push(strip(b.text));
          break;
        case "meta":
          parts.push(...b.lines);
          break;
        case "list":
          parts.push(...b.items);
          break;
        case "email":
          parts.push(`To: ${b.to}`, `From: ${b.from}`, `Date: ${b.date}`, `Subject: ${b.subject}`, ...b.body);
          break;
        case "table":
          parts.push(...b.headers, ...b.rows.map((r) => r.join(" | ")));
          break;
        case "box":
          parts.push(b.label, ...b.lines);
          break;
        case "quote":
          parts.push(b.text, b.attribution);
          break;
        case "chat":
          // chat lưu trong doc.blocks của passage 49–50 — không giả định ở đây
          break;
        case "divider":
          break;
      }
    }
    // chat document: blocks là chat lines
    const chatLines = doc.blocks
      .filter((b) => b.type === "chat")
      .map((b) => (b.type === "chat" ? `${b.author} ${b.time} ${b.text}` : ""));
    if (doc.blocks.some((b) => b.type === "chat")) parts.push(...chatLines);
    blocks.push(parts.filter(Boolean).join(" "));
  }
  return blocks.join("\n\n");
}
