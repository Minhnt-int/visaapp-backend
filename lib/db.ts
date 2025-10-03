// backend/visaapp/lib/db.ts

import mysql from 'mysql2/promise';

/**
 * =================================================================================
 * QUẢN LÝ KẾT NỐI DATABASE (DATABASE CONNECTION POOL)
 * =================================================================================
 *
 * Tại sao lại cần file này?
 * Trong một ứng dụng web, việc tạo một kết nối mới đến database cho mỗi yêu cầu (request)
 * là cực kỳ chậm và tốn tài nguyên. Một "Connection Pool" (bể kết nối) sẽ giải quyết
 * vấn đề này bằng cách tạo ra và duy trì một số lượng kết nối đã sẵn sàng.
 *
 * Khi có một yêu cầu cần truy vấn database:
 * 1. Nó sẽ "mượn" một kết nối từ bể.
 * 2. Thực hiện truy vấn.
 * 3. "Trả" kết nối đó lại vào bể để các yêu cầu khác có thể tái sử dụng.
 *
 * Lợi ích:
 * - Tăng hiệu suất: Giảm độ trễ vì không phải mở/đóng kết nối liên tục.
 * - Tăng độ ổn định: Quản lý và giới hạn số lượng kết nối đồng thời, tránh làm sập database.
 *
 * Chú ý:
 * - Biến `pool` được khai báo trong scope global nhưng chỉ được khởi tạo một lần.
 *   Trong môi trường serverless của Next.js, điều này giúp tái sử dụng pool giữa các
 *   lần gọi API khác nhau mà không cần khởi tạo lại.
 */

declare global {
  // Khai báo một biến global để lưu trữ connection pool.
  // Điều này cho phép chúng ta tái sử dụng pool trong môi trường hot-reload của development.
  var pool: mysql.Pool | undefined;
}

let pool: mysql.Pool;

if (process.env.NODE_ENV === 'production') {
  // Trong môi trường production, khởi tạo pool một lần và sử dụng.
  pool = mysql.createPool(process.env.DATABASE_URL);
} else {
  // Trong môi trường development, chúng ta cần xử lý hot-reloading.
  // Nếu không có check này, mỗi lần Next.js reload, một pool mới sẽ được tạo ra,
  // dẫn đến cạn kiệt kết nối.
  if (!global.pool) {
    global.pool = mysql.createPool(process.env.DATABASE_URL);
  }
  pool = global.pool;
}

export const db = pool;
