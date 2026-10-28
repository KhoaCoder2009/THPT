# HƯỚNG DẪN 3 DẠNG THỨC CÂU HỎI CHUẨN THI TỐT NGHIỆP THPT (KEdu)

Hệ thống hỗ trợ chuẩn 3 phần theo định dạng đề thi mới của Bộ Giáo dục & Đào tạo:

---

### 1. DẠNG 1: TRẮC NGHIỆM NHIỀU LỰA CHỌN (type: "mc")
- **Mô tả**: Câu hỏi có 4 phương án A, B, C, D (chọn 1 phương án đúng).
- **Cấu trúc JSON trong `supabase-data.json`**:
```json
{
  "id": "toan_mc_01",
  "subject_id": "toan",
  "topic_id": "1",
  "type": "mc",
  "question_text": "Hàm số y = x^3 - 3x^2 + 2 nghịch biến trên khoảng nào dưới đây?",
  "options": [
    "(0; 2)",
    "(-∞; 0)",
    "(2; +∞)",
    "(0; +∞)"
  ],
  "correct_index": 0,
  "explanation": "Đạo hàm y' = 3x^2 - 6x = 3x(x - 2) < 0 với mọi x thuộc (0; 2).",
  "diagram": null,
  "order_index": 1
}
```

---

### 2. DẠNG 2: TRẮC NGHIỆM ĐÚNG / SAI (type: "tf")
- **Mô tả**: Mỗi câu gồm 1 tình huống/lệnh hỏi chung và 4 mệnh đề a, b, c, d; học sinh chọn Đúng hoặc Sai cho từng ý.
- **Cấu trúc JSON trong `supabase-data.json`**:
```json
{
  "id": "toan_tf_01",
  "subject_id": "toan",
  "topic_id": "1",
  "type": "tf",
  "question_text": "Cho hàm số y = f(x) có đạo hàm f'(x) = x(x - 1)^2(x + 2). Xét tính đúng/sai của các khẳng định sau:",
  "options": [
    { "text": "Hàm số đồng biến trên khoảng (0; +∞)", "isCorrect": true },
    { "text": "Hàm số có 3 điểm cực trị", "isCorrect": false },
    { "text": "Điểm x = 0 là điểm cực đại của hàm số", "isCorrect": true },
    { "text": "Đồ thị hàm số đạt cực tiểu tại x = -2", "isCorrect": true }
  ],
  "explanation": "Nghiệm bội chẵn x = 1 không đổi dấu, do đó hàm số chỉ có 2 điểm cực trị tại x = -2 và x = 0.",
  "diagram": null,
  "order_index": 2
}
```

---

### 3. DẠNG 3: TRẮC NGHIỆM TRẢ LỜI NGẮN (type: "sa")
- **Mô tả**: Câu hỏi yêu cầu học sinh tính toán hoặc tìm giá trị rồi nhập kết quả ngắn vào ô trống.
- **Cấu trúc JSON trong `supabase-data.json`**:
```json
{
  "id": "toan_sa_01",
  "subject_id": "toan",
  "topic_id": "1",
  "type": "sa",
  "question_text": "Tìm giá trị lớn nhất của hàm số y = -x^4 + 2x^2 + 3 trên đoạn [0; 2].",
  "accepted_answers": ["4", "4.0"],
  "explanation": "y' = -4x^3 + 4x = 0 <=> x = 0 hoặc x = 1 trên [0; 2]. y(0)=3, y(1)=4, y(2)=-5. Vậy GTLN là 4.",
  "diagram": null,
  "order_index": 3
}
```
