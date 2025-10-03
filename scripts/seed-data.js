
// This file contains the mock data needed for seeding the database.
// It's a JavaScript version of the data originally from the frontend's mock-data.ts.

const mockTours = [
    {
      id: "da-nang-hoi-an-hue-4n3d",
      slug: "da-nang-hoi-an-hue-4n3d",
      name: "Tour Đà Nẵng - Hội An - Huế 4N3D",
      categorySlug: "tour-trong-nuoc",
      country: "Việt Nam",
      duration: "4 ngày 3 đêm",
      price: 5500000,
      originalPrice: 6500000,
      image: "https://images.unsplash.com/photo-1561053591-62d8c3b035f6?q=80&w=2070&auto=format&fit=crop",
      rating: 4.8,
      reviewCount: 120,
      isHot: true,
      details: {
        departure: ["Hà Nội", "TP. Hồ Chí Minh"],
        gallery: [],
        groupSize: { min: 10, max: 25 },
        highlights: [
          { id: "hl1", title: "Bà Nà Hills", description: "Khám phá Cầu Vàng nổi tiếng thế giới và Làng Pháp cổ kính." },
          { id: "hl2", title: "Phố cổ Hội An", description: "Dạo bước trong khu phố đèn lồng lung linh về đêm." }
        ],
        itinerary: [
          { day: "1", title: "Đà Nẵng - Ngũ Hành Sơn", description: "Khởi hành tour.", activities: [{ activity: "Tham quan Ngũ Hành Sơn" }] }
        ],
        services: {
          included: [{ id: "inc1", name: "Xe đưa đón" }],
          excluded: [{ id: "exc1", name: "Chi phí cá nhân" }]
        },
        terms: {
          registration: ["Đặt cọc 50% khi đăng ký."],
          cancellation: ["Hủy tour trước 7 ngày, phí 30%."]
        },
        whyChooseUs: [
          { id: "wcu1", title: "Lịch trình đa dạng", description: "Thiết kế độc đáo, điểm đến hấp dẫn.", icon: "star" }
        ]
      }
    },
    {
      id: "thai-lan-bangkok-pattaya-5n4d",
      slug: "thai-lan-bangkok-pattaya-5n4d",
      name: "Tour Thái Lan: Bangkok - Pattaya 5N4D",
      categorySlug: "tour-quoc-te",
      country: "Thái Lan",
      duration: "5 ngày 4 đêm",
      price: 7990000,
      originalPrice: 9500000,
      image: "https://images.unsplash.com/photo-1549410141-f7617b07548b?q=80&w=2070&auto=format&fit=crop",
      rating: 4.7,
      reviewCount: 310,
      isHot: true,
      details: {
        departure: ["Hà Nội", "TP. Hồ Chí Minh"],
        gallery: [],
        groupSize: { min: 20, max: 40 },
        highlights: [
          { id: "hl9", title: "Chùa Vàng", description: "Chiêm bái tượng Phật Vàng lớn nhất thế giới." },
          { id: "hl10", title: "Đảo Coral", description: "Tắm biển và lặn ngắm san hô tại hòn đảo nổi tiếng." }
        ],
        itinerary: [
          { day: "1", title: "Hà Nội/TPHCM - Bangkok", description: "Bay đến Bangkok, di chuyển về Pattaya.", activities: [{ activity: "Ăn tối buffet quốc tế" }] }
        ],
        services: {
          included: [{ id: "inc5", name: "Khách sạn 4 sao" }],
          excluded: [{ id: "exc5", name: "Visa (nếu có)" }]
        },
        terms: {
          registration: ["Đặt cọc 50%."],
          cancellation: ["Hủy tour trước 10 ngày, phí 30%."]
        },
        whyChooseUs: [
          { id: "wcu5", title: "Shopping thả ga", description: "Thỏa sức mua sắm tại các trung tâm thương mại lớn.", icon: "tag" }
        ]
      }
    },
];

