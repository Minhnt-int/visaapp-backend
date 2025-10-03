
// backend/visaapp/scripts/seed.js

/*
 * =================================================================================
 * SCRIPT KHỞI TẠO DATABASE (SEEDING SCRIPT)
 * = '================================================================================='
 *
 * Hướng dẫn sử dụng:
 * 1. Cài đặt các dependency cần thiết:
 *    npm install mysql2 dotenv
 *
 * 2. Tạo file `.env` hoặc `.env.local` trong thư mục `backend/visaapp` với nội dung:
 *    DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE_NAME"
 *
 * 3. Chạy script từ thư mục gốc `backend/visaapp`:
 *    node scripts/seed.js
 *
 * Chức năng:
 * - Đọc dữ liệu mẫu từ `frontend/visaapp/lib/mock-data.ts`.
 * - Kết nối đến database MySQL.
 * - Xóa các bảng cũ để làm sạch.
 * - Tạo lại cấu trúc các bảng theo schema đã thiết kế.
 * - Chèn (seed) dữ liệu mẫu vào các bảng, xử lý các mối quan hệ phức tạp.
 */

const path = require('path');
const { createConnection } = require('mysql2/promise');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

// IMPORTANT: We are in `backend/visaapp`, so we need to go up and then into the frontend project.
const {
  mockNews,
  newsPreview,
  mockTourCategories,
  mockTours,
  mockVisaContinents,
  mockVisaPageData,
  siteConfig,
  contactInfo,
  navigationLinks,
} = require('../../../visaapp/lib/mock-data');
const { normalizeVietnamese } = require('../../../visaapp/lib/api');


