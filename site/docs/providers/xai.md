---
title: xAI (Grok) Provider
description: Configure and use xAI's Grok models with promptfoo, including Grok-3 with reasoning capabilities
keywords: [xai, grok, grok-3, grok-2, reasoning, vision, llm]
---

# xAI (Grok)

The `xai` provider supports [xAI's Grok models](https://x.ai/) through an API interface compatible with OpenAI's format. The provider supports both text and vision capabilities depending on the model used.

## Setup

To use xAI's API, set the `XAI_API_KEY` environment variable or specify via `apiKey` in the configuration file.

```sh
export XAI_API_KEY=your_api_key_here
```

## Supported Models

The xAI provider includes support for the following model formats:

### Grok-4 Models

- `xai:grok-4-0709` - Latest flagship reasoning model (256K context)
- `xai:grok-4` - Alias for latest Grok-4 model
- `xai:grok-4-latest` - Alias for latest Grok-4 model

### Grok-3 Models

- `xai:grok-3-beta` - Latest flagship model for enterprise tasks (131K context)
- `xai:grok-3-fast-beta` - Fastest flagship model (131K context)
- `xai:grok-3-mini-beta` - Smaller model for basic tasks, supports reasoning effort (32K context)
- `xai:grok-3-mini-fast-beta` - Faster mini model, supports reasoning effort (32K context)
- `xai:grok-3` - Alias for grok-3-beta
- `xai:grok-3-latest` - Alias for grok-3-beta
- `xai:grok-3-fast` - Alias for grok-3-fast-beta
- `xai:grok-3-fast-latest` - Alias for grok-3-fast-beta
- `xai:grok-3-mini` - Alias for grok-3-mini-beta
- `xai:grok-3-mini-latest` - Alias for grok-3-mini-beta
- `xai:grok-3-mini-fast` - Alias for grok-3-mini-fast-beta
- `xai:grok-3-mini-fast-latest` - Alias for grok-3-mini-fast-beta

### Grok-2 and previous Models

- `xai:grok-2-latest` - Latest Grok-2 model (131K context)
- `xai:grok-2-vision-latest` - Latest Grok-2 vision model (32K context)
- `xai:grok-2-vision-1212`
- `xai:grok-2-1212`
- `xai:grok-beta` - Beta version (131K context)
- `xai:grok-vision-beta` - Vision beta version (8K context)

You can also use specific versioned models:

- `xai:grok-2-1212`
- `xai:grok-2-vision-1212`

## Configuration

The provider supports all [OpenAI provider](/docs/providers/openai) configuration options plus Grok-specific options. Example usage:

```yaml title="promptfooconfig.yaml"
# yaml-language-server: $schema=https://promptfoo.dev/config-schema.json
providers:
  - id: xai:grok-3-mini-beta
    config:
      temperature: 0.7
      reasoning_effort: 'high' # Only for grok-3-mini models
      apiKey: your_api_key_here # Alternative to XAI_API_KEY
```

### Reasoning Support

Grok-3 introduces reasoning capabilities for specific models. The `grok-3-mini-beta` and `grok-3-mini-fast-beta` models support reasoning through the `reasoning_effort` parameter:

- `reasoning_effort: "low"` - Minimal thinking time, using fewer tokens for quick responses
- `reasoning_effort: "high"` - Maximum thinking time, leveraging more tokens for complex problems

:::info

Reasoning is only available for the mini variants. The standard `grok-3-beta` and `grok-3-fast-beta` models do not support reasoning.

:::

### Grok-4 Specific Behavior

Grok-4 introduces significant changes compared to previous Grok models:

- **Always uses reasoning**: Grok-4 is a reasoning model that always operates at maximum reasoning capacity
- **No `reasoning_effort` parameter**: Unlike Grok-3 mini models, Grok-4 does not support the `reasoning_effort` parameter
- **Unsupported parameters**: The following parameters are not supported and will be automatically filtered out:
  - `presencePenalty` / `presence_penalty`
  - `frequencyPenalty` / `frequency_penalty`
  - `stop`
- **Larger context window**: 256,000 tokens compared to 131,072 for Grok-3 models
- **Uses `max_completion_tokens`**: As a reasoning model, Grok-4 uses `max_completion_tokens` instead of `max_tokens`

```yaml title="promptfooconfig.yaml"
# yaml-language-server: $schema=https://promptfoo.dev/config-schema.json
providers:
  - id: xai:grok-4
    config:
      temperature: 0.7
      max_completion_tokens: 4096
```

### Region Support

You can specify a region to use a region-specific API endpoint:

```yaml
providers:
  - id: xai:grok-2-latest
    config:
      region: us-west-1 # Will use https://us-west-1.api.x.ai/v1
```

This is equivalent to setting `base_url="https://us-west-1.api.x.ai/v1"` in the Python client.

### Live Search (Beta)

You can optionally enable Grok's **Live Search** feature to let the model pull in real-time information from the web or X. Pass a `search_parameters` object in your provider config. The `mode` field controls how search is used:

- `off` – Disable search
- `auto` – Model decides when to search (default)
- `on` – Always perform live search

Additional fields like `sources`, `from_date`, `to_date`, and `return_citations` may also be provided.

```yaml title="promptfooconfig.yaml"
providers:
  - id: xai:grok-3-beta
    config:
      search_parameters:
        mode: auto
        return_citations: true
        sources:
          - type: web
```

For a full list of options see the [xAI documentation](https://docs.x.ai/docs).

### Vision Support

For models with vision capabilities, you can include images in your prompts using the same format as OpenAI. Create a `prompt.yaml` file:

```yaml title="prompt.yaml"
- role: user
  content:
    - type: image_url
      image_url:
        url: '{{image_url}}'
        detail: 'high'
    - type: text
      text: '{{question}}'
```

Then reference it in your promptfoo config:

```yaml title="promptfooconfig.yaml"
# yaml-language-server: $schema=https://promptfoo.dev/config-schema.json
prompts:
  - file://prompt.yaml

providers:
  - id: xai:grok-2-vision-latest

tests:
  - vars:
      image_url: 'https://example.com/image.jpg'
      question: "What's in this image?"
```

### Image Generation

xAI also supports image generation through the Grok image model:

```yaml
providers:
  - xai:image:grok-2-image
```

Example configuration for image generation:

```yaml title="promptfooconfig.yaml"
# yaml-language-server: $schema=https://promptfoo.dev/config-schema.json
prompts:
  - 'A {{style}} painting of {{subject}}'

providers:
  - id: xai:image:grok-2-image
    config:
      n: 1 # Number of images to generate (1-10)
      response_format: 'url' # 'url' or 'b64_json'

tests:
  - vars:
      style: 'impressionist'
      subject: 'sunset over mountains'
```

For more information on the available models and API usage, refer to the [xAI documentation](https://docs.x.ai/docs).

## Examples

For examples demonstrating text generation, image creation, and web search, see the [xai example](https://github.com/promptfoo/promptfoo/tree/main/examples/xai).

You can run this example with:

```bash
npx promptfoo@latest init --example xai
```

## See Also

- [OpenAI Provider](/docs/providers/openai)

## Troubleshooting

### 502 Bad Gateway Errors

If you encounter 502 Bad Gateway errors when using the xAI provider, this typically indicates:

- An invalid or missing API key
- Server issues on x.ai's side

The xAI provider will provide helpful error messages to guide you in resolving these issues.

**Solution**: Verify your `XAI_API_KEY` environment variable is set correctly. You can obtain an API key from [https://x.ai/](https://x.ai/).

### Controlling Retries

If you're experiencing timeouts or want to control retry behavior:

- To disable retries for 5XX errors: `PROMPTFOO_RETRY_5XX=false`
- To reduce retry delays: `PROMPTFOO_REQUEST_BACKOFF_MS=1000` (in milliseconds)

## Reference

- [x.ai documentation](https://docs.x.ai/)
