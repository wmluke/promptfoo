---
sidebar_position: 22
sidebar_label: Assertions & metrics
title: Assertions and Metrics - LLM Output Validation
description: Configure assertions and metrics to validate LLM outputs. Learn deterministic tests, model-graded evaluation, custom scoring, and performance metrics.
keywords:
  [
    LLM assertions,
    evaluation metrics,
    output validation,
    model grading,
    deterministic testing,
    performance metrics,
    accuracy measurement,
  ]
---

# Assertions & metrics

Assertions are used to compare the LLM output against expected values or conditions. While assertions are not required to run an eval, they are a useful way to automate your analysis.

Different types of assertions can be used to validate the output in various ways, such as checking for equality, JSON structure, similarity, or custom functions.

In machine learning, "Accuracy" is a metric that measures the proportion of correct predictions made by a model out of the total number of predictions. With `promptfoo`, accuracy is defined as the proportion of prompts that produce the expected or desired output.

## Using assertions

To use assertions in your test cases, add an `assert` property to the test case with an array of assertion objects. Each assertion object should have a `type` property indicating the assertion type and any additional properties required for that assertion type.

Example:

```yaml
tests:
  - description: 'Test if output is equal to the expected value'
    vars:
      example: 'Hello, World!'
    assert:
      - type: equals
        value: 'Hello, World!'
```

## Assertion properties

