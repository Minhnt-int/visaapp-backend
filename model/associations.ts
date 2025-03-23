import Product from './Product';
import ProductItem from './ProductItem';

// Sau khi đã import tất cả các model
setupAssociations();

export function setupAssociations() {
  // Thiết lập quan hệ giữa Product và ProductItem
  Product.hasMany(ProductItem, {
    sourceKey: 'id',
    foreignKey: 'productId',
    as: 'items',
  });
  
  ProductItem.belongsTo(Product, {
    foreignKey: 'productId',
    as: 'product',
  });
}