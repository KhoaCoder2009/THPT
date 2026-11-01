-- ========================================================
-- BỘ ĐỀ HÓA HỌC 12 - THPT CHUYÊN LƯƠNG VĂN CHÁNH (MÃ ĐỀ 101)
-- ========================================================

INSERT INTO public.topics (id, subject_id, index_code, title, description, chapter, theme, icon_svg, is_full, order_index)
VALUES ('2', 'hoa', '01', 'Đề kiểm tra giữa học kỳ 1 môn Hóa học lớp 12 năm học 2025 - 2026 trường THPT Chuyên Lương Văn Chánh', 'Mã đề 101 • Đề kiểm tra chính thức THPT Chuyên Lương Văn Chánh gồm 3 phần: Trắc nghiệm (18 câu), Đúng/Sai (4 câu), Trả lời ngắn (6 câu) kèm lời giải chi tiết chuẩn cấu trúc Bộ GD&ĐT 2025+.', 'Đề kiểm tra Giữa Học kỳ 1', 'emerald', '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 2v7.31M14 2v7.31M8.5 2h7M14 9.3a6.5 6.5 0 1 1-4 0"/><path d="M5.52 16h12.96"/></svg>', TRUE, 2)
ON CONFLICT (subject_id, id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  chapter = EXCLUDED.chapter,
  theme = EXCLUDED.theme,
  icon_svg = EXCLUDED.icon_svg,
  is_full = EXCLUDED.is_full,
  order_index = EXCLUDED.order_index;

INSERT INTO public.questions (id, subject_id, topic_id, type, question_text, options, correct_index, accepted_answers, explanation, diagram, order_index)
VALUES ('hoa_gk1_mc_01', 'hoa', '2', 'mc', 'Glucose và fructose hòa tan $\text{Cu(OH)}_2$ ở nhiệt độ thường tạo dung dịch xanh lam qua phản ứng nào sau đây?', '["$\\text{CH}_2\\text{OH}[\\text{CHOH}]_4\\text{CHO} + \\text{Br}_2 + \\text{H}_2\\text{O} \\xrightarrow{t^\\circ} \\text{CH}_2\\text{OH}[\\text{CHOH}]_4\\text{COOH} + 2\\text{HBr}$","$2\\text{C}_6\\text{H}_{12}\\text{O}_6 + \\text{Cu(OH)}_2 \\rightarrow (\\text{C}_6\\text{H}_{11}\\text{O}_6)_2\\text{Cu} + 2\\text{H}_2\\text{O}$","$\\text{CH}_2\\text{OH}[\\text{CHOH}]_4\\text{CHO} + 2\\text{Cu(OH)}_2 + \\text{NaOH} \\xrightarrow{t^\\circ} \\text{CH}_2\\text{OH}[\\text{CHOH}]_4\\text{COONa} + \\text{Cu}_2\\text{O} + 3\\text{H}_2\\text{O}$","$\\text{CH}_2\\text{OH}[\\text{CHOH}]_4\\text{CHO} + 2[\\text{Ag(NH}_3)_2]\\text{OH} \\xrightarrow{t^\\circ} \\text{CH}_2\\text{OH}[\\text{CHOH}]_4\\text{COONH}_4 + 2\\text{Ag} + 3\\text{NH}_3 + \\text{H}_2\\text{O}$"]'::jsonb, 1, '[]'::jsonb, 'Glucose và fructose đều là các polyalcohol có nhiều nhóm $-\text{OH}$ kề nhau, có khả năng tạo phức hòa tan $\text{Cu(OH)}_2$ ở nhiệt độ thường tạo dung dịch màu xanh lam đặc trưng theo phương trình: $2\text{C}_6\text{H}_{12}\text{O}_6 + \text{Cu(OH)}_2 \rightarrow (\text{C}_6\text{H}_{11}\text{O}_6)_2\text{Cu} + 2\text{H}_2\text{O}$. Chọn B.', NULL, 1)
ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  accepted_answers = EXCLUDED.accepted_answers,
  explanation = EXCLUDED.explanation,
  diagram = EXCLUDED.diagram,
  order_index = EXCLUDED.order_index;

INSERT INTO public.questions (id, subject_id, topic_id, type, question_text, options, correct_index, accepted_answers, explanation, diagram, order_index)
VALUES ('hoa_gk1_mc_02', 'hoa', '2', 'mc', 'Amino acid là hợp chất hữu cơ trong phân tử', '["chỉ chứa nhóm amino.","chỉ chứa nhóm carboxyl.","chứa nhóm carboxyl và nhóm amino.","chỉ chứa nitrogen hoặc carbon."]'::jsonb, 2, '[]'::jsonb, 'Theo định nghĩa, amino acid là loại hợp chất hữu cơ tạp chức mà trong phân tử chứa đồng thời nhóm amino ($-\text{NH}_2$) và nhóm carboxyl ($-\text{COOH}$). Chọn C.', NULL, 2)
ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  accepted_answers = EXCLUDED.accepted_answers,
  explanation = EXCLUDED.explanation,
  diagram = EXCLUDED.diagram,
  order_index = EXCLUDED.order_index;

INSERT INTO public.questions (id, subject_id, topic_id, type, question_text, options, correct_index, accepted_answers, explanation, diagram, order_index)
VALUES ('hoa_gk1_mc_03', 'hoa', '2', 'mc', 'Cho sơ đồ chuyển hóa sau: $\text{X}(l) + 2\text{NaOH}(aq) \rightarrow \text{CH}_2(\text{COONa})_2(aq) + \text{CH}_3\text{OH}(aq) + \text{C}_2\text{H}_5\text{OH}(aq)$. Nhận xét nào sau đây **không đúng** về chất X trong phản ứng trên?', '["Tên của X là ethyl methyl malonate.","X có nhiệt độ sôi cao vì có liên kết hydrogen giữa các phân tử.","X là ester no có hai nhóm chức có công thức phân tử $\\text{C}_6\\text{H}_{10}\\text{O}_4$.","Công thức cấu tạo của (X) được biểu diễn như hình sơ đồ trên."]'::jsonb, 1, '[]'::jsonb, 'Phản ứng thủy phân X tạo muối malonate và hai ancol là methanol và ethanol, do đó X là diester: $\text{CH}_3\text{OOC-CH}_2\text{-COOC}_2\text{H}_5$ (ethyl methyl malonate, CTPT $\text{C}_6\text{H}_{10}\text{O}_4$). Ester không có nguyên tử H linh động liên kết với O nên không tạo được liên kết hydrogen liên phân tử, do đó nhiệt độ sôi của ester thấp hơn nhiều so với alcohol và carboxylic acid tương ứng. Phát biểu B sai. Chọn B.', '<div class="quiz-diagram-box"><img src="../assets/images/diagrams/hoa_gk1_mc3_ester.png" alt="Cấu tạo ester X" class="quiz-diagram-img"></div>', 3)
ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  accepted_answers = EXCLUDED.accepted_answers,
  explanation = EXCLUDED.explanation,
  diagram = EXCLUDED.diagram,
  order_index = EXCLUDED.order_index;

INSERT INTO public.questions (id, subject_id, topic_id, type, question_text, options, correct_index, accepted_answers, explanation, diagram, order_index)
VALUES ('hoa_gk1_mc_04', 'hoa', '2', 'mc', 'Ở pH thấp, amino acid tồn tại chủ yếu dưới dạng', '["cation.","anion.","phân tử.","ion lưỡng cực."]'::jsonb, 0, '[]'::jsonb, 'Ở môi trường pH thấp (nồng độ $\text{H}^+$ cao, môi trường acid mạnh), ion lưỡng cực của amino acid nhận proton $\text{H}^+$: $\text{H}_3\text{N}^+-\text{CH(R)}-\text{COO}^- + \text{H}^+ \rightleftharpoons \text{H}_3\text{N}^+-\text{CH(R)}-\text{COOH}$. Do đó phân tử tích điện dương và tồn tại chủ yếu dưới dạng cation. Chọn A.', NULL, 4)
ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  accepted_answers = EXCLUDED.accepted_answers,
  explanation = EXCLUDED.explanation,
  diagram = EXCLUDED.diagram,
  order_index = EXCLUDED.order_index;

INSERT INTO public.questions (id, subject_id, topic_id, type, question_text, options, correct_index, accepted_answers, explanation, diagram, order_index)
VALUES ('hoa_gk1_mc_05', 'hoa', '2', 'mc', 'Mùi tanh của cá là hỗn hợp các amine và một số tạp chất khác. Để khử mùi tanh của cá trước khi chế biến, biện pháp nào sau đây là phù hợp nhất?', '["Ngâm cá thật lâu trong nước.","Rửa cá bằng giấm ăn.","Rửa cá bằng dung dịch baking soda (chứa $\\text{NaHCO}_3$).","Rửa cá bằng dung dịch thuốc tím."]'::jsonb, 1, '[]'::jsonb, 'Các amine gây mùi tanh ở cá (chủ yếu là trimethylamine) có tính base. Giấm ăn chứa acetic acid ($\text{CH}_3\text{COOH}$) sẽ phản ứng trung hòa các amine này tạo thành các muối tan không bay hơi và dễ bị rửa trôi bởi nước, giúp khử sạch mùi tanh. Chọn B.', NULL, 5)
ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  accepted_answers = EXCLUDED.accepted_answers,
  explanation = EXCLUDED.explanation,
  diagram = EXCLUDED.diagram,
  order_index = EXCLUDED.order_index;

INSERT INTO public.questions (id, subject_id, topic_id, type, question_text, options, correct_index, accepted_answers, explanation, diagram, order_index)
VALUES ('hoa_gk1_mc_06', 'hoa', '2', 'mc', 'Khối lượng glucose cần dùng để điều chế 1 lít rượu $40^\circ$ (khối lượng riêng của ethanol là $0,8\text{ g/ml}$) với hiệu suất $45\%$ là', '["1560 gam.","1391 gam.","626,09 gam.","281,74 gam."]'::jsonb, 1, '[]'::jsonb, 'Thể tích ethanol nguyên chất: $V_{\text{ethanol}} = 1000 \times 40\% = 400\text{ ml}$.<br>Khối lượng ethanol: $m_{\text{ethanol}} = 400 \times 0,8 = 320\text{ g} \Rightarrow n_{\text{ethanol}} = \frac{320}{46}\text{ mol}$.<br>Phương trình lên men: $\text{C}_6\text{H}_{12}\text{O}_6 \xrightarrow{\text{men}} 2\text{C}_2\text{H}_5\text{OH} + 2\text{CO}_2$.<br>Số mol glucose lý thuyết: $n_{\text{glucose(LT)}} = \frac{n_{\text{ethanol}}}{2} = \frac{160}{46}\text{ mol}$.<br>Vì hiệu suất $H = 45\%$, khối lượng glucose thực tế cần dùng là:<br>$m_{\text{glucose}} = \frac{n_{\text{glucose(LT)}} \times 180}{45\%} = \frac{160 \times 180}{46 \times 0,45} \approx 1391,3\text{ gam}$. Chọn B.', NULL, 6)
ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  accepted_answers = EXCLUDED.accepted_answers,
  explanation = EXCLUDED.explanation,
  diagram = EXCLUDED.diagram,
  order_index = EXCLUDED.order_index;

INSERT INTO public.questions (id, subject_id, topic_id, type, question_text, options, correct_index, accepted_answers, explanation, diagram, order_index)
VALUES ('hoa_gk1_mc_07', 'hoa', '2', 'mc', 'Cellulose thuộc loại polysaccharide, là thành phần chính tạo nên màng tế bào thực vật, có nhiều trong gỗ, bông gòn. Công thức của cellulose là', '["$(\\text{C}_6\\text{H}_{10}\\text{O}_5)_n$.","$\\text{C}_{12}\\text{H}_{22}\\text{O}_{11}$.","$\\text{C}_2\\text{H}_4\\text{O}_2$.","$\\text{C}_6\\text{H}_{12}\\text{O}_6$."]'::jsonb, 0, '[]'::jsonb, 'Cellulose là một polymer thiên nhiên thuộc loại polysaccharide, gồm nhiều gốc $\beta$-glucose liên kết với nhau qua liên kết $\beta$-1,4-glycosidic, có công thức phân tử là $(\text{C}_6\text{H}_{10}\text{O}_5)_n$. Chọn A.', NULL, 7)
ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  accepted_answers = EXCLUDED.accepted_answers,
  explanation = EXCLUDED.explanation,
  diagram = EXCLUDED.diagram,
  order_index = EXCLUDED.order_index;

INSERT INTO public.questions (id, subject_id, topic_id, type, question_text, options, correct_index, accepted_answers, explanation, diagram, order_index)
VALUES ('hoa_gk1_mc_08', 'hoa', '2', 'mc', 'Chất nào sau đây là amino acid?', '["$\\text{H}_2\\text{NCH}_2\\text{COOH}$.","$\\text{CH}_3\\text{COOH}$.","$\\text{CH}_3\\text{NH}_2$.","$\\text{HOCH}_2\\text{COOH}$."]'::jsonb, 0, '[]'::jsonb, '$\text{H}_2\text{NCH}_2\text{COOH}$ (glycine) có đồng thời nhóm amino ($-\text{NH}_2$) và nhóm carboxyl ($-\text{COOH}$) nên là amino acid. Chọn A.', NULL, 8)
ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  accepted_answers = EXCLUDED.accepted_answers,
  explanation = EXCLUDED.explanation,
  diagram = EXCLUDED.diagram,
  order_index = EXCLUDED.order_index;

INSERT INTO public.questions (id, subject_id, topic_id, type, question_text, options, correct_index, accepted_answers, explanation, diagram, order_index)
VALUES ('hoa_gk1_mc_09', 'hoa', '2', 'mc', 'Cho dung dịch glucose vào ống nghiệm chứa dung dịch $\text{AgNO}_3$ (trong $\text{NH}_3$ dư) được ngâm trong cốc nước nóng, thu được sản phẩm hữu cơ X và bạc kim loại. Tên gọi của X là', '["glycerol.","ammonium gluconate.","fructose.","gluconic acid."]'::jsonb, 1, '[]'::jsonb, 'Phương trình phản ứng tráng bạc của glucose:<br>$\text{CH}_2\text{OH}[\text{CHOH}]_4\text{CHO} + 2[\text{Ag(NH}_3)_2]\text{OH} \xrightarrow{t^\circ} \text{CH}_2\text{OH}[\text{CHOH}]_4\text{COONH}_4 + 2\text{Ag} + 3\text{NH}_3 + \text{H}_2\text{O}$.<br>Sản phẩm hữu cơ X là ammonium gluconate. Chọn B.', NULL, 9)
ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  accepted_answers = EXCLUDED.accepted_answers,
  explanation = EXCLUDED.explanation,
  diagram = EXCLUDED.diagram,
  order_index = EXCLUDED.order_index;

INSERT INTO public.questions (id, subject_id, topic_id, type, question_text, options, correct_index, accepted_answers, explanation, diagram, order_index)
VALUES ('hoa_gk1_mc_10', 'hoa', '2', 'mc', 'Trong quá trình sản xuất xà phòng, người ta cho dung dịch $\text{NaCl}$ bão hòa vào hỗn hợp sản phẩm sau khi xà phòng hóa. Vai trò của dung dịch $\text{NaCl}$ bão hòa trong trường hợp này là', '["tạo môi trường pH trung tính cho xà phòng.","để tách các muối của acid béo ra khỏi hỗn hợp.","tránh xà phòng bị nhiệt phân hủy.","hòa tan các muối của acid béo trong hỗn hợp."]'::jsonb, 1, '[]'::jsonb, 'Muối sodium của acid béo (thành phần chính của xà phòng) có độ tan rất thấp trong dung dịch $\text{NaCl}$ bão hòa và có khối lượng riêng nhỏ hơn, do đó việc thêm $\text{NaCl}$ bão hòa làm muối acid béo kết tụ lại và nổi lên bề mặt, giúp tách xà phòng ra khỏi glycerol và hỗn hợp dung dịch. Chọn B.', NULL, 10)
ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  accepted_answers = EXCLUDED.accepted_answers,
  explanation = EXCLUDED.explanation,
  diagram = EXCLUDED.diagram,
  order_index = EXCLUDED.order_index;

INSERT INTO public.questions (id, subject_id, topic_id, type, question_text, options, correct_index, accepted_answers, explanation, diagram, order_index)
VALUES ('hoa_gk1_mc_11', 'hoa', '2', 'mc', 'Công thức của ethyl acetate là', '["$\\text{C}_2\\text{H}_5\\text{COOCH}_3$.","$\\text{C}_2\\text{H}_5\\text{COOC}_2\\text{H}_5$.","$\\text{CH}_3\\text{COOC}_2\\text{H}_5$.","$\\text{CH}_3\\text{COOCH}_3$."]'::jsonb, 2, '[]'::jsonb, 'Ethyl acetate là ester được tạo từ acetic acid ($\text{CH}_3\text{COOH}$) và ethyl alcohol ($\text{C}_2\text{H}_5\text{OH}$), có công thức là $\text{CH}_3\text{COOC}_2\text{H}_5$. Chọn C.', NULL, 11)
ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  accepted_answers = EXCLUDED.accepted_answers,
  explanation = EXCLUDED.explanation,
  diagram = EXCLUDED.diagram,
  order_index = EXCLUDED.order_index;

INSERT INTO public.questions (id, subject_id, topic_id, type, question_text, options, correct_index, accepted_answers, explanation, diagram, order_index)
VALUES ('hoa_gk1_mc_12', 'hoa', '2', 'mc', 'Chất nào sau đây không có phản ứng thủy phân?', '["Fructose.","Amylose.","Cellulose.","Amylopectin."]'::jsonb, 0, '[]'::jsonb, 'Fructose là một monosaccharide (đường đơn giản nhất), không thể bị thủy phân thành carbohydrate nhỏ hơn. Amylose, cellulose và amylopectin đều là polysaccharide bị thủy phân thành glucose. Chọn A.', NULL, 12)
ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  accepted_answers = EXCLUDED.accepted_answers,
  explanation = EXCLUDED.explanation,
  diagram = EXCLUDED.diagram,
  order_index = EXCLUDED.order_index;

INSERT INTO public.questions (id, subject_id, topic_id, type, question_text, options, correct_index, accepted_answers, explanation, diagram, order_index)
VALUES ('hoa_gk1_mc_13', 'hoa', '2', 'mc', 'Chất nào sau đây thuộc loại polysaccharide?', '["fructose.","glucose.","maltose.","cellulose."]'::jsonb, 3, '[]'::jsonb, 'Cellulose và tinh bột là polysaccharide. Glucose và fructose là monosaccharide; maltose và saccharose là disaccharide. Chọn D.', NULL, 13)
ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  accepted_answers = EXCLUDED.accepted_answers,
  explanation = EXCLUDED.explanation,
  diagram = EXCLUDED.diagram,
  order_index = EXCLUDED.order_index;

INSERT INTO public.questions (id, subject_id, topic_id, type, question_text, options, correct_index, accepted_answers, explanation, diagram, order_index)
VALUES ('hoa_gk1_mc_14', 'hoa', '2', 'mc', 'Chất nào sau đây thuộc loại monosaccharide?', '["Cellulose.","Tinh bột.","Saccharose.","Fructose."]'::jsonb, 3, '[]'::jsonb, 'Monosaccharide là carbohydrate không bị thủy phân, bao gồm glucose và fructose. Chọn D.', NULL, 14)
ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  accepted_answers = EXCLUDED.accepted_answers,
  explanation = EXCLUDED.explanation,
  diagram = EXCLUDED.diagram,
  order_index = EXCLUDED.order_index;

INSERT INTO public.questions (id, subject_id, topic_id, type, question_text, options, correct_index, accepted_answers, explanation, diagram, order_index)
VALUES ('hoa_gk1_mc_15', 'hoa', '2', 'mc', 'Kết quả thí nghiệm của các dung dịch X, Y, Z với thuốc thử được ghi ở bảng sau:<br><table style="width:100%; border-collapse:collapse; margin:8px 0; font-size:13.5px;"><thead><tr style="background:#f1f5f9;"><th style="border:1px solid #cbd5e1; padding:6px 10px;">Mẫu thử</th><th style="border:1px solid #cbd5e1; padding:6px 10px;">Thuốc thử</th><th style="border:1px solid #cbd5e1; padding:6px 10px;">Hiện tượng</th></tr></thead><tbody><tr><td style="border:1px solid #cbd5e1; padding:6px 10px; text-align:center;"><strong>X</strong></td><td style="border:1px solid #cbd5e1; padding:6px 10px;">Dung dịch $\text{I}_2$</td><td style="border:1px solid #cbd5e1; padding:6px 10px;">Có màu xanh tím</td></tr><tr><td style="border:1px solid #cbd5e1; padding:6px 10px; text-align:center;"><strong>Y</strong></td><td style="border:1px solid #cbd5e1; padding:6px 10px;">$\text{Cu(OH)}_2$</td><td style="border:1px solid #cbd5e1; padding:6px 10px;">Có màu xanh lam</td></tr><tr><td style="border:1px solid #cbd5e1; padding:6px 10px; text-align:center;"><strong>Z</strong></td><td style="border:1px solid #cbd5e1; padding:6px 10px;">Dung dịch $\text{AgNO}_3$ trong $\text{NH}_3$</td><td style="border:1px solid #cbd5e1; padding:6px 10px;">Tạo kết tủa Ag</td></tr></tbody></table>Các dung dịch X, Y, Z lần lượt là', '["Cellulose, glucose, saccharose.","Cellulose, saccharose, glucose.","Hồ tinh bột, saccharose, glucose.","Hồ tinh bột, glucose, saccharose."]'::jsonb, 2, '[]'::jsonb, '• Mẫu X tác dụng với dung dịch $\text{I}_2$ cho màu xanh tím $\Rightarrow$ X là hồ tinh bột.<br>• Mẫu Y hòa tan $\text{Cu(OH)}_2$ tạo dung dịch xanh lam $\Rightarrow$ Y là saccharose.<br>• Mẫu Z phản ứng tráng bạc tạo kết tủa Ag $\Rightarrow$ Z là glucose.<br>Vậy X, Y, Z lần lượt là Hồ tinh bột, saccharose, glucose. Chọn C.', NULL, 15)
ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  accepted_answers = EXCLUDED.accepted_answers,
  explanation = EXCLUDED.explanation,
  diagram = EXCLUDED.diagram,
  order_index = EXCLUDED.order_index;

INSERT INTO public.questions (id, subject_id, topic_id, type, question_text, options, correct_index, accepted_answers, explanation, diagram, order_index)
VALUES ('hoa_gk1_mc_16', 'hoa', '2', 'mc', 'Thành phần của xà phòng bao gồm muối của acid béo với kim loại X và các chất phụ gia. Kim loại X có thể là', '["sodium hoặc potassium.","sodium.","potassium.","calcium."]'::jsonb, 0, '[]'::jsonb, 'Xà phòng là hỗn hợp muối sodium (muối natri - tạo xà phòng cứng) hoặc potassium (muối kali - tạo xà phòng mềm/lỏng) của các acid béo, cùng các chất phụ gia tạo màu, mùi và bảo quản. Muối calcium của acid béo không tan trong nước nên không dùng làm xà phòng. Chọn A.', NULL, 16)
ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  accepted_answers = EXCLUDED.accepted_answers,
  explanation = EXCLUDED.explanation,
  diagram = EXCLUDED.diagram,
  order_index = EXCLUDED.order_index;

INSERT INTO public.questions (id, subject_id, topic_id, type, question_text, options, correct_index, accepted_answers, explanation, diagram, order_index)
VALUES ('hoa_gk1_mc_17', 'hoa', '2', 'mc', 'Amine có công thức cấu tạo: $\text{CH}_3\text{CH}_2\text{CH(CH}_3)\text{CH}_2-\text{NH}_2$. Tên gọi và bậc của amine này là', '["2-methylbutan-1-amine, bậc I.","3-methylbutan-4-amine, bậc I.","2-methylbutan-1-amine, bậc II.","2-methylbutan-2-amine, bậc II."]'::jsonb, 0, '[]'::jsonb, 'Mạch carbon dài nhất chứa nhóm $-\text{NH}_2$ có 4 C (butan). Đánh số ưu tiên từ đầu gần nhóm amino: $\text{C}_1$ gắn $-\text{NH}_2$, $\text{C}_2$ có nhánh methyl $-\text{CH}_3$, $\text{C}_3$ là $-\text{CH}_2-$, $\text{C}_4$ là $-\text{CH}_3$. Tên thay thế: 2-methylbutan-1-amine. Vì nhóm $-\text{NH}_2$ gắn vào 1 gốc hydrocarbon nên đây là amine bậc I. Chọn A.', NULL, 17)
ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  accepted_answers = EXCLUDED.accepted_answers,
  explanation = EXCLUDED.explanation,
  diagram = EXCLUDED.diagram,
  order_index = EXCLUDED.order_index;

INSERT INTO public.questions (id, subject_id, topic_id, type, question_text, options, correct_index, accepted_answers, explanation, diagram, order_index)
VALUES ('hoa_gk1_mc_18', 'hoa', '2', 'mc', 'Chất nào sau đây là ester?', '["$\\text{CH}_3\\text{COOC}_2\\text{H}_5$.","$\\text{CH}_3\\text{OH}$.","$\\text{CH}_3\\text{CHO}$.","$\\text{HCOOH}$."]'::jsonb, 0, '[]'::jsonb, '$\text{CH}_3\text{COOC}_2\text{H}_5$ (ethyl acetate) là ester. $\text{CH}_3\text{OH}$ là alcohol, $\text{CH}_3\text{CHO}$ là aldehyde, $\text{HCOOH}$ là carboxylic acid. Chọn A.', NULL, 18)
ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  accepted_answers = EXCLUDED.accepted_answers,
  explanation = EXCLUDED.explanation,
  diagram = EXCLUDED.diagram,
  order_index = EXCLUDED.order_index;

INSERT INTO public.questions (id, subject_id, topic_id, type, question_text, options, correct_index, accepted_answers, explanation, diagram, order_index)
VALUES ('hoa_gk1_tf_01', 'hoa', '2', 'tf', 'Tiến hành thí nghiệm theo các bước sau:<br><b>Bước 1:</b> Cho khoảng 2 mL dung dịch $\text{NaOH}$ $10\%$ vào ống nghiệm. Sau đó, thêm khoảng 0,5 mL dung dịch $\text{CuSO}_4$ $5\%$ vào, lắc nhẹ.<br><b>Bước 2:</b> Cho khoảng 3 mL dung dịch glucose $2\%$ vào ống nghiệm, lắc đều.<br>Xét tính Đúng / Sai của các phát biểu sau:', '[{"text":"Sau bước 2, kết tủa đã bị hòa tan, thu được dung dịch màu xanh lam.","isCorrect":true},{"text":"Thí nghiệm trên chứng minh glucose có tính khử.","isCorrect":false},{"text":"Nếu thay dung dịch NaOH ở bước 2 bằng dung dịch KOH thì hiện tượng ở bước 2 vẫn tương tự.","isCorrect":true},{"text":"Sau bước 2, nếu đun nóng sẽ xuất hiện kết tủa màu đen.","isCorrect":false}]'::jsonb, NULL, '[]'::jsonb, 'a) ĐÚNG: Bước 1 tạo kết tủa xanh $\text{Cu(OH)}_2$; bước 2 cho glucose (polyalcohol có nhiều -OH liền kề) vào kết tủa bị hòa tan tạo phức đồng-glucose màu xanh lam thẩm.<br>b) SAI: Phản ứng hòa tan $\text{Cu(OH)}_2$ ở nhiệt độ phòng chứng minh glucose có nhiều nhóm -OH kề nhau, không phải chứng minh tính khử.<br>c) ĐÚNG: Dung dịch KOH hay NaOH đều là base mạnh cung cấp $\text{OH}^-$ tạo kết tủa $\text{Cu(OH)}_2$ và môi trường kiềm cho phản ứng tạo phức, nên hiện tượng không đổi.<br>d) SAI: Khi đun nóng hỗn hợp sau bước 2, nhóm aldehyde $-\text{CHO}$ của glucose khử $\text{Cu(II)}$ thành $\text{Cu}_2\text{O}$ tạo kết tủa màu đỏ gạch, không phải màu đen (màu đen là CuO).', NULL, 19)
ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  accepted_answers = EXCLUDED.accepted_answers,
  explanation = EXCLUDED.explanation,
  diagram = EXCLUDED.diagram,
  order_index = EXCLUDED.order_index;

INSERT INTO public.questions (id, subject_id, topic_id, type, question_text, options, correct_index, accepted_answers, explanation, diagram, order_index)
VALUES ('hoa_gk1_tf_02', 'hoa', '2', 'tf', 'Naftifine là một chất có tác dụng chống nấm. Naftifine có công thức cấu tạo như hình bên. Xét tính Đúng / Sai của các phát biểu sau:', '[{"text":"Naftifine thuộc loại amine bậc một.","isCorrect":false},{"text":"Trong phân tử naftifine có vòng benzene nên naftifine thuộc loại arylamine.","isCorrect":false},{"text":"Công thức phân tử của naftifine là $\\text{C}_{21}\\text{H}_{21}\\text{N}$.","isCorrect":true},{"text":"Cho 43,05 gam naftifine tác dụng vừa đủ với hydrochloric acid sinh ra muối naftifine hydrochloride có khối lượng là 48,525 gam.","isCorrect":true}]'::jsonb, NULL, '[]'::jsonb, 'a) SAI: Nguyên tử N liên kết với 3 gốc hydrocarbon ($-\text{CH}_2\text{C}_{10}\text{H}_7$, $-\text{CH}_3$, $-\text{CH}_2\text{CH=CHC}_6\text{H}_5$) nên naftifine là amine bậc ba.<br>b) SAI: Arylamine yêu cầu nguyên tử N phải liên kết trực tiếp với nguyên tử C của vòng thơm (như aniline). Ở naftifine, N liên kết với các nhóm alkyl/allyl, không gắn trực tiếp vào vòng thơm nên không phải arylamine.<br>c) ĐÚNG: Đếm số nguyên tử: gốc 1-naphthylmethyl có $11\text{C}$, nhóm methyl có $1\text{C}$, gốc cinnamyl có $9\text{C} \Rightarrow$ Tổng $\text{C} = 21$. Số $\text{H} = 7 + 2 + 3 + 2 + 2 + 5 = 21$, $1\text{N} \Rightarrow \text{C}_{21}\text{H}_{21}\text{N}$.<br>d) ĐÚNG: $M = 21 \times 12 + 21 + 14 = 287\text{ g/mol}$. $n = 43,05 / 287 = 0,15\text{ mol}$. $m_{\text{muối}} = m_{\text{naftifine}} + m_{\text{HCl}} = 43,05 + 0,15 \times 36,5 = 48,525\text{ gam}$.', '<div class="quiz-diagram-box"><img src="../assets/images/diagrams/hoa_gk1_naftifine.png" alt="Cấu tạo Naftifine" class="quiz-diagram-img"></div>', 20)
ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  accepted_answers = EXCLUDED.accepted_answers,
  explanation = EXCLUDED.explanation,
  diagram = EXCLUDED.diagram,
  order_index = EXCLUDED.order_index;

INSERT INTO public.questions (id, subject_id, topic_id, type, question_text, options, correct_index, accepted_answers, explanation, diagram, order_index)
VALUES ('hoa_gk1_tf_03', 'hoa', '2', 'tf', 'Biodiesel (diesel sinh học) là một loại nhiên liệu lỏng, thân thiện hơn với môi trường so với diesel truyền thống. Biodiesel được sản xuất thông qua phản ứng giữa chất béo với các alcohol mạch ngắn (thường là methanol), với xúc tác là kiềm, thu được biodiesel (ester của acid béo) và glycerol. Một nhà máy tái chế dầu ăn đã qua sử dụng để sản xuất biodiesel theo phương trình phản ứng tổng quát sau:<br>$(\text{RCOO})_3\text{C}_3\text{H}_5 + 3\text{CH}_3\text{OH} \xrightarrow{\text{NaOH}} 3\text{RCOOCH}_3 + \text{C}_3\text{H}_5(\text{OH})_3$ (1)<br>Xét tính Đúng / Sai của các phát biểu sau:', '[{"text":"Biodiesel có thành phần nguyên tố giống dầu diesel truyền thống.","isCorrect":false},{"text":"Phương pháp trên giúp tận dụng dầu ăn đã qua sử dụng, giảm ô nhiễm môi trường do dầu ăn thải gây ra.","isCorrect":true},{"text":"Phản ứng (1) là phản ứng thủy phân ester trong môi trường kiềm.","isCorrect":false},{"text":"Từ 500 kg một loại dầu ăn đã qua sử dụng có chứa $86\\%$ chất béo (phân tử khối trung bình của chất béo là 860 amu), còn lại là tạp chất không có khả năng chuyển hóa thành biodiesel, có thể tạo tối đa 432 kg biodiesel dạng methyl ester với hiệu suất chuyển hóa là $90\\%$.","isCorrect":false}]'::jsonb, NULL, '[]'::jsonb, 'a) SAI: Diesel truyền thống chiết xuất từ dầu mỏ chỉ chứa hydrocarbon (C, H), còn biodiesel là methyl ester của acid béo chứa cả nguyên tố O (gồm C, H, O).<br>b) ĐÚNG: Tái chế dầu ăn thải vừa giảm ô nhiễm đất và nước, vừa tạo nguồn nhiên liệu sinh học tái tạo.<br>c) SAI: Phản ứng (1) là phản ứng trao đổi ester (chuyển hóa ester - transesterification) giữa triglyceride và methanol, không phải phản ứng thủy phân (thủy phân là phản ứng với nước $\text{H}_2\text{O}$).<br>d) SAI: Khối lượng chất béo: $500 \times 86\% = 430\text{ kg}$. Phân tử khối trung bình của chất béo là 860, phân tử khối của methyl ester $\text{RCOOCH}_3$ là $M = \frac{860 - 41 + 3 \times 15}{3} = 288\text{ g/mol}$. Với 1 mol chất béo tạo 3 mol methyl ester $\Rightarrow m_{\text{LT}} = \frac{430}{860} \times 3 \times 288 = 432\text{ kg}$. Với hiệu suất $90\%$, khối lượng biodiesel thực tế thu được là $432 \times 90\% = 388,8\text{ kg}$, chứ không thể đạt 432 kg.', NULL, 21)
ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  accepted_answers = EXCLUDED.accepted_answers,
  explanation = EXCLUDED.explanation,
  diagram = EXCLUDED.diagram,
  order_index = EXCLUDED.order_index;

INSERT INTO public.questions (id, subject_id, topic_id, type, question_text, options, correct_index, accepted_answers, explanation, diagram, order_index)
VALUES ('hoa_gk1_tf_04', 'hoa', '2', 'tf', 'Đường huyết ổn định giúp cơ thể khoẻ mạnh, nếu tăng đường huyết có nguy cơ bị tiểu đường, còn hạ đường huyết gây hoa mắt, chóng mặt, tim đập nhanh. Xét tính Đúng / Sai của các phát biểu sau:', '[{"text":"Đường huyết là đường glucose.","isCorrect":true},{"text":"Trong y học, dung dịch glucose $5\\%$ (G-5) là dịch truyền tĩnh mạch cho những trường hợp bệnh nhân thiếu nước và năng lượng theo chỉ định của bác sĩ.","isCorrect":true},{"text":"Khi hạ đường huyết nên uống nước đường glucose ấm.","isCorrect":true},{"text":"Insulin sinh ra ở tuyến tụy giúp duy trì đường huyết ổn định trong máu. Insulin là một hormone đóng vai trò quan trọng trong quá trình chuyển hoá các chất carbohydrate trong cơ thể. Sau khi ăn, nồng độ glucose trong máu tăng, glucose được chuyển đổi thành glycogen và lưu trữ trong gan. Trước khi ăn, lượng glucose trong máu giảm, glycogen được chuyển đổi trở lại thành glucose để duy trì lượng đường trong máu.","isCorrect":true}]'::jsonb, NULL, '[]'::jsonb, 'a) ĐÚNG: Nồng độ đường trong máu (đường huyết) của người bình thường khoảng 0,1% (4,4 - 7,2 mmol/L), loại đường này chính là glucose.<br>b) ĐÚNG: Dung dịch glucose 5% là dung dịch đẳng trương, dùng để truyền tĩnh mạch bù dịch và cung cấp năng lượng nhanh cho bệnh nhân.<br>c) ĐÚNG: Glucose có thể hấp thu trực tiếp qua niêm mạc mà không cần tiêu hóa, uống nước đường ấm giúp tăng nhanh lượng đường huyết khi bị tụt đường huyết.<br>d) ĐÚNG: Đây là cơ chế điều hòa đường huyết chuẩn xác của cơ thể bằng hormone insulin và glucagon của tuyến tụy.', NULL, 22)
ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  accepted_answers = EXCLUDED.accepted_answers,
  explanation = EXCLUDED.explanation,
  diagram = EXCLUDED.diagram,
  order_index = EXCLUDED.order_index;

INSERT INTO public.questions (id, subject_id, topic_id, type, question_text, options, correct_index, accepted_answers, explanation, diagram, order_index)
VALUES ('hoa_gk1_sa_01', 'hoa', '2', 'sa', 'Cho các chất: $\text{C}_6\text{H}_5\text{OH}$ (phenol), $\text{C}_6\text{H}_5-\text{CH}_2-\text{OH}$, $\text{CH}_3\text{COOCH}_3$, $\text{HCOO}-\text{C}_6\text{H}_5$, $(\text{C}_{15}\text{H}_{31}\text{COO})_3\text{C}_3\text{H}_5$. Có bao nhiêu chất trong dãy phản ứng được với dung dịch $\text{NaOH}$?', '[]'::jsonb, NULL, '["4","bốn"]'::jsonb, 'Các chất phản ứng được với dung dịch $\text{NaOH}$ gồm:<br>1) $\text{C}_6\text{H}_5\text{OH}$ (phenol có tính acid yếu: $\text{C}_6\text{H}_5\text{OH} + \text{NaOH} \rightarrow \text{C}_6\text{H}_5\text{ONa} + \text{H}_2\text{O}$);<br>2) $\text{CH}_3\text{COOCH}_3$ (ester thủy phân trong kiềm);<br>3) $\text{HCOO}-\text{C}_6\text{H}_5$ (ester của phenol phản ứng với $\text{NaOH}$ tỉ lệ 1:2);<br>4) $(\text{C}_{15}\text{H}_{31}\text{COO})_3\text{C}_3\text{H}_5$ (chất béo xà phòng hóa).<br>Chất $\text{C}_6\text{H}_5\text{CH}_2\text{OH}$ (benzyl alcohol) không phản ứng với $\text{NaOH}$.<br>Vậy có đúng 4 chất phản ứng. Đáp số: 4.', NULL, 23)
ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  accepted_answers = EXCLUDED.accepted_answers,
  explanation = EXCLUDED.explanation,
  diagram = EXCLUDED.diagram,
  order_index = EXCLUDED.order_index;

INSERT INTO public.questions (id, subject_id, topic_id, type, question_text, options, correct_index, accepted_answers, explanation, diagram, order_index)
VALUES ('hoa_gk1_sa_02', 'hoa', '2', 'sa', 'Cho các phát biểu sau:<br>(a) Một số ester có mùi thơm, không độc như benzyl formate, ethyl formate, ... được dùng làm chất tạo hương trong công nghệ thực phẩm.<br>(b) Chất béo là triester của glixerol và carboxylic acid.<br>(c) Tripanmitin và triolein đều tồn tại trạng thái rắn ở điều kiện thường.<br>(d) Dầu mỡ để lâu bị ôi do liên kết đôi C=C trong dầu mỡ bị oxi hóa chậm bởi oxygen trong không khí.<br>(e) Các phân tử ester ethyl acetate không có khả năng tạo liên kết hydrogen với nhau.<br>Số phát biểu <b>đúng</b> là?', '[]'::jsonb, NULL, '["3","ba"]'::jsonb, '• (a) ĐÚNG: Nhiều ester có mùi thơm hoa quả dễ chịu, an toàn được dùng làm hương liệu thực phẩm.<br>• (b) SAI: Chất béo phải là triester của glycerol với <b>acid béo</b> (carboxylic acid mạch dài, không phân nhánh, số C chẵn), không phải carboxylic acid bất kì.<br>• (c) SAI: Triolein chứa gốc acid không no nên ở trạng thái <b>lỏng</b> ở điều kiện thường.<br>• (d) ĐÚNG: Liên kết đôi C=C bị oxi hóa chậm bởi oxygen không khí tạo thành peroxide rồi phân hủy thành aldehyde, ketone có mùi ôi thiu.<br>• (e) ĐÚNG: Ethyl acetate không có liên kết hydrogen liên phân tử.<br>Vậy có 3 phát biểu đúng là (a), (d), (e). Đáp số: 3.', NULL, 24)
ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  accepted_answers = EXCLUDED.accepted_answers,
  explanation = EXCLUDED.explanation,
  diagram = EXCLUDED.diagram,
  order_index = EXCLUDED.order_index;

INSERT INTO public.questions (id, subject_id, topic_id, type, question_text, options, correct_index, accepted_answers, explanation, diagram, order_index)
VALUES ('hoa_gk1_sa_03', 'hoa', '2', 'sa', 'Cho 6,75 gam amine X (no, đơn chức, mạch hở) tác dụng hết với dung dịch $\text{HCl}$ dư, thu được 12,225 gam muối. Số nguyên tử hydrogen trong phân tử X là bao nhiêu?', '[]'::jsonb, NULL, '["7","bảy"]'::jsonb, 'Khối lượng $\text{HCl}$ phản ứng theo bảo toàn khối lượng:<br>$m_{\text{HCl}} = 12,225 - 6,75 = 5,475\text{ gam} \Rightarrow n_{\text{HCl}} = 5,475 / 36,5 = 0,15\text{ mol}$.<br>Vì amine X no, đơn chức, mạch hở $\Rightarrow n_X = n_{\text{HCl}} = 0,15\text{ mol}$.<br>Phân tử khối của X: $M_X = 6,75 / 0,15 = 45\text{ g/mol}$.<br>Công thức amine no, đơn chức, mạch hở có dạng $\text{C}_n\text{H}_{2n+3}\text{N} \Rightarrow 14n + 17 = 45 \Rightarrow n = 2$.<br>Công thức phân tử của X là $\text{C}_2\text{H}_7\text{N}$.<br>Số nguyên tử hydrogen trong X là 7. Đáp số: 7.', NULL, 25)
ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  accepted_answers = EXCLUDED.accepted_answers,
  explanation = EXCLUDED.explanation,
  diagram = EXCLUDED.diagram,
  order_index = EXCLUDED.order_index;

INSERT INTO public.questions (id, subject_id, topic_id, type, question_text, options, correct_index, accepted_answers, explanation, diagram, order_index)
VALUES ('hoa_gk1_sa_04', 'hoa', '2', 'sa', 'Cho sơ đồ phản ứng sau. Biết rằng X, Y, Z, T, W là các hợp chất hữu cơ khác nhau; T chỉ chứa một loại nhóm chức. Tổng phân tử khối của T và W là bao nhiêu?', '[]'::jsonb, NULL, '["292"]'::jsonb, 'Từ sơ đồ: $\text{Z} \xrightarrow{\text{men giấm}} \text{Y} \Rightarrow \text{Z}$ là ethanol $\text{C}_2\text{H}_5\text{OH}$ ($M=46$) và $\text{Y}$ là acetic acid $\text{CH}_3\text{COOH}$ ($M=60$).<br>Thủy phân X ($\text{C}_4\text{H}_8\text{O}_2$) tạo Y và Z $\Rightarrow \text{X}$ là ethyl acetate $\text{CH}_3\text{COOC}_2\text{H}_5$.<br>Chất T tạo từ Y ($\text{CH}_3\text{COOH}$) và glycerol $\text{C}_3\text{H}_5(\text{OH})_3$, T chỉ chứa một loại nhóm chức $\Rightarrow$ T là triester triacetin $(\text{CH}_3\text{COO})_3\text{C}_3\text{H}_5$ ($M_T = 3 \times 59 + 41 = 218\text{ g/mol}$).<br>Chất W tạo từ Z ($\text{C}_2\text{H}_5\text{OH}$) và $\text{HCOOH} \Rightarrow$ W là ethyl formate $\text{HCOOC}_2\text{H}_5$ ($M_W = 1 + 44 + 29 = 74\text{ g/mol}$).<br>Tổng phân tử khối: $M_T + M_W = 218 + 74 = 292$. Đáp số: 292.', '<div class="quiz-diagram-box"><img src="../assets/images/diagrams/hoa_gk1_sa_sodo.png" alt="Sơ đồ phản ứng" class="quiz-diagram-img"></div>', 26)
ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  accepted_answers = EXCLUDED.accepted_answers,
  explanation = EXCLUDED.explanation,
  diagram = EXCLUDED.diagram,
  order_index = EXCLUDED.order_index;

INSERT INTO public.questions (id, subject_id, topic_id, type, question_text, options, correct_index, accepted_answers, explanation, diagram, order_index)
VALUES ('hoa_gk1_sa_05', 'hoa', '2', 'sa', 'Trong công nghiệp, saccharose là nguyên liệu để thủy phân thành glucose và fructose dùng trong kĩ thuật tráng gương, ruột phích. Để thu được 18 kg glucose cần thủy phân $m$ kg saccharose với hiệu suất phản ứng là $60\%$. Giá trị của $m$ là bao nhiêu?', '[]'::jsonb, NULL, '["57","57 kg","57kg"]'::jsonb, 'Phương trình thủy phân: $\text{C}_{12}\text{H}_{22}\text{O}_{11} + \text{H}_2\text{O} \xrightarrow{H^+, t^\circ} \text{C}_6\text{H}_{12}\text{O}_6 (\text{glucose}) + \text{C}_6\text{H}_{12}\text{O}_6 (\text{fructose})$.<br>Khối lượng mol: saccharose = 342 g/mol, glucose = 180 g/mol.<br>Khối lượng saccharose cần theo lý thuyết: $m_{\text{LT}} = \frac{18 \times 342}{180} = 34,2\text{ kg}$.<br>Với hiệu suất $H = 60\% = 0,6$, khối lượng saccharose thực tế cần dùng là:<br>$m = \frac{m_{\text{LT}}}{H} = \frac{34,2}{0,6} = 57\text{ kg}$. Đáp số: 57.', NULL, 27)
ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  accepted_answers = EXCLUDED.accepted_answers,
  explanation = EXCLUDED.explanation,
  diagram = EXCLUDED.diagram,
  order_index = EXCLUDED.order_index;

INSERT INTO public.questions (id, subject_id, topic_id, type, question_text, options, correct_index, accepted_answers, explanation, diagram, order_index)
VALUES ('hoa_gk1_sa_06', 'hoa', '2', 'sa', 'Lysine hay còn gọi là L-lysine là một axit amin cần thiết cho cơ thể nhưng cơ thể không thể tự tổng hợp được mà chỉ có thể được bổ sung thông qua chế độ ăn uống hàng ngày. Puritan''s Pride L-Lysine 500 mg giúp hỗ trợ tốt với tiêu hóa. Một hộp Puritan''s Pride L-Lysine chứa 100 viên, mỗi viên chứa 500 mg lysine; gelatin cùng các thành phần khác. Ước tính một người 70 kg cần khoảng 1500mg lysine mỗi ngày. Với một hộp Puritan''s Pride L-Lysine, người đó sẽ dùng hết trong bao nhiêu ngày? (Làm tròn kết quả đến hàng đơn vị)', '[]'::jsonb, NULL, '["33","33.3","33,3","33,33","33 ngày"]'::jsonb, 'Tổng lượng lysine chứa trong 1 hộp: $100 \times 500\text{ mg} = 50.000\text{ mg}$.<br>Nhu cầu của người 70 kg mỗi ngày: $1500\text{ mg/ngày}$.<br>Số ngày dùng hết 1 hộp: $\frac{50.000}{1500} = \frac{100}{3} \approx 33,33\text{ ngày} \approx 33\text{ ngày}$. Đáp số: 33.', NULL, 28)
ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  accepted_answers = EXCLUDED.accepted_answers,
  explanation = EXCLUDED.explanation,
  diagram = EXCLUDED.diagram,
  order_index = EXCLUDED.order_index;

