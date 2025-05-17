# Hướng dẫn thêm cột status vào bảng product_categories

## Bước 1: Chạy migration

Chạy lệnh sau để thêm cột status vào bảng product_categories:

```bash
npm run add-status-to-categories
```

hoặc

```bash
yarn add-status-to-categories
```

## Bước 2: Sau khi thêm cột thành công, cần khôi phục lại các thay đổi tạm thời

### 1. Trong file model/index.ts:

Chuyển cột status từ optional thành required:

```typescript
// ProductCategory Model
export interface ProductCategoryAttributes {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parentId?: number;
  avatarUrl?: string;
  status: string; // Bỏ dấu ? để là required
  createdAt?: Date;
  updatedAt?: Date;
}

class ProductCategory extends Model<ProductCategoryAttributes, ProductCategoryCreationAttributes> implements ProductCategoryAttributes {
  // ...các field khác
  public status!: string; // Bỏ dấu ? để là required
  // ...các field khác
}

ProductCategory.init(
  {
    // ...các field khác
    status: {
      type: DataTypes.ENUM(...Object.values(ProductCategoryStatus)),
      allowNull: false, // Đổi từ true thành false
      defaultValue: ProductCategoryStatus.ACTIVE,
    },
    // ...các field khác
  },
  {
    tableName: 'product_categories',
    sequelize,
    timestamps: true,
  }
);
```

### 2. Trong file pages/api/product-category/create-category.ts:

Bỏ comment và thêm lại field status:

```typescript
const newCategory = await ProductCategory.create({
  name,
  slug,
  description,
  parentId: parentId || null,
  avatarUrl: avatarUrl || null,
  status: ProductCategoryStatus.ACTIVE, // Bỏ comment và thêm lại dòng này
});
```

### 3. Trong file pages/api/product-category/update-status.ts:

Bỏ comment và xóa đoạn trả về lỗi 503:

```typescript
export default asyncHandler(async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Áp dụng middleware CORS
  await runMiddleware(req, res, cors);

  await connectToDatabase();

  if (req.method === 'POST') {
    // Xóa dòng comment và đoạn trả về lỗi 503
    // Xóa /* và */ để mở comment phần code bên dưới
    
    const transaction = await sequelize.transaction();
    
    try {
      // ...code xử lý
    } catch (error) {
      // ...code xử lý lỗi
    }
  } else {
    // ...code xử lý method không hợp lệ
  }
});
```