export type PluginKind = 'uploader' | 'site-detector' | 'editor-adapter';
export type PluginAuthor = string | Record<string, unknown>;

const UPLOADER_INPUT_TYPES = new Set([
  'text',
  'password',
  'checkbox',
  'select',
  'textarea',
  'number',
  'switch',
  'kv-pairs',
]);

const DETECTOR_ACTION_FORM_TYPES = new Set([
  'text',
  'password',
  'checkbox',
  'select',
  'textarea',
  'number',
  'switch',
]);

const SITE_DETECTOR_PRESENTATION_FIELDS = [
  'title',
  'description',
  'actionText',
  'ignoreText',
  'successText',
  'dismissText',
  'failureText',
] as const;

export interface PluginDataSource {
  watch?: string[];
  required?: string[];
  script: string;
  manual?: boolean;
  actionLabel?: string;
  [key: string]: unknown;
}

export interface PluginFieldCondition {
  field: string;
  equals?: unknown;
  notEquals?: unknown;
  in?: unknown[];
  notIn?: unknown[];
  truthy?: boolean;
  falsy?: boolean;
  exists?: boolean;
  empty?: boolean;
}

export interface PluginFieldConditionGroup {
  all?: PluginFieldConditionSchema[];
  any?: PluginFieldConditionSchema[];
}

export type PluginFieldConditionSchema =
  | PluginFieldCondition
  | PluginFieldConditionGroup;

export interface PluginInputSchema {
  name: string;
  label?: string;
  type?:
    | 'text'
    | 'password'
    | 'checkbox'
    | 'select'
    | 'textarea'
    | 'number'
    | 'switch'
    | 'kv-pairs';
  required?: boolean;
  default?: unknown;
  options?: Array<{ label: string; value: unknown }>;
  placeholder?: string;
  help?: string;
  filterable?: boolean;
  clearable?: boolean;
  tag?: boolean;
  multiple?: boolean;
  visibleWhen?: PluginFieldConditionSchema;
  disabledWhen?: PluginFieldConditionSchema;
  dataSource?: PluginDataSource;
  [key: string]: unknown;
}

export interface SiteDetectorMatchRule {
  domains?: string[];
  domainSuffixes?: string[];
  pathnameEquals?: string[];
  pathnameIncludes?: string[];
  urlPatterns?: string[];
}

export interface SiteDetectorPresentation {
  title?: string;
  description?: string;
  actionText?: string;
  ignoreText?: string;
  successText?: string;
  dismissText?: string;
  failureText?: string;
}

export interface DetectorActionFieldSchema {
  name: string;
  label?: string;
  type?:
    | 'text'
    | 'password'
    | 'checkbox'
    | 'select'
    | 'textarea'
    | 'number'
    | 'switch';
  required?: boolean;
  default?: unknown;
  options?: Array<{ label: string; value: unknown }>;
  placeholder?: string;
  help?: string;
  filterable?: boolean;
  clearable?: boolean;
  multiple?: boolean;
  [key: string]: unknown;
}

interface BasePluginContent extends Record<string, unknown> {
  id: string;
  kind: PluginKind;
  name: string;
  version: string;
  description?: string;
  icon?: string;
  author?: PluginAuthor;
}

export interface UploaderRuntimeSchema extends Record<string, unknown> {
  inputs: PluginInputSchema[];
  script: string;
}

export interface SiteDetectorRuntimeSchema extends Record<string, unknown> {
  targetDriveType: string;
  detectScript: string;
  extractScript: string;
  match?: SiteDetectorMatchRule;
  presentation?: SiteDetectorPresentation;
  priority?: number;
  actionForm?: DetectorActionFieldSchema[];
}

export interface EditorAdapterRuntimeSchema extends Record<string, unknown> {
  editorType: string;
  displayName: string;
  detectScript: string;
  injectScript: string;
}

export interface UploaderPluginContent extends BasePluginContent {
  kind: 'uploader';
  uploader: UploaderRuntimeSchema;
}

export interface SiteDetectorPluginContent extends BasePluginContent {
  kind: 'site-detector';
  detector: SiteDetectorRuntimeSchema;
}

