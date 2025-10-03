const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Tải biến môi trường từ file .env.local
dotenv.config({ path: './.env.local' });

// Tải dữ liệu mẫu từ file cục bộ
const { 
    metaData,
    mockNews,
    mockVisaServices,
    mockTours,
    mockTourCategories
} = require('./seed-data.js');

async function main() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true
    });

    try {
        console.log('✅ Đã kết nối với database.');
        console.log('🚀 Bắt đầu quá trình seeding với kiến trúc mới...');

        // Tắt kiểm tra khóa ngoại để DROP bảng dễ dàng
        await connection.query('SET FOREIGN_KEY_CHECKS=0;');

        // ---- DỌN DẸP CÁC BẢNG CŨ VÀ BẢNG LIÊN QUAN ----
        console.log('🧹 Dọn dẹp các bảng cũ...');
        await connection.query('DROP TABLE IF EXISTS news_tags;');
        await connection.query('DROP TABLE IF EXISTS tags;');
        await connection.query('DROP TABLE IF EXISTS faqs;');
        await connection.query('DROP TABLE IF EXISTS site_settings;');
        await connection.query('DROP TABLE IF EXISTS contact_submissions;');
        await connection.query('DROP TABLE IF EXISTS visa_services;');
        await connection.query('DROP TABLE IF EXISTS continents;');
        await connection.query('DROP TABLE IF EXISTS tour_tags;');
        await connection.query('DROP TABLE IF EXISTS tours;');
        await connection.query('DROP TABLE IF EXISTS tour_categories;');
        await connection.query('DROP TABLE IF EXISTS news;');
        await connection.query('DROP TABLE IF EXISTS meta_json;'); // Dọn luôn bảng meta mới để đảm bảo sạch


        // ---- TẠO BẢNG THEO KIẾN TRÚC MỚI ----

        // 1. Bảng `meta_json` để lưu trữ tất cả cấu hình
        console.log('✨ Tạo và seed bảng `meta_json`...');
        await connection.query(`
            CREATE TABLE meta_json (
                id INT AUTO_INCREMENT PRIMARY KEY,
                page_key VARCHAR(100) NOT NULL UNIQUE,
                meta_data JSON NOT NULL
            );
        `);
        for (const key in metaData) {
            await connection.execute(
                'INSERT INTO meta_json (page_key, meta_data) VALUES (?, ?)',
                [key, JSON.stringify(metaData[key])]
            );
        }

        // 2. Bảng `news` với cột `tags` là JSON
        console.log('✨ Tạo và seed bảng `news`...');
        await connection.query(`
            CREATE TABLE news (
                id INT AUTO_INCREMENT PRIMARY KEY,
                slug VARCHAR(255) NOT NULL UNIQUE,
                title VARCHAR(255) NOT NULL,
                excerpt TEXT,
                content LONGTEXT,
                image_url VARCHAR(512),
                author VARCHAR(255),
                published_at DATE,
                read_time INT,
                meta_title VARCHAR(255),
                meta_description VARCHAR(512),
                meta_keywords VARCHAR(255),
                status VARCHAR(50) DEFAULT 'draft',
                tags JSON // Cột tags mới kiểu JSON
            );
        `);
        for (const article of mockNews) {
            await connection.execute(
                `INSERT INTO news (slug, title, excerpt, content, image_url, author, published_at, read_time, meta_title, meta_description, meta_keywords, status, tags) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [article.slug, article.title, article.excerpt, article.content, article.imageUrl, article.author, article.publishedAt, article.readTime, article.metaTitle, article.metaDescription, article.metaKeywords, article.status, JSON.stringify(article.tags)]
            );
        }

        // 3. Bảng `visa_services` với `continent_slug`
        console.log('✨ Tạo và seed bảng `visa_services`...');
        await connection.query(`
            CREATE TABLE visa_services (
                id INT AUTO_INCREMENT PRIMARY KEY,
                slug VARCHAR(255) NOT NULL UNIQUE,
                continent_slug VARCHAR(255), -- Cột mới thay cho khóa ngoại
                title VARCHAR(255) NOT NULL,
                country_name VARCHAR(255) NOT NULL,
                hero_image VARCHAR(512),
                success_rate VARCHAR(50),
                processing_time VARCHAR(255),
                description TEXT,
                details JSON
            );
        `);
        for (const slug in mockVisaServices) {
            const service = mockVisaServices[slug];
            await connection.execute(
                `INSERT INTO visa_services (slug, continent_slug, title, country_name, hero_image, success_rate, processing_time, description, details) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [slug, service.continent_slug, service.title, service.country_name, service.hero_image, service.success_rate, service.processing_time, service.description, JSON.stringify(service.details)]
            );
        }
        
        // 4. Các bảng `tours` và `tour_categories` (vẫn cần thiết)
        console.log('✨ Tạo và seed bảng `tour_categories` và `tours`...');
        await connection.query(`
            CREATE TABLE tour_categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                slug VARCHAR(255) NOT NULL UNIQUE,
                description TEXT,
                image_url VARCHAR(512)
            );
        `);
        for (const category of mockTourCategories) {
            await connection.execute(
                'INSERT INTO tour_categories (name, slug, description, image_url) VALUES (?, ?, ?, ?)',
                [category.name, category.slug, category.description, category.imageUrl]
            );
        }
        
        const categoriesMap = (await connection.query('SELECT id, slug FROM tour_categories'))[0].reduce((map, row) => {
            map[row.slug] = row.id;
            return map;
        }, {});

        await connection.query(`
          CREATE TABLE tours (
            id INT AUTO_INCREMENT PRIMARY KEY,
            slug VARCHAR(255) NOT NULL UNIQUE,
            name VARCHAR(255) NOT NULL,
            category_id INT,
            country VARCHAR(255),
            duration VARCHAR(255),
            price DECIMAL(15, 2) NOT NULL,
            original_price DECIMAL(15, 2),
            image VARCHAR(512),
            rating FLOAT,
            review_count INT,
            is_hot BOOLEAN DEFAULT false,
            details JSON,
            FOREIGN KEY (category_id) REFERENCES tour_categories(id) ON DELETE SET NULL
          );
        `);
        for (const tour of mockTours) {
            const categoryId = categoriesMap[tour.categorySlug] || null;
            await connection.execute(
                `INSERT INTO tours (slug, name, category_id, country, duration, price, original_price, image, rating, review_count, is_hot, details) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [tour.slug, tour.name, categoryId, tour.country, tour.duration, tour.price, tour.originalPrice, tour.image, tour.rating, tour.reviewCount, tour.isHot, JSON.stringify(tour.details)]
            );
        }
        
        // 5. Bảng `contact_submissions` (để lưu form liên hệ)
        console.log('✨ Tạo bảng `contact_submissions`...');
        await connection.query(`
            CREATE TABLE contact_submissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                subject VARCHAR(255),
                message TEXT NOT NULL,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        

        // Bật lại kiểm tra khóa ngoại
        await connection.query('SET FOREIGN_KEY_CHECKS=1;');

        console.log('\n✅ Hoàn tất! Database đã được seed thành công với kiến trúc mới.');

    } catch (error) {
        console.error('❌ Lỗi khi seeding database:', error);
    } finally {
        await connection.end();
        console.log('🔌 Đã đóng kết nối database.');
    }
}

main().catch(err => {
    console.error('Lỗi không mong muốn xảy ra:', err);
});
