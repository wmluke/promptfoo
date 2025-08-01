import fs from 'fs';
import path from 'path';

import async from 'async';
import yaml from 'js-yaml';
import cliState from '../cliState';
import { getEnvInt } from '../envars';
import logger from '../logger';
import {
  matchesAnswerRelevance,
  matchesClassification,
  matchesClosedQa,
  matchesContextFaithfulness,
  matchesContextRecall,
  matchesContextRelevance,
  matchesFactuality,
  matchesLlmRubric,
  matchesModeration,
  matchesSelectBest,
  matchesSimilarity,
} from '../matchers';
import { isPackagePath, loadFromPackage } from '../providers/packageParser';
import { runPython } from '../python/pythonUtils';
import {
  type ApiProvider,
  type Assertion,
  type AssertionType,
  type AtomicTestCase,
  type GradingResult,
} from '../types';
import { isJavascriptFile } from '../util/fileExtensions';
import invariant from '../util/invariant';
import { getNunjucksEngine } from '../util/templates';
import { transform } from '../util/transform';
import { handleAnswerRelevance } from './answerRelevance';
import { AssertionsResult } from './assertionsResult';
import { handleBleuScore } from './bleu';
import { handleClassifier } from './classifier';
import {
  handleContains,
  handleContainsAll,
  handleContainsAny,
  handleIContains,
  handleIContainsAll,
  handleIContainsAny,
} from './contains';
import { handleContextFaithfulness } from './contextFaithfulness';
import { handleContextRecall } from './contextRecall';
import { handleContextRelevance } from './contextRelevance';
import { handleCost } from './cost';
import { handleEquals } from './equals';
import { handleFactuality } from './factuality';
import { handleFinishReason } from './finishReason';
import { handleIsValidFunctionCall } from './functionToolCall';
import { handleGEval } from './geval';
import { handleGleuScore } from './gleu';
import { handleGuardrails } from './guardrails';
import { handleJavascript } from './javascript';
import { handleContainsJson, handleIsJson } from './json';
import { handleLatency } from './latency';
import { handleLevenshtein } from './levenshtein';
import { handleLlmRubric } from './llmRubric';
import { handleModelGradedClosedQa } from './modelGradedClosedQa';
import { handleModeration } from './moderation';
import { handleIsValidOpenAiToolsCall } from './openai';
import { handlePerplexity, handlePerplexityScore } from './perplexity';
import { handlePiScorer } from './pi';
import { handlePython } from './python';
import { handleRedteam } from './redteam';
import { handleIsRefusal } from './refusal';
import { handleRegex } from './regex';
import { handleRougeScore } from './rouge';
import { handleSimilar } from './similar';
import { handleContainsSql, handleIsSql } from './sql';
import { handleStartsWith } from './startsWith';
import { handleTraceErrorSpans } from './traceErrorSpans';
import { handleTraceSpanCount } from './traceSpanCount';
import { handleTraceSpanDuration } from './traceSpanDuration';
import { coerceString, getFinalTest, loadFromJavaScriptFile, processFileReference } from './utils';
import { handleWebhook } from './webhook';
import { handleIsXml } from './xml';

import type {
  AssertionParams,
  AssertionValueFunctionContext,
  BaseAssertionTypes,
  ProviderResponse,
  ScoringFunction,
} from '../types';

const ASSERTIONS_MAX_CONCURRENCY = getEnvInt('PROMPTFOO_ASSERTIONS_MAX_CONCURRENCY', 3);

export const MODEL_GRADED_ASSERTION_TYPES = new Set<AssertionType>([
  'answer-relevance',
  'context-faithfulness',
  'context-recall',
  'context-relevance',
  'factuality',
  'llm-rubric',
  'model-graded-closedqa',
  'model-graded-factuality',
]);

const nunjucks = getNunjucksEngine();