export interface EditorAdapterPluginContent extends BasePluginContent {
  kind: 'editor-adapter';
  editorAdapter: EditorAdapterRuntimeSchema;
}

export type PluginContent =
  | UploaderPluginContent
  | SiteDetectorPluginContent
  | EditorAdapterPluginContent;

export interface PluginValidationResult {
  valid: boolean;
  errors: string[];
  content?: PluginContent;
}

export interface PluginContentStats {
  kind: PluginKind;
  inputCount: number;
  actionFormCount: number;
  dataSourceCount: number;
  conditionalCount: number;
  uploadScriptCount: number;
  configScriptCount: number;
  detectScriptCount: number;
  extractScriptCount: number;
  injectScriptCount: number;
  scriptCount: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOwnKey(record: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === 'string')
  );
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateBoolean(value: unknown, field: string, errors: string[]) {
  if (value === undefined) {
    return;
  }

  if (typeof value !== 'boolean') {
    errors.push(`\`${field}\` must be a boolean.`);
  }
}

function resolvePluginKind(value: unknown, errors: string[]): PluginKind {
  if (value === undefined || value === null) {
    return 'uploader';
  }

  if (typeof value !== 'string') {
    errors.push('`kind` must be a string.');
    return 'uploader';
  }

  const normalized = value.trim();
  if (
    normalized === 'uploader' ||
    normalized === 'site-detector' ||
    normalized === 'editor-adapter'
  ) {
    return normalized;
  }

  errors.push(
    '`kind` must be one of `uploader`, `site-detector`, or `editor-adapter`.',
  );
  return 'uploader';
}

function validateConditionSchema(
  value: unknown,
  field: string,
  errors: string[],
) {
  if (value === undefined) {
    return;
  }

  if (!isRecord(value)) {
    errors.push(`\`${field}\` must be an object.`);
    return;
  }

  const all = value.all;
  const any = value.any;

  if (all !== undefined) {
    if (!Array.isArray(all)) {
      errors.push(`\`${field}.all\` must be an array.`);
    } else {
      all.forEach((item, index) => {
        validateConditionSchema(item, `${field}.all[${index}]`, errors);
      });
    }
  }

  if (any !== undefined) {
    if (!Array.isArray(any)) {
      errors.push(`\`${field}.any\` must be an array.`);
    } else {
      any.forEach((item, index) => {
        validateConditionSchema(item, `${field}.any[${index}]`, errors);
      });
    }
  }
}

function validateDataSource(
  value: unknown,
  field: string,
  errors: string[],
) {
  if (value === undefined) {
    return;
  }

  if (!isRecord(value)) {
    errors.push(`\`${field}\` must be an object.`);
    return;
  }

  if (!isNonEmptyString(value.script)) {
    errors.push(`\`${field}.script\` is required.`);
  }

  if (value.watch !== undefined && !isStringArray(value.watch)) {
    errors.push(`\`${field}.watch\` must be an array of strings.`);
  }

  if (value.required !== undefined && !isStringArray(value.required)) {
    errors.push(`\`${field}.required\` must be an array of strings.`);
  }

  validateBoolean(value.manual, `${field}.manual`, errors);

  if (value.actionLabel !== undefined && typeof value.actionLabel !== 'string') {
    errors.push(`\`${field}.actionLabel\` must be a string.`);
  }
}

