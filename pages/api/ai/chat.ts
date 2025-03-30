import type { NextApiRequest, NextApiResponse } from 'next';
import { callToAI } from './openrouter';
import { asyncHandler, AppError } from '../../../lib/error-handler';
import logger from '../../../lib/logger';

interface Message {
  role: 'user' | 'system' | 'assistant';
  content: string;
}

export default asyncHandler(async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = req.headers['x-request-id'] || Date.now().toString();
  logger.info('Processing Google Chat request', {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent']
  });

  if (req.method !== 'POST') {
    logger.warn('Invalid method for Google Chat', {
      requestId,
      method: req.method
    });
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const startTime = Date.now();

  try {
    const { messages, systemPrompt } = req.body;

    // Validate input
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      logger.warn('Missing or invalid messages parameter', { requestId });
      throw new AppError(400, 'Messages array is required and cannot be empty', 'VALIDATION_ERROR');
    }

    // Validate each message has the correct format
    for (const message of messages) {
      if (!message.role || !message.content || typeof message.content !== 'string' || 
          !['user', 'assistant', 'system'].includes(message.role)) {
        logger.warn('Invalid message format', { requestId, message });
        throw new AppError(400, 'Each message must have a valid role and content', 'VALIDATION_ERROR');
      }
    }

    // Prepare the input for Google
    // Format messages into a conversation format
    let formattedContent = '';
    
    if (systemPrompt) {
      formattedContent += `System: ${systemPrompt}\n\n`;
    }
    
    messages.forEach((message: Message) => {
      if (message.role === 'user') {
        formattedContent += `User: ${message.content}\n`;
      } else if (message.role === 'assistant') {
        formattedContent += `Assistant: ${message.content}\n`;
      } else if (message.role === 'system') {
        formattedContent += `System: ${message.content}\n`;
      }
    });
    
    // Add a prompt for the assistant to respond
    formattedContent += 'Assistant:';

    logger.debug('Calling Google AI for chat', {
      requestId,
      messageCount: messages.length,
      contentLength: formattedContent.length
    });

    const result = await callToAI(formattedContent);

    logger.info('Google Chat response received', {
      requestId,
      // responseLength: result?.length || 0,
      processingTime: Date.now() - startTime
    });

    res.status(200).json({
      message: 'Google Chat response generated successfully',
      data: {
        response: result,
        conversation: [
          ...messages,
          { role: 'assistant', content: result }
        ]
      }
    });

  } catch (error) {
    logger.error('Error with Google Chat', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      processingTime: Date.now() - startTime
    });
    throw error;
  }
}); 