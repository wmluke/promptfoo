---
sidebar_position: 100
sidebar_label: Moderation
---

# Moderation

Use the `moderation` assert type to ensure that LLM outputs are safe.

Currently, this supports [OpenAI's moderation model](https://platform.openai.com/docs/guides/moderation), Meta's LlamaGuard models (LlamaGuard 3 and 4) via [Replicate](https://replicate.com/meta/llama-guard-3-8b), and [Azure Content Safety API](https://learn.microsoft.com/en-us/azure/ai-services/content-safety/overview).

In general, we encourage the use of Meta's LlamaGuard as it substantially outperforms OpenAI's moderation API as well as GPT-4. [See benchmarks](https://github.com/meta-llama/PurpleLlama/blob/main/Llama-Guard2/MODEL_CARD.md#model-performance).

## OpenAI moderation

By default, the `moderation` assertion uses OpenAI if an OpenAI API key is provided. Just make sure that the `OPENAI_API_KEY` environment variable is set:

```yaml
tests:
  - vars:
      foo: bar
    assert:
      # Ensure that it passes OpenAI's moderation filters
      - type: moderation
```

OpenAI monitors the following categories:

| Category               | Description                                                                                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| hate                   | Content that promotes hate based on race, gender, ethnicity, religion, nationality, sexual orientation, disability, or caste. Hateful content aimed at non-protected groups is harassment. |
| hate/threatening       | Hateful content that includes violence or serious harm towards the targeted group.                                                                                                         |
| harassment             | Content that promotes harassing language towards any target.                                                                                                                               |
| harassment/threatening | Harassment content that includes violence or serious harm towards any target.                                                                                                              |
| self-harm              | Content that promotes or depicts acts of self-harm, such as suicide, cutting, and eating disorders.                                                                                        |
| self-harm/intent       | Content where the speaker expresses intent to engage in self-harm.                                                                                                                         |
| self-harm/instructions | Content that encourages or gives instructions on how to commit acts of self-harm.                                                                                                          |
| sexual                 | Content meant to arouse sexual excitement or promote sexual services (excluding sex education and wellness).                                                                               |
| sexual/minors          | Sexual content involving individuals under 18 years old.                                                                                                                                   |
| violence               | Content that depicts death, violence, or physical injury.                                                                                                                                  |
| violence/graphic       | Content that depicts death, violence, or physical injury in graphic detail.                                                                                                                |

### Check specific categories

The assertion value allows you to only enable moderation for specific categories:

```yaml
tests:
  - vars:
      foo: bar
    assert:
      - type: moderation
        // highlight-start
        value:
          - harassment
          - harassment/threatening
          - sexual
          - sexual/minors
        // highlight-end
```

## Meta LlamaGuard moderation

This example uses the LlamaGuard model hosted on Replicate. Be sure to set the `REPLICATE_API_KEY` environment variable:

```yaml
tests:
  - vars:
      foo: bar
    assert:
      - type: moderation
        # Use the latest Llama Guard on replicate
        provider: 'replicate:moderation:meta/llama-guard-3-8b:146d1220d447cdcc639bc17c5f6137416042abee6ae153a2615e6ef5749205c8'
```

:::tip
LlamaGuard 4 is the default moderation provider on Replicate, featuring enhanced capabilities and an additional category (S14: Code Interpreter Abuse). You can explicitly specify it:

```yaml
provider: 'replicate:moderation:meta/llama-guard-4-12b'
```

For compatibility or specific use cases, you can use LlamaGuard 3:

```yaml
provider: 'replicate:moderation:meta/llama-guard-3-8b:146d1220d447cdcc639bc17c5f6137416042abee6ae153a2615e6ef5749205c8'
```

:::

LlamaGuard monitors the following categories:

| Category               | Description                                                                                                      | Code |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- | ---- |
| Violent Crimes         | Content that enables, encourages, or excuses violent crimes (e.g., terrorism, murder, child abuse, animal abuse) | S1   |
| Non-Violent Crimes     | Content that enables, encourages, or excuses non-violent crimes (e.g., fraud, burglary, drug trafficking)        | S2   |
| Sex Crimes             | Content that enables, encourages, or excuses sex crimes (e.g., human trafficking, sexual assault, harassment)    | S3   |
| Child Exploitation     | Content depicting child nudity or sexual abuse of children                                                       | S4   |
| Defamation             | Content containing defamatory statements about individuals or entities                                           | S5   |
| Specialized Advice     | Content containing specialized financial, medical, or legal advice                                               | S6   |
| Privacy                | Content containing sensitive, personal information about private individuals                                     | S7   |
| Intellectual Property  | Content that violates intellectual property rights of third parties                                              | S8   |
| Indiscriminate Weapons | Content that enables the creation of weapons of mass destruction (e.g., chemical, biological, nuclear weapons)   | S9   |
| Hate                   | Content that is hateful toward people based on protected characteristics or perpetuates negative stereotypes     | S10  |
| Self-Harm              | Content that enables, encourages, or excuses acts of intentional self-harm (e.g., suicide, self-injury)          | S11  |
| Sexual Content         | Depictions of nude adults or content with erotic descriptions or explicit sex acts                               | S12  |
| Elections              | Content containing misinformation or illegal activity related to elections                                       | S13  |
| Code Interpreter Abuse | Content that seeks to abuse code interpreters (e.g., denial of service, container escapes) - LlamaGuard 4 only   | S14  |

### Check specific categories

The assertion value allows you to only enable moderation for specific categories:

```yaml
tests:
  - vars:
      foo: bar
    assert:
      - type: moderation
        provider: 'replicate:moderation:meta/llama-guard-3-8b:146d1220d447cdcc639bc17c5f6137416042abee6ae153a2615e6ef5749205c8'
        // highlight-start
        value:
          - S1
          - S3
          - S4
        // highlight-end
```

## Azure Content Safety moderation

You can use the Azure Content Safety API for moderation. To set it up, you need to create an Azure Content Safety resource and get the API key and endpoint.

### Setup

First, set these environment variables:

```bash
AZURE_CONTENT_SAFETY_ENDPOINT=https://your-resource-name.cognitiveservices.azure.com
AZURE_CONTENT_SAFETY_API_KEY=your-api-key
AZURE_CONTENT_SAFETY_API_VERSION=2024-09-01  # Optional, defaults to this version
```

If `AZURE_CONTENT_SAFETY_ENDPOINT` is set, PromptFoo will automatically use the Azure Content Safety service for moderation instead of OpenAI's moderation API.

Or you can explicitly use the Azure moderation provider in your tests:

```yaml
tests:
  - vars:
      foo: bar
    assert:
      - type: moderation
        provider: 'azure:moderation'
```

### Moderation Categories

The Azure Content Safety API checks content for these categories:

| Category | Description                                                       |
| -------- | ----------------------------------------------------------------- |
| Hate     | Content that expresses discrimination or derogatory sentiments    |
| SelfHarm | Content related to inflicting physical harm on oneself            |
| Sexual   | Sexually explicit or adult content                                |
| Violence | Content depicting or promoting violence against people or animals |

### Check specific categories

The assertion value allows you to only enable moderation for specific categories

```yaml
tests:
  - vars:
      foo: bar
    assert:
      - type: moderation
        provider: 'azure:moderation'
        value:
          - hate
          - sexual
```

You can also set blocklist names and halt on blocklist hit in the provider config:

```yaml
tests:
  - vars:
      foo: bar
    assert:
      - type: moderation
        provider:
          id: azure:moderation
          config:
            blocklistNames: ['my-custom-blocklist', 'industry-terms']
            haltOnBlocklistHit: true
```