function validateUploaderInput(
  value: unknown,
  index: number,
  errors: string[],
  fieldPath = 'uploader.inputs',
) {
  if (!isRecord(value)) {
    errors.push(`\`${fieldPath}[${index}]\` must be an object.`);
    return;
  }

  if (!isNonEmptyString(value.name)) {
    errors.push(`\`${fieldPath}[${index}].name\` is required.`);
  }

  if (
    value.type !== undefined &&
    (typeof value.type !== 'string' || !UPLOADER_INPUT_TYPES.has(value.type))
  ) {
    errors.push(
      `\`${fieldPath}[${index}].type\` must be one of: ${Array.from(
        UPLOADER_INPUT_TYPES,
      ).join(', ')}.`,
    );
  }

  if (value.options !== undefined && !Array.isArray(value.options)) {
    errors.push(`\`${fieldPath}[${index}].options\` must be an array.`);
  }

  validateBoolean(value.required, `${fieldPath}[${index}].required`, errors);
  validateBoolean(value.filterable, `${fieldPath}[${index}].filterable`, errors);
  validateBoolean(value.clearable, `${fieldPath}[${index}].clearable`, errors);
  validateBoolean(value.tag, `${fieldPath}[${index}].tag`, errors);
  validateBoolean(value.multiple, `${fieldPath}[${index}].multiple`, errors);

  if (value.label !== undefined && typeof value.label !== 'string') {
    errors.push(`\`${fieldPath}[${index}].label\` must be a string.`);
  }

  if (value.placeholder !== undefined && typeof value.placeholder !== 'string') {
    errors.push(`\`${fieldPath}[${index}].placeholder\` must be a string.`);
  }

  if (value.help !== undefined && typeof value.help !== 'string') {
    errors.push(`\`${fieldPath}[${index}].help\` must be a string.`);
  }

  validateConditionSchema(
    value.visibleWhen,
    `${fieldPath}[${index}].visibleWhen`,
    errors,
  );
  validateConditionSchema(
    value.disabledWhen,
    `${fieldPath}[${index}].disabledWhen`,
    errors,
  );
  validateDataSource(
    value.dataSource,
    `${fieldPath}[${index}].dataSource`,
    errors,
  );
}

function validateSiteDetectorMatch(
  value: unknown,
  field: string,
  errors: string[],
) {
  if (value === undefined) {
    return;
  }

  if (!isRecord(value)) {
    errors.push(`\`${field}\` must be an object.`);
    return;
  }

  const arrayFields = [
    'domains',
    'domainSuffixes',
    'pathnameEquals',
    'pathnameIncludes',
    'urlPatterns',
  ] as const;

  arrayFields.forEach((key) => {
    if (value[key] !== undefined && !isStringArray(value[key])) {
      errors.push(`\`${field}.${key}\` must be an array of strings.`);
    }
  });
}

function validateSiteDetectorPresentation(
  value: unknown,
  field: string,
  errors: string[],
) {
  if (value === undefined) {
    return;
  }

  if (!isRecord(value)) {
    errors.push(`\`${field}\` must be an object.`);
    return;
  }

  SITE_DETECTOR_PRESENTATION_FIELDS.forEach((key) => {
    if (value[key] !== undefined && typeof value[key] !== 'string') {
      errors.push(`\`${field}.${key}\` must be a string.`);
    }
  });
}

function validateDetectorActionField(
  value: unknown,
  index: number,
  errors: string[],
  fieldPath = 'detector.actionForm',
) {
  if (!isRecord(value)) {
    errors.push(`\`${fieldPath}[${index}]\` must be an object.`);
    return;
  }

  if (!isNonEmptyString(value.name)) {
    errors.push(`\`${fieldPath}[${index}].name\` is required.`);
  }

  if (
    value.type !== undefined &&
    (typeof value.type !== 'string' ||
      !DETECTOR_ACTION_FORM_TYPES.has(value.type))
  ) {
    errors.push(
      `\`${fieldPath}[${index}].type\` must be one of: ${Array.from(
        DETECTOR_ACTION_FORM_TYPES,
      ).join(', ')}.`,
    );
  }

  if (value.options !== undefined && !Array.isArray(value.options)) {
    errors.push(`\`${fieldPath}[${index}].options\` must be an array.`);
  }

  validateBoolean(value.required, `${fieldPath}[${index}].required`, errors);
  validateBoolean(value.filterable, `${fieldPath}[${index}].filterable`, errors);
  validateBoolean(value.clearable, `${fieldPath}[${index}].clearable`, errors);
  validateBoolean(value.multiple, `${fieldPath}[${index}].multiple`, errors);

  if (value.label !== undefined && typeof value.label !== 'string') {
    errors.push(`\`${fieldPath}[${index}].label\` must be a string.`);
  }

  if (value.placeholder !== undefined && typeof value.placeholder !== 'string') {
    errors.push(`\`${fieldPath}[${index}].placeholder\` must be a string.`);
  }

  if (value.help !== undefined && typeof value.help !== 'string') {
    errors.push(`\`${fieldPath}[${index}].help\` must be a string.`);
  }

  if (hasOwnKey(value, 'tag')) {
    errors.push(`\`${fieldPath}[${index}].tag\` is not supported.`);
  }

  if (hasOwnKey(value, 'visibleWhen') || hasOwnKey(value, 'disabledWhen')) {
    errors.push(
      `\`${fieldPath}[${index}]\` does not support visibleWhen/disabledWhen.`,
    );
  }

  if (hasOwnKey(value, 'dataSource')) {
    errors.push(`\`${fieldPath}[${index}]\` does not support dataSource.`);
  }
}

