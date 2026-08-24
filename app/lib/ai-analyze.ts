// Server-side only — orchestrates two-round tool calling for Cube.js data analysis.
// Imported by app/api/chat/route.ts.

import type { AnalysisContent, Message, ProviderConfig } from '@/app/types';
import { CubeQuery, CubeResponse, cubeLoad } from './cube-client';

// ──────────────────────────────────────────────
// System prompt describing the data schema + output rules
// ──────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a business data analysis assistant focused on answering questions with data. You have a data analysis tool to query sales data.

The data warehouse contains the following information:

Table: Orders (order table, 2023-01-01 to 2024-12-31, about 8851 orders)
  Measures:
  - Orders.totalAmount: total sales amount (SUM)
  - Orders.orderCount: order count (COUNT)
  - Orders.avgAmount: average order value (AVG)
  - Orders.totalQuantity: total quantity sold (SUM)
  Dimensions:
  - Orders.region: region (North/ East/ South/ Central/ Southwest/ Northwest China)
  - Orders.orderDateMonth: order month (aggregated as YYYY-MM)
  - Orders.orderDateQuarter: order quarter (aggregated as YYYY-Q)
  - Orders.orderDateYear: order year (aggregated as YYYY)
  - Orders.status: order status (completed/ shipped/ pending/ cancelled)
  - Orders.productCategory: product category (Electronics/ Office Furniture/ Books/ Digital Accessories)
  - Orders.customerName: customer name
  - Orders.customerCity: customer city
  - Orders.productName: product name

When the user asks a data-related question, use the cube_query tool to query data, then provide an analysis report based on the results.
If the user is just chatting or greeting, reply directly without using the tool.

[CRITICAL LANGUAGE RULE] ALWAYS reply in English only. Do NOT match the user's input language. Even if the user writes in Chinese or any other language, you MUST keep every part of the output — including chart titles, series names, labels, category labels, column headers, table cells, and analysis text — in English.

[IMPORTANT] Your reply MUST use the following STRICT JSON format. Do not wrap it in a code block; output the JSON directly:

{"chart":{"type":"bar","title":"Chart Title","series":[{"name":"Metric Name","data":[{"label":"Category Label","value":Number}]}]},"analysis":"Analysis report text in Markdown format"}

Field descriptions:
- chart.type: chart type, one of "bar" (bar chart - for category comparison), "line" (line chart - for time trends), "pie" (pie chart - for proportion analysis)
- chart.title: chart title
- chart.series: array of data series, up to 3 series
  - each series.name: series name (e.g. "Sales Amount")
  - each series.data: array of data points, up to 15 items
    - each data.label: category label (e.g. "South China")
    - each data.value: numeric value
- analysis: analysis report in Markdown format, including key conclusions; tables are allowed

When chatting, reply with plain text directly; no JSON needed.`;

// ──────────────────────────────────────────────
// Round 2 prompt — tool call is DONE, force final JSON analysis
// ──────────────────────────────────────────────
const FINAL_ANALYSIS_PROMPT = `You are a business data analysis assistant. The cube_query tool has already been called, and the real query results are attached as tool messages in the conversation.

Your task: write the final analysis report based on this real data. Do not call any tool again; output conclusions directly.

[CRITICAL LANGUAGE RULE] ALWAYS reply in English only. Do NOT match the user's input language. Even if the user writes in Chinese or any other language, you MUST keep every part of the output — including chart titles, series names, labels, category labels, column headers, table cells, and analysis text — in English.

[IMPORTANT] Your reply MUST use the following STRICT JSON format. Do not wrap it in a code block; output the JSON directly:

{"chart":{"type":"bar","title":"Chart Title","series":[{"name":"Metric Name","data":[{"label":"Category Label","value":Number}]}]},"analysis":"Analysis report text in Markdown format"}

Field descriptions:
- chart.type: chart type, one of "bar" (bar chart - for category comparison), "line" (line chart - for time trends), "pie" (pie chart - for proportion analysis)
- chart.title: chart title
- chart.series: array of data series, up to 3 series
  - each series.name: series name (e.g. "Sales Amount")
  - each series.data: array of data points, up to 15 items
    - each data.label: category label (e.g. "South China")
    - each data.value: numeric value
- analysis: analysis report in Markdown format, including key conclusions; tables are allowed