| Property         | Type               | Required | Description                                                                                                                                                                                                                                                                            |
| ---------------- | ------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| type             | string             | Yes      | Type of assertion                                                                                                                                                                                                                                                                      |
| value            | string             | No       | The expected value, if applicable                                                                                                                                                                                                                                                      |
| threshold        | number             | No       | The threshold value, applicable only to certain types such as `similar`, `cost`, `javascript`, `python`                                                                                                                                                                                |
| weight           | number             | No       | How heavily to weigh the assertion. Defaults to 1.0                                                                                                                                                                                                                                    |
| provider         | string             | No       | Some assertions (similarity, llm-rubric, model-graded-\*) require an [LLM provider](/docs/providers)                                                                                                                                                                                   |
| rubricPrompt     | string \| string[] | No       | Model-graded LLM prompt                                                                                                                                                                                                                                                                |
| config           | object             | No       | External mapping of arbitrary strings to values passed to custom javascript/python assertions                                                                                                                                                                                          |
| transform        | string             | No       | Process the output before running the assertion. See [Transformations](/docs/configuration/guide#transforming-outputs)                                                                                                                                                                 |
| metric           | string             | No       | Tag that appears in the web UI as a named metric                                                                                                                                                                                                                                       |
| contextTransform | string             | No       | Javascript expression to dynamically construct context for [context-based assertions](/docs/configuration/expected-outputs/model-graded#context-based). See [Context Transform](/docs/configuration/expected-outputs/model-graded#dynamically-via-context-transform) for more details. |

## Grouping assertions via Assertion Sets

Assertions can be grouped together using an `assert-set`.

Example:

```yaml
tests:
  - description: 'Test that the output is cheap and fast'
    vars:
      example: 'Hello, World!'
    assert:
      - type: assert-set
        assert:
          - type: cost
            threshold: 0.001
          - type: latency
            threshold: 200
```

In the above example if all assertions of the `assert-set` pass the entire `assert-set` passes.

There are cases where you may only need a certain number of assertions to pass. Here you can use `threshold`.

Example - if one of two assertions need to pass or 50%:

```yaml
tests:
  - description: 'Test that the output is cheap or fast'
    vars:
      example: 'Hello, World!'
    assert:
      - type: assert-set
        threshold: 0.5
        assert:
          - type: cost
            threshold: 0.001
          - type: latency
            threshold: 200
```

## Assertion Set properties

| Property  | Type             | Required | Description                                                                                                          |
| --------- | ---------------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| type      | string           | Yes      | Must be assert-set                                                                                                   |
| assert    | array of asserts | Yes      | Assertions to be run for the set                                                                                     |
| threshold | number           | No       | Success threshold for the assert-set. Ex. 1 out of 4 equal weights assertions need to pass. Threshold should be 0.25 |
| weight    | number           | No       | How heavily to weigh the assertion set within test assertions. Defaults to 1.0                                       |
| metric    | string           | No       | Metric name for this assertion set within the test                                                                   |

## Assertion types

### Deterministic eval metrics

These metrics are programmatic tests that are run on LLM output. [See all details](/docs/configuration/expected-outputs/deterministic)

| Assertion Type                                                                                                     | Returns true if...                                                |
| ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| [equals](/docs/configuration/expected-outputs/deterministic/#equality)                                             | output matches exactly                                            |
| [contains](/docs/configuration/expected-outputs/deterministic/#contains)                                           | output contains substring                                         |
| [icontains](/docs/configuration/expected-outputs/deterministic/#contains)                                          | output contains substring, case insensitive                       |
| [regex](/docs/configuration/expected-outputs/deterministic/#regex)                                                 | output matches regex                                              |
| [starts-with](/docs/configuration/expected-outputs/deterministic/#starts-with)                                     | output starts with string                                         |
| [contains-any](/docs/configuration/expected-outputs/deterministic/#contains-any)                                   | output contains any of the listed substrings                      |
| [contains-all](/docs/configuration/expected-outputs/deterministic/#contains-all)                                   | output contains all list of substrings                            |
| [icontains-any](/docs/configuration/expected-outputs/deterministic/#contains-any)                                  | output contains any of the listed substrings, case insensitive    |
| [icontains-all](/docs/configuration/expected-outputs/deterministic/#contains-all)                                  | output contains all list of substrings, case insensitive          |
| [is-json](/docs/configuration/expected-outputs/deterministic/#is-json)                                             | output is valid json (optional json schema validation)            |
| [contains-json](/docs/configuration/expected-outputs/deterministic/#contains-json)                                 | output contains valid json (optional json schema validation)      |
| [is-sql](/docs/configuration/expected-outputs/deterministic/#is-sql)                                               | output is valid sql                                               |
| [contains-sql](/docs/configuration/expected-outputs/deterministic/#contains-sql)                                   | output contains valid sql                                         |
| [is-xml](/docs/configuration/expected-outputs/deterministic/#is-xml)                                               | output is valid xml                                               |
| [contains-xml](/docs/configuration/expected-outputs/deterministic/#contains-xml)                                   | output contains valid xml                                         |
| [is-refusal](/docs/configuration/expected-outputs/deterministic/#is-refusal)                                       | output indicates the model refused to perform the task            |
| [javascript](/docs/configuration/expected-outputs/javascript)                                                      | provided Javascript function validates the output                 |
| [python](/docs/configuration/expected-outputs/python)                                                              | provided Python function validates the output                     |
| [webhook](/docs/configuration/expected-outputs/deterministic/#webhook)                                             | provided webhook returns \{pass: true\}                           |
| [rouge-n](/docs/configuration/expected-outputs/deterministic/#rouge-n)                                             | Rouge-N score is above a given threshold (default 0.75)           |
| [bleu](/docs/configuration/expected-outputs/deterministic/#bleu)                                                   | BLEU score is above a given threshold (default 0.5)               |
| [gleu](/docs/configuration/expected-outputs/deterministic/#gleu)                                                   | GLEU score is above a given threshold (default 0.5)               |
| [levenshtein](/docs/configuration/expected-outputs/deterministic/#levenshtein-distance)                            | Levenshtein distance is below a threshold                         |
| [latency](/docs/configuration/expected-outputs/deterministic/#latency)                                             | Latency is below a threshold (milliseconds)                       |
| [meteor](/docs/configuration/expected-outputs/deterministic/#meteor)                                               | METEOR score is above a given threshold (default 0.5)             |
| [perplexity](/docs/configuration/expected-outputs/deterministic/#perplexity)                                       | Perplexity is below a threshold                                   |
| [perplexity-score](/docs/configuration/expected-outputs/deterministic/#perplexity-score)                           | Normalized perplexity                                             |
| [cost](/docs/configuration/expected-outputs/deterministic/#cost)                                                   | Cost is below a threshold (for models with cost info such as GPT) |
| [is-valid-function-call](/docs/configuration/expected-outputs/deterministic/#is-valid-function-call)               | Ensure that the function call matches the function's JSON schema  |
| [is-valid-openai-function-call](/docs/configuration/expected-outputs/deterministic/#is-valid-openai-function-call) | Ensure that the function call matches the function's JSON schema  |
| [is-valid-openai-tools-call](/docs/configuration/expected-outputs/deterministic/#is-valid-openai-tools-call)       | Ensure all tool calls match the tools JSON schema                 |
| [trace-span-count](/docs/configuration/expected-outputs/deterministic/#trace-span-count)                           | Count spans matching patterns with min/max thresholds             |
| [trace-span-duration](/docs/configuration/expected-outputs/deterministic/#trace-span-duration)                     | Check span durations with percentile support                      |
| [trace-error-spans](/docs/configuration/expected-outputs/deterministic/#trace-error-spans)                         | Detect errors in traces by status codes, attributes, and messages |
| [guardrails](/docs/configuration/expected-outputs/guardrails)                                                      | Ensure that the output does not contain harmful content           |

:::tip
Every test type can be negated by prepending `not-`. For example, `not-equals` or `not-regex`.
:::

### Model-assisted eval metrics

These metrics are model-assisted, and rely on LLMs or other machine learning models.

See [Model-graded evals](/docs/configuration/expected-outputs/model-graded), [classification](/docs/configuration/expected-outputs/classifier), and [similarity](/docs/configuration/expected-outputs/similar) docs for more information.

| Assertion Type                                                                        | Method                                                                           |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| [similar](/docs/configuration/expected-outputs/similar)                               | Embeddings and cosine similarity are above a threshold                           |
| [classifier](/docs/configuration/expected-outputs/classifier)                         | Run LLM output through a classifier                                              |
| [llm-rubric](/docs/configuration/expected-outputs/model-graded)                       | LLM output matches a given rubric, using a Language Model to grade output        |
| [g-eval](/docs/configuration/expected-outputs/model-graded/g-eval)                    | Chain-of-thought evaluation based on custom criteria using the G-Eval framework  |
| [answer-relevance](/docs/configuration/expected-outputs/model-graded)                 | Ensure that LLM output is related to original query                              |
| [context-faithfulness](/docs/configuration/expected-outputs/model-graded)             | Ensure that LLM output uses the context                                          |
| [context-recall](/docs/configuration/expected-outputs/model-graded)                   | Ensure that ground truth appears in context                                      |
| [context-relevance](/docs/configuration/expected-outputs/model-graded)                | Ensure that context is relevant to original query                                |
| [factuality](/docs/configuration/expected-outputs/model-graded)                       | LLM output adheres to the given facts, using Factuality method from OpenAI eval  |
| [model-graded-closedqa](/docs/configuration/expected-outputs/model-graded)            | LLM output adheres to given criteria, using Closed QA method from OpenAI eval    |
| [pi](/docs/configuration/expected-outputs/model-graded/pi)                            | Alternative scoring approach that uses a dedicated model for evaluating criteria |
| [select-best](https://promptfoo.dev/docs/configuration/expected-outputs/model-graded) | Compare multiple outputs for a test case and pick the best one                   |
| [max-score](/docs/configuration/expected-outputs/model-graded/max-score)              | Select output with highest aggregate score from other assertions                 |

## Weighted assertions

In some cases, you might want to assign different weights to your assertions depending on their importance. The `weight` property is a number that determines the relative importance of the assertion. The default weight is 1.

The final score of the test case is calculated as the weighted average of the scores of all assertions, where the weights are the `weight` values of the assertions.

Here's an example:

```yaml
tests:
  assert:
    - type: equals
      value: 'Hello world'
      weight: 2
    - type: contains
      value: 'world'
      weight: 1
```

In this example, the `equals` assertion is twice as important as the `contains` assertion.

If the LLM output is `Goodbye world`, the `equals` assertion fails but the `contains` assertion passes, and the final score is 0.33 (1/3).

### Setting a score requirement

Test cases support an optional `threshold` property. If set, the pass/fail status of a test case is determined by whether the combined weighted score of all assertions exceeds the threshold value.

For example:

```yaml
tests:
  threshold: 0.5
  assert:
    - type: equals
      value: 'Hello world'
      weight: 2
    - type: contains
      value: 'world'
      weight: 1
```

If the LLM outputs `Goodbye world`, the `equals` assertion fails but the `contains` assertion passes and the final score is 0.33. Because this is below the 0.5 threshold, the test case fails. If the threshold were lowered to 0.2, the test case would succeed.

:::info
If weight is set to 0, the assertion automatically passes.
:::

### Custom assertion scoring

By default, test cases use weighted averaging to combine assertion scores. You can define custom scoring functions to implement more complex logic, such as:

- Failing if any critical metric falls below a threshold
- Implementing non-linear scoring combinations
- Using different scoring logic for different test cases

#### Prerequisites

Custom scoring functions require **named metrics**. Each assertion must have a `metric` field:

```yaml
assert:
  - type: equals
    value: 'Hello'
    metric: accuracy
  - type: contains
    value: 'world'
    metric: completeness
```

#### Configuration

Define scoring functions at two levels:

```yaml
defaultTest:
  assertScoringFunction: file://scoring.js # Global default

tests:
  - description: 'Custom scoring for this test'
    assertScoringFunction: file://custom.js # Test-specific override
```

The scoring function can be JavaScript or Python, referenced with `file://` prefix. For named exports, use `file://path/to/file.js:functionName`.

#### Function Interface

```typescript
type ScoringFunction = (
  namedScores: Record<string, number>, // Map of metric names to scores (0-1)
  context: {
    threshold?: number; // Test case threshold if set
    tokensUsed?: {
      // Token usage if available
      total: number;
      prompt: number;
      completion: number;
    };
  },
) => {
  pass: boolean; // Whether the test case passes
  score: number; // Final score (0-1)
  reason: string; // Explanation of the score
};
```

See the [custom assertion scoring example](https://github.com/promptfoo/promptfoo/tree/main/examples/assertion-scoring-override) for complete implementations in JavaScript and Python.

## Load assertions from external file

#### Raw files

The `value` of an assertion can be loaded directly from a file using the `file://` syntax:

```yaml
- assert:
    - type: contains
      value: file://gettysburg_address.txt
```

#### Javascript

If the file ends in `.js`, the Javascript is executed:

```yaml title="promptfooconfig.yaml"
- assert:
    - type: javascript
      value: file://path/to/assert.js
```

The type definition is:

```ts
type AssertionValueFunctionContext = {
  prompt: string | undefined;
  vars: Record<string, string | object>;
  test: AtomicTestCase<Record<string, string | object>>;
  logProbs: number[] | undefined;
  config?: Record<string, any>;
  provider: ApiProvider | undefined;
  providerResponse: ProviderResponse | undefined;
};
type AssertionResponse = string | boolean | number | GradingResult;
type AssertFunction = (output: string, context: AssertionValueFunctionContext) => AssertResponse;
```

See [GradingResult definition](/docs/configuration/reference#gradingresult).

Here's an example `assert.js`:

```js
module.exports = (output, { vars }) => {
  console.log(`Received ${output} using variables ${JSON.stringify(vars)}`);
  return {
    pass: true,
    score: 0.5,
    reason: 'Some custom reason',
  };
};
```

You can also use Javascript files in non-`javascript`-type asserts. For example, using a Javascript file in a `contains` assertion will check that the output contains the string returned by Javascript.

#### Python

If the file ends in `.py`, the Python is executed:

```yaml title="promptfooconfig.yaml"
- assert:
    - type: python
      value: file://path/to/assert.py
```

The assertion expects an output that is `bool`, `float`, or a JSON [GradingResult](/docs/configuration/reference#gradingresult).

For example:

```py
import sys
import json

output = sys.argv[1]
context = json.loads(sys.argv[2])

# Use `output` and `context['vars']` to determine result ...

print(json.dumps({
  'pass': False,
  'score': 0.5,
  'reason': 'Some custom reason',
}))
```

## Load assertions from CSV

The [Tests file](/docs/configuration/test-cases) is an optional format that lets you specify test cases outside of the main config file.

To add an assertion to a test case in a vars file, use the special `__expected` column.

Here's an example tests.csv:

| text               | \_\_expected                                         |
| ------------------ | ---------------------------------------------------- |
| Hello, world!      | Bonjour le monde                                     |
| Goodbye, everyone! | fn:output.includes('Au revoir');                     |
| I am a pineapple   | grade:doesn't reference any fruits besides pineapple |

All assertion types can be used in `__expected`. The column supports exactly one assertion.

- `is-json` and `contains-json` are supported directly, and do not require any value
- `fn` indicates `javascript` type. For example: `fn:output.includes('foo')`
- `file://` indicates an external file relative to your config. For example: `file://custom_assertion.py` or `file://customAssertion.js`
- `similar` takes a threshold value. For example: `similar(0.8):hello world`
- `grade` indicates `llm-rubric`. For example: `grade: does not mention being an AI`
- By default, `__expected` will use type `equals`

When the `__expected` field is provided, the success and failure statistics in the evaluation summary will be based on whether the expected criteria are met.

To run multiple assertions, use column names `__expected1`, `__expected2`, `__expected3`, etc.

For more advanced test cases, we recommend using a testing framework like [Jest or Vitest](/docs/integrations/jest) or [Mocha](/docs/integrations/mocha-chai) and using promptfoo [as a library](/docs/usage/node-package).

## Reusing assertions with templates

If you have a set of common assertions that you want to apply to multiple test cases, you can create assertion templates and reuse them across your configuration.

```yaml
// highlight-start
assertionTemplates:
  containsMentalHealth:
    type: javascript
    value: output.toLowerCase().includes('mental health')
// highlight-end

prompts:
  - file://prompt1.txt
  - file://prompt2.txt
providers:
  - openai:gpt-4.1-mini
  - localai:chat:vicuna
tests:
  - vars:
      input: Tell me about the benefits of exercise.
    assert:
      // highlight-next-line
      - $ref: "#/assertionTemplates/containsMentalHealth"
  - vars:
      input: How can I improve my well-being?
    assert:
      // highlight-next-line
      - $ref: "#/assertionTemplates/containsMentalHealth"
```

In this example, the `containsMentalHealth` assertion template is defined at the top of the configuration file and then reused in two test cases. This approach helps maintain consistency and reduces duplication in your configuration.

## Defining named metrics

Each assertion supports a `metric` field that allows you to tag the result however you like. Use this feature to combine related assertions into aggregate metrics.

For example, these asserts will aggregate results into two metrics, `Tone` and `Consistency`.

```yaml
tests:
  - assert:
      - type: equals
        value: Yarr
        metric: Tone

  - assert:
      - type: icontains
        value: grub
        metric: Tone

  - assert:
      - type: is-json
        metric: Consistency

  - assert:
      - type: python
        value: max(0, len(output) - 300)
        metric: Consistency

      - type: similar
        value: Ahoy, world
        metric: Tone

  - assert:
      - type: llm-rubric
        value: Is spoken like a pirate
        metric: Tone
```

These metrics will be shown in the UI:

![llm eval metrics](/img/docs/named-metrics.png)

See [named metrics example](https://github.com/promptfoo/promptfoo/tree/main/examples/named-metrics).

## Creating derived metrics

Derived metrics calculate composite scores from your named assertions after evaluation completes. Use them for metrics like F1 scores, weighted averages, or custom scoring formulas.

Add a `derivedMetrics` array to your configuration:

```yaml
derivedMetrics:
  - name: 'f1_score'
    value: '2 * precision * recall / (precision + recall)'
```

Each derived metric requires:

- **name**: The metric identifier
- **value**: A mathematical expression or JavaScript function

:::tip
Derived metrics are initialized to 0 and calculated per prompt. Errors are logged at debug level.
:::

### Mathematical expressions

Use [mathjs](https://mathjs.org/) syntax for calculations:

```yaml
derivedMetrics:
  - name: 'weighted_score'
    value: 'accuracy * 0.6 + relevance * 0.4'

  - name: 'harmonic_mean'
    value: '3 / (1/accuracy + 1/relevance + 1/coherence)'
```

### JavaScript functions

For complex logic:

```yaml
derivedMetrics:
  - name: 'adaptive_score'
    value: |
      function(namedScores, evalStep) {
        const { accuracy = 0, speed = 0 } = namedScores;
        if (evalStep.tokensUsed?.total > 1000) {
          return accuracy * 0.8; // Penalize verbose responses
        }
        return accuracy * 0.6 + speed * 0.4;
      }
```

### Example: F1 score

```yaml
defaultTest:
  assert:
    - type: javascript
      value: output.sentiment === 'positive' && context.vars.expected === 'positive' ? 1 : 0
      metric: true_positives
      weight: 0
    - type: javascript
      value: output.sentiment === 'positive' && context.vars.expected === 'negative' ? 1 : 0
      metric: false_positives
      weight: 0
    - type: javascript
      value: output.sentiment === 'negative' && context.vars.expected === 'positive' ? 1 : 0
      metric: false_negatives
      weight: 0

derivedMetrics:
  - name: precision
    value: 'true_positives / (true_positives + false_positives)'
  - name: recall
    value: 'true_positives / (true_positives + false_negatives)'
  - name: f1_score
    value: '2 * true_positives / (2 * true_positives + false_positives + false_negatives)'
```

Metrics are calculated in order, so later metrics can reference earlier ones:

```yaml
derivedMetrics:
  - name: base_score
    value: '(accuracy + relevance) / 2'
  - name: final_score
    value: 'base_score * confidence_multiplier'
```

### Notes

- Missing metrics default to 0
- To avoid division by zero: `value: 'numerator / (denominator + 0.0001)'`
- Debug errors with: `LOG_LEVEL=debug promptfoo eval`
- No circular dependency protection - order your metrics carefully

Derived metrics appear in all outputs alongside regular metrics - in the web UI metrics column, JSON `namedScores`, and CSV columns.

See also:

- [Named metrics example](https://github.com/promptfoo/promptfoo/tree/main/examples/named-metrics) - Basic named metrics usage
- [F-score example](https://github.com/promptfoo/promptfoo/tree/main/examples/f-score) - Complete F1 score implementation
- [MathJS documentation](https://mathjs.org/docs/expressions/syntax.html) - Expression syntax reference

## Running assertions directly on outputs

If you already have LLM outputs and want to run assertions on them, the `eval` command supports standalone assertion files.

Put your outputs in a JSON string array, like this `output.json`:

```json
["Hello world", "Greetings, planet", "Salutations, Earth"]
```

And create a list of assertions (`asserts.yaml`):

```yaml
- type: icontains
  value: hello

- type: javascript
  value: 1 / (output.length + 1) # prefer shorter outputs

- type: model-graded-closedqa
  value: ensure that the output contains a greeting
```

Then run the eval command:

```
promptfoo eval --assertions asserts.yaml --model-outputs outputs.json
```

### Tagging outputs

Promptfoo accepts a slightly more complex JSON structure that includes an `output` field for the model's output and a `tags` field for the associated tags. These tags are shown in the web UI as a comma-separated list. It's useful if you want to keep track of certain output attributes:

```json
[
  { "output": "Hello world", "tags": ["foo", "bar"] },
  { "output": "Greetings, planet", "tags": ["baz", "abc"] },
  { "output": "Salutations, Earth", "tags": ["def", "ghi"] }
]
```

### Processing and formatting outputs

If you need to do any processing/formatting of outputs, use a [Javascript provider](/docs/providers/custom-api/), [Python provider](https://promptfoo.dev/docs/providers/python/), or [custom script](/docs/providers/custom-script/).