function normalizeUploaderRuntime(
  content: Record<string, unknown>,
  errors: string[],
) {
  if (content.uploader !== undefined && !isRecord(content.uploader)) {
    errors.push('`uploader` must be an object.');
    return null;
  }

  const uploader = isRecord(content.uploader) ? content.uploader : {};
  const normalizedUploader: Record<string, unknown> = { ...uploader };

  const rawInputs =
    normalizedUploader.inputs !== undefined
      ? normalizedUploader.inputs
      : content.inputs;

  if (rawInputs === undefined) {
    normalizedUploader.inputs = [];
  } else if (Array.isArray(rawInputs)) {
    normalizedUploader.inputs = rawInputs;
  } else {
    errors.push('`uploader.inputs` must be an array.');
    normalizedUploader.inputs = [];
  }

  const rawScript =
    normalizedUploader.script !== undefined
      ? normalizedUploader.script
      : content.script;

  if (!isNonEmptyString(rawScript)) {
    errors.push('`uploader.script` is required for uploader plugin.');
    normalizedUploader.script = '';
  } else {
    normalizedUploader.script = rawScript;
  }

  content.uploader = normalizedUploader;
  delete content.inputs;
  delete content.script;

  return normalizedUploader as UploaderRuntimeSchema;
}

function normalizeSiteDetectorRuntime(
  content: Record<string, unknown>,
  errors: string[],
) {
  if (content.detector !== undefined && !isRecord(content.detector)) {
    errors.push('`detector` must be an object.');
    return null;
  }

  const detector = isRecord(content.detector) ? content.detector : {};
  const normalizedDetector: Record<string, unknown> = { ...detector };

  const targetDriveType =
    normalizedDetector.targetDriveType !== undefined
      ? normalizedDetector.targetDriveType
      : content.targetDriveType;
  const detectScript =
    normalizedDetector.detectScript !== undefined
      ? normalizedDetector.detectScript
      : content.detectScript;
  const extractScript =
    normalizedDetector.extractScript !== undefined
      ? normalizedDetector.extractScript
      : content.extractScript;
  const match =
    normalizedDetector.match !== undefined
      ? normalizedDetector.match
      : content.match;
  const presentation =
    normalizedDetector.presentation !== undefined
      ? normalizedDetector.presentation
      : content.presentation;
  const priority =
    normalizedDetector.priority !== undefined
      ? normalizedDetector.priority
      : content.priority;
  const actionForm =
    normalizedDetector.actionForm !== undefined
      ? normalizedDetector.actionForm
      : content.actionForm;

  normalizedDetector.targetDriveType =
    typeof targetDriveType === 'string' ? targetDriveType : '';
  normalizedDetector.detectScript =
    typeof detectScript === 'string' ? detectScript : '';
  normalizedDetector.extractScript =
    typeof extractScript === 'string' ? extractScript : '';

  if (match !== undefined) {
    normalizedDetector.match = match;
  }

  if (presentation !== undefined) {
    normalizedDetector.presentation = presentation;
  }

  if (priority !== undefined) {
    normalizedDetector.priority = priority;
  }

  if (actionForm !== undefined) {
    normalizedDetector.actionForm = actionForm;
  }

  if (!isNonEmptyString(normalizedDetector.targetDriveType)) {
    errors.push('`detector.targetDriveType` is required for site-detector plugin.');
  }

  if (!isNonEmptyString(normalizedDetector.detectScript)) {
    errors.push('`detector.detectScript` is required for site-detector plugin.');
  }

  if (!isNonEmptyString(normalizedDetector.extractScript)) {
    errors.push('`detector.extractScript` is required for site-detector plugin.');
  }

  content.detector = normalizedDetector;
  delete content.targetDriveType;
  delete content.detectScript;
  delete content.extractScript;
  delete content.match;
  delete content.presentation;
  delete content.priority;
  delete content.actionForm;

  return normalizedDetector as SiteDetectorRuntimeSchema;
}

