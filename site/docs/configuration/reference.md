---
sidebar_position: 2
sidebar_label: Reference
title: Configuration Reference - Complete API Documentation
description: Comprehensive reference for all promptfoo configuration options, properties, and settings. Complete API documentation for evaluation setup.
keywords:
  [
    promptfoo reference,
    configuration API,
    evaluation options,
    provider settings,
    test configuration,
    assertion types,
  ]
pagination_prev: configuration/guide
pagination_next: configuration/parameters
---

# Reference

Here is the main structure of the promptfoo configuration file:

### Config

| Property                        | Type                                                                                             | Required | Description                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| description                     | string                                                                                           | No       | Optional description of what your LLM is trying to do                                                                                                                                                       |
| tags                            | Record\<string, string\>                                                                         | No       | Optional tags to describe the test suite (e.g. `env: production`, `application: chatbot`)                                                                                                                   |
| providers                       | string \| string[] \| [Record\<string, ProviderOptions\>](#provideroptions) \| ProviderOptions[] | Yes      | One or more [LLM APIs](/docs/providers) to use                                                                                                                                                              |
| prompts                         | string \| string[]                                                                               | Yes      | One or more prompts to load                                                                                                                                                                                 |
| tests                           | string \| [Test Case](#test-case)[]                                                              | Yes      | Path to a test file, OR list of LLM prompt variations (aka "test case")                                                                                                                                     |
| defaultTest                     | string \| Partial [Test Case](#test-case)                                                        | No       | Sets the default properties for each test case. Can be an inline object or a `file://` path to an external YAML/JSON file.                                                                                  |
| outputPath                      | string                                                                                           | No       | Where to write output. Writes to console/web viewer if not set.                                                                                                                                             |
| evaluateOptions.maxConcurrency  | number                                                                                           | No       | Maximum number of concurrent requests. Defaults to 4                                                                                                                                                        |
| evaluateOptions.repeat          | number                                                                                           | No       | Number of times to run each test case . Defaults to 1                                                                                                                                                       |
| evaluateOptions.delay           | number                                                                                           | No       | Force the test runner to wait after each API call (milliseconds)                                                                                                                                            |
| evaluateOptions.showProgressBar | boolean                                                                                          | No       | Whether to display the progress bar                                                                                                                                                                         |
| extensions                      | string[]                                                                                         | No       | List of extension files to load. Each extension is a file path with a function name. Can be Python (.py) or JavaScript (.js) files. Supported hooks are 'beforeAll', 'afterAll', 'beforeEach', 'afterEach'. |
| env                             | Record\<string, string \| number \| boolean\>                                                    | No       | Environment variables to set for the test run. These values will override existing environment variables. Can be used to set API keys and other configuration values needed by providers.                   |

### Test Case

A test case represents a single example input that is fed into all prompts and providers.

| Property              | Type                                                            | Required | Description                                                                                                                                 |
| --------------------- | --------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| description           | string                                                          | No       | Description of what you're testing                                                                                                          |
| vars                  | Record\<string, string \| string[] \| object \| any\> \| string | No       | Key-value pairs to substitute in the prompt. If `vars` is a plain string, it will be treated as a YAML filepath to load a var mapping from. |
| provider              | string \| ProviderOptions \| ApiProvider                        | No       | Override the default provider for this specific test case                                                                                   |
| assert                | [Assertion](#assertion)[]                                       | No       | List of automatic checks to run on the LLM output                                                                                           |
| threshold             | number                                                          | No       | Test will fail if the combined score of assertions is less than this number                                                                 |
| metadata              | Record\<string, string \| string[] \| any\>                     | No       | Additional metadata to include with the test case, useful for filtering or grouping results                                                 |
| options               | Object                                                          | No       | Additional configuration settings for the test case                                                                                         |
| options.transformVars | string                                                          | No       | A filepath (js or py) or JavaScript snippet that runs on the vars before they are substituted into the prompt                               |
| options.transform     | string                                                          | No       | A filepath (js or py) or JavaScript snippet that runs on LLM output before any assertions                                                   |
| options.prefix        | string                                                          | No       | Text to prepend to the prompt                                                                                                               |
| options.suffix        | string                                                          | No       | Text to append to the prompt                                                                                                                |
| options.provider      | string                                                          | No       | The API provider to use for LLM rubric grading                                                                                              |
| options.runSerially   | boolean                                                         | No       | If true, run this test case without concurrency regardless of global settings                                                               |
| options.storeOutputAs | string                                                          | No       | The output of this test will be stored as a variable, which can be used in subsequent tests                                                 |
| options.rubricPrompt  | string \| string[]                                              | No       | Model-graded LLM prompt                                                                                                                     |

### Assertion

More details on using assertions, including examples [here](/docs/configuration/expected-outputs).

| Property         | Type   | Required | Description                                                                                                                                                                                                                                                                            |
| ---------------- | ------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| type             | string | Yes      | Type of assertion                                                                                                                                                                                                                                                                      |
| value            | string | No       | The expected value, if applicable                                                                                                                                                                                                                                                      |
| threshold        | number | No       | The threshold value, applicable only to certain types such as `similar`, `cost`, `javascript`, `python`                                                                                                                                                                                |
| provider         | string | No       | Some assertions (type = similar, llm-rubric, model-graded-\*) require an [LLM provider](/docs/providers)                                                                                                                                                                               |
| metric           | string | No       | The label for this result. Assertions with the same `metric` will be aggregated together                                                                                                                                                                                               |
| contextTransform | string | No       | Javascript expression to dynamically construct context for [context-based assertions](/docs/configuration/expected-outputs/model-graded#context-based). See [Context Transform](/docs/configuration/expected-outputs/model-graded#dynamically-via-context-transform) for more details. |

### AssertionValueFunctionContext

When using JavaScript or Python assertions, your function receives a context object with the following interface:

```typescript
interface AssertionValueFunctionContext {
  // Raw prompt sent to LLM
  prompt: string | undefined;

  // Test case variables
  vars: Record<string, string | object>;

  // The complete test case
  test: AtomicTestCase;

  // Log probabilities from the LLM response, if available
  logProbs: number[] | undefined;

  // Configuration passed to the assertion
  config?: Record<string, any>;

  // The provider that generated the response
  provider: ApiProvider | undefined;

  // The complete provider response
  providerResponse: ProviderResponse | undefined;
}
```

:::note

promptfoo supports `.js` and `.json` file extensions in addition to `.yaml`.

It automatically loads `promptfooconfig.*`, but you can use a custom config file with `promptfoo eval -c path/to/config`.

:::

## Extension Hooks

Promptfoo supports extension hooks that allow you to run custom code that modifies the evaluation state at specific points in the evaluation lifecycle. These hooks are defined in extension files specified in the `extensions` property of the configuration.

### Available Hooks

| Name       | Description                                   | Context                                           |
| ---------- | --------------------------------------------- | ------------------------------------------------- |
| beforeAll  | Runs before the entire test suite begins      | `{ suite: TestSuite }`                            |
| afterAll   | Runs after the entire test suite has finished | `{ results: EvaluateResult[], suite: TestSuite }` |
| beforeEach | Runs before each individual test              | `{ test: TestCase }`                              |
| afterEach  | Runs after each individual test               | `{ test: TestCase, result: EvaluateResult }`      |

#### Session Management in Hooks

For multi-turn conversations or stateful interactions, the `sessionId` is made available in the `afterEach` hook context at:

```javascript
context.result.metadata.sessionId;
```

This sessionId comes from either:

1. The provider's response (`response.sessionId`) - takes priority
2. The test variables (`vars.sessionId`) - used as fallback for client-generated session IDs

**Note:** The provider's `response.sessionId` takes precedence over `vars.sessionId`. The session ID from vars is only used if the provider doesn't return one.

Example usage in an extension:

```javascript
async function extensionHook(hookName, context) {
  if (hookName === 'afterEach') {
    const sessionId = context.result.metadata.sessionId;
    if (sessionId) {
      console.log(`Test completed with session: ${sessionId}`);
      // You can use this sessionId for tracking, logging, or cleanup
    }
  }
}
```

For iterative red team strategies (e.g., jailbreak, tree search), the `sessionIds` array is made available in the `afterEach` hook context at:

```javascript
context.result.metadata.sessionIds;
```

This is an array containing all session IDs from the iterative exploration process. Each iteration may have its own session ID, allowing you to track the full conversation history across multiple attempts.

Example usage for iterative providers:

```javascript
async function extensionHook(hookName, context) {
  if (hookName === 'afterEach') {
    // For regular providers - single session ID
    const sessionId = context.result.metadata.sessionId;

    // For iterative providers (jailbreak, tree search) - array of session IDs
    const sessionIds = context.result.metadata.sessionIds;
    if (sessionIds && Array.isArray(sessionIds)) {
      console.log(`Jailbreak completed with ${sessionIds.length} iterations`);
      sessionIds.forEach((id, index) => {
        console.log(`  Iteration ${index + 1}: session ${id}`);
      });
      // You can use these sessionIds for detailed tracking of the attack path
    }
  }
}
```

Note: The `sessionIds` array only contains defined session IDs - any iterations without a session ID are filtered out.

### Implementing Hooks

To implement these hooks, create a JavaScript or Python file with a function that handles the hooks you want to use. Then, specify the path to this file and the function name in the `extensions` array in your configuration.

:::note
All extensions receive all event types (beforeAll, afterAll, beforeEach, afterEach). It's up to the extension function to decide which events to handle based on the `hookName` parameter.
:::

Example configuration:

```yaml
extensions:
  - file://path/to/your/extension.js:extensionHook
  - file://path/to/your/extension.py:extension_hook
```

:::important
When specifying an extension in the configuration, you must include the function name after the file path, separated by a colon (`:`). This tells promptfoo which function to call in the extension file.
:::

Python example extension file:

```python
from typing import Optional

def extension_hook(hook_name, context) -> Optional[dict]:
    # Perform any necessary setup
    if hook_name == 'beforeAll':
        print(f"Setting up test suite: {context['suite'].get('description', '')}")

        # Add an additional test case to the suite:
        context["suite"]["tests"].append(
            {
                "vars": {
                    "body": "It's a beautiful day",
                    "language": "Spanish",
                },
                "assert": [{"type": "contains", "value": "Es un día hermoso."}],
            }
        )

        # Add an additional default assertion to the suite:
        context["suite"]["defaultTest"]["assert"].append({"type": "is-json"})

        return context

    # Perform any necessary teardown or reporting
    elif hook_name == 'afterAll':
        print(f"Test suite completed: {context['suite'].get('description', '')}")
        print(f"Total tests: {len(context['results'])}")

    # Prepare for individual test
    elif hook_name == 'beforeEach':
        print(f"Running test: {context['test'].get('description', '')}")

        # Change all languages to pirate-dialect
        context["test"]["vars"]["language"] = f'Pirate {context["test"]["vars"]["language"]}'

        return context

    # Clean up after individual test or log results
    elif hook_name == 'afterEach':
        print(f"Test completed: {context['test'].get('description', '')}. Pass: {context['result'].get('success', False)}")


```

JavaScript example extension file:

```javascript
async function extensionHook(hookName, context) {
  // Perform any necessary setup
  if (hookName === 'beforeAll') {
    console.log(`Setting up test suite: ${context.suite.description || ''}`);

    // Add an additional test case to the suite:
    context.suite.tests.push({
      vars: {
        body: "It's a beautiful day",
        language: 'Spanish',
      },
      assert: [{ type: 'contains', value: 'Es un día hermoso.' }],
    });

    return context;
  }

  // Perform any necessary teardown or reporting
  else if (hookName === 'afterAll') {
    console.log(`Test suite completed: ${context.suite.description || ''}`);
    console.log(`Total tests: ${context.results.length}`);
  }

  // Prepare for individual test
  else if (hookName === 'beforeEach') {
    console.log(`Running test: ${context.test.description || ''}`);

    // Change all languages to pirate-dialect
    context.test.vars.language = `Pirate ${context.test.vars.language}`;

    return context;
  }

  // Clean up after individual test or log results
  else if (hookName === 'afterEach') {
    console.log(
      `Test completed: ${context.test.description || ''}. Pass: ${context.result.success || false}`,
    );
  }
}

module.exports = extensionHook;
```

These hooks provide powerful extensibility to your promptfoo evaluations, allowing you to implement custom logic for setup, teardown, logging, or integration with other systems. The extension function receives the `hookName` and a `context` object, which contains relevant data for each hook type. You can use this information to perform actions specific to each stage of the evaluation process.

The beforeAll and beforeEach hooks may mutate specific properties of their respective `context` arguments in order to modify evaluation state. To persist these changes, the hook must return the modified context.

#### beforeAll

| Property                          | Type                       | Description                                                                                |
| --------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------ |
| `context.suite.prompts`           | `Prompt[]`                 | The prompts to be evaluated.                                                               |
| `context.suite.providerPromptMap` | `Record<string, Prompt[]>` | A map of provider IDs to prompts.                                                          |
| `context.suite.tests`             | `TestCase[]`               | The test cases to be evaluated.                                                            |
| `context.suite.scenarios`         | `Scenario[]`               | The scenarios to be evaluated.                                                             |
| `context.suite.defaultTest`       | `TestCase`                 | The default test case to be evaluated.                                                     |
| `context.suite.nunjucksFilters`   | `Record<string, FilePath>` | A map of Nunjucks filters.                                                                 |
| `context.suite.derivedMetrics`    | `Record<string, string>`   | A map of [derived metrics](/docs/configuration/expected-outputs#creating-derived-metrics). |
| `context.suite.redteam`           | `Redteam[]`                | The red team to be evaluated.                                                              |

#### beforeEach

| Property       | Type       | Description                    |
| -------------- | ---------- | ------------------------------ |
| `context.test` | `TestCase` | The test case to be evaluated. |

## Provider-related types

### Guardrails

GuardrailResponse is an object that represents the GuardrailResponse from a provider. It includes flags indicating if prompt or output failed guardrails.

```typescript
interface GuardrailResponse {
  flagged?: boolean;
  flaggedInput?: boolean;
  flaggedOutput?: boolean;
}
```

### ProviderFunction

A ProviderFunction is a function that takes a prompt as an argument and returns a Promise that resolves to a ProviderResponse. It allows you to define custom logic for calling an API.

```typescript
type ProviderFunction = (
  prompt: string,
  context: { vars: Record<string, string | object> },
) => Promise<ProviderResponse>;
```

### ProviderOptions

ProviderOptions is an object that includes the `id` of the provider and an optional `config` object that can be used to pass provider-specific configurations.

```typescript
interface ProviderOptions {
  id?: ProviderId;
  config?: any;

  // A label is required when running a red team
  // It can be used to uniquely identify targets even if the provider id changes.
  label?: string;

  // List of prompt display strings
  prompts?: string[];

  // Transform the output, either with inline Javascript or external py/js script (see `Transforms`)
  transform?: string;

  // Sleep this long before each request
  delay?: number;
}
```

### ProviderResponse

ProviderResponse is an object that represents the response from a provider. It includes the output from the provider, any error that occurred, information about token usage, and a flag indicating whether the response was cached.

```typescript
interface ProviderResponse {
  error?: string;
  output?: string | object;
  metadata?: object;
  tokenUsage?: Partial<{
    total: number;
    prompt: number;
    completion: number;
    cached?: number;
  }>;
  cached?: boolean;
  cost?: number; // required for cost assertion
  logProbs?: number[]; // required for perplexity assertion
  isRefusal?: boolean; // the provider has explicitly refused to generate a response
  guardrails?: GuardrailResponse;
}
```

### ProviderEmbeddingResponse

ProviderEmbeddingResponse is an object that represents the response from a provider's embedding API. It includes the embedding from the provider, any error that occurred, and information about token usage.

```typescript
interface ProviderEmbeddingResponse {
  error?: string;
  embedding?: number[];
  tokenUsage?: Partial<TokenUsage>;
}
```

## Evaluation inputs

### TestSuiteConfiguration

```typescript
interface TestSuiteConfig {
  // Optional description of what you're trying to test
  description?: string;

  // One or more LLM APIs to use, for example: openai:gpt-4.1-mini, openai:gpt-4.1, localai:chat:vicuna
  providers: ProviderId | ProviderFunction | (ProviderId | ProviderOptionsMap | ProviderOptions)[];

  // One or more prompts
  prompts: (FilePath | Prompt | PromptFunction)[];

  // Path to a test file, OR list of LLM prompt variations (aka "test case")
  tests: FilePath | (FilePath | TestCase)[];

  // Scenarios, groupings of data and tests to be evaluated
  scenarios?: Scenario[];

  // Sets the default properties for each test case. Useful for setting an assertion, on all test cases, for example.
  defaultTest?: Omit<TestCase, 'description'>;

  // Path to write output. Writes to console/web viewer if not set.
  outputPath?: FilePath | FilePath[];

  // Determines whether or not sharing is enabled.
  sharing?:
    | boolean
    | {
        apiBaseUrl?: string;
        appBaseUrl?: string;
      };

  // Nunjucks filters
  nunjucksFilters?: Record<string, FilePath>;

  // Envar overrides
  env?: EnvOverrides;

  // Whether to write latest results to promptfoo storage. This enables you to use the web viewer.
  writeLatestResults?: boolean;
}
```

### UnifiedConfig

UnifiedConfig is an object that includes the test suite configuration, evaluation options, and command line options. It is used to hold the complete configuration for the evaluation.

```typescript
interface UnifiedConfig extends TestSuiteConfiguration {
  evaluateOptions: EvaluateOptions;
  commandLineOptions: Partial<CommandLineOptions>;
}
```

### Scenario

`Scenario` is an object that represents a group of test cases to be evaluated.
It includes a description, default test case configuration, and a list of test cases.

```typescript
interface Scenario {
  description?: string;
  config: Partial<TestCase>[];
  tests: TestCase[];
}
```

Also, see [this table here](/docs/configuration/scenarios#configuration) for descriptions.

### Prompt

A `Prompt` is what it sounds like. When specifying a prompt object in a static config, it should look like this:

```typescript
interface Prompt {
  id: string; // Path, usually prefixed with file://
  label: string; // How to display it in outputs and web UI
}
```

When passing a `Prompt` object directly to the Javascript library:

```typescript
interface Prompt {
  // The actual prompt
  raw: string;
  // How it should appear in the UI
  label: string;
  // A function to generate a prompt on a per-input basis. Overrides the raw prompt.
  function?: (context: {
    vars: Record<string, string | object>;
    config?: Record<string, any>;
    provider?: ApiProvider;
  }) => Promise<string | object>;
}
```

### EvaluateOptions

EvaluateOptions is an object that includes options for how the evaluation should be performed. It includes the maximum concurrency for API calls, whether to show a progress bar, a callback for progress updates, the number of times to repeat each test, and a delay between tests.

```typescript
interface EvaluateOptions {
  maxConcurrency?: number;
  showProgressBar?: boolean;
  progressCallback?: (progress: number, total: number) => void;
  generateSuggestions?: boolean;
  repeat?: number;
  delay?: number;
}
```

## Evaluation outputs

### EvaluateTable

EvaluateTable is an object that represents the results of the evaluation in a tabular format. It includes a header with the prompts and variables, and a body with the outputs and variables for each test case.

```typescript
interface EvaluateTable {
  head: {
    prompts: Prompt[];
    vars: string[];
  };
  body: {
    outputs: EvaluateTableOutput[];
    vars: string[];
  }[];
}
```

### EvaluateTableOutput

EvaluateTableOutput is an object that represents the output of a single evaluation in a tabular format. It includes the pass/fail result, score, output text, prompt, latency, token usage, and grading result.

```typescript
interface EvaluateTableOutput {
  pass: boolean;
  score: number;
  text: string;
  prompt: string;
  latencyMs: number;
  tokenUsage?: Partial<TokenUsage>;
  gradingResult?: GradingResult;
}
```

### EvaluateSummary

EvaluateSummary is an object that represents a summary of the evaluation results. It includes the version of the evaluator, the results of each evaluation, a table of the results, and statistics about the evaluation.
The latest version is 3. It removed the table and added in a new prompts property.

```typescript
interface EvaluateSummaryV3 {
  version: 3;
  timestamp: string; // ISO 8601 datetime
  results: EvaluateResult[];
  prompts: CompletedPrompt[];
  stats: EvaluateStats;
}
```

```typescript
interface EvaluateSummaryV2 {
  version: 2;
  timestamp: string; // ISO 8601 datetime
  results: EvaluateResult[];
  table: EvaluateTable;
  stats: EvaluateStats;
}
```

### EvaluateStats

EvaluateStats is an object that includes statistics about the evaluation. It includes the number of successful and failed tests, and the total token usage.

```typescript
interface EvaluateStats {
  successes: number;
  failures: number;
  tokenUsage: Required<TokenUsage>;
}
```

### EvaluateResult

EvaluateResult roughly corresponds to a single "cell" in the grid comparison view. It includes information on the provider, prompt, and other inputs, as well as the outputs.

```typescript
interface EvaluateResult {
  provider: Pick<ProviderOptions, 'id'>;
  prompt: Prompt;
  vars: Record<string, string | object>;
  response?: ProviderResponse;
  error?: string;
  success: boolean;
  score: number;
  latencyMs: number;
  gradingResult?: GradingResult;
  metadata?: Record<string, any>;
}
```

### GradingResult

GradingResult is an object that represents the result of grading a test case. It includes whether the test case passed, the score, the reason for the result, the tokens used, and the results of any component assertions.

```typescript
interface GradingResult {
  pass: boolean;                        # did test pass?
  score: number;                        # score between 0 and 1
  reason: string;                       # plaintext reason for outcome
  tokensUsed?: TokenUsage;              # tokens consumed by the test
  componentResults?: GradingResult[];   # if this is a composite score, it can have nested results
  assertion: Assertion | null;          # source of assertion
  latencyMs?: number;                   # latency of LLM call
}
```

### CompletedPrompt

CompletedPrompt is an object that represents a prompt that has been evaluated. It includes the raw prompt, the provider, metrics, and other information.

```typescript
interface CompletedPrompt {
  id?: string;
  raw: string;
  label: string;
  function?: PromptFunction;

  // These config options are merged into the provider config.
  config?: any;
  provider: string;
  metrics?: {
    score: number;
    testPassCount: number;
    testFailCount: number;
    assertPassCount: number;
    assertFailCount: number;
    totalLatencyMs: number;
    tokenUsage: TokenUsage;
    namedScores: Record<string, number>;
    namedScoresCount: Record<string, number>;
    redteam?: {
      pluginPassCount: Record<string, number>;
      pluginFailCount: Record<string, number>;
      strategyPassCount: Record<string, number>;
      strategyFailCount: Record<string, number>;
    };
    cost: number;
  };
}
```
