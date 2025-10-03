'''// backend/visaapp/scripts/seed-data.js

// =================================================================================
// DỮ LIỆU MẪU CHO SCHEMA MỚI
// - Gộp siteSettings và faqs vào một object `metaData`.
// - Thêm trực tiếp mảng tags vào các bài viết trong `mockNews`.
// - Dữ liệu continents bị loại bỏ.
// =================================================================================

// 1. Dữ liệu cho bảng `meta_json`
const metaData = {
  siteSettings: {
    general: {
      siteName: "VISA5S",
      logoUrl: "/logo.png",
      faviconUrl: "/favicon.ico",
    },
    contact: {
      address: "Tầng 5, toà nhà APTEK, 77-79-81 Nguyễn Văn Linh, phường Nam Dương, quận Hải Châu, TP. Đà Nẵng",
      phone: "0911.909.686",
      email: "info@visa5s.com",
      website: "www.visa5s.com",
    },
    social: {
      facebook: "https://facebook.com/visa5s",
      zalo: "https://zalo.me/0911909686",
      youtube: "https://youtube.com/visa5s",
      instagram: "https://instagram.com/visa5s",
    }
  },
  faqs: [
    { question: "Thời gian xử lý hồ sơ xin visa là bao lâu?", answer: "Thời gian xử lý tùy thuộc vào từng quốc gia. Ví dụ, visa du lịch Mỹ có thể mất vài tuần đến vài tháng, trong khi visa Schengen thường mất khoảng 15-20 ngày." },
    { question: "Tôi có cần chứng minh tài chính không?", answer: "Hầu hết các quốc gia đều yêu cầu chứng minh tài chính để đảm bảo bạn có đủ khả năng chi trả cho chuyến đi. Mức yêu cầu sẽ khác nhau tùy quốc gia." },
    { question: "Tỷ lệ đậu visa của công ty là bao nhiêu?", answer: "Chúng tôi tự hào với tỷ lệ đậu visa trên 95% cho hầu hết các thị trường. Đội ngũ chuyên gia của chúng tôi sẽ tối ưu hóa hồ sơ của bạn để tăng cơ hội thành công." },
  ]
};

// 2. Dữ liệu cho bảng `news` (với `tags` là cột JSON)
const mockNews = [
    {
      id: 1,
      slug: "bi-quyet-phong-van-visa-my",
      title: "Bí quyết phỏng vấn visa Mỹ",
      excerpt: "Phỏng vấn là bước quan trọng nhất trong quá trình xin visa Mỹ...",
      content: "<p>Nội dung chi tiết về bí quyết phỏng vấn visa Mỹ...</p>",
      imageUrl: "/images/news/news-1.jpg",
      author: "Chuyên gia Visa",
      publishedAt: "2024-07-29",
      readTime: 5, 
      metaTitle: "Bí quyết phỏng vấn visa Mỹ thành công 99%",
      metaDescription: "Tổng hợp mẹo và kinh nghiệm phỏng vấn visa Mỹ...",
      metaKeywords: "visa mỹ, phỏng vấn visa, kinh nghiệm xin visa",
      status: "published",
      tags: [ // Đây là cột JSON mới
          { "name": "Visa Mỹ", "slug": "visa-my" },
          { "name": "Hướng dẫn", "slug": "huong-dan" }
      ]
    },
    {
      id: 2,
      slug: "chinh-sach-visa-moi-cua-canada-2024",
      title: "Chính sách visa mới của Canada năm 2024 có gì thay đổi?",
      excerpt: "Những cập nhật quan trọng về các loại visa định cư và không định cư của Canada...",
      content: "<p>Nội dung chi tiết về chính sách visa Canada 2024...</p>",
      imageUrl: "/images/news/news-2.jpg",
      author: "Tư vấn Di trú",
      publishedAt: "2024-09-27",
      readTime: 7,
      metaTitle: "Cập nhật chính sách visa Canada mới nhất 2024",
      metaDescription: "Thông tin chi tiết về những thay đổi trong chính sách visa...",
      metaKeywords: "visa canada, chính sách visa, định cư canada, du học canada",
      status: "published",
      tags: [ // Đây là cột JSON mới
          { "name": "Visa Canada", "slug": "visa-canada" },
          { "name": "Chính sách", "slug": "chinh-sach" }
      ]
    },
];

// 3. Dữ liệu cho `visa_services` (với `continent_slug`)
const mockVisaServices = {
    "visa-trung-quoc": {
        continent_slug: "visa-chau-a", // Cột mới thay cho khóa ngoại
        title: "Dịch Vụ Xin Visa Trung Quốc",
        country_name: "Trung Quốc",
        hero_image: "https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b",
        success_rate: "94%",
        processing_time: "7-10 ngày làm việc",
        description: "Dịch vụ xin visa Trung Quốc chuyên nghiệp...",
        details: { /* JSON blob with all details */ }
    },
    "visa-han-quoc": {
        continent_slug: "visa-chau-a",
        title: "Dịch Vụ Xin Visa Hàn Quốc",
        country_name: "Hàn Quốc",
        // ... các trường khác
        details: { /* JSON blob */ }
    },
    "visa-phap": {
        continent_slug: "visa-chau-au",
        title: "Dịch Vụ Xin Visa Pháp (Schengen)",
        country_name: "Pháp",
        // ... các trường khác
        details: { /* JSON blob */ }
    },
    "visa-hoa-ky": {
        continent_slug: "visa-chau-my",
        title: "Dịch Vụ Xin Visa Mỹ",
        country_name: "Hoa Kỳ",
        // ... các trường khác
        details: { /* JSON blob */ }
    },
};


// 4. Dữ liệu cho `tours` và `tour_categories` (giữ nguyên)
const mockTours = [
    {
      id: "da-nang-hoi-an-hue-4n3d",
      slug: "da-nang-hoi-an-hue-4n3d",
      name: "Tour Đà Nẵng - Hội An - Huế 4N3D",
      categorySlug: "tour-trong-nuoc", // Sẽ dùng để map ra category_id
      country: "Việt Nam",
      duration: "4 ngày 3 đêm",
      price: 5500000,
      originalPrice: 6500000,
      image: "https://images.unsplash.com/photo-1561053591-62d8c3b035f6",
      rating: 4.8,
      reviewCount: 120,
      isHot: true,
      details: { /* JSON blob */ }
    },
    // ... các tour khác
];

const mockTourCategories = [
    { name: "Tour Trong Nước", slug: "tour-trong-nuoc", description: "Khám phá vẻ đẹp Việt Nam", imageUrl: "..." },
    { name: "Tour Quốc Tế", slug: "tour-quoc-te", description: "Du lịch các nước trên thế giới", imageUrl: "..." },
    { name: "Tour Châu Á", slug: "tour-chau-a", description: "Du lịch các nước Châu Á", imageUrl: "..." },
    { name: "Tour Châu Âu", slug: "tour-chau-au", description: "Khám phá Lục địa già", imageUrl: "..." },
];

// EXPORT
module.exports = {
    metaData,
    mockNews,
    mockVisaServices,
    mockTours,
    mockTourCategories
};
'''