function normalizeEditorAdapterRuntime(
  content: Record<string, unknown>,
  errors: string[],
) {
  if (content.editorAdapter !== undefined && !isRecord(content.editorAdapter)) {
    errors.push('`editorAdapter` must be an object.');
    return null;
  }

  const editorAdapter = isRecord(content.editorAdapter)
    ? content.editorAdapter
    : {};
  const normalizedEditorAdapter: Record<string, unknown> = { ...editorAdapter };

  const editorType =
    normalizedEditorAdapter.editorType !== undefined
      ? normalizedEditorAdapter.editorType
      : content.editorType;
  const displayName =
    normalizedEditorAdapter.displayName !== undefined
      ? normalizedEditorAdapter.displayName
      : content.displayName;
  const detectScript =
    normalizedEditorAdapter.detectScript !== undefined
      ? normalizedEditorAdapter.detectScript
      : content.detectScript;
  const injectScript =
    normalizedEditorAdapter.injectScript !== undefined
      ? normalizedEditorAdapter.injectScript
      : content.injectScript;

  normalizedEditorAdapter.editorType =
    typeof editorType === 'string' ? editorType : '';
  normalizedEditorAdapter.displayName =
    typeof displayName === 'string' ? displayName : '';
  normalizedEditorAdapter.detectScript =
    typeof detectScript === 'string' ? detectScript : '';
  normalizedEditorAdapter.injectScript =
    typeof injectScript === 'string' ? injectScript : '';

  if (!isNonEmptyString(normalizedEditorAdapter.editorType)) {
    errors.push('`editorAdapter.editorType` is required for editor-adapter plugin.');
  }

  if (!isNonEmptyString(normalizedEditorAdapter.displayName)) {
    errors.push(
      '`editorAdapter.displayName` is required for editor-adapter plugin.',
    );
  }

  if (!isNonEmptyString(normalizedEditorAdapter.detectScript)) {
    errors.push(
      '`editorAdapter.detectScript` is required for editor-adapter plugin.',
    );
  }

  if (!isNonEmptyString(normalizedEditorAdapter.injectScript)) {
    errors.push(
      '`editorAdapter.injectScript` is required for editor-adapter plugin.',
    );
  }

  content.editorAdapter = normalizedEditorAdapter;
  delete content.editorType;
  delete content.displayName;
  delete content.detectScript;
  delete content.injectScript;

  return normalizedEditorAdapter as EditorAdapterRuntimeSchema;
}

export function isUploaderPlugin(
  content: PluginContent | null | undefined,
): content is UploaderPluginContent {
  return !!content && content.kind === 'uploader';
}

export function isSiteDetectorPlugin(
  content: PluginContent | null | undefined,
): content is SiteDetectorPluginContent {
  return !!content && content.kind === 'site-detector';
}

export function isEditorAdapterPlugin(
  content: PluginContent | null | undefined,
): content is EditorAdapterPluginContent {
  return !!content && content.kind === 'editor-adapter';
}

