import { FinancialDataModel } from './data-model';

/**
 * AI Agent Tools for Financial Model Management
 * 
 * This module provides OpenAI function calling compatible tools
 * for managing financial data models through an AI agent.
 */

export interface ToolFunction {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required?: string[];
      additionalProperties?: boolean;
    };
  };
}

/**
 * Get all available tools for the financial model
 */
export function getFinancialModelTools(): ToolFunction[] {
  return [
    addDataPointTool(),
    getLineItemsTool(),
    getTimePeriodsTool(),
    getCellValueTool(),
    getScenariosTool(),
    addForecastPeriodTool(),
    exportModelDataTool(),
    setVariableTool(),
    getVariablesTool(),
  ];
}

/**
 * Tool: Add a data point or formula to the model
 */
function addDataPointTool(): ToolFunction {
  return {
    type: 'function',
    function: {
      name: 'add_data_point',
      description: 'Add an input value or formula to the financial model. Use this to create new line items, add values, or define calculations.',
      parameters: {
        type: 'object',
        properties: {
          lineItem: {
            type: 'string',
            description: 'The line item name (e.g., "Revenue", "Costs", "Revenue/Product A")'
          },
          timePeriods: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Array of time periods (e.g., ["2023A", "2024F"]). Use "A" suffix for actuals, "F" for forecasts.'
          },
          type: {
            type: 'string',
            enum: ['input', 'formula'],
            description: 'Type of data point: "input" for direct values, "formula" for calculations'
          },
          value: {
            type: 'number',
            description: 'The numeric value (required for "input" type)'
          },
          expression: {
            type: 'string',
            description: 'The formula expression (required for "formula" type). Examples: "Revenue - Costs", "Revenue[last_year] * 1.1", "SUM(Revenue/*)"'
          },
          scenario: {
            type: 'string',
            description: 'The scenario name (e.g., "Base", "Bull", "Bear"). Use null for all scenarios.'
          },
          variables: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Variable name (e.g., "growth_rate")'
                },
                value: {
                  type: 'number',
                  description: 'Variable value'
                },
                description: {
                  type: 'string',
                  description: 'Variable description'
                }
              },
              required: ['name', 'value']
            },
            description: 'Variables to create for use in formulas'
          }
        },
        required: ['lineItem', 'timePeriods', 'type'],
        additionalProperties: false
      }
    }
  };
}

/**
 * Tool: Get all line items in the model
 */
function getLineItemsTool(): ToolFunction {
  return {
    type: 'function',
    function: {
      name: 'get_line_items',
      description: 'Get all line items currently in the financial model',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false
      }
    }
  };
}

/**
 * Tool: Get all time periods in the model
 */
function getTimePeriodsTool(): ToolFunction {
  return {
    type: 'function',
    function: {
      name: 'get_time_periods',
      description: 'Get all time periods currently in the financial model',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false
      }
    }
  };
}

/**
 * Tool: Get a specific cell value
 */
function getCellValueTool(): ToolFunction {
  return {
    type: 'function',
    function: {
      name: 'get_cell_value',
      description: 'Get the value of a specific cell in the financial model',
      parameters: {
        type: 'object',
        properties: {
          lineItem: {
            type: 'string',
            description: 'The line item name'
          },
          timePeriod: {
            type: 'string',
            description: 'The time period (e.g., "2023A", "2024F")'
          },
          scenario: {
            type: 'string',
            description: 'The scenario name. Use null for dimension-agnostic values.'
          }
        },
        required: ['lineItem', 'timePeriod'],
        additionalProperties: false
      }
    }
  };
}

/**
 * Tool: Get all scenarios
 */
function getScenariosTool(): ToolFunction {
  return {
    type: 'function',
    function: {
      name: 'get_scenarios',
      description: 'Get all scenarios in the financial model',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false
      }
    }
  };
}

/**
 * Tool: Add a new forecast period
 */
function addForecastPeriodTool(): ToolFunction {
  return {
    type: 'function',
    function: {
      name: 'add_forecast_period',
      description: 'Add a new forecast period to the model (e.g., add 2025F)',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false
      }
    }
  };
}

/**
 * Tool: Export model data
 */
function exportModelDataTool(): ToolFunction {
  return {
    type: 'function',
    function: {
      name: 'export_model_data',
      description: 'Export all model data including data points, formula templates, and variables',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false
      }
    }
  };
}

/**
 * Tool: Set or update a variable
 */
function setVariableTool(): ToolFunction {
  return {
    type: 'function',
    function: {
      name: 'set_variable',
      description: 'Create or update a variable that can be used in formulas. Variables are referenced in formulas using ${variable_name} syntax. Variables can have either a static value or a dynamic expression that gets evaluated.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'The variable name (e.g., tax_rate, growth_rate, costs_pct_revenue)'
          },
          value: {
            type: 'number',
            description: 'The numeric value of the variable (required if no expression is provided)'
          },
          expression: {
            type: 'string',
            description: 'Formula expression for dynamic variables (e.g., "{Costs}[2023A] / {Revenue}[2023A]"). Use either value OR expression, not both.'
          },
          description: {
            type: 'string',
            description: 'Optional description of what this variable represents'
          },
          scenario: {
            type: ['string', 'null'],
            description: 'Optional scenario this variable applies to. If null, applies to all scenarios.'
          }
        },
        required: ['name'],
        additionalProperties: false
      }
    }
  };
}