Output exactly one JSON object and nothing else.`;

// ──────────────────────────────────────────────
// Tool definition sent to the LLM
// ──────────────────────────────────────────────
const CUBE_TOOL = {
  type: 'function' as const,
  function: {
    name: 'cube_query',
    description:
      'Query sales data analysis results. Use this tool when the user asks about sales amount, orders, customers, products, trends, or other data-related questions.',
    parameters: {
      type: 'object',
      properties: {
        measures: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Measures to query, e.g. Orders.totalAmount, Orders.orderCount, Orders.avgAmount, Orders.totalQuantity',
        },
        dimensions: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Dimensions to group by, e.g. Orders.region, Orders.orderDateMonth, Orders.orderDateQuarter, Orders.orderDateYear, Orders.status, Orders.productCategory, Orders.customerName, Orders.productName, Orders.customerCity',
        },
        filters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              member: { type: 'string', description: 'Filter field, e.g. Orders.status' },
              operator: {
                type: 'string',
                description: 'Operator: equals/ notEquals/ greaterThan/ lessThan/ in',
              },
              value: { description: 'Filter value' },
            },
            required: ['member', 'operator', 'value'],
          },
          description: 'Optional filter conditions',
        },
        order: {
          type: 'object',
          properties: {
            measure: { type: 'string', description: 'Sort field, e.g. Orders.totalAmount' },
            direction: { type: 'string', enum: ['asc', 'desc'] },
          },
          description: 'Sort rule',
        },
        chartType: {
          type: 'string',
          enum: ['pie', 'bar', 'line', 'table'],
          description: 'Desired chart type (for reference only; the final output is a Markdown table).',
        },
        limit: {
          type: 'number',
          description: 'Row limit for the result',
        },
      },
      required: ['measures', 'dimensions'],
    },
  },
};

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string | null;
      tool_calls?: Array<{
        id: string;
        function: { name: string; arguments: string };
      }>;
    };
  }>;
}

function buildEndpoint(baseUrl: string): string {
  const base = baseUrl.replace(/\/+$/, '');
  if (base.endsWith('/chat/completions')) return base;
  return `${base}/chat/completions`;
}

async function callLLM(
  provider: ProviderConfig,
  messages: unknown[],
  signal?: AbortSignal,
  options?: { tools?: unknown[]; tool_choice?: string }
): Promise<ChatCompletionResponse> {
  const endpoint = buildEndpoint(provider.baseUrl);

  const body: Record<string, unknown> = {
    model: provider.model,
    messages,
    max_tokens: 4096,
    stream: false,
    temperature: 0.3,
  };
  if (options?.tools) body.tools = options.tools;
  if (options?.tool_choice) body.tool_choice = options.tool_choice;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`AI call failed (${res.status}): ${errText.slice(0, 300)}`);
  }

  return res.json();
}

/**
 * Extract chart data from a Markdown table and build a chart config.
 */
function extractChartFromMarkdown(analysis: string, question: string): AnalysisContent['chart'] | undefined {
  // Find a Markdown table
  const tableRegex = /^\|(.+)\|\s*\n\|[-:\s|]+\|\s*\n((?:\|.+\|\s*\n?)+)/m;
  const match = analysis.match(tableRegex);
  if (!match) return undefined;

  const headerRow = match[1].split('|').map((c) => c.trim()).filter(Boolean);
  const dataRows = match[2]
    .trim()
    .split('\n')
    .map((line) => line.split('|').map((c) => c.trim()).filter(Boolean));

  if (dataRows.length === 0 || headerRow.length < 2) return undefined;

  // Determine whether the first column is a label column (non-numeric); if not, try the second
  let labelColIdx = 0;
  if (!isNaN(parseFloat(headerRow[0])) && headerRow[0].toLowerCase() !== 'rank') {
    // First column may be numeric
    if (headerRow.length > 1 && isNaN(parseFloat(headerRow[1]))) {
      labelColIdx = 1;
    }
  }
  const labelCol = headerRow[labelColIdx];

  // Find a numeric column (skip the label column)
  let valueColIdx = -1;
  for (let i = 0; i < headerRow.length; i++) {
    if (i === labelColIdx) continue;
    const val = parseFloat((dataRows[0][i] || '').replace(/[,\s¥￥%]/g, ''));
    if (!isNaN(val) && val !== 0) {
      valueColIdx = i;
      break;
    }
  }
  if (valueColIdx === -1) return undefined;

  const valueCol = headerRow[valueColIdx];

  const data: Array<{ label: string; value: number }> = dataRows.map((row) => {
    const label = row[labelColIdx] || '';
    const raw = (row[valueColIdx] || '0').replace(/[,\s¥￥%]/g, '');
    return { label, value: parseFloat(raw) || 0 };
  }).filter((d) => d.value !== 0);

  if (data.length === 0) return undefined;

  // Determine chart type from question keywords
  let type: 'bar' | 'line' | 'pie' = 'bar';
  const q = question.toLowerCase();
  if (q.match(/share|ratio|composition|distribution|breakdown/)) {
    type = 'pie';
  } else if (q.match(/trend|change|over time|monthly|quarterly/)) {
    type = 'line';
  }

  const title = `${valueCol} by ${labelCol}`;

  return {
    type,
    title,
    series: [{ name: valueCol, data }],
  };
}

/**
 * Main entry: two-phase tool-calling analysis
 */
export async function analyzeWithCube(
  messages: Message[],
  provider: ProviderConfig,
  signal?: AbortSignal
): Promise<AnalysisContent> {
  if (provider.apiFormat !== 'openai') {
    return { analysis: 'Data analysis mode requires an OpenAI-compatible API format. Please switch the API format to OpenAI in settings and try again.' };
  }

  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  if (!lastUserMsg) return { analysis: 'Please enter a question first.' };

  const question = typeof lastUserMsg.content === 'string' ? lastUserMsg.content : 'Please enter a question first.';

  // ── Round 1: LLM + tool ─────────────────────
  const round1Messages: Array<{
    role: string;
    content: string;
  }> = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: question },
  ];

  const res1 = await callLLM(provider, round1Messages, signal, {
    tools: [CUBE_TOOL],
    tool_choice: 'auto',
  });

  const msg1 = res1.choices?.[0]?.message ?? { content: null, tool_calls: undefined };

  // No tool calls → LLM just chatted
  if (!msg1.tool_calls || msg1.tool_calls.length === 0) {
    return { analysis: msg1.content || 'No reply yet.' };
  }

  // ── Execute tool calls ──────────────────────
  const toolResponses: Array<{
    role: 'tool';
    tool_call_id: string;
    content: string;
  }> = [];

  for (const toolCall of msg1.tool_calls) {
    try {
      const args = JSON.parse(toolCall.function.arguments);
      const query: CubeQuery = {
        measures: args.measures || [],
        dimensions: args.dimensions || [],
        filters: args.filters,
        order: args.order,
        limit: args.limit,
        chartType: args.chartType,
      };

      const response: CubeResponse = await cubeLoad(query);
      const limitedData = response.data.slice(0, 100);
      toolResponses.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify({ data: limitedData }),
      });
    } catch (err) {
      toolResponses.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify({
          error: err instanceof Error ? err.message : String(err),
        }),
      });
    }
  }

  // ── Round 2: LLM + tool results ─────────────
  // Note: tools are no longer passed — prevents the LLM from calling tools again instead of producing the final analysis
  const round2Messages: unknown[] = [
    { role: 'system', content: FINAL_ANALYSIS_PROMPT },
    { role: 'user', content: question },
    {
      role: 'assistant',
      content: null,
      tool_calls: msg1.tool_calls,
    },
    ...toolResponses,
  ];

  const res2 = await callLLM(provider, round2Messages, signal);

  const msg2 = res2.choices?.[0]?.message ?? { content: null };

  // Defense: if the LLM still tries to call a tool (should not happen since tools are not passed), state it clearly
  const toolCalls2 = (msg2 as { tool_calls?: unknown[] }).tool_calls;
  if (toolCalls2 && toolCalls2.length > 0) {
    return {
      analysis:
        'The model attempted to call a tool again in the second round and failed to produce an analysis report. Please retry or switch the model.',
    };
  }

  const raw = msg2.content || '';

  // Try to parse as structured JSON
  const cleaned = raw.trim().replace(/^```json\s*|```$/g, '').replace(/^```\s*|```$/g, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed.analysis) {
      return {
        chart: parsed.chart || undefined,
        analysis: parsed.analysis,
      };
    }
  } catch {
    // Fall through to plain text
  }

  // LLM didn't return JSON — try to extract chart from Markdown table
  const result: AnalysisContent = {
    analysis:
      cleaned ||
      'The query completed, but the model failed to generate an analysis report (empty response). Please retry or switch the model.',
  };
  const extractedChart = extractChartFromMarkdown(result.analysis, question);
  if (extractedChart) {
    result.chart = extractedChart;
  }

  return result;
}