async function main() {
  // Kết nối đến database từ chuỗi DATABASE_URL trong file .env
  const connection = await createConnection(process.env.DATABASE_URL);
  console.log('✅ Đã kết nối thành công đến database.');

  // Bắt đầu quá trình tạo và chèn dữ liệu
  try {
    console.log('🔄 Bắt đầu quá trình khởi tạo dữ liệu...');
    await connection.beginTransaction();

    // 1. Tạo các bảng (Tables)
    await createTables(connection);

    // 2. Chèn dữ liệu vào các bảng
    await seedData(connection);

    await connection.commit();
    console.log('✅ Hoàn tất khởi tạo và chèn dữ liệu thành công!');
  } catch (error) {
    await connection.rollback();
    console.error('❌ Đã xảy ra lỗi, rollback tất cả thay đổi:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

async function createTables(connection) {
  console.log('  -> Dọn dẹp các bảng cũ...');
  // Xóa bảng theo thứ tự ngược để tránh lỗi khóa ngoại
  await connection.query(`DROP TABLE IF EXISTS news_tags;`);
  await connection.query(`DROP TABLE IF EXISTS tour_tags;`);
  await connection.query(`DROP TABLE IF EXISTS news;`);
  await connection.query(`DROP TABLE IF EXISTS tours;`);
  await connection.query(`DROP TABLE IF EXISTS tags;`);
  await connection.query(`DROP TABLE IF EXISTS tour_categories;`);
  await connection.query(`DROP TABLE IF EXISTS visa_services;`);
  await connection.query(`DROP TABLE IF EXISTS continents;`);
  await connection.query(`DROP TABLE IF EXISTS site_settings;`);

  console.log('  -> Tạo cấu trúc bảng mới...');
  
  // Bảng Cài đặt chung (Key-Value Store)
  await connection.query(`
    CREATE TABLE site_settings (
      setting_key VARCHAR(255) PRIMARY KEY,
      setting_value JSON NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);
  
  // Bảng Châu lục (Continents)
  await connection.query(`
    CREATE TABLE continents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);

  // Bảng Dịch vụ Visa (Visa Services)
  // `details` sẽ lưu trữ toàn bộ cấu trúc phức tạp từ VisaDetail
  await connection.query(`
    CREATE TABLE visa_services (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(255) NOT NULL UNIQUE,
      title VARCHAR(255) NOT NULL,
      country_name VARCHAR(255) NOT NULL,
      hero_image VARCHAR(255),
      description TEXT,
      continent_id INT,
      details JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (continent_id) REFERENCES continents(id) ON DELETE SET NULL
    );
  `);
  
  // Bảng Danh mục Tour (Tour Categories)
  await connection.query(`
    CREATE TABLE tour_categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      description TEXT,
      image_url VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);
  
  // Bảng Tags (Dùng chung cho News và Tours)
  await connection.query(`
    CREATE TABLE tags (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);

  // Bảng Tour
  // Dùng kiểu JSON cho các trường có cấu trúc phức tạp
  await connection.query(`
    CREATE TABLE tours (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      country VARCHAR(255),
      duration VARCHAR(100),
      price DECIMAL(12, 2) NOT NULL,
      original_price DECIMAL(12, 2),
      image VARCHAR(255),
      rating FLOAT,
      review_count INT,
      is_hot BOOLEAN DEFAULT FALSE,
      details JSON, -- Chứa gallery, itinerary, services, terms, whyChooseUs etc.
      category_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES tour_categories(id) ON DELETE SET NULL
    );
  `);
  
  // Bảng News (Tin tức)
  await connection.query(`
    CREATE TABLE news (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(255) NOT NULL UNIQUE,
      title VARCHAR(500) NOT NULL,
      excerpt TEXT,
      content LONGTEXT,
      image_url VARCHAR(255),
      author VARCHAR(255),
      published_at DATE,
      read_time VARCHAR(50),
      view_count INT DEFAULT 0,
      status ENUM('published', 'draft') DEFAULT 'published',
      meta_title VARCHAR(500),
      meta_description TEXT,
      meta_keywords TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);
  
  // Bảng nối News và Tags (Many-to-Many)
  await connection.query(`
    CREATE TABLE news_tags (
      news_id INT NOT NULL,
      tag_id INT NOT NULL,
      PRIMARY KEY (news_id, tag_id),
      FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );
  `);

  // Bảng nối Tours và Tags (Many-to-Many)
  await connection.query(`
    CREATE TABLE tour_tags (
      tour_id INT NOT NULL,
      tag_id INT NOT NULL,
      PRIMARY KEY (tour_id, tag_id),
      FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );
  `);

  console.log('✅ Đã tạo thành công các bảng.');
}


async function seedData(connection) {
  console.log('  -> Bắt đầu chèn dữ liệu mẫu (seeding)...');
  
  // 1. Chèn Site Settings (dữ liệu chung)
  await connection.execute(`INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?), (?, ?), (?, ?);`, [
    'site_config', JSON.stringify(siteConfig),
    'contact_info', JSON.stringify(contactInfo),
    'navigation_links', JSON.stringify(navigationLinks)
  ]);
  
  // 2. Chèn Continents
  for (const continent of mockVisaContinents) {
    await connection.execute(
      'INSERT INTO continents (name, slug, description) VALUES (?, ?, ?)',
      [continent.name, continent.slug, continent.description]
    );
  }
  const [continents] = await connection.query('SELECT id, slug FROM continents;');
  const continentMap = new Map(continents.map(c => [c.slug, c.id]));

  // 3. Chèn Visa Services
  for (const [slug, details] of Object.entries(mockVisaPageData)) {
    const continentId = continentMap.get(details.continentSlug) || null;
    await connection.execute(
      'INSERT INTO visa_services (slug, title, country_name, hero_image, description, continent_id, details) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [slug, details.title, details.countryName, details.heroImage, details.description, continentId, JSON.stringify(details)]
    );
  }

  // 4. Chèn Tour Categories
  for (const category of mockTourCategories) {
     await connection.execute(
      'INSERT INTO tour_categories (name, slug, description, image_url) VALUES (?, ?, ?, ?)',
      [category.name, category.slug, category.description, category.imageUrl]
    );
  }
  const [tourCategories] = await connection.query('SELECT id, slug FROM tour_categories;');
  const tourCategoryMap = new Map(tourCategories.map(c => [c.slug, c.id]));

  // 5. Chèn Tags
  const allTags = new Set();
  newsPreview.forEach(n => n.category.forEach(tag => allTags.add(tag)));
  mockTours.forEach(t => t.tags?.forEach(tag => allTags.add(tag)));

  for (const tagName of Array.from(allTags)) {
      const tagSlug = normalizeVietnamese(tagName);
      await connection.execute('INSERT INTO tags (name, slug) VALUES (?, ?) ON DUPLICATE KEY UPDATE name=name;', [tagName, tagSlug]);
  }
  const [tags] = await connection.query('SELECT id, slug FROM tags;');
  const tagMap = new Map(tags.map(t => [t.slug, t.id]));
  
  // 6. Chèn News và liên kết Tags
  for (const post of newsPreview) { // newsPreview có đủ dữ liệu cần thiết
    const [result] = await connection.execute(
      `INSERT INTO news (slug, title, excerpt, image_url, author, published_at, read_time, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [post.slug, post.title, post.excerpt, post.imageUrl, post.author, new Date(post.date), post.readTime, 'published']
    );
    const newsId = result.insertId;

    for (const categoryName of post.category) {
      const tagSlug = normalizeVietnamese(categoryName);
      const tagId = tagMap.get(tagSlug);
      if (tagId) {
        await connection.execute('INSERT INTO news_tags (news_id, tag_id) VALUES (?, ?)', [newsId, tagId]);
      }
    }
  }

  // 7. Chèn Tours và liên kết Tags
  for (const tour of mockTours) {
    const categoryId = tourCategoryMap.get(tour.categorySlug) || null;
    // Tách các trường đơn giản ra và đưa phần còn lại vào JSON
    const { id, slug, name, country, duration, price, originalPrice, image, rating, reviewCount, isHot, categorySlug, tags: tourTags, ...details } = tour;
    const [result] = await connection.execute(
      `INSERT INTO tours (slug, name, country, duration, price, original_price, image, rating, review_count, is_hot, category_id, details) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [slug, name, country, duration, price, originalPrice, image, rating, reviewCount, isHot, categoryId, JSON.stringify(details)]
    );
    const tourId = result.insertId;
    
    if (tourTags) {
      for (const tagName of tourTags) {
        const tagSlug = normalizeVietnamese(tagName);
        const tagId = tagMap.get(tagSlug);
        if (tagId) {
          await connection.execute('INSERT INTO tour_tags (tour_id, tag_id) VALUES (?, ?)', [tourId, tagId]);
        }
      }
    }
  }

  console.log('✅ Dữ liệu mẫu đã được chèn thành công.');
}

main().catch(err => {
  console.error(
    'Lỗi không mong muốn trong quá trình thực thi script:',
    err,
  );
  process.exit(1);
});