export async function runAssertion({
  prompt,
  provider,
  assertion,
  test,
  latencyMs,
  providerResponse,
  assertIndex,
  traceId,
}: {
  prompt?: string;
  provider?: ApiProvider;
  assertion: Assertion;
  test: AtomicTestCase;
  providerResponse: ProviderResponse;
  latencyMs?: number;
  assertIndex?: number;
  traceId?: string;
}): Promise<GradingResult> {
  const { cost, logProbs, output: originalOutput } = providerResponse;
  let output = originalOutput;

  invariant(assertion.type, `Assertion must have a type: ${JSON.stringify(assertion)}`);

  const inverse = assertion.type.startsWith('not-');
  const baseType = inverse
    ? (assertion.type.slice(4) as AssertionType)
    : (assertion.type as AssertionType);

  if (assertion.transform) {
    output = await transform(assertion.transform, output, {
      vars: test.vars,
      prompt: { label: prompt },
    });
  }

  const context: AssertionValueFunctionContext = {
    prompt,
    vars: test.vars || {},
    test,
    logProbs,
    provider,
    providerResponse,
    ...(assertion.config ? { config: structuredClone(assertion.config) } : {}),
  };

  // Add trace data if traceId is available
  if (traceId) {
    try {
      const { getTraceStore } = await import('../tracing/store');
      const traceStore = getTraceStore();
      const traceData = await traceStore.getTrace(traceId);
      if (traceData) {
        context.trace = {
          traceId: traceData.traceId,
          spans: traceData.spans || [],
        };
      }
    } catch (error) {
      logger.debug(`Failed to fetch trace data for assertion: ${error}`);
    }
  }

  // Render assertion values
  let renderedValue = assertion.value;
  let valueFromScript: string | boolean | number | GradingResult | object | undefined;
  if (typeof renderedValue === 'string') {
    if (renderedValue.startsWith('file://')) {
      const basePath = cliState.basePath || '';
      const fileRef = renderedValue.slice('file://'.length);
      let filePath = fileRef;
      let functionName: string | undefined;

      if (fileRef.includes(':')) {
        const [pathPart, funcPart] = fileRef.split(':');
        filePath = pathPart;
        functionName = funcPart;
      }

      filePath = path.resolve(basePath, filePath);

      if (isJavascriptFile(filePath)) {
        valueFromScript = await loadFromJavaScriptFile(filePath, functionName, [output, context]);
        logger.debug(`Javascript script ${filePath} output: ${valueFromScript}`);
      } else if (filePath.endsWith('.py')) {
        try {
          const pythonScriptOutput = await runPython(filePath, functionName || 'get_assert', [
            output,
            context,
          ]);
          valueFromScript = pythonScriptOutput;
          logger.debug(`Python script ${filePath} output: ${valueFromScript}`);
        } catch (error) {
          return {
            pass: false,
            score: 0,
            reason: (error as Error).message,
            assertion,
          };
        }
      } else {
        renderedValue = processFileReference(renderedValue);
      }
    } else if (isPackagePath(renderedValue)) {
      const basePath = cliState.basePath || '';
      const requiredModule = await loadFromPackage(renderedValue, basePath);
      if (typeof requiredModule !== 'function') {
        throw new Error(
          `Assertion malformed: ${renderedValue} must be a function. Received: ${typeof requiredModule}`,
        );
      }

      valueFromScript = await Promise.resolve(requiredModule(output, context));
    } else {
      // It's a normal string value
      renderedValue = nunjucks.renderString(renderedValue, test.vars || {});
    }
  } else if (renderedValue && Array.isArray(renderedValue)) {
    // Process each element in the array
    renderedValue = renderedValue.map((v) => {
      if (typeof v === 'string') {
        if (v.startsWith('file://')) {
          return processFileReference(v);
        }
        return nunjucks.renderString(v, test.vars || {});
      }
      return v;
    });
  }

  const assertionParams: AssertionParams = {
    assertion,
    baseType,
    context,
    cost,
    inverse,
    latencyMs,
    logProbs,
    output,
    outputString: coerceString(output),
    prompt,
    provider,
    providerResponse,
    renderedValue,
    test: getFinalTest(test, assertion),
    valueFromScript,
  };

  const assertionHandlers: Record<
    BaseAssertionTypes,
    (params: AssertionParams) => GradingResult | Promise<GradingResult>
  > = {
    'answer-relevance': handleAnswerRelevance,
    bleu: handleBleuScore,
    classifier: handleClassifier,
    contains: handleContains,
    'contains-all': handleContainsAll,
    'contains-any': handleContainsAny,
    'contains-json': handleContainsJson,
    'contains-sql': handleContainsSql,
    'contains-xml': handleIsXml,
    'context-faithfulness': handleContextFaithfulness,
    'context-recall': handleContextRecall,
    'context-relevance': handleContextRelevance,
    cost: handleCost,
    equals: handleEquals,
    factuality: handleFactuality,
    'finish-reason': handleFinishReason,
    gleu: handleGleuScore,
    guardrails: handleGuardrails,
    'g-eval': handleGEval,
    icontains: handleIContains,
    'icontains-all': handleIContainsAll,
    'icontains-any': handleIContainsAny,
    'is-json': handleIsJson,
    'is-refusal': handleIsRefusal,
    'is-sql': handleIsSql,
    'is-valid-function-call': handleIsValidFunctionCall,
    'is-valid-openai-function-call': handleIsValidFunctionCall,
    'is-valid-openai-tools-call': handleIsValidOpenAiToolsCall,
    'is-xml': handleIsXml,
    javascript: handleJavascript,
    latency: handleLatency,
    levenshtein: handleLevenshtein,
    'llm-rubric': handleLlmRubric,
    meteor: async (params: AssertionParams) => {
      try {
        const { handleMeteorAssertion } = await import('./meteor');
        return handleMeteorAssertion(params);
      } catch (error) {
        if (error instanceof Error && error.message.includes('Cannot find module')) {
          return {
            pass: false,
            score: 0,
            reason:
              'METEOR assertion requires the natural package. Please install it using: npm install natural',
            assertion: params.assertion,
          };
        }
        throw error;
      }
    },
    'model-graded-closedqa': handleModelGradedClosedQa,
    'model-graded-factuality': handleFactuality,
    moderation: handleModeration,
    perplexity: handlePerplexity,
    'perplexity-score': handlePerplexityScore,
    python: handlePython,
    regex: handleRegex,
    'rouge-n': handleRougeScore,
    similar: handleSimilar,
    'starts-with': handleStartsWith,
    'trace-error-spans': handleTraceErrorSpans,
    'trace-span-count': handleTraceSpanCount,
    'trace-span-duration': handleTraceSpanDuration,
    webhook: handleWebhook,
    pi: handlePiScorer,
  };

  // Check for redteam assertions first
  if (baseType.startsWith('promptfoo:redteam:')) {
    return handleRedteam(assertionParams);
  }

  const handler = assertionHandlers[baseType as keyof typeof assertionHandlers];
  if (handler) {
    const result = await handler(assertionParams);

    // If weight is 0, treat this as a metric-only assertion that can't fail
    if (assertion.weight === 0) {
      return {
        ...result,
        pass: true, // Force pass for weight=0 assertions
      };
    }

    return result;
  }

  throw new Error(`Unknown assertion type: ${assertion.type}`);
}

