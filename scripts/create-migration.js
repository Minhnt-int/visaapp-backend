const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Nhập tên cho migration (ví dụ: add-column-to-users): ', (name) => {
  if (!name) {
    console.error('Tên migration không được để trống!');
    rl.close();
    return;
  }

  try {
    console.log(`Đang tạo migration "${name}"...`);
    
    // Chạy lệnh npx sequelize-cli migration:generate
    execSync(`npx sequelize-cli migration:generate --name ${name}`, { stdio: 'inherit' });
    
    console.log('\nMigration đã được tạo thành công!');
    console.log('Hãy chỉnh sửa file migration vừa tạo trong thư mục migrations/');
    console.log('\nĐể chạy migration:');
    console.log('  node scripts/run-migrations.js');
  } catch (error) {
    console.error('Lỗi khi tạo migration:', error.message);
  }

  rl.close();
}); 