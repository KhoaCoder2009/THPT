/* ========================================================
   SCRIPT TỰ ĐỘNG ĐẨY TOÀN BỘ CÂU HỎI LÊN SUPABASE CỦA BẠN
   Cách chạy:
   1. Điền SUPABASE_URL và SUPABASE_ANON_KEY trong file 'supabase-config.js'
   2. Mở terminal và chạy lệnh:
      node upload_to_supabase.js
   ======================================================== */

const fs = require('fs');
const https = require('https');
const url = require('url');

const path = require('path');
const configCandidatePaths = [
  path.join(__dirname, '../js/supabase-config.js'),
  path.join(__dirname, 'supabase-config.js'),
  path.join(process.cwd(), 'js/supabase-config.js'),
  path.join(process.cwd(), 'supabase-config.js')
];
const configPath = configCandidatePaths.find(p => fs.existsSync(p));
if (!configPath) {
  console.error('❌ Không tìm thấy file supabase-config.js!');
  process.exit(1);
}
const configContent = fs.readFileSync(configPath, 'utf8');

const urlMatch = configContent.match(/const\s+SUPABASE_URL\s*=\s*["']([^"']+)["']/);
const keyMatch = configContent.match(/const\s+SUPABASE_ANON_KEY\s*=\s*["']([^"']+)["']/);

const SUPABASE_URL = urlMatch ? urlMatch[1] : '';
const SUPABASE_KEY = keyMatch ? keyMatch[1] : '';

if (!SUPABASE_URL || !SUPABASE_KEY || SUPABASE_URL.includes('YOUR_SUPABASE') || SUPABASE_KEY.includes('YOUR_SUPABASE')) {
  console.error('\n❌ CHƯA CẤU HÌNH SUPABASE:');
  console.error('Vui lòng mở file "supabase-config.js" và điền SUPABASE_URL và SUPABASE_ANON_KEY từ Supabase Dashboard của bạn!');
  console.error('Sau đó chạy lại lệnh: node upload_to_supabase.js\n');
  process.exit(1);
}

const dataCandidatePaths = [
  path.join(__dirname, 'supabase-data.json'),
  path.join(process.cwd(), 'database/supabase-data.json'),
  path.join(process.cwd(), 'supabase-data.json')
];
const dataPath = dataCandidatePaths.find(p => fs.existsSync(p));
if (!dataPath) {
  console.error('❌ Không tìm thấy file supabase-data.json!');
  process.exit(1);
}
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('🚀 Đang kết nối tới Supabase:', SUPABASE_URL);

function supabaseRest(endpoint, method, body) {
  return new Promise((resolve, reject) => {
    const fullUrl = SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/' + endpoint;
    const parsed = new URL(fullUrl);

    const postData = body ? JSON.stringify(body) : '';

    const options = {
      hostname: parsed.hostname,
      port: 443,
      path: parsed.pathname + (parsed.search || ''),
      method: method,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let resBody = '';
      res.on('data', chunk => resBody += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(resBody);
        } else {
          reject(new Error(`[${res.statusCode}] ${resBody}`));
        }
      });
    });

    req.on('error', err => reject(err));
    if (postData) req.write(postData);
    req.end();
  });
}

async function runUpload() {
  try {
    console.log(`1. Đang tải lên ${data.subjects.length} môn học (subjects)...`);
    await supabaseRest('subjects', 'POST', data.subjects);
    console.log('✅ Đã nạp xong bảng subjects.');

    console.log(`2. Đang tải lên ${data.topics.length} chuyên đề (topics)...`);
    await supabaseRest('topics', 'POST', data.topics);
    console.log('✅ Đã nạp xong bảng topics.');

    console.log(`3. Đang tải lên ${data.questions.length} câu hỏi thật (questions)...`);
    // Batch in chunks of 50 to avoid payload limits
    const chunkSize = 50;
    for (let i = 0; i < data.questions.length; i += chunkSize) {
      const chunk = data.questions.slice(i, i + chunkSize);
      await supabaseRest('questions', 'POST', chunk);
      console.log(`   -> Đã tải ${Math.min(i + chunkSize, data.questions.length)} / ${data.questions.length} câu hỏi...`);
    }
    console.log(`✅ ĐÃ NẠP THÀNH CÔNG TOÀN BỘ ${data.questions.length} CÂU HỎI LÊN SUPABASE CỦA BẠN!`);
    console.log('👉 Bây giờ website của bạn đã sẵn sàng đồng bộ trực tiếp với dữ liệu Supabase.');
  } catch (err) {
    console.error('❌ Lỗi tải lên Supabase:', err.message);
    console.error('Gợi ý: Hãy chắc chắn bạn đã chạy file "CAI_DAT_TOAN_BO_DATABASE.sql" hoặc "supabase-schema.sql" trong SQL Editor của Supabase để tạo bảng trước!');
  }
}

runUpload();
