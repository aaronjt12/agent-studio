import express from 'express';
import { AIService } from '../services/AIService';

const router = express.Router();

// Get available AI providers and models
router.get('/providers', (req, res) => {
  const providers = {
    openai: {
      name: 'OpenAI',
      models: [
        'gpt-4',
        'gpt-4-turbo',
        'gpt-4o',
        'gpt-4o-mini',
        'gpt-3.5-turbo'
      ]
    },
    anthropic: {
      name: 'Anthropic',
      models: [
        'claude-3-5-haiku-20241022',
        'claude-3-5-sonnet-20241022',
        'claude-3-5-opus-20241022'
      ]
    }
  };

  res.json(providers);
});

// Chat endpoint for workflow agents
router.post('/chat', async (req, res) => {
  try {
    const { message, agentType, agentName, systemPrompt, context, provider, model } = req.body;

    if (!message || !agentType || !agentName || !systemPrompt) {
      return res.status(400).json({ 
        error: 'Missing required fields: message, agentType, agentName, systemPrompt' 
      });
    }

    // Create a comprehensive prompt that includes the agent's role and context
    const fullPrompt = `${systemPrompt}

Current Context: ${context || 'No specific context provided'}

User Message: ${message}

Please respond as ${agentName}, the ${agentType}, maintaining your professional role and expertise.`;

    // Use the AI service to generate a response
    const aiService = new AIService();
    const response = await aiService.generateResponse(fullPrompt, provider, model);

    res.json({
      response,
      agentName,
      agentType,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in AI chat endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to generate AI response',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;