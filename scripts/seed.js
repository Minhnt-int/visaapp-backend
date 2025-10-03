const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Configure dotenv to find the .env.local file
dotenv.config({ path: './.env.local' });

const { 
    mockTours,
    mockTourCategories,
    mockNews,
    mockTags,
    mockVisaPageData,
    mockContinents,
    mockFaqs,
    siteSettings 
} = require('./seed-data.js'); // <--- THAY ĐỔI Ở ĐÂY: Sử dụng file data cục bộ


async function main() {
    // Create a connection to the database
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true // Allow multiple SQL statements
    });

    try {
        console.log('Connected to the database.');
        console.log('Starting to seed the database...');

        // The seeding logic from your original file
        // The tables will be dropped and recreated, so the order is important.

        await connection.query('SET FOREIGN_KEY_CHECKS=0;');

        console.log('Seeding `continents` table...');
        await connection.query('DROP TABLE IF EXISTS continents');
        await connection.query(`
            CREATE TABLE continents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                slug VARCHAR(255) NOT NULL UNIQUE,
                description TEXT
            );
        `);
        for (const continent of mockContinents) {
            await connection.execute(
                'INSERT INTO continents (name, slug, description) VALUES (?, ?, ?)',
                [continent.name, continent.slug, continent.description]
            );
        }

        console.log('Seeding `visa_services` table...');
        await connection.query('DROP TABLE IF EXISTS visa_services');
        await connection.query(`
            CREATE TABLE visa_services (
                id INT AUTO_INCREMENT PRIMARY KEY,
                continent_id INT,
                slug VARCHAR(255) NOT NULL UNIQUE,
                title VARCHAR(255) NOT NULL,
                country_name VARCHAR(255) NOT NULL,
                hero_image VARCHAR(512),
                success_rate VARCHAR(50),
                processing_time VARCHAR(255),
                description TEXT,
                details JSON, -- Store all other details as a JSON object
                FOREIGN KEY (continent_id) REFERENCES continents(id) ON DELETE SET NULL
            );
        `);

        const continentsMap = (await connection.query('SELECT id, slug FROM continents'))[0].reduce((map, row) => {
            map[row.slug] = row.id;
            return map;
        }, {});

        for (const slug in mockVisaPageData) {
            const service = mockVisaPageData[slug];
            const continentId = continentsMap[service.continentSlug] || null;
            await connection.execute(
                `INSERT INTO visa_services (continent_id, slug, title, country_name, hero_image, success_rate, processing_time, description, details) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [continentId, slug, service.title, service.countryName, service.heroImage, service.successRate, service.processingTime, service.description, JSON.stringify(service.details)]
            );
        }

        console.log('Seeding `tour_categories` table...');
        await connection.query('DROP TABLE IF EXISTS tour_categories');
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

        console.log('Seeding `tours` and related tables...');
        await connection.query('DROP TABLE IF EXISTS tour_tags;');
        await connection.query('DROP TABLE IF EXISTS tours;');
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

        const categoriesMap = (await connection.query('SELECT id, slug FROM tour_categories'))[0].reduce((map, row) => {
            map[row.slug] = row.id;
            return map;
        }, {});

        for (const tour of mockTours) {
            const categoryId = categoriesMap[tour.categorySlug] || null;
            await connection.execute(
                `INSERT INTO tours (slug, name, category_id, country, duration, price, original_price, image, rating, review_count, is_hot, details) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [tour.slug, tour.name, categoryId, tour.country, tour.duration, tour.price, tour.originalPrice, tour.image, tour.rating, tour.reviewCount, tour.isHot, JSON.stringify(tour.details)]
            );
        }

        // Seeding Tags for News and Tours
        console.log('Seeding `tags` table...');
        await connection.query('DROP TABLE IF EXISTS news_tags;');
        await connection.query('DROP TABLE IF EXISTS tags;');
        await connection.query(`
            CREATE TABLE tags (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                slug VARCHAR(255) NOT NULL UNIQUE
            );
        `);
        for (const tag of mockTags) {
            await connection.execute('INSERT INTO tags (name, slug) VALUES (?, ?)', [tag.name, tag.slug]);
        }

        console.log('Seeding `news` and `news_tags` table...');
        await connection.query('DROP TABLE IF EXISTS news');
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
                status VARCHAR(50) DEFAULT 'draft'
            );
        `);

        await connection.query(`
            CREATE TABLE news_tags (
                news_id INT,
                tag_id INT,
                PRIMARY KEY (news_id, tag_id),
                FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
                FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
            );
        `);

        const tagsMap = (await connection.query('SELECT id, name FROM tags'))[0].reduce((map, row) => {
            map[row.name] = row.id;
            return map;
        }, {});

        for (const article of mockNews) {
            const result = await connection.execute(
                `INSERT INTO news (slug, title, excerpt, content, image_url, author, published_at, read_time, meta_title, meta_description, meta_keywords, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [article.slug, article.title, article.excerpt, article.content, article.imageUrl, article.author, article.publishedAt, article.readTime, article.metaTitle, article.metaDescription, article.metaKeywords, article.status]
            );
            const newsId = result[0].insertId;
            for (const tagName of article.tags) {
                const tagId = tagsMap[tagName];
                if (tagId) {
                    await connection.execute('INSERT INTO news_tags (news_id, tag_id) VALUES (?, ?)', [newsId, tagId]);
                }
            }
        }

        console.log('Seeding `faqs` table...');
        await connection.query('DROP TABLE IF EXISTS faqs');
        await connection.query(`
            CREATE TABLE faqs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                question VARCHAR(512) NOT NULL,
                answer TEXT NOT NULL,
                display_order INT DEFAULT 0
            );
        `);
        for (let i = 0; i < mockFaqs.length; i++) {
            await connection.execute('INSERT INTO faqs (question, answer, display_order) VALUES (?, ?, ?)', [mockFaqs[i].question, mockFaqs[i].answer, i + 1]);
        }

        console.log('Seeding `contact_submissions` table...');
        await connection.query('DROP TABLE IF EXISTS contact_submissions');
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

        console.log('Seeding `site_settings` table...');
        await connection.query('DROP TABLE IF EXISTS site_settings');
        await connection.query(`
            CREATE TABLE site_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                setting_key VARCHAR(100) NOT NULL UNIQUE,
                setting_value JSON NOT NULL
            );
        `);
        for (const key in siteSettings) {
            await connection.execute(
                'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?)',
                [key, JSON.stringify(siteSettings[key])]
            );
        }
        
        await connection.query('SET FOREIGN_KEY_CHECKS=1;');

        console.log('Database seeding completed successfully.');

    } catch (error) {
        console.error('Error seeding the database:', error);
    } finally {
        await connection.end();
        console.log('Database connection closed.');
    }
}

main().catch(err => {
    console.error('An unexpected error occurred:', err);
});