export async function runAssertions({
  assertScoringFunction,
  latencyMs,
  prompt,
  provider,
  providerResponse,
  test,
  traceId,
}: {
  assertScoringFunction?: ScoringFunction;
  latencyMs?: number;
  prompt?: string;
  provider?: ApiProvider;
  providerResponse: ProviderResponse;
  test: AtomicTestCase;
  traceId?: string;
}): Promise<GradingResult> {
  if (!test.assert || test.assert.length < 1) {
    return AssertionsResult.noAssertsResult();
  }

  const mainAssertResult = new AssertionsResult({
    threshold: test.threshold,
  });
  const subAssertResults: AssertionsResult[] = [];
  const asserts: {
    assertion: Assertion;
    assertResult: AssertionsResult;
    index: number;
  }[] = test.assert
    .map((assertion, i) => {
      if (assertion.type === 'assert-set') {
        const subAssertResult = new AssertionsResult({
          threshold: assertion.threshold,
          parentAssertionSet: {
            assertionSet: assertion,
            index: i,
          },
        });

        subAssertResults.push(subAssertResult);

        return assertion.assert.map((subAssert, j) => {
          return {
            assertion: subAssert,
            assertResult: subAssertResult,
            index: j,
          };
        });
      }

      return { assertion, assertResult: mainAssertResult, index: i };
    })
    .flat();

  await async.forEachOfLimit(
    asserts,
    ASSERTIONS_MAX_CONCURRENCY,
    async ({ assertion, assertResult, index }) => {
      if (assertion.type.startsWith('select-') || assertion.type === 'max-score') {
        // Select-type and max-score assertions are handled separately because they depend on multiple outputs.
        return;
      }

      const result = await runAssertion({
        prompt,
        provider,
        providerResponse,
        assertion,
        test,
        latencyMs,
        assertIndex: index,
        traceId,
      });

      assertResult.addResult({
        index,
        result,
        metric: assertion.metric,
        weight: assertion.weight,
      });
    },
  );

  await async.forEach(subAssertResults, async (subAssertResult) => {
    const result = await subAssertResult.testResult();
    const {
      index,
      assertionSet: { metric, weight },
    } = subAssertResult.parentAssertionSet!;

    mainAssertResult.addResult({
      index,
      result,
      metric,
      weight,
    });
  });

  return mainAssertResult.testResult(assertScoringFunction);
}

export async function runCompareAssertion(
  test: AtomicTestCase,
  assertion: Assertion,
  outputs: string[],
): Promise<GradingResult[]> {
  invariant(typeof assertion.value === 'string', 'select-best must have a string value');
  test = getFinalTest(test, assertion);
  const comparisonResults = await matchesSelectBest(
    assertion.value,
    outputs,
    test.options,
    test.vars,
  );
  return comparisonResults.map((result) => ({
    ...result,
    assertion,
  }));
}

export async function readAssertions(filePath: string): Promise<Assertion[]> {
  try {
    const assertions = yaml.load(fs.readFileSync(filePath, 'utf-8')) as Assertion[];
    if (!Array.isArray(assertions) || assertions[0]?.type === undefined) {
      throw new Error('Assertions file must be an array of assertion objects');
    }
    return assertions;
  } catch (err) {
    throw new Error(`Failed to read assertions from ${filePath}:\n${err}`);
  }
}

// These exports are used by the node.js package (index.ts)
export default {
  runAssertion,
  runAssertions,
  matchesSimilarity,
  matchesClassification,
  matchesLlmRubric,
  matchesFactuality,
  matchesClosedQa,
  matchesAnswerRelevance,
  matchesContextRecall,
  matchesContextRelevance,
  matchesContextFaithfulness,
  matchesComparisonBoolean: matchesSelectBest,
  matchesModeration,
};
