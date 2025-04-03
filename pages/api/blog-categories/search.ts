import { NextApiRequest, NextApiResponse } from 'next';
import { BlogCategory } from '../../../model';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  try {
    const { q } = req.query;
    
    // Lấy tất cả BlogCategory
    const allCategories = await BlogCategory.findAll({
      order: [['createdAt', 'DESC']]
    });
    
    // Nếu có query, lọc theo tên
    if (q && typeof q === 'string') {
      const searchQuery = q.toLowerCase();
      const filteredCategories = allCategories.filter(category => 
        category.name.toLowerCase().includes(searchQuery)
      );
      
      return res.status(200).json({
        success: true,
        data: filteredCategories
      });
    }
    
    // Trả về tất cả nếu không có query
    return res.status(200).json({
      success: true,
      data: allCategories
    });
  } catch (error) {
    console.error('Error searching blog categories:', error);
    return res.status(500).json({
      success: false,
      message: 'Error searching blog categories'
    });
  }
} 