/**
 * Tool: Get all variables or variables for a specific scenario
 */
function getVariablesTool(): ToolFunction {
  return {
    type: 'function',
    function: {
      name: 'get_variables',
      description: 'Get all variables in the model, optionally filtered by scenario',
      parameters: {
        type: 'object',
        properties: {
          scenario: {
            type: ['string', 'null'],
            description: 'Optional scenario to filter variables by. If null, returns all variables.'
          }
        },
        additionalProperties: false
      }
    }
  };
}


/**
 * Execute a tool function call on the financial model
 */
export async function executeToolCall(
  model: FinancialDataModel,
  toolName: string,
  args: any
): Promise<any> {
  switch (toolName) {
    case 'add_data_point':
      return model.addDataPoint({
        lineItem: args.lineItem,
        timePeriods: args.timePeriods,
        type: args.type,
        value: args.value,
        expression: args.expression,
        scenario: args.scenario || null,
        variables: args.variables || []
      });

    case 'get_line_items':
      return { lineItems: model.getLineItems() };

    case 'get_time_periods':
      return { timePeriods: model.getTimePeriods() };

    case 'get_cell_value':
      // If no scenario specified, try to get values for all scenarios
      if (!args.scenario) {
        const scenarios = model.getScenarios();
        const values: Record<string, any> = {};
        
        // First check dimension-agnostic value
        const dimensionAgnosticValue = model.getCellValue(args.lineItem, args.timePeriod, null);
        if (dimensionAgnosticValue !== null) {
          values['(all scenarios)'] = dimensionAgnosticValue;
        }
        
        // Then check each scenario
        for (const scenario of scenarios) {
          const value = model.getCellValue(args.lineItem, args.timePeriod, scenario);
          if (value !== null) {
            values[scenario] = value;
          }
        }
        
        // If we found any values, return them
        if (Object.keys(values).length > 0) {
          return {
            value: values,
            note: 'Multiple values found. Specify a scenario for a single value.'
          };
        }
        
        // No values found
        return { value: null };
      }
      
      // Scenario specified - return single value
      return {
        value: model.getCellValue(
          args.lineItem,
          args.timePeriod,
          args.scenario
        )
      };

    case 'get_scenarios':
      return { scenarios: model.getScenarios() };

    case 'add_forecast_period':
      model.incrementMaxForecastOffset();
      return {
        success: true,
        message: `Added forecast period ${model.getLastActualYear() + model.getMaxForecastOffset()}F`
      };

    case 'export_model_data':
      return {
        dataPoints: model.exportDataPoints(),
        formulaTemplates: model.exportFormulaTemplates(),
        variables: model.exportVariables()
      };

    case 'set_variable':
      // If expression is provided, use a placeholder value of 0 (it will be calculated)
      const value = args.expression ? 0 : args.value;
      
      if (!args.expression && args.value === undefined) {
        return {
          success: false,
          message: 'Either value or expression must be provided'
        };
      }
      
      model.setVariable({
        name: args.name,
        value: value,
        expression: args.expression,
        description: args.description,
        scenario: args.scenario || null
      });
      
      const displayValue = args.expression ? `formula: ${args.expression}` : args.value;
      return {
        success: true,
        message: `Variable ${args.name} set to ${displayValue}${args.scenario ? ` for scenario ${args.scenario}` : ' for all scenarios'}`
      };

    case 'get_variables':
      const allVariables = model.exportVariables();
      const filteredVariables = args.scenario 
        ? allVariables.filter(v => v.scenario === args.scenario || v.scenario === null)
        : allVariables;
      
      // Group by variable name for cleaner output
      const variablesByName = new Map<string, any[]>();
      filteredVariables.forEach(v => {
        if (!variablesByName.has(v.name)) {
          variablesByName.set(v.name, []);
        }
        variablesByName.get(v.name)!.push({
          value: v.value,
          scenario: v.scenario,
          description: v.description
        });
      });
      
      return {
        variables: Array.from(variablesByName.entries()).map(([name, values]) => ({
          name,
          values
        }))
      };


    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

/**
 * Example usage with OpenAI
 * 
 * ```typescript
 * import { OpenAI } from 'openai';
 * import { getFinancialModelTools, executeToolCall } from './financial-model-ai-tools';
 * 
 * const openai = new OpenAI();
 * const model = new FinancialDataModel();
 * const tools = getFinancialModelTools();
 * 
 * // Make a request with tools
 * const response = await openai.chat.completions.create({
 *   model: 'gpt-4',
 *   messages: [
 *     { role: 'user', content: 'Add revenue of 1M for 2024 and create a formula for 2025 with 10% growth' }
 *   ],
 *   tools: tools.map(t => ({ type: 'function', function: t.function })),
 *   tool_choice: 'auto'
 * });
 * 
 * // Execute any tool calls
 * if (response.choices[0].message.tool_calls) {
 *   for (const toolCall of response.choices[0].message.tool_calls) {
 *     const result = await executeToolCall(
 *       model,
 *       toolCall.function.name,
 *       JSON.parse(toolCall.function.arguments)
 *     );
 *     console.log(`Tool ${toolCall.function.name} result:`, result);
 *   }
 * }
 * ```
 */