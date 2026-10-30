window.KEDU_DATABASE_DATA = {
  "subjects": [
    {
      "id": "toan",
      "name": "Toán học 12",
      "corner": "CHƯƠNG 1",
      "hero_title": "Toán học 12: Ứng dụng đạo hàm khảo sát hàm số",
      "hero_desc": "Tính đơn điệu, cực trị, GTLN - GTNN, đường tiệm cận đứng / ngang / xiên của đồ thị hàm số và bài toán thực tế.",
      "author": "TDKA",
      "order_index": 1
    },
    {
      "id": "vatli",
      "name": "Vật lí 12",
      "corner": "CHƯƠNG 1",
      "hero_title": "Vật lí 12: Chuyên đề Vật lí nhiệt",
      "hero_desc": "Mô hình động học phân tử, cấu trúc 3 thể, các quá trình chuyển thể và định luật nhiệt động lực học.",
      "author": "TDKA",
      "order_index": 2
    },
    {
      "id": "hoa",
      "name": "Hóa học 12",
      "corner": "CHƯƠNG 1",
      "hero_title": "Hóa học 12: Este - Lipit - Xà phòng & Chất giặt rửa",
      "hero_desc": "Cấu tạo đồng phân danh pháp Este, phản ứng xà phòng hóa, chất béo Triglyceride và cơ chế tẩy rửa.",
      "author": "TDKA",
      "order_index": 3
    },
    {
      "id": "sinh",
      "name": "Sinh học 12",
      "corner": "PHẦN 4",
      "hero_title": "Sinh học 12: Di truyền phân tử & Nhiễm sắc thể",
      "hero_desc": "Mã di truyền, tái bản ADN, phiên mã, dịch mã, điều hòa hoạt động gen Operon Lac và đột biến NST.",
      "author": "TDKA",
      "order_index": 4
    },
    {
      "id": "tinhoc",
      "name": "Tin học 12",
      "corner": "CHUYÊN ĐỀ",
      "hero_title": "Tin học 12: Khoa học máy tính & Mạng máy tính",
      "hero_desc": "Hệ thống mạng máy tính, giao thức TCP/IP, thuật toán, cơ sở dữ liệu quan hệ SQL và ứng dụng công nghệ trí tuệ nhân tạo (AI).",
      "author": "TDKA",
      "order_index": 5
    },
    {
      "id": "lichsu",
      "name": "Lịch Sử 12",
      "corner": "CHUYÊN ĐỀ",
      "hero_title": "Lịch Sử 12: Lịch sử thế giới & Lịch sử Việt Nam hiện đại",
      "hero_desc": "Trật tự thế giới sau Chiến tranh lạnh, Liên Hợp Quốc, ASEAN, các mốc lịch sử cách mạng Việt Nam và công cuộc Đổi mới.",
      "author": "TDKA",
      "order_index": 6
    }
  ],
  "topics": [
    {
      "id": "1",
      "subject_id": "toan",
      "index_code": "01",
      "title": "Đề kiểm tra giữa học kỳ 1 môn Toán lớp 12 năm học 2026 - 2027 trường THPT Trịnh Hoài Đức",
      "description": "Mã đề 655 • Đề kiểm tra chính thức THPT Trịnh Hoài Đức - TP.HCM gồm 3 phần: Trắc nghiệm (12 câu), Đúng/Sai (4 câu), Trả lời ngắn (6 câu) kèm lời giải chi tiết chuẩn cấu trúc Bộ GD&ĐT.",
      "chapter": "Đề kiểm tra Giữa Học kỳ 1",
      "theme": "red",
      "icon_svg": "<svg width=\"22\" height=\"22\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z\"/><path d=\"M6 6h10M6 10h10M6 14h6\"/></svg>",
      "is_full": true,
      "order_index": 1
    }
  ],
  "questions": [
    {
      "id": "toan_gk1_mc_01",
      "subject_id": "toan",
      "topic_id": "1",
      "type": "mc",
      "question_text": "Cho hàm số $y=\\frac{\\sqrt{x^2 - 9}}{x^2 - 4x + 3}$. Chọn khẳng định đúng:",
      "options": [
        "Đồ thị hàm số có đường tiệm cận đứng là $x=1$.",
        "Đồ thị hàm số có hai đường tiệm cận đứng $x=1$ và $x=3$.",
        "Đồ thị hàm số có đường tiệm cận đứng là $x=3$.",
        "Đồ thị hàm số không có tiệm cận ngang."
      ],
      "correct_index": 2,
      "accepted_answers": [],
      "explanation": "Điều kiện xác định: $x^2 - 9 \\ge 0 \\Leftrightarrow x \\le -3$ hoặc $x \\ge 3$. Mẫu số bằng $0$ khi $x=1$ hoặc $x=3$, do đó tập xác định là $(-\\infty; -3] \\cup (3; +\\infty)$. Ta có $x^2 - 4x + 3 = (x-1)(x-3)$. Khi $x \\to 3^+$, ta có $y = \\frac{\\sqrt{x+3}}{(x-1)\\sqrt{x-3}} \\to +\\infty \\Rightarrow x = 3$ là tiệm cận đứng. Vì $x=1$ không thuộc tập xác định và không phải điểm tụ nên $x=1$ không là tiệm cận đứng. Ngoài ra khi $x \\to \\pm\\infty$ thì $y \\to 0$ nên tiệm cận ngang là $y=0$. Đáp án C.",
      "diagram": null,
      "order_index": 1
    },
    {
      "id": "toan_gk1_mc_02",
      "subject_id": "toan",
      "topic_id": "1",
      "type": "mc",
      "question_text": "Cho hàm số $y=f(x)$ liên tục trên đoạn $[-1;4]$ và có đồ thị như hình vẽ dưới đây. Giá trị nhỏ nhất của hàm số trên đoạn $[-1;4]$ là:",
      "options": [
        "$3$",
        "$-2$",
        "$2$",
        "$1$"
      ],
      "correct_index": 1,
      "accepted_answers": [],
      "explanation": "Quan sát đồ thị: tại $x=2$, đồ thị đạt tung độ $-2$; ở đầu mút $x=-1$, tung độ cũng là $-2$. Điểm cực đại tại $x=4$ có tung độ $3$. Không có điểm nào trên đoạn $[-1;4]$ nằm thấp hơn đường thẳng $y=-2$. Do đó $\\min_{[-1;4]} f(x) = -2$. Đáp án B.",
      "diagram": "<div class=\"quiz-diagram-box\"><img src=\"../assets/images/diagrams/toan_gk1_mc_c2.png\" alt=\"Đồ thị hàm số trên đoạn [-1;4]\" class=\"quiz-diagram-img\"></div>",
      "order_index": 2
    },
    {
      "id": "toan_gk1_mc_03",
      "subject_id": "toan",
      "topic_id": "1",
      "type": "mc",
      "question_text": "Cho hàm số $f(x)=\\frac{ax^2+bx+c}{dx+e}$ $(a,b,c,d,e \\in \\mathbb{R}, ad \\ne 0)$ có đồ thị như hình vẽ. Tiệm cận xiên của đồ thị hàm số đã cho là:",
      "options": [
        "$y=x$",
        "$y=-x$",
        "$y=x+1$",
        "$y=x-1$"
      ],
      "correct_index": 0,
      "accepted_answers": [],
      "explanation": "Đường tiệm cận xiên mà hai nhánh của đồ thị tiến gần đến đi qua gốc tọa độ $O(0;0)$ và điểm $(-1;-1)$, có hệ số góc dương $k=1$. Vì vậy phương trình đường tiệm cận xiên là $y=x$. Đáp án A.",
      "diagram": "<div class=\"quiz-diagram-box\"><img src=\"../assets/images/diagrams/toan_gk1_mc_c3.png\" alt=\"Đồ thị hàm phân thức có tiệm cận xiên\" class=\"quiz-diagram-img\"></div>",
      "order_index": 3
    },
    {
      "id": "toan_gk1_mc_04",
      "subject_id": "toan",
      "topic_id": "1",
      "type": "mc",
      "question_text": "Cho hàm số $y=f(x)$ xác định và liên tục trên $\\mathbb{R} \\setminus \\{0\\}$ và có bảng biến thiên như sau: Hàm số $y=f(x)$ nghịch biến trên khoảng nào dưới đây?",
      "options": [
        "$(-1;1)$",
        "$(1;+\\infty)$",
        "$(-1;0)$",
        "$(-\\infty;-1)$"
      ],
      "correct_index": 2,
      "accepted_answers": [],
      "explanation": "Bảng biến thiên cho thấy $f'(x) < 0$ trên $(-1;0)$ và $(0;1)$, do đó hàm số nghịch biến trên từng khoảng $(-1;0)$ và $(0;1)$. Không được gộp hai khoảng nghịch biến qua $x=0$ vì hàm số không xác định tại $x=0$. Trong 4 phương án đã cho, chỉ có khoảng $(-1;0)$ là đúng. Đáp án C.",
      "diagram": "<div class=\"quiz-diagram-box\"><img src=\"../assets/images/diagrams/toan_gk1_mc_c4.png\" alt=\"Bảng biến thiên\" class=\"quiz-diagram-img\"></div>",
      "order_index": 4
    },
    {
      "id": "toan_gk1_mc_05",
      "subject_id": "toan",
      "topic_id": "1",
      "type": "mc",
      "question_text": "Cho hàm số $y=f(x)$ có đạo hàm $f'(x)=x(x-2)(x^2-4)$. Hàm số $y=f(x)$ có bao nhiêu điểm cực trị?",
      "options": [
        "2",
        "1",
        "3",
        "4"
      ],
      "correct_index": 0,
      "accepted_answers": [],
      "explanation": "Ta phân tích đạo hàm: $f'(x) = x(x-2)(x-2)(x+2) = x(x-2)^2(x+2)$. Các nghiệm của $f'(x)=0$ là $x=-2, x=0, x=2$. Vì $(x-2)^2 \\ge 0$ với mọi $x$ nên khi qua nghiệm bội chẵn $x=2$, đạo hàm không đổi dấu. Đạo hàm chỉ đổi dấu khi qua hai nghiệm đơn $x=-2$ (từ dương sang âm: điểm cực đại) và $x=0$ (từ âm sang dương: điểm cực tiểu). Vậy hàm số có đúng 2 điểm cực trị. Đáp án A.",
      "diagram": null,
      "order_index": 5
    },
    {
      "id": "toan_gk1_mc_06",
      "subject_id": "toan",
      "topic_id": "1",
      "type": "mc",
      "question_text": "Tìm giá trị lớn nhất của hàm số $f(x)=-x^3-6x^2-9x-1$ trên đoạn $[-4;1]$.",
      "options": [
        "5",
        "3",
        "1",
        "−17"
      ],
      "correct_index": 1,
      "accepted_answers": [],
      "explanation": "Lấy đạo hàm: $f'(x) = -3x^2 - 12x - 9 = -3(x+1)(x+3)$. Nghiệm $f'(x)=0 \\Leftrightarrow x=-1 \\in [-4;1]$ hoặc $x=-3 \\in [-4;1]$. Tính các giá trị: $f(-4)=3, f(-3)=-1, f(-1)=3, f(1)=-17$. Suy ra giá trị lớn nhất $\\max_{[-4;1]} f(x) = 3$ tại $x=-4$ và $x=-1$. Đáp án B.",
      "diagram": null,
      "order_index": 6
    },
    {
      "id": "toan_gk1_mc_07",
      "subject_id": "toan",
      "topic_id": "1",
      "type": "mc",
      "question_text": "Đồ thị sau đây là của hàm số nào?",
      "options": [
        "$y=-x^3+3x^2-4$",
        "$y=3x^2-4$",
        "$y=-x^3$",
        "$y=x^3+3x^2-4$"
      ],
      "correct_index": 0,
      "accepted_answers": [],
      "explanation": "Đồ thị có dạng đường cong bậc 3 với nhánh phải đi xuống khi $x \\to +\\infty$, suy ra hệ số $a < 0$. Đồ thị đi qua điểm $(0;-4)$ và điểm cực đại $(2;0)$. Với hàm số ở phương án A: $y = -x^3 + 3x^2 - 4$, ta có $y' = -3x^2 + 6x = -3x(x-2) = 0 \\Leftrightarrow x=0, x=2$. Tại $x=0 \\Rightarrow y=-4$ (cực tiểu); tại $x=2 \\Rightarrow y=0$ (cực đại), hoàn toàn trùng khớp với đồ thị. Đáp án A.",
      "diagram": "<div class=\"quiz-diagram-box\"><img src=\"../assets/images/diagrams/toan_gk1_mc_c7.png\" alt=\"Đồ thị hàm số bậc 3\" class=\"quiz-diagram-img\"></div>",
      "order_index": 7
    },
    {
      "id": "toan_gk1_mc_08",
      "subject_id": "toan",
      "topic_id": "1",
      "type": "mc",
      "question_text": "Cho hàm số $y=f(x)$ xác định trên tập $D$. Số $m$ được gọi là giá trị nhỏ nhất của hàm số $y=f(x)$ trên $D$ nếu:",
      "options": [
        "$f(x) \\le m$ với mọi $x \\in D$ và tồn tại $x_0 \\in D$ sao cho $f(x_0)=m$.",
        "$f(x) \\ge m$ với mọi $x \\in D$.",
        "$f(x) \\le m$ với mọi $x \\in D$.",
        "$f(x) \\ge m$ với mọi $x \\in D$ và tồn tại $x_0 \\in D$ sao cho $f(x_0)=m$."
      ],
      "correct_index": 3,
      "accepted_answers": [],
      "explanation": "Theo định nghĩa trong SGK Toán 12: Số $m$ là giá trị nhỏ nhất của hàm số $y=f(x)$ trên tập $D$ nếu thỏa mãn đồng thời hai điều kiện: (1) $f(x) \\ge m$ với mọi $x \\in D$; (2) Tồn tại $x_0 \\in D$ sao cho $f(x_0) = m$. Đáp án D.",
      "diagram": null,
      "order_index": 8
    },
    {
      "id": "toan_gk1_mc_09",
      "subject_id": "toan",
      "topic_id": "1",
      "type": "mc",
      "question_text": "Cho hàm số $y=f(x)$ có bảng biến thiên như sau: Giá trị cực tiểu của hàm số đã cho bằng:",
      "options": [
        "3",
        "−4",
        "2",
        "0"
      ],
      "correct_index": 1,
      "accepted_answers": [],
      "explanation": "Từ bảng biến thiên, tại $x=3$, đạo hàm $f'(x)$ đổi dấu từ âm $(-)$ sang dương $(+)$ nên hàm số đạt cực tiểu tại $x=3$. Giá trị cực tiểu tương ứng của hàm số là $y_{CT} = f(3) = -4$. Đáp án B.",
      "diagram": "<div class=\"quiz-diagram-box\"><img src=\"../assets/images/diagrams/toan_gk1_mc_c9.png\" alt=\"Bảng biến thiên cực tiểu\" class=\"quiz-diagram-img\"></div>",
      "order_index": 9
    },
    {
      "id": "toan_gk1_mc_10",
      "subject_id": "toan",
      "topic_id": "1",
      "type": "mc",
      "question_text": "Cho hàm số $y=\\frac{ax+b}{cx+d}$ có đồ thị như hình vẽ bên. Biết rằng $a$ là số thực dương ($a>0$). Trong các số $b,c,d$ có tất cả bao nhiêu số dương?",
      "options": [
        "1",
        "3",
        "0",
        "2"
      ],
      "correct_index": 3,
      "accepted_answers": [],
      "explanation": "1) Tiệm cận ngang $y = \\frac{a}{c}$ nằm phía trên trục hoành ($y > 0$). Vì $a > 0$ nên $c > 0$.\n2) Tiệm cận đứng $x = -\\frac{d}{c}$ nằm bên trái trục tung ($x < 0$). Vì $c > 0$ nên $-\\frac{d}{c} < 0 \\Leftrightarrow d > 0$.\n3) Đồ thị cắt trục tung tại điểm có tung độ $y = \\frac{b}{d}$ nằm bên dưới trục hoành ($y < 0$). Vì $d > 0$ nên $b < 0$.\nVậy trong ba số $b, c, d$ có đúng 2 số dương (đó là $c$ và $d$). Đáp án D.",
      "diagram": "<div class=\"quiz-diagram-box\"><img src=\"../assets/images/diagrams/toan_gk1_mc_c10.png\" alt=\"Đồ thị hàm phân thức\" class=\"quiz-diagram-img\"></div>",
      "order_index": 10
    },
    {
      "id": "toan_gk1_mc_11",
      "subject_id": "toan",
      "topic_id": "1",
      "type": "mc",
      "question_text": "Đồ thị dưới đây là của một trong bốn hàm số sau. Hỏi hàm số đó là hàm số nào?",
      "options": [
        "$y=\\frac{1}{x+1}$",
        "$y=\\frac{-x^2-x+2}{x+1}$",
        "$y=\\frac{-x^2+x-4}{x+1}$",
        "$y=\\frac{x+2}{x+1}$"
      ],
      "correct_index": 1,
      "accepted_answers": [],
      "explanation": "Từ đồ thị ta xác định:\n- Tiệm cận đứng $x = -1$.\n- Tiệm cận xiên đi qua $(0;0)$ và $(1;-1)$, có phương trình $y = -x$.\n- Cắt trục tung tại điểm $(0;2)$.\nXét hàm số ở phương án B: $y = \\frac{-x^2-x+2}{x+1} = \\frac{-x(x+1)+2}{x+1} = -x + \\frac{2}{x+1}$. Hàm số này có tiệm cận đứng $x = -1$, tiệm cận xiên $y = -x$, và $y(0) = 2$. Ngoài ra khi $x=3 \\Rightarrow y(3) = -3 + \\frac{2}{4} = -\\frac{5}{2}$, đúng với điểm gióng $(3; -5/2)$ trên hình vẽ. Đáp án B.",
      "diagram": "<div class=\"quiz-diagram-box\"><img src=\"../assets/images/diagrams/toan_gk1_mc_c11.png\" alt=\"Đồ thị tiệm cận xiên\" class=\"quiz-diagram-img\"></div>",
      "order_index": 11
    },
    {
      "id": "toan_gk1_mc_12",
      "subject_id": "toan",
      "topic_id": "1",
      "type": "mc",
      "question_text": "Cho hàm số $y=f(x)$ có đồ thị như hình bên dưới. Khẳng định nào sau đây là đúng?",
      "options": [
        "Đồ thị hàm số có tiệm cận đứng $x=0$, tiệm cận ngang $y=2$.",
        "Đồ thị hàm số có tiệm cận đứng $x=0$, không có tiệm cận ngang.",
        "Đồ thị hàm số có tiệm cận ngang $y=0$, có tiệm cận đứng $x=2$.",
        "Đồ thị hàm số có tiệm cận ngang $y=2$, không có tiệm cận đứng."
      ],
      "correct_index": 0,
      "accepted_answers": [],
      "explanation": "Từ đồ thị: Khi $x \\to 0^+$, nhánh đồ thị tiến ra $+\\infty$ và khi $x \\to 0^-$, nhánh đồ thị tiến ra $-\\infty$. Do đó $x = 0$ (trục tung) là đường tiệm cận đứng. Khi $x \\to \\pm\\infty$, đồ thị tiến sát đường thẳng nằm ngang $y = 2$, do đó $y = 2$ là đường tiệm cận ngang. Đáp án A.",
      "diagram": "<div class=\"quiz-diagram-box\"><img src=\"../assets/images/diagrams/toan_gk1_mc_c12.png\" alt=\"Đồ thị hàm số tiệm cận đứng ngang\" class=\"quiz-diagram-img\"></div>",
      "order_index": 12
    },
    {
      "id": "toan_gk1_tf_01",
      "subject_id": "toan",
      "topic_id": "1",
      "type": "tf",
      "question_text": "Cho hàm số $y=f(x)$ có bảng biến thiên như hình vẽ. Xét tính Đúng / Sai của các khẳng định sau:",
      "options": [
        {
          "text": "Tập xác định của hàm số là $D=\\mathbb{R} \\setminus \\{0\\}$.",
          "isCorrect": true
        },
        {
          "text": "Hàm số đồng biến trên khoảng $(-2;1)$.",
          "isCorrect": false
        },
        {
          "text": "Giá trị cực tiểu của hàm số bằng $-1$.",
          "isCorrect": true
        },
        {
          "text": "Điểm cực đại của đồ thị hàm số là $1$.",
          "isCorrect": false
        }
      ],
      "correct_index": null,
      "accepted_answers": [],
      "explanation": "a) ĐÚNG: Tại $x=0$ bảng biến thiên có vạch đôi không xác định, do đó $D = \\mathbb{R} \\setminus \\{0\\}$.\nb) SAI: Hàm số đồng biến trên $(-2;0)$ và $(0;1)$, nhưng gián đoạn tại $x=0$ nên không đồng biến trên cả khoảng $(-2;1)$.\nc) ĐÚNG: Tại $x=-2$, $y'$ đổi dấu từ âm sang dương, giá trị cực tiểu $y_{CT} = f(-2) = -1$.\nd) SAI: Tại $x=1$ hàm đạt cực đại với giá trị $y=2$; điểm cực đại của đồ thị hàm số là tọa độ $(1;2)$, không phải số $1$.",
      "diagram": "<div class=\"quiz-diagram-box\"><img src=\"../assets/images/diagrams/toan_gk1_tf_c1.png\" alt=\"Bảng biến thiên câu 1\" class=\"quiz-diagram-img\"></div>",
      "order_index": 13
    },
    {
      "id": "toan_gk1_tf_02",
      "subject_id": "toan",
      "topic_id": "1",
      "type": "tf",
      "question_text": "Một nhóm học sinh muốn thiết kế một hộp đựng dụng cụ học tập có dạng hình hộp chữ nhật không nắp từ một tấm bìa hình vuông cạnh 60 cm. Các em tiến hành cắt bỏ bốn hình vuông nhỏ bằng nhau ở bốn góc của tấm bìa rồi gấp các phần bìa còn lại lên. Gọi $x$ (cm) là độ dài cạnh của các hình vuông nhỏ bị cắt đi ($0 < x < 30$), $V(x)$ là thể tích của chiếc hộp tạo thành.",
      "options": [
        {
          "text": "Khi cạnh phần cắt đi $x=15\\text{ cm}$ thì thể tích chiếc hộp đạt giá trị lớn nhất.",
          "isCorrect": false
        },
        {
          "text": "Thể tích lớn nhất của chiếc hộp có thể đạt được là $18000\\text{ cm}^3$.",
          "isCorrect": false
        },
        {
          "text": "Chiếc hộp có thể tích lớn nhất khi cạnh của hình vuông bị cắt bỏ là $x=10\\text{ cm}$.",
          "isCorrect": true
        },
        {
          "text": "Thể tích của chiếc hộp được tính bởi hàm số $V(x)=x(60-2x)^2\\;(\\text{cm}^3)$.",
          "isCorrect": true
        }
      ],
      "correct_index": null,
      "accepted_answers": [],
      "explanation": "Sau khi gấp, đáy hộp là hình vuông cạnh $60-2x$, chiều cao hộp là $x$ ($0 < x < 30$).\nd) ĐÚNG: Thể tích $V(x) = x(60-2x)^2 = 4x(30-x)^2 = 4x^3 - 240x^2 + 3600x$.\nĐạo hàm: $V'(x) = 12x^2 - 480x + 3600 = 12(x-10)(x-30)$.\nVới $x \\in (0;30)$, $V'(x) = 0 \\Leftrightarrow x = 10$.\nc) ĐÚNG & a) SAI: Chiếc hộp đạt thể tích lớn nhất khi $x = 10\\text{ cm}$, không phải $x = 15\\text{ cm}$.\nb) SAI: Thể tích cực đại là $V(10) = 10 \\cdot (60-20)^2 = 10 \\cdot 1600 = 16000\\text{ cm}^3$, không phải $18000\\text{ cm}^3$.",
      "diagram": null,
      "order_index": 14
    },
    {
      "id": "toan_gk1_tf_03",
      "subject_id": "toan",
      "topic_id": "1",
      "type": "tf",
      "question_text": "Cho hàm số $f(x)=\\frac{ax-6}{bx-c}$ $(a,b,c \\in \\mathbb{R})$ có bảng biến thiên như sau. Xét tính Đúng / Sai của các khẳng định sau:",
      "options": [
        {
          "text": "Đồ thị hàm số đã cho có đường tiệm cận đứng là $x=-2$ và đường tiệm cận ngang là $y=1$.",
          "isCorrect": true
        },
        {
          "text": "Hàm số $f(x)$ nghịch biến trên $\\mathbb{R} \\setminus \\{-2\\}$.",
          "isCorrect": false
        },
        {
          "text": "Trong các số $a, b, c$ có đúng hai số âm.",
          "isCorrect": true
        },
        {
          "text": "Gọi $I$ là tâm đối xứng của đồ thị hàm số và $A$ là giao điểm của đồ thị với trục tung. Biết khoảng cách $IA=\\sqrt{13}$, khi đó biểu thức $a+2b-c=-6$.",
          "isCorrect": false
        }
      ],
      "correct_index": null,
      "accepted_answers": [],
      "explanation": "a) ĐÚNG: Từ bảng biến thiên, khi $x \\to -2$ thì $y \\to \\pm\\infty \\Rightarrow x=-2$ là TCĐ; khi $x \\to \\pm\\infty$ thì $y \\to 1 \\Rightarrow y=1$ là TCN.\nb) SAI: Hàm số nghịch biến trên từng khoảng $(-\\infty;-2)$ và $(-2;+\\infty)$, không được ghi nghịch biến trên $\\mathbb{R} \\setminus \\{-2\\}$.\nc) ĐÚNG: Từ TCN $\\frac{a}{b}=1 \\Rightarrow a=b$. Từ TCĐ $x=\\frac{c}{b}=-2 \\Rightarrow c=-2b$. Hàm số nghịch biến nên $f'(x) = \\frac{-ac+6b}{(bx-c)^2} < 0 \\Rightarrow 6b - b(-2b) = 2b^2 + 6b < 0 \\Leftrightarrow -3 < b < 0$. Do đó $a=b < 0$ (2 số âm) và $c = -2b > 0$ (1 số dương).\nd) SAI: Tâm đối xứng $I(-2;1)$. Giao điểm với trục tung $A(0; 6/c)$. Khoảng cách $IA^2 = (-2)^2 + (6/c - 1)^2 = 13 \\Leftrightarrow (6/c - 1)^2 = 9 \\Leftrightarrow 6/c - 1 = 3$ (do $c>0 \\Rightarrow c=3/2$). Khi đó $b = -c/2 = -3/4, a = -3/4$. Biểu thức $a + 2b - c = -3/4 + 2(-3/4) - 3/2 = -15/4 \\ne -6$.",
      "diagram": "<div class=\"quiz-diagram-box\"><img src=\"../assets/images/diagrams/toan_gk1_tf_c3.png\" alt=\"Bảng biến thiên hàm phân thức\" class=\"quiz-diagram-img\"></div>",
      "order_index": 15
    },
    {
      "id": "toan_gk1_tf_04",
      "subject_id": "toan",
      "topic_id": "1",
      "type": "tf",
      "question_text": "Một công ty dược phẩm đang nghiên cứu một loại thuốc cảm cúm. Dữ liệu dược động học cho thấy sau khi bệnh nhân uống một viên thuốc tiêu chuẩn, nồng độ thuốc trong máu (đo bằng mg/lít) theo thời gian $t$ (tính bằng giờ, $t \\ge 0$) được mô hình hóa bởi hàm số: $C(t)=\\frac{16t}{t^2+4}$.",
      "options": [
        {
          "text": "Giai đoạn hấp thu thuốc vào máu (nồng độ thuốc tăng) là trong hai giờ đầu tiên sau khi uống một viên thuốc.",
          "isCorrect": true
        },
        {
          "text": "Sau khi uống một viên thuốc, thời gian càng lâu dài về sau lượng thuốc trong máu càng giảm về $0\\text{ mg/lít}$.",
          "isCorrect": true
        },
        {
          "text": "Đạo hàm của $C(t)$ là $C'(t)=\\frac{4-t^2}{(t^2+4)^2}$.",
          "isCorrect": false
        },
        {
          "text": "Nồng độ thuốc trong máu cao nhất là $4\\text{ mg/lít}$.",
          "isCorrect": true
        }
      ],
      "correct_index": null,
      "accepted_answers": [],
      "explanation": "Đạo hàm: $C'(t) = \\frac{16(t^2+4) - 16t \\cdot 2t}{(t^2+4)^2} = \\frac{16(4-t^2)}{(t^2+4)^2}$.\nc) SAI: Công thức thiếu thừa số 16 ở tử số.\na) ĐÚNG: Với $t \\in [0;2)$, $C'(t) > 0$ nên nồng độ thuốc tăng trong 2 giờ đầu tiên.\nd) ĐÚNG: $C'(t) = 0 \\Leftrightarrow t = 2$. Nồng độ thuốc cao nhất là $C(2) = \\frac{32}{8} = 4\\text{ mg/L}$.\nb) ĐÚNG: $\\lim_{t \\to +\\infty} C(t) = \\lim_{t \\to +\\infty} \\frac{16t}{t^2+4} = 0$, nghĩa là về lâu dài nồng độ thuốc giảm dần về 0.",
      "diagram": null,
      "order_index": 16
    },
    {
      "id": "toan_gk1_sa_01",
      "subject_id": "toan",
      "topic_id": "1",
      "type": "sa",
      "question_text": "Kính viễn vọng không gian Hubble được đưa vào vũ trụ ngày 24/4/1990 bằng tàu con thoi Discovery. Vận tốc của tàu con thoi trong sứ mệnh này, từ lúc cất cánh tại thời điểm $t=0$ (s) cho đến khi tên lửa đẩy được phóng đi tại thời điểm $t=126$ (s), cho bởi hàm số sau: $v(t)=0,001302t^3 - 0,09029t^2 + 23$ ($v$ được tính bằng ft/s, $1\\text{ ft}=0,3048\\text{ m}$). Gia tốc của tàu con thoi sẽ tăng trong khoảng thời gian từ $a$ đến $b$, tính $a+b$ (đơn vị: giây, làm tròn kết quả đến hàng đơn vị).",
      "options": [],
      "correct_index": null,
      "accepted_answers": [
        "149",
        "149s",
        "149 giây"
      ],
      "explanation": "Gia tốc $a(t) = v'(t) = 0,003906t^2 - 0,18058t$. Gia tốc tăng khi đạo hàm của gia tốc dương: $a'(t) = v''(t) = 0,007812t - 0,18058 > 0 \\Leftrightarrow t > \\frac{0,18058}{0,007812} \\approx 23,1157\\text{ s}$. Trong khoảng thời gian khảo sát $[0; 126]$, gia tốc tăng từ $a \\approx 23,1157$ đến $b = 126$. Tổng $a + b \\approx 23,1157 + 126 = 149,1157 \\approx 149\\text{ (giây)}$. Đáp số: 149.",
      "diagram": null,
      "order_index": 17
    },
    {
      "id": "toan_gk1_sa_02",
      "subject_id": "toan",
      "topic_id": "1",
      "type": "sa",
      "question_text": "Xí nghiệp $A$ sản xuất độc quyền một loại sản phẩm. Biết rằng hàm tổng chi phí sản xuất là $TC=x^3-77x^2+1000x+40000$ và hàm doanh thu là $TR=-2x^2+1312x$, với $x$ là số sản phẩm. Lợi nhuận của xí nghiệp $A$ được xác định bằng hàm số $f(x)=TR-TC$, cực đại lợi nhuận của xí nghiệp $A$ khi đó đạt bao nhiêu sản phẩm?",
      "options": [],
      "correct_index": null,
      "accepted_answers": [
        "52",
        "52 sản phẩm"
      ],
      "explanation": "Hàm lợi nhuận $f(x) = TR - TC = (-2x^2 + 1312x) - (x^3 - 77x^2 + 1000x + 40000) = -x^3 + 75x^2 + 312x - 40000$.\nĐạo hàm: $f'(x) = -3x^2 + 150x + 312 = -3(x-52)(x+2)$.\nVới $x \\ge 0$, $f'(x) = 0 \\Leftrightarrow x = 52$. Đạo hàm đổi dấu từ dương sang âm qua $x=52$ nên lợi nhuận đạt cực đại khi sản xuất $52$ sản phẩm. Đáp số: 52.",
      "diagram": null,
      "order_index": 18
    },
    {
      "id": "toan_gk1_sa_03",
      "subject_id": "toan",
      "topic_id": "1",
      "type": "sa",
      "question_text": "Một nghệ nhân làm gốm thủ công tại địa phương đang sản xuất một dòng bình hoa gốm đặc biệt. Mỗi ngày, nghệ nhân này có thể sản xuất $x$ chiếc bình hoa, với $1 \\le x \\le 18$, $x \\in \\mathbb{N}$. Tổng chi phí sản xuất $x$ bình hoa trong một ngày, tính bằng nghìn đồng, là $C(x)=x^3-40x^2+500x$. Giả sử toàn bộ số bình hoa sản xuất ra trong ngày đều được các cửa hàng lưu niệm thu mua hết với giá cố định 280 nghìn đồng/bình. Để đạt được lợi nhuận cao nhất, nghệ nhân này nên sản xuất bao nhiêu bình hoa mỗi ngày?",
      "options": [],
      "correct_index": null,
      "accepted_answers": [
        "18",
        "18 bình",
        "18 bình hoa"
      ],
      "explanation": "Tổng doanh thu $R(x) = 280x$ (nghìn đồng). Hàm lợi nhuận $L(x) = R(x) - C(x) = 280x - (x^3 - 40x^2 + 500x) = -x^3 + 40x^2 - 220x$.\nĐạo hàm: $L'(x) = -3x^2 + 80x - 220 = 0 \\Leftrightarrow x = \\frac{40 \\pm 2\\sqrt{235}}{3} \\approx 3,11$ hoặc $23,55$.\nTrên đoạn $[1;18]$, $L'(x) \\le 0$ trên $[1; 3,11]$ và $L'(x) \\ge 0$ trên $[3,11; 18]$. Do đó giá trị lớn nhất chỉ có thể đạt tại đầu mút $x=1$ hoặc $x=18$.\nTa có $L(1) = -181$ nghìn đồng; $L(18) = -(18)^3 + 40(18)^2 - 220(18) = 3168$ nghìn đồng. Do đó lợi nhuận cao nhất khi nghệ nhân sản xuất 18 bình hoa mỗi ngày. Đáp số: 18.",
      "diagram": null,
      "order_index": 19
    },
    {
      "id": "toan_gk1_sa_04",
      "subject_id": "toan",
      "topic_id": "1",
      "type": "sa",
      "question_text": "Một xưởng cơ khí gia công nhận hợp đồng sản xuất một loại bồn chứa nước công nghiệp bằng thép không gỉ. Theo yêu cầu kỹ thuật, mỗi bồn chứa có dạng hình trụ tròn xoay (gồm nắp đậy, thân trụ và đáy) với dung tích cố định là $V=16\\pi\\;(\\text{m}^3)$. Để đảm bảo độ bền chịu áp lực nước, vật liệu làm đáy bồn phải dày hơn nên chi phí gia công là 120000 đồng/m². Vật liệu làm nắp bồn và thân xung quanh có chi phí thấp hơn, cùng ở mức 60000 đồng/m². Do chiều cao xưởng lắp ráp bị giới hạn trần, chiều cao bồn chứa không được vượt quá 2 mét. Tổng chi phí vật liệu làm bồn chứa đạt giá trị nhỏ nhất là bao nhiêu triệu đồng? (Làm tròn kết quả đến hàng phần trăm).",
      "options": [],
      "correct_index": null,
      "accepted_answers": [
        "6,66",
        "6.66",
        "6,66 triệu đồng"
      ],
      "explanation": "Gọi bán kính đáy là $r$ (m) và chiều cao là $h$ (m). Thể tích $V = \\pi r^2 h = 16\\pi \\Rightarrow r^2 = \\frac{16}{h} \\Rightarrow r = \\frac{4}{\\sqrt{h}}$. Điều kiện: $0 < h \\le 2$.\nDiện tích đáy $S_{đáy} = \\pi r^2$, diện tích nắp $S_{nắp} = \\pi r^2$, diện tích xung quanh $S_{xq} = 2\\pi rh$.\nTổng chi phí vật liệu (triệu đồng):\n$F(h) = 0,12\\pi r^2 + 0,06\\pi r^2 + 0,06 \\cdot 2\\pi rh = 0,18\\pi r^2 + 0,12\\pi rh = \\pi \\left(\\frac{2,88}{h} + 0,48\\sqrt{h}\\right)$.\nĐạo hàm: $F'(h) = \\pi \\left(-\\frac{2,88}{h^2} + \\frac{0,24}{\\sqrt{h}}\\right) = \\frac{0,24\\pi}{h^2}\\left(h^{3/2} - 12\\right)$.\nVì $0 < h \\le 2 \\Rightarrow h^{3/2} \\le 2^{3/2} \\approx 2,83 < 12 \\Rightarrow F'(h) < 0$ với mọi $h \\in (0;2]$.\nDo đó $F(h)$ nghịch biến trên $(0;2]$, chi phí nhỏ nhất khi $h = 2\\text{ m}$.\nKhi $h = 2 \\Rightarrow F(2) = \\pi(1,44 + 0,48\\sqrt{2}) \\approx 6,6565\\text{ triệu đồng} \\approx 6,66\\text{ triệu đồng}$. Đáp số: 6,66.",
      "diagram": null,
      "order_index": 20
    },
    {
      "id": "toan_gk1_sa_05",
      "subject_id": "toan",
      "topic_id": "1",
      "type": "sa",
      "question_text": "Nồng độ của một loại thuốc tiêm trong máu của bệnh nhân sau $t$ giờ được tính bởi công thức $C(t)=36t^2-2t^3\\;(\\text{mg/L})$, với $t \\in [0;12]$. Nếu coi $C(t)$ là hàm số xác định trên đoạn $[0;12]$ thì đạo hàm $C'(t)$ biểu diễn tốc độ thay đổi nồng độ thuốc trong máu (mg/L/giờ) tại thời điểm $t$. Hỏi sau bao nhiêu giờ kể từ lúc tiêm thì tốc độ thay đổi nồng độ thuốc trong máu đạt giá trị lớn nhất?",
      "options": [],
      "correct_index": null,
      "accepted_answers": [
        "6",
        "6 giờ",
        "6h"
      ],
      "explanation": "Tốc độ thay đổi nồng độ thuốc là $v(t) = C'(t) = 72t - 6t^2$.\nTìm giá trị lớn nhất của $v(t)$ trên đoạn $[0;12]$:\nĐạo hàm $v'(t) = 72 - 12t = 0 \\Leftrightarrow t = 6 \\in [0;12]$.\nBiểu diễn tam thức bậc 2: $v(t) = -6(t-6)^2 + 216 \\le 216$. Dấu bằng đạt được khi $t = 6$.\nVậy sau đúng 6 giờ kể từ lúc tiêm thì tốc độ thay đổi nồng độ thuốc trong máu đạt cực đại. Đáp số: 6.",
      "diagram": null,
      "order_index": 21
    },
    {
      "id": "toan_gk1_sa_06",
      "subject_id": "toan",
      "topic_id": "1",
      "type": "sa",
      "question_text": "Trong hệ thống vi điện năng (Microgrid), công suất phát $P$ (tính bằng Watt, W) của một tấm pin quang điện phụ thuộc vào điện áp làm việc $V$ (tính bằng Volt, V) trên cổng tải. Với dải điện áp vận hành $V \\in [0;40]$, mối quan hệ giữa công suất và điện áp được mô hình hóa bởi hàm số: $P(V)=-0,02V^3+0,9V^2+8V$. Công suất lớn nhất đạt được là bao nhiêu Watt? (Làm tròn kết quả đến hàng đơn vị).",
      "options": [],
      "correct_index": null,
      "accepted_answers": [
        "526",
        "526W",
        "526 W"
      ],
      "explanation": "Đạo hàm: $P'(V) = -0,06V^2 + 1,8V + 8$.\nGiải phương trình $P'(V) = 0 \\Leftrightarrow 3V^2 - 90V - 400 = 0 \\Leftrightarrow V = \\frac{45 \\pm 5\\sqrt{129}}{3}$.\nVì $V \\in [0;40]$, ta lấy nghiệm dương $V_0 = \\frac{45 + 5\\sqrt{129}}{3} \\approx 33,93\\text{ V}$.\nVì hàm số bậc 3 có hệ số âm, $P'(V)$ đổi dấu từ dương sang âm qua $V_0$ nên $P(V)$ đạt cực đại tại $V_0$.\nTính giá trị: $P(0) = 0\\text{ W}$, $P(40) = 480\\text{ W}$, $P(V_0) \\approx 526,33\\text{ W}$.\nLàm tròn đến hàng đơn vị được 526 W. Đáp số: 526.",
      "diagram": null,
      "order_index": 22
    }
  ]
};
