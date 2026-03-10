export type PluginAuthor = string | Record<string, unknown>;

export interface PluginDataSource {
  watch?: string[];
  required?: string[];
  script: string;
  manual?: boolean;
  actionLabel?: string;
  [key: string]: unknown;
}

export interface PluginInputSchema {
  name: string;
  label?: string;
  type?: string;
  required?: boolean;
  default?: unknown;
  options?: Array<{ label: string; value: unknown }>;
  placeholder?: string;
  help?: string;
  filterable?: boolean;
  clearable?: boolean;
  tag?: boolean;
  multiple?: boolean;
  visibleWhen?: Record<string, unknown>;
  disabledWhen?: Record<string, unknown>;
  dataSource?: PluginDataSource;
  [key: string]: unknown;
}

export interface PluginContent extends Record<string, unknown> {
  id: string;
  name: string;
  version: string;
  description?: string;
  icon?: string;
  author?: PluginAuthor;
  inputs: PluginInputSchema[];
  script: string;
}

export interface PluginValidationResult {
  valid: boolean;
  errors: string[];
  content?: PluginContent;
}

export interface PluginContentStats {
  inputCount: number;
  dataSourceCount: number;
  conditionalCount: number;
  uploadScriptCount: number;
  configScriptCount: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function getPluginAuthorName(author: unknown, fallback = 'Unknown') {
  if (typeof author === 'string') {
    const trimmed = author.trim();
    return trimmed || fallback;
  }

  if (isRecord(author)) {
    const candidates = [author.username, author.name, author.label, author.id];
    const matched = candidates.find((item) => typeof item === 'string' && item.trim().length > 0);
    if (typeof matched === 'string') {
      return matched.trim();
    }
  }

  return fallback;
}

export function validatePluginContent(value: unknown): PluginValidationResult {
  if (!isRecord(value)) {
    return { valid: false, errors: ['Plugin content must be an object.'] };
  }

  const content = cloneJson(value);
  const errors: string[] = [];

  if (!Array.isArray(content.inputs)) {
    if (content.inputs === undefined) {
      content.inputs = [];
    } else {
      errors.push('`inputs` must be an array.');
    }
  }

  if (!isNonEmptyString(content.id)) {
    errors.push('`id` is required.');
  }

  if (!isNonEmptyString(content.name)) {
    errors.push('`name` is required.');
  }

  if (!isNonEmptyString(content.version)) {
    errors.push('`version` is required.');
  }

  if (!isNonEmptyString(content.script)) {
    errors.push('`script` is required.');
  }

  if (Array.isArray(content.inputs)) {
    content.inputs.forEach((input, index) => {
      if (!isRecord(input)) {
        errors.push(`inputs[${index}] must be an object.`);
        return;
      }

      if (!isNonEmptyString(input.name)) {
        errors.push(`inputs[${index}].name is required.`);
      }

      if (input.dataSource !== undefined) {
        if (!isRecord(input.dataSource)) {
          errors.push(`inputs[${index}].dataSource must be an object.`);
        } else {
          if (!isNonEmptyString(input.dataSource.script)) {
            errors.push(`inputs[${index}].dataSource.script is required.`);
          }

          if (input.dataSource.watch !== undefined && !isStringArray(input.dataSource.watch)) {
            errors.push(`inputs[${index}].dataSource.watch must be an array of strings.`);
          }

          if (input.dataSource.required !== undefined && !isStringArray(input.dataSource.required)) {
            errors.push(`inputs[${index}].dataSource.required must be an array of strings.`);
          }
        }
      }

      if (input.visibleWhen !== undefined && !isRecord(input.visibleWhen)) {
        errors.push(`inputs[${index}].visibleWhen must be an object.`);
      }

      if (input.disabledWhen !== undefined && !isRecord(input.disabledWhen)) {
        errors.push(`inputs[${index}].disabledWhen must be an object.`);
      }
    });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    content: content as PluginContent,
  };
}

export function getPluginContentStats(content: unknown): PluginContentStats {
  const validation = validatePluginContent(content);
  if (!validation.valid || !validation.content) {
    return {
      inputCount: 0,
      dataSourceCount: 0,
      conditionalCount: 0,
      uploadScriptCount: 0,
      configScriptCount: 0,
    };
  }

  const inputs = validation.content.inputs;
  return {
    inputCount: inputs.length,
    dataSourceCount: inputs.filter((input) => isRecord(input.dataSource)).length,
    conditionalCount: inputs.filter((input) => isRecord(input.visibleWhen) || isRecord(input.disabledWhen)).length,
    uploadScriptCount: validation.content.script ? 1 : 0,
    configScriptCount: inputs.filter((input) => isRecord(input.dataSource) && isNonEmptyString(input.dataSource.script)).length,
  };
}

export function toPrettyJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}
