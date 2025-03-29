/**
 * Chuyển đổi chuỗi thành slug URL an toàn
 * @param text Chuỗi cần chuyển đổi thành slug
 * @param options Tùy chọn chuyển đổi
 * @returns Chuỗi slug đã được tạo
 */
export function slugify(text: string, options?: { lower?: boolean }): string {
  // Chuyển đổi sang chữ thường nếu tùy chọn lower được bật
  let result = options?.lower ? text.toLowerCase() : text;
  
  // Loại bỏ dấu tiếng Việt
  result = result
    .replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a")
    .replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e")
    .replace(/ì|í|ị|ỉ|ĩ/g, "i")
    .replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o")
    .replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u")
    .replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y")
    .replace(/đ/g, "d")
    .replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A")
    .replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E")
    .replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I")
    .replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O")
    .replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U")
    .replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y")
    .replace(/Đ/g, "D");
    
  // Thay thế các ký tự không phải chữ cái số bằng dấu gạch ngang
  result = result
    .replace(/[^\w\s-]/g, '') // Xóa tất cả ký tự đặc biệt và dấu câu
    .replace(/[\s_]+/g, '-')  // Thay thế khoảng trắng và gạch dưới bằng gạch ngang
    .replace(/^-+|-+$/g, ''); // Xóa gạch ngang ở đầu và cuối chuỗi
    
  return result;
} 