export function getPluginAuthorName(author: unknown, fallback = 'Unknown') {
  if (typeof author === 'string') {
    const trimmed = author.trim();
    return trimmed || fallback;
  }

  if (isRecord(author)) {
    const candidates = [author.username, author.name, author.label, author.id];
    const matched = candidates.find(
      (item) => typeof item === 'string' && item.trim().length > 0,
    );
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

  const content = cloneJson(value) as Record<string, unknown>;
  const errors: string[] = [];
  const kind = resolvePluginKind(content.kind, errors);
  content.kind = kind;

  if (!isNonEmptyString(content.id)) {
    errors.push('`id` is required.');
  }

  if (!isNonEmptyString(content.name)) {
    errors.push('`name` is required.');
  }

  if (!isNonEmptyString(content.version)) {
    errors.push('`version` is required.');
  }

  if (kind === 'uploader') {
    const uploader = normalizeUploaderRuntime(content, errors);
    if (uploader && Array.isArray(uploader.inputs)) {
      uploader.inputs.forEach((input, index) => {
        validateUploaderInput(input, index, errors, 'uploader.inputs');
      });
    }
  } else if (kind === 'site-detector') {
    const detector = normalizeSiteDetectorRuntime(content, errors);
    if (detector) {
      if (
        detector.priority !== undefined &&
        (typeof detector.priority !== 'number' || !Number.isFinite(detector.priority))
      ) {
        errors.push('`detector.priority` must be a finite number.');
      }

      validateSiteDetectorMatch(detector.match, 'detector.match', errors);
      validateSiteDetectorPresentation(
        detector.presentation,
        'detector.presentation',
        errors,
      );

      if (detector.actionForm !== undefined) {
        if (!Array.isArray(detector.actionForm)) {
          errors.push('`detector.actionForm` must be an array.');
        } else {
          detector.actionForm.forEach((field, index) => {
            validateDetectorActionField(
              field,
              index,
              errors,
              'detector.actionForm',
            );
          });
        }
      } else {
        delete detector.actionForm;
      }
    }
  } else {
    normalizeEditorAdapterRuntime(content, errors);
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
      kind: 'uploader',
      inputCount: 0,
      actionFormCount: 0,
      dataSourceCount: 0,
      conditionalCount: 0,
      uploadScriptCount: 0,
      configScriptCount: 0,
      detectScriptCount: 0,
      extractScriptCount: 0,
      injectScriptCount: 0,
      scriptCount: 0,
    };
  }

  if (isUploaderPlugin(validation.content)) {
    const inputs = validation.content.uploader.inputs;
    const configScriptCount = inputs.filter(
      (input) =>
        isRecord(input.dataSource) && isNonEmptyString(input.dataSource.script),
    ).length;

    return {
      kind: 'uploader',
      inputCount: inputs.length,
      actionFormCount: 0,
      dataSourceCount: inputs.filter((input) => isRecord(input.dataSource))
        .length,
      conditionalCount: inputs.filter(
        (input) =>
          isRecord(input.visibleWhen) || isRecord(input.disabledWhen),
      ).length,
      uploadScriptCount: validation.content.uploader.script ? 1 : 0,
      configScriptCount,
      detectScriptCount: 0,
      extractScriptCount: 0,
      injectScriptCount: 0,
      scriptCount:
        configScriptCount + (validation.content.uploader.script ? 1 : 0),
    };
  }

  if (isSiteDetectorPlugin(validation.content)) {
    const actionFormCount = Array.isArray(validation.content.detector.actionForm)
      ? validation.content.detector.actionForm.length
      : 0;

    const detectScriptCount = validation.content.detector.detectScript ? 1 : 0;
    const extractScriptCount = validation.content.detector.extractScript ? 1 : 0;

    return {
      kind: 'site-detector',
      inputCount: 0,
      actionFormCount,
      dataSourceCount: 0,
      conditionalCount: 0,
      uploadScriptCount: 0,
      configScriptCount: 0,
      detectScriptCount,
      extractScriptCount,
      injectScriptCount: 0,
      scriptCount: detectScriptCount + extractScriptCount,
    };
  }

  const detectScriptCount = validation.content.editorAdapter.detectScript ? 1 : 0;
  const injectScriptCount = validation.content.editorAdapter.injectScript ? 1 : 0;

  return {
    kind: 'editor-adapter',
    inputCount: 0,
    actionFormCount: 0,
    dataSourceCount: 0,
    conditionalCount: 0,
    uploadScriptCount: 0,
    configScriptCount: 0,
    detectScriptCount,
    extractScriptCount: 0,
    injectScriptCount,
    scriptCount: detectScriptCount + injectScriptCount,
  };
}

export function toPrettyJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}
