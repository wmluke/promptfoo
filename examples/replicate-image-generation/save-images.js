const fs = require('fs');
const path = require('path');

// For Node >= 18, fetch is available globally
const { fetch } = globalThis;

/**
 * Downloads and saves Replicate generated images after each test
 */
module.exports = {
  async hook(hookName, context) {
    // Only run for afterEach hook and when we have an output
    if (hookName !== 'afterEach') {
      return;
    }

    // Extract URL from markdown image format
    const output = context.result?.response?.output;
    if (!output || typeof output !== 'string') {
      return;
    }

    const match = output.match(/!\[.*?\]\((.*?)\)/);
    const imageUrl = match?.[1];
    if (!imageUrl || !imageUrl.includes('replicate.delivery')) {
      return;
    }

    try {
      // Create images directory if it doesn't exist
      const imagesDir = path.join(__dirname, 'images');
      await fs.promises.mkdir(imagesDir, { recursive: true });

      // Extract provider and model info for filename
      const providerId = context.provider?.id || 'unknown';
      const modelParts = providerId.split(':');
      const modelFullName = modelParts[modelParts.length - 1] || 'model';
      const modelName = modelFullName.split('/').pop()?.split(':')[0] || 'model';

      // Generate filename from prompt and timestamp
      const imagePrompt = context.test.vars?.imagePrompt || 'unnamed';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const sanitizedPrompt = imagePrompt
        .substring(0, 50) // Limit length
        .replace(/[^a-z0-9\s-]/gi, '')
        .trim()
        .replace(/\s+/g, '-')
        .toLowerCase();
      const filename = `${modelName}-${sanitizedPrompt}-${timestamp}.png`;
      const filepath = path.join(imagesDir, filename);

      // Download and save the image
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      await fs.promises.writeFile(filepath, Buffer.from(buffer));

      console.log(`✓ Saved image: ${filename}`);
    } catch (error) {
      console.error(`❌ Failed to save image: ${error.message}`);
    }
  },
};
