export interface Part5Explanation {
  translation: string;
  answerTranslation: string;
  partOfSpeech: string;
  reason: string;
}

/** Lời giải biên soạn cho từng câu Part 5, bám theo câu và bộ lựa chọn trong đề. */
export const READING_PART5_EXPLANATIONS: Record<number, Part5Explanation> = {
  1: { translation: "Một trách nhiệm của bộ phận CNTT là bảo đảm công ty đang sử dụng phần mềm được cập nhật.", answerTranslation: "được cập nhật", partOfSpeech: "Tính từ phân từ quá khứ (past participle), bổ nghĩa cho danh từ software.", reason: "Chỗ trống đứng ngay trước software nên cần từ bổ nghĩa cho danh từ. Updated mang nghĩa phần mềm đã được cập nhật; updating là V-ing, updates là danh từ số nhiều/động từ chia ngôi, update là động từ nguyên mẫu hoặc danh từ." },
  2: { translation: "Trang phục được giao không đủ sớm để dùng trong buổi tổng duyệt trang phục đầu tiên.", answerTranslation: "soon — sớm", partOfSpeech: "Trạng từ chỉ thời gian.", reason: "Cấu trúc soon enough nghĩa là đủ sớm. Far, very và almost không kết hợp tự nhiên với enough trong nghĩa cần có ở đây." },
  3: { translation: "Việc căn chỉnh bánh xe và kiểm tra hệ thống phanh là một phần trong gói bảo dưỡng xe của chúng tôi.", answerTranslation: "inspections — các cuộc kiểm tra", partOfSpeech: "Danh từ số nhiều; làm chủ ngữ ghép với Wheel alignments.", reason: "Cụm wheel alignments and brake system inspections liệt kê hai dịch vụ. Inspects là động từ, inspected là phân từ, inspector là người kiểm tra nên không song song với alignments." },
  4: { translation: "Việc đăng ký Hội nghị Marketing Coalition hiện mở đến hết ngày 30 tháng 9.", answerTranslation: "until — cho đến", partOfSpeech: "Giới từ chỉ mốc kết thúc thời gian.", reason: "Until September 30 nêu hạn cuối đăng ký. Into chỉ hướng vào, yet là trạng từ/liên từ trong ngữ cảnh khác, while cần một mệnh đề." },
  5: { translation: "Tăng trưởng trong ngành giải trí tại gia đã bị hạn chế trong quý này.", answerTranslation: "limited — bị hạn chế", partOfSpeech: "Tính từ/phân từ quá khứ sau has been.", reason: "Has been limited diễn tả trạng thái/kết quả bị hạn chế. Separate, assorted và willing không phù hợp nghĩa với growth trong câu." },
  6: { translation: "Hawson Furniture sẽ thực hiện các chuyến giao hàng ở phía đông thị trấn vào thứ Năm.", answerTranslation: "deliveries — các chuyến giao hàng", partOfSpeech: "Danh từ số nhiều sau making.", reason: "Make deliveries là cụm danh từ tự nhiên. Deliver là động từ, delivered là phân từ, deliverable là tính từ/danh từ chỉ thứ có thể giao." },
  7: { translation: "Biên bản cuộc họp đã vô tình bị xóa, nhưng ông Hahm có thể khôi phục chúng từ trí nhớ.", answerTranslation: "accidentally — một cách vô ý", partOfSpeech: "Trạng từ bổ nghĩa cho deleted.", reason: "Cần trạng từ mô tả cách biên bản bị xóa. Accident/accidents là danh từ; accidental là tính từ." },
  8: { translation: "Bất kỳ ai vẫn cần tham gia khóa huấn luyện an toàn phòng cháy nên hoàn thành trước cuối tháng.", answerTranslation: "needs — cần", partOfSpeech: "Động từ hiện tại đơn, ngôi thứ ba số ít.", reason: "Đại từ bất định anyone được xem là số ít; mệnh đề quan hệ hiện tại đơn nên dùng needs. Needing thiếu động từ chia, has needed không hợp nghĩa tiếp diễn đến hiện tại, were needing sai hòa hợp và thì." },
  9: { translation: "Các công nghệ mới nổi đã bắt đầu chuyển đổi ngành vận tải biển theo những cách trước đây không thể tưởng tượng được.", answerTranslation: "already — đã", partOfSpeech: "Trạng từ chỉ thời gian, thường đứng giữa have và quá khứ phân từ.", reason: "Already begun diễn tả việc đã bắt đầu. Exactly, hardly và closely không hợp nghĩa với begun to transform trong câu." },
  10: { translation: "Sổ tay công ty nêu các tiêu chuẩn cao mà nhân viên được kỳ vọng phải đáp ứng mỗi ngày.", answerTranslation: "standards — các tiêu chuẩn", partOfSpeech: "Danh từ số nhiều sau tính từ high.", reason: "Meet standards là kết hợp từ chuẩn: đáp ứng các tiêu chuẩn. Experts, accounts và recommendations không đi với meet theo nghĩa này." },
  11: { translation: "Thông tin bổ sung trong tài liệu quảng bá của Uniss Bank giúp người nộp đơn hiểu các điều khoản vay.", answerTranslation: "supplemental — bổ sung", partOfSpeech: "Tính từ đứng trước và bổ nghĩa cho information.", reason: "Thông tin giúp giải thích điều khoản là thông tin bổ sung. Arbitrary là tùy tiện, superfluous là thừa, potential là tiềm năng; các nghĩa này không phù hợp." },
  12: { translation: "Vì một số thành viên hội đồng quản trị bị trùng lịch, cuộc họp sẽ được chuyển sang ngày tất cả đều có thể tham dự.", answerTranslation: "some — một số", partOfSpeech: "Từ hạn định/đại từ chỉ số lượng, bổ nghĩa cho danh từ số nhiều members.", reason: "Some of the board members nghĩa là một số thành viên. Any không hợp câu khẳng định này; everybody là số ít và không dùng of theo cấu trúc đã cho; those cần chỉ định nhóm cụ thể." },
  13: { translation: "Nhóm Project Earth đang tìm cách giảm phát thải khí nhà kính liên quan đến vận tải.", answerTranslation: "looking — tìm kiếm", partOfSpeech: "Động từ V-ing trong cụm hiện tại tiếp diễn is looking for.", reason: "Look for ways là cụm cố định mang nghĩa tìm cách. See, drive và lean không kết hợp với for theo nghĩa này." },
  14: { translation: "Nên kiểm tra quy định trang phục của công ty trước khi đến trụ sở chính.", answerTranslation: "before — trước khi", partOfSpeech: "Liên từ thời gian nối với mệnh đề visiting its head office.", reason: "Before visiting diễn tả việc kiểm tra xảy ra trước chuyến thăm. So, now và like không tạo được quan hệ thời gian đúng." },
  15: { translation: "Cựu CEO Ken Nakata của Sendai Company đã nói về những trải nghiệm nghề nghiệp của ông ấy.", answerTranslation: "his — của ông ấy", partOfSpeech: "Tính từ sở hữu đứng trước danh từ career experiences.", reason: "Trước danh từ experiences cần tính từ sở hữu his. He là chủ ngữ, him là tân ngữ, himself là đại từ phản thân." },
  16: { translation: "Hành khách đi chuyến bay nội địa nối chuyến nên đến Nhà ga A.", answerTranslation: "connecting — nối chuyến", partOfSpeech: "Tính từ phân từ hiện tại bổ nghĩa cho flight.", reason: "Connecting flight là chuyến bay nối chuyến. Connectivity là danh từ, connects là động từ chia, connect là động từ nguyên mẫu nên không bổ nghĩa trực tiếp cho flight." },
  17: { translation: "Quản lý dự án Hannah Chung chứng tỏ mình rất hữu ích trong việc hoàn thành các dự án công ty.", answerTranslation: "helpful — hữu ích", partOfSpeech: "Tính từ sau very và sau linking verb be.", reason: "Sau very cần tính từ mô tả Hannah. Helpfulness là danh từ, helpfully là trạng từ, help là động từ/danh từ." },
  18: { translation: "Bánh donut táo tươi ngon được bán tại cửa hàng của Oakcrest Orchard với giá 5 bảng mỗi tá.", answerTranslation: "tasty — ngon", partOfSpeech: "Tính từ song song với fresh, cùng bổ nghĩa cho apple-cider donuts.", reason: "Hai tính từ fresh and tasty mô tả bánh. Eaten là phân từ không hợp nghĩa, open không tự nhiên với đồ ăn, free trái với thông tin giá bán." },
  19: { translation: "Ban quản lý Wexler Store kỳ vọng nhân viên sẽ nhiệt tình hỗ trợ nhân viên mới.", answerTranslation: "enthusiastically — một cách nhiệt tình", partOfSpeech: "Trạng từ bổ nghĩa cho động từ support.", reason: "Khoảng trống đứng trước support nên cần trạng từ chỉ cách hỗ trợ. Enthusiasm là danh từ, enthusiastic là tính từ, enthused không dùng ở vị trí này." },
  20: { translation: "Zahn Flooring có nhiều lựa chọn gạch lát sàn nhất tại Vương quốc Anh.", answerTranslation: "tiles — gạch lát", partOfSpeech: "Danh từ số nhiều sau selection of.", reason: "Tên công ty Flooring và cụm selection of hướng đến vật liệu lát sàn; tiles phù hợp. Paints, furniture và curtains không khớp lĩnh vực được nêu." },
  21: { translation: "Dự án đòi hỏi sự hợp tác của nhiều nhóm trong công ty.", answerTranslation: "required — đòi hỏi", partOfSpeech: "Động từ quá khứ đơn; project là chủ ngữ số ít.", reason: "Require collaboration nghĩa là đòi hỏi sự hợp tác. Passed, decided và performed không kết hợp với the collaboration theo ý câu." },
  22: { translation: "Do Verdigold Transport Services đóng cửa, chúng tôi đang tìm một công ty vận chuyển mới.", answerTranslation: "In light of — xét đến/do", partOfSpeech: "Cụm giới từ đứng trước cụm danh từ the closure.", reason: "In light of nêu nguyên nhân/dữ kiện dẫn đến việc tìm công ty mới. Just as cần mệnh đề, in spite of chỉ sự tương phản, according to nghĩa là theo." },
  23: { translation: "Hội đồng thành phố Marlton không có thẩm quyền cấm đỗ xe trên các đường phố của thành phố.", answerTranslation: "prohibit — cấm", partOfSpeech: "Động từ nguyên mẫu sau to.", reason: "Prohibit parking là cấm việc đỗ xe. Drive, travel và bother không diễn đạt hành động cấm theo ngữ cảnh." },
  24: { translation: "Các thợ may lành nghề của chúng tôi sẵn lòng thiết kế bộ vest đặt may vừa vặn hoàn hảo với phong cách và ngân sách của bạn.", answerTranslation: "perfectly — hoàn hảo", partOfSpeech: "Trạng từ bổ nghĩa cho động từ fits.", reason: "Trạng từ mô tả mức độ bộ vest vừa với phong cách/ngân sách. Perfects là động từ, perfect là tính từ, perfection là danh từ." },
  25: { translation: "Thành viên Lehua Vacation Club sẽ nhận gấp đôi điểm trong tháng Tám tại các khách sạn tham gia chương trình.", answerTranslation: "during — trong suốt/trong", partOfSpeech: "Giới từ đứng trước khoảng thời gian the month of August.", reason: "During the month of August diễn tả thời gian chương trình áp dụng. Onto chỉ chuyển động lên bề mặt, above là phía trên, between cần hai mốc." },
  26: { translation: "Là cựu chuyên viên quảng bá cho nhiều dàn nhạc nổi tiếng, ông Wu sẽ xuất sắc trong vai trò người tổ chức sự kiện.", answerTranslation: "organizer — người tổ chức", partOfSpeech: "Danh từ chỉ người sau cụm the role of event.", reason: "Event organizer là người tổ chức sự kiện. Organized/organizes là dạng động từ; organizational là tính từ." },
  27: { translation: "Làn đường hướng bắc trên phố Davis sẽ tạm thời bị đóng do dự án gia cố cầu của thành phố.", answerTranslation: "temporarily — tạm thời", partOfSpeech: "Trạng từ bổ nghĩa cho closed.", reason: "Cần trạng từ mô tả thời hạn đóng đường. Comparatively, recently và collectively không diễn đạt đúng ý tạm thời." },
  28: { translation: "Chúng tôi không thể gửi cuốn sổ phiếu giảm giá của cửa hàng cho nhà in cho đến khi nó được bà Jeon phê duyệt.", answerTranslation: "has been approved — đã được phê duyệt", partOfSpeech: "Động từ hiện tại hoàn thành bị động.", reason: "It là vật nhận hành động nên cần bị động; việc phê duyệt phải hoàn tất trước khi gửi in. Sau until, mệnh đề thời gian dùng hiện tại thay vì will." },
  29: { translation: "Đại diện hãng hàng không phải xử lý nhiều vấn đề của hành khách, từ lỡ chuyến nối đến thất lạc hành lý.", answerTranslation: "from — từ", partOfSpeech: "Giới từ trong cấu trúc from A to B.", reason: "From missed connections to lost luggage nêu hai đầu của một phạm vi vấn đề. Against, under và on không tạo được cấu trúc liệt kê phạm vi này." },
  30: { translation: "Số báo mới nhất của tạp chí Farming Scene dự đoán giá ngô sẽ tăng 5% trong năm tới.", answerTranslation: "next — tiếp theo/tới", partOfSpeech: "Tính từ đứng trước danh từ year.", reason: "The next year chỉ năm kế tiếp. Now, with và which không thể bổ nghĩa cho year theo cấu trúc này." },
};

