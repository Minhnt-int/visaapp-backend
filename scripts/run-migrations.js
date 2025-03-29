const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('Chọn hành động:');
console.log('1. Chạy các migration chưa được chạy (up)');
console.log('2. Hoàn tác migration cuối cùng (down)');
console.log('3. Hoàn tác tất cả migrations (down all)');
console.log('4. Hiển thị trạng thái migrations');
console.log('5. Thoát');

rl.question('Lựa chọn của bạn (1-5): ', (answer) => {
  try {
    switch (answer) {
      case '1':
        console.log('Đang chạy migrations...');
        execSync('npx sequelize-cli db:migrate', { stdio: 'inherit' });
        console.log('Các migrations đã được chạy thành công!');
        break;
      
      case '2':
        console.log('Đang hoàn tác migration cuối cùng...');
        execSync('npx sequelize-cli db:migrate:undo', { stdio: 'inherit' });
        console.log('Migration cuối cùng đã được hoàn tác!');
        break;
      
      case '3':
        rl.question('Bạn có chắc chắn muốn hoàn tác TẤT CẢ migrations? Việc này sẽ xóa toàn bộ dữ liệu! (y/n): ', (confirm) => {
          if (confirm.toLowerCase() === 'y') {
            console.log('Đang hoàn tác tất cả migrations...');
            execSync('npx sequelize-cli db:migrate:undo:all', { stdio: 'inherit' });
            console.log('Tất cả migrations đã được hoàn tác!');
          } else {
            console.log('Đã hủy hành động!');
          }
          rl.close();
        });
        return;
      
      case '4':
        console.log('Đang hiển thị trạng thái migrations...');
        execSync('npx sequelize-cli db:migrate:status', { stdio: 'inherit' });
        break;
      
      case '5':
        console.log('Đã thoát!');
        break;
      
      default:
        console.log('Lựa chọn không hợp lệ!');
    }
  } catch (error) {
    console.error('Lỗi:', error.message);
  }
  
  rl.close();
}); 