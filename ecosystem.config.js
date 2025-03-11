// filepath: c:\Users\Duy\Documents\giftweb-admin\ecosystem.config.js
module.exports = {
    apps: [
      {
        name: 'gitweb-backend',
        script: 'node_modules/next/dist/bin/next',
        args: 'start',
        env: {
        //   NODE_ENV: 'production',
          PORT: 3002 // Bạn có thể thay đổi cổng nếu cần
        }
      }
    ]
  };