/** Bản dịch theo đúng ngữ cảnh câu cho cả đáp án đúng lẫn phương án nhiễu. */
export const READING_PART5_OPTION_TRANSLATIONS: Record<number, Record<string, string>> = {
  1: { A: "được cập nhật", B: "đang cập nhật / việc cập nhật", C: "các bản cập nhật", D: "cập nhật / bản cập nhật" },
  2: { A: "xa", B: "rất", C: "gần như", D: "sớm" },
  3: { A: "kiểm tra", B: "việc kiểm tra", C: "đã kiểm tra", D: "người kiểm tra" },
  4: { A: "cho đến", B: "vào / bên trong", C: "chưa / còn", D: "trong khi" },
  5: { A: "riêng biệt", B: "đa dạng", C: "sẵn lòng", D: "bị hạn chế" },
  6: { A: "giao hàng", B: "đã giao", C: "các chuyến giao hàng", D: "có thể giao được" },
  7: { A: "tai nạn / sự cố", B: "một cách vô ý", C: "các tai nạn", D: "vô ý" },
  8: { A: "cần", B: "đang cần", C: "đã cần", D: "đã đang cần" },
  9: { A: "đã", B: "chính xác", C: "hầu như không", D: "chặt chẽ" },
  10: { A: "các chuyên gia", B: "các tài khoản / bản tường trình", C: "các tiêu chuẩn", D: "các khuyến nghị" },
  11: { A: "tùy tiện", B: "bổ sung", C: "dư thừa", D: "tiềm năng" },
  12: { A: "bất kỳ", B: "mọi người", C: "một số", D: "những người đó" },
  13: { A: "đang tìm", B: "đang nhìn / thấy", C: "đang lái xe / thúc đẩy", D: "đang nghiêng / dựa" },
  14: { A: "để / vì vậy", B: "bây giờ", C: "như / giống như", D: "trước khi" },
  15: { A: "anh ấy (chủ ngữ)", B: "anh ấy (tân ngữ)", C: "của anh ấy", D: "chính anh ấy / bản thân anh ấy" },
  16: { A: "khả năng kết nối", B: "kết nối (động từ ngôi thứ ba)", C: "kết nối", D: "nối chuyến" },
  17: { A: "sự hữu ích", B: "hữu ích", C: "một cách hữu ích", D: "giúp đỡ / sự giúp đỡ" },
  18: { A: "đã ăn", B: "mở", C: "ngon", D: "miễn phí" },
  19: { A: "một cách nhiệt tình", B: "sự nhiệt tình", C: "nhiệt tình", D: "hào hứng" },
  20: { A: "các loại sơn", B: "gạch lát", C: "đồ nội thất", D: "rèm cửa" },
  21: { A: "đã thông qua", B: "đã quyết định", C: "đòi hỏi", D: "đã thực hiện" },
  22: { A: "xét đến / do", B: "đúng lúc / giống như", C: "mặc dù", D: "theo" },
  23: { A: "lái xe", B: "đi lại", C: "làm phiền", D: "cấm" },
  24: { A: "một cách hoàn hảo", B: "hoàn thiện (động từ ngôi thứ ba)", C: "hoàn hảo", D: "sự hoàn hảo" },
  25: { A: "lên trên", B: "phía trên", C: "trong suốt", D: "giữa" },
  26: { A: "đã tổ chức / được tổ chức", B: "tổ chức (động từ ngôi thứ ba)", C: "người tổ chức", D: "thuộc về tổ chức" },
  27: { A: "tạm thời", B: "tương đối", C: "gần đây", D: "một cách tập thể" },
  28: { A: "đang phê duyệt", B: "phê duyệt", C: "đã được phê duyệt", D: "sẽ được phê duyệt" },
  29: { A: "chống lại", B: "bên dưới", C: "trên", D: "từ" },
  30: { A: "bây giờ", B: "với", C: "mà / cái mà", D: "tiếp theo / tới" },
};
