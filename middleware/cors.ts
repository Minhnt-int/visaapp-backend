import { NextApiRequest, NextApiResponse } from 'next';
import Cors from 'cors';

// Initialize the cors middleware
const corsMiddleware = Cors({
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  origin: '*', // Allow all origins
  credentials: true,
});

// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: Function) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

// Wrapper function for API handlers
export function cors(handler: any) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Run the CORS middleware
    await runMiddleware(req, res, corsMiddleware);
    
    // Call the handler
    return handler(req, res);
  };
} 