const mockTourCategories = [
    { name: "Tour Trong Nước", slug: "tour-trong-nuoc", description: "Khám phá vẻ đẹp Việt Nam", imageUrl: "https://images.unsplash.com/photo-1594916895315-927d3c53c4c9?q=80&w=2070&auto=format&fit=crop" },
    { name: "Tour Quốc Tế", slug: "tour-quoc-te", description: "Du lịch các nước trên thế giới", imageUrl: "https://images.unsplash.com/photo-1549410141-f7617b07548b?q=80&w=2070&auto=format&fit=crop" },
    { name: "Tour Châu Á", slug: "tour-chau-a", description: "Du lịch các nước Châu Á", imageUrl: "https://images.unsplash.com/photo-1542051841857-5f90071e7989" },
    { name: "Tour Châu Âu", slug: "tour-chau-au", description: "Khám phá Lục địa già", imageUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34" },
];

const mockNews = [
    {
      id: 1,
      slug: "bi-quyet-phong-van-visa-my",
      title: "Bí quyết phỏng vấn visa Mỹ",
      excerpt: "Phỏng vấn là bước quan trọng nhất trong quá trình xin visa Mỹ. Bài viết này sẽ chia sẻ những kinh nghiệm quý báu để bạn tự tin đối mặt với viên chức lãnh sự.",
      content: "<p>Nội dung chi tiết về bí quyết phỏng vấn visa Mỹ...</p>",
      imageUrl: "/images/news/news-1.jpg",
      author: "Chuyên gia Visa",
      publishedAt: "2024-07-29",
      readTime: 5, // in minutes
      metaTitle: "Bí quyết phỏng vấn visa Mỹ thành công 99%",
      metaDescription: "Tổng hợp mẹo và kinh nghiệm phỏng vấn visa Mỹ giúp bạn tăng tỷ lệ đậu.",
      metaKeywords: "visa mỹ, phỏng vấn visa, kinh nghiệm xin visa",
      status: "published",
      tags: ["Visa Mỹ", "Hướng dẫn"]
    },
    {
      id: 2,
      slug: "chinh-sach-visa-moi-cua-canada-2024",
      title: "Chính sách visa mới của Canada năm 2024 có gì thay đổi?",
      excerpt: "Những cập nhật quan trọng về các loại visa định cư và không định cư của Canada trong năm 2024.",
      content: "<p>Nội dung chi tiết về chính sách visa Canada 2024...</p>",
      imageUrl: "/images/news/news-2.jpg",
      author: "Tư vấn Di trú",
      publishedAt: "2024-09-27",
      readTime: 7, // in minutes
      metaTitle: "Cập nhật chính sách visa Canada mới nhất 2024",
      metaDescription: "Thông tin chi tiết về những thay đổi trong chính sách visa du học, lao động và định cư Canada.",
      metaKeywords: "visa canada, chính sách visa, định cư canada, du học canada",
      status: "published",
      tags: ["Visa Canada", "Chính sách"]
    },
];

const mockTags = [
    { name: "Visa Mỹ", slug: "visa-my" },
    { name: "Hướng dẫn", slug: "huong-dan" },
    { name: "Visa Canada", slug: "visa-canada" },
    { name: "Chính sách", slug: "chinh-sach" },
    { name: "Tin tức", slug: "tin-tuc" },
    { name: "Du lịch", slug: "du-lich" },
];

const mockVisaPageData = {
    // Châu Á
    "visa-trung-quoc": {
        continentSlug: "visa-chau-a",
        title: "Dịch Vụ Xin Visa Trung Quốc",
        countryName: "Trung Quốc",
        heroImage: "https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b",
        successRate: "94%",
        processingTime: "7-10 ngày làm việc",
        description: "Dịch vụ xin visa Trung Quốc chuyên nghiệp, phù hợp cho du lịch, công tác và thương mại.",
        details: { /* JSON blob with all details */ }
    },
    "visa-han-quoc": {
        continentSlug: "visa-chau-a",
        title: "Dịch Vụ Xin Visa Hàn Quốc",
        countryName: "Hàn Quốc",
        heroImage: "https://images.unsplash.com/photo-1538485399081-7191377e8241",
        successRate: "95%",
        processingTime: "5-7 ngày làm việc",
        description: "Dịch vụ xin visa Hàn Quốc trọn gói, tỷ lệ đậu cao, thủ tục nhanh gọn.",
        details: { /* JSON blob */ }
    },
    // Châu Âu
    "visa-phap": {
        continentSlug: "visa-chau-au",
        title: "Dịch Vụ Xin Visa Pháp (Schengen)",
        countryName: "Pháp",
        heroImage: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34",
        successRate: "91%",
        processingTime: "15-20 ngày",
        description: "Dịch vụ xin visa Schengen qua Pháp, phù hợp du lịch và công tác trong khối Schengen.",
        details: { /* JSON blob */ }
    },
    // Châu Mỹ
    "visa-hoa-ky": {
        continentSlug: "visa-chau-my",
        title: "Dịch Vụ Xin Visa Mỹ",
        countryName: "Hoa Kỳ",
        heroImage: "https://images.unsplash.com/photo-1508672019048-805c876b67e2?q=80&w=2070&auto=format&fit=crop",
        successRate: "98%",
        processingTime: "Phụ thuộc lịch hẹn",
        description: "Dịch vụ tư vấn và hoàn thiện hồ sơ xin visa Mỹ trọn gói.",
        details: { /* JSON blob */ }
    },
};

const mockContinents = [
    { name: "Visa Châu Á", slug: "visa-chau-a", description: "Xin visa các nước Châu Á nhanh chóng." },
    { name: "Visa Châu Âu", slug: "visa-chau-au", description: "Du lịch khám phá châu Âu." },
    { name: "Visa Châu Mỹ", slug: "visa-chau-my", description: "Chinh phục giấc mơ Mỹ." },
    { name: "Visa Châu Úc", slug: "visa-chau-uc", description: "Khám phá các quốc gia Châu Đại Dương." },
    { name: "Visa Châu Phi", slug: "visa-chau-phi", description: "Khám phá lục địa hoang dã." },
];

const mockFaqs = [
    { question: "Thời gian xử lý hồ sơ xin visa là bao lâu?", answer: "Thời gian xử lý tùy thuộc vào từng quốc gia. Ví dụ, visa du lịch Mỹ có thể mất vài tuần đến vài tháng, trong khi visa Schengen thường mất khoảng 15-20 ngày." },
    { question: "Tôi có cần chứng minh tài chính không?", answer: "Hầu hết các quốc gia đều yêu cầu chứng minh tài chính để đảm bảo bạn có đủ khả năng chi trả cho chuyến đi. Mức yêu cầu sẽ khác nhau tùy quốc gia." },
    { question: "Tỷ lệ đậu visa của công ty là bao nhiêu?", answer: "Chúng tôi tự hào với tỷ lệ đậu visa trên 95% cho hầu hết các thị trường. Đội ngũ chuyên gia của chúng tôi sẽ tối ưu hóa hồ sơ của bạn để tăng cơ hội thành công." },
];

const siteSettings = {
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
};

module.exports = {
    mockTours,
    mockTourCategories,
    mockNews,
    mockTags,
    mockVisaPageData,
    mockContinents,
    mockFaqs,
    siteSettings,
};
''