import { computed, ref, watch, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage, type UploadFileInfo } from 'naive-ui'
import { isUploaderPlugin, validatePluginContent } from '@common/utils/plugin'
import type { PluginInputSchema, UploaderRuntimeSchema } from '@common/utils/plugin'
import { createPluginTesterCtx, evaluatePluginScript } from './pluginTester'

export function usePluginTester(content: Ref<unknown>) {
  const { t } = useI18n()
  const message = useMessage()
  
  // State
  const configFields = ref<Record<string, any>>({})
  const dynamicOptions = ref<Record<string, any[]>>({})
  const dynamicHelp = ref<Record<string, string>>({})
  const dynamicPlaceholder = ref<Record<string, string>>({})
  const kvPairRows = ref<Record<string, Array<{ key: string; value: string }>>>({})
  const dataSourceErrors = ref<Record<string, string>>({})
  const testFile = ref<File | null>(null)
  const testResult = ref<string>('')
  const testError = ref<string>('')
  const isTesting = ref(false)
  const isFetchingSource = ref<Record<string, boolean>>({})
  
  const dataSourceSignatures = new Map<string, string>()
  const dataSourceRequestTokens = new Map<string, number>()
  
  // Validation & Normalization
  const validation = computed(() => validatePluginContent(content.value))
  const pluginContent = computed<UploaderRuntimeSchema | null>(() => {
    const validatedContent = validation.value.content
    if (!validatedContent || !isUploaderPlugin(validatedContent)) {
      return null
    }
    return validatedContent.uploader
  })
  const hasErrors = computed(() => !validation.value.valid)
  const unsupportedKindMessage = computed(() => {
    if (!validation.value.valid || !validation.value.content) {
      return ''
    }
    return pluginContent.value ? '' : t('submit.testerOnlyUploader')
  })
  
  function isRecord(value: unknown): value is Record<string, any> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
  }
  
  function hasOwnKey(record: Record<string, unknown>, key: string): boolean {
    return Object.prototype.hasOwnProperty.call(record, key)
  }
  
  function isValueEmpty(value: unknown): boolean {
    if (value === undefined || value === null) {
      return true
    }
  
    if (typeof value === 'string') {
      return value.trim().length === 0
    }
  
    if (Array.isArray(value)) {
      return value.length === 0
    }
  
    if (isRecord(value)) {
      return Object.keys(value).length === 0
    }
  
    if (typeof value === 'number') {
      return Number.isNaN(value)
    }
  
    return false
  }
  
  function hasFieldValue(value: unknown): boolean {
    return !isValueEmpty(value)
  }
  
  function valuesEqual(left: unknown, right: unknown): boolean {
    if (left === right) {
      return true
    }
  
    if ((Array.isArray(left) || isRecord(left)) && (Array.isArray(right) || isRecord(right))) {
      try {
        return JSON.stringify(left) === JSON.stringify(right)
      } catch {
        return false
      }
    }
  
    return false
  }
  
  function valueInList(value: unknown, list: unknown[]): boolean {
    if (Array.isArray(value)) {
      return value.some((item) => list.some((candidate) => valuesEqual(item, candidate)))
    }
    return list.some((candidate) => valuesEqual(value, candidate))
  }
  
  function evaluateSingleCondition(rawCondition: Record<string, unknown>): boolean {
    const fieldName = typeof rawCondition.field === 'string' ? rawCondition.field : ''
    if (!fieldName) {
      return true
    }
  
    const targetValue = configFields.value[fieldName]
    const checks: boolean[] = []
  
    if (hasOwnKey(rawCondition, 'equals')) {
      checks.push(valuesEqual(targetValue, rawCondition.equals))
    }
  
    if (hasOwnKey(rawCondition, 'notEquals')) {
      checks.push(!valuesEqual(targetValue, rawCondition.notEquals))
    }
  
    if (hasOwnKey(rawCondition, 'in')) {
      checks.push(Array.isArray(rawCondition.in) ? valueInList(targetValue, rawCondition.in) : false)
    }
  
    if (hasOwnKey(rawCondition, 'notIn')) {
      checks.push(Array.isArray(rawCondition.notIn) ? !valueInList(targetValue, rawCondition.notIn) : true)
    }
  
    if (hasOwnKey(rawCondition, 'truthy')) {
      checks.push(rawCondition.truthy === true ? !!targetValue : !targetValue)
    }
  
    if (hasOwnKey(rawCondition, 'falsy')) {
      checks.push(rawCondition.falsy === true ? !targetValue : !!targetValue)
    }
  
    if (hasOwnKey(rawCondition, 'exists')) {
      checks.push(rawCondition.exists === true ? hasFieldValue(targetValue) : !hasFieldValue(targetValue))
    }
  
    if (hasOwnKey(rawCondition, 'empty')) {
      checks.push(rawCondition.empty === true ? isValueEmpty(targetValue) : !isValueEmpty(targetValue))
    }
  
    return checks.every(Boolean)
  }
  
  function evaluateConditionSchema(schema: unknown): boolean {
    if (!isRecord(schema)) {
      return true
    }
  
    const all = Array.isArray(schema.all) ? schema.all : null
    const any = Array.isArray(schema.any) ? schema.any : null
  
    if (all !== null || any !== null) {
      const allResult = all === null || all.every((item) => evaluateConditionSchema(item))
      const anyResult = any === null || any.some((item) => evaluateConditionSchema(item))
      return allResult && anyResult
    }
  
    return evaluateSingleCondition(schema)
  }
  
  function isInputVisible(input: PluginInputSchema): boolean {
    if (!isRecord(input.visibleWhen)) {
      return true
    }
    return evaluateConditionSchema(input.visibleWhen)
  }
  
  function isInputDisabled(input: PluginInputSchema): boolean {
    if (!isRecord(input.disabledWhen)) {
      return false
    }
    return evaluateConditionSchema(input.disabledWhen)
  }
  
  function getInputPlaceholder(input: PluginInputSchema, fallback = ''): string {
    if (hasOwnKey(dynamicPlaceholder.value, input.name)) {
      return dynamicPlaceholder.value[input.name] ?? ''
    }
  
    if (typeof input.placeholder === 'string') {
      return input.placeholder
    }
  
    return fallback || input.name
  }
  
  function getInputHelp(input: PluginInputSchema): string {
    if (hasOwnKey(dynamicHelp.value, input.name)) {
      return dynamicHelp.value[input.name] ?? ''
    }
  
    return typeof input.help === 'string' ? input.help : ''
  }
  
  function toKvRows(value: unknown): Array<{ key: string; value: string }> {
    if (!isRecord(value)) {
      return []
    }
  
    return Object.entries(value).map(([key, rowValue]) => ({
      key,
      value: rowValue == null ? '' : String(rowValue)
    }))
  }
  
  function kvRowsToObject(rows: Array<{ key: string; value: string }>): Record<string, string> {
    const next: Record<string, string> = {}
  
    rows.forEach((row) => {
      const normalizedKey = row.key.trim()
      if (!normalizedKey) {
        return
      }
      next[normalizedKey] = row.value
    })
  
    return next
  }
  
  function syncKvRowsFromConfig(inputName: string) {
    kvPairRows.value[inputName] = toKvRows(configFields.value[inputName])
  }
  
  function ensureKvRows(inputName: string) {
    if (!Array.isArray(kvPairRows.value[inputName])) {
      syncKvRowsFromConfig(inputName)
    }
  }
  
  function applyKvRowsToConfig(inputName: string) {
    configFields.value[inputName] = kvRowsToObject(kvPairRows.value[inputName] || [])
  }
  
  function addKvRow(inputName: string) {
    ensureKvRows(inputName)
    kvPairRows.value[inputName] = [...(kvPairRows.value[inputName] || []), { key: '', value: '' }]
    applyKvRowsToConfig(inputName)
  }
  
  function removeKvRow(inputName: string, index: number) {
    ensureKvRows(inputName)
    const rows = [...(kvPairRows.value[inputName] || [])]
    rows.splice(index, 1)
    kvPairRows.value[inputName] = rows
    applyKvRowsToConfig(inputName)
  }
  
  function updateKvRowKey(inputName: string, index: number, key: string) {
    ensureKvRows(inputName)
    const rows = [...(kvPairRows.value[inputName] || [])]
    if (!rows[index]) {
      return
    }
  
    rows[index] = { ...rows[index], key }
    kvPairRows.value[inputName] = rows
    applyKvRowsToConfig(inputName)
  }
  
  function updateKvRowValue(inputName: string, index: number, value: string) {
    ensureKvRows(inputName)
    const rows = [...(kvPairRows.value[inputName] || [])]
    if (!rows[index]) {
      return
    }
  
    rows[index] = { ...rows[index], value }
    kvPairRows.value[inputName] = rows
    applyKvRowsToConfig(inputName)
  }
  
  function getMissingRequiredInputs(): PluginInputSchema[] {
    const inputs = pluginContent.value?.inputs || []
    return inputs.filter((input) => input.required === true && isInputVisible(input) && isValueEmpty(configFields.value[input.name]))
  }
  
  function getInputByName(inputName: string): PluginInputSchema | null {
    const inputs = pluginContent.value?.inputs || []
    return inputs.find((input) => input.name === inputName) || null
  }
  
  function getInputDataSource(input: PluginInputSchema) {
    const source = input.dataSource
    if (!source || typeof source.script !== 'string' || !source.script.trim()) {
      return null
    }
    return source
  }
  
  function getDataSourceDependencies(input: PluginInputSchema): string[] {
    const source = getInputDataSource(input)
    if (!source) {
      return []
    }
  
    if (Array.isArray(source.watch) && source.watch.length > 0) {
      return source.watch.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    }
  
    if (Array.isArray(source.required) && source.required.length > 0) {
      return source.required.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    }
  
    return []
  }
  
  function getDataSourceRequiredDependencies(input: PluginInputSchema): string[] {
    const source = getInputDataSource(input)
    if (!source) {
      return []
    }
  
    if (Array.isArray(source.required) && source.required.length > 0) {
      return source.required.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    }
  
    return getDataSourceDependencies(input)
  }
  
  function canResolveInputSource(input: PluginInputSchema): boolean {
    if (!getInputDataSource(input)) {
      return false
    }
  
    if (!isInputVisible(input)) {
      return false
    }
  
    return getDataSourceRequiredDependencies(input).every((key) => hasFieldValue(configFields.value[key]))
  }
  
  function getInputDataSourceSignature(input: PluginInputSchema): string {
    const source = getInputDataSource(input)
    if (!source) {
      return ''
    }
  
    const dependencies = getDataSourceDependencies(input)
    return JSON.stringify({
      name: input.name,
      visible: isInputVisible(input),
      script: source.script,
      dependencies: dependencies.map((key) => [key, configFields.value[key]])
    })
  }
  
  function resetInputSourceState(inputName: string) {
    delete dynamicOptions.value[inputName]
    delete dynamicHelp.value[inputName]
    delete dynamicPlaceholder.value[inputName]
    delete dataSourceErrors.value[inputName]
  }
  
  function cleanupInputSourceStates(activeInputNames: string[]) {
    const activeSet = new Set(activeInputNames)
  
    Object.keys(dynamicOptions.value).forEach((key) => {
      if (!activeSet.has(key)) {
        delete dynamicOptions.value[key]
      }
    })
  
    Object.keys(dynamicHelp.value).forEach((key) => {
      if (!activeSet.has(key)) {
        delete dynamicHelp.value[key]
      }
    })
  
    Object.keys(dynamicPlaceholder.value).forEach((key) => {
      if (!activeSet.has(key)) {
        delete dynamicPlaceholder.value[key]
      }
    })
  
    Object.keys(dataSourceErrors.value).forEach((key) => {
      if (!activeSet.has(key)) {
        delete dataSourceErrors.value[key]
      }
    })
  
    Object.keys(isFetchingSource.value).forEach((key) => {
      if (!activeSet.has(key)) {
        delete isFetchingSource.value[key]
      }
    })
  
    Array.from(dataSourceSignatures.keys()).forEach((key) => {
      if (!activeSet.has(key)) {
        dataSourceSignatures.delete(key)
        dataSourceRequestTokens.delete(key)
      }
    })
  }
  
  function applyDataSourceResult(inputName: string, result: unknown) {
    if (Array.isArray(result)) {
      dynamicOptions.value[inputName] = result
      return
    }
  
    if (!isRecord(result)) {
      return
    }
  
    const payload = result as Record<string, unknown>
  
    if (hasOwnKey(payload, 'options')) {
      if (Array.isArray(payload.options)) {
        dynamicOptions.value[inputName] = payload.options
      } else {
        delete dynamicOptions.value[inputName]
      }
    }
  
    if (hasOwnKey(payload, 'value')) {
      configFields.value[inputName] = payload.value
      const input = getInputByName(inputName)
      if (input?.type === 'kv-pairs') {
        syncKvRowsFromConfig(inputName)
      }
    }
  
    if (hasOwnKey(payload, 'help')) {
      if (payload.help === undefined) {
        delete dynamicHelp.value[inputName]
      } else {
        dynamicHelp.value[inputName] = payload.help == null ? '' : String(payload.help)
      }
    }
  
    if (hasOwnKey(payload, 'placeholder')) {
      if (payload.placeholder === undefined) {
        delete dynamicPlaceholder.value[inputName]
      } else {
        dynamicPlaceholder.value[inputName] = payload.placeholder == null ? '' : String(payload.placeholder)
      }
    }
  
    const patch = payload.patch
    if (isRecord(patch)) {
      Object.keys(patch).forEach((key) => {
        configFields.value[key] = patch[key]
        const input = getInputByName(key)
        if (input?.type === 'kv-pairs') {
          syncKvRowsFromConfig(key)
        }
      })
    }
  }
  
  // Initialize form from inputs default values
  watch(pluginContent, (newConfig) => {
    if (!newConfig || !newConfig.inputs) {
      configFields.value = {}
      dynamicOptions.value = {}
      dynamicHelp.value = {}
      dynamicPlaceholder.value = {}
      kvPairRows.value = {}
      dataSourceErrors.value = {}
      isFetchingSource.value = {}
      dataSourceSignatures.clear()
      dataSourceRequestTokens.clear()
      return
    }
  
    const currentInputNames = new Set(newConfig.inputs.map((input) => input.name))
    const newFields: Record<string, any> = { ...configFields.value }
  
    Object.keys(newFields).forEach((key) => {
      if (!currentInputNames.has(key)) {
        delete newFields[key]
      }
    })
  
    Object.keys(kvPairRows.value).forEach((key) => {
      if (!currentInputNames.has(key)) {
        delete kvPairRows.value[key]
      }
    })
  
    newConfig.inputs.forEach(input => {
      if (newFields[input.name] === undefined) {
        if (input.type === 'switch') {
          newFields[input.name] = input.default === true
        } else if (input.type === 'checkbox') {
          if (input.options || Array.isArray(input.default)) {
            newFields[input.name] = Array.isArray(input.default) ? input.default : []
          } else {
            newFields[input.name] = input.default === true
          }
        } else if (input.type === 'select' && input.multiple) {
          newFields[input.name] = Array.isArray(input.default) ? input.default : []
        } else if (input.type === 'number') {
          newFields[input.name] = typeof input.default === 'number' ? input.default : null
        } else if (input.type === 'kv-pairs') {
          newFields[input.name] = isRecord(input.default) ? { ...input.default } : {}
        } else {
          newFields[input.name] = input.default !== undefined ? input.default : ''
        }
      }
  
      if (input.options) {
        dynamicOptions.value[input.name] = input.options
      }
  
      if (input.type === 'kv-pairs') {
        if (!isRecord(newFields[input.name])) {
          newFields[input.name] = {}
        }
        kvPairRows.value[input.name] = toKvRows(newFields[input.name])
      }
    })
  
    configFields.value = newFields
  }, { immediate: true })
  
  const executeDataSourceScript = async (input: PluginInputSchema, showSuccessMessage: boolean) => {
    const source = getInputDataSource(input)
    if (!source) {
      return
    }
  
    if (!canResolveInputSource(input)) {
      resetInputSourceState(input.name)
      return
    }
  
    const requestToken = (dataSourceRequestTokens.get(input.name) || 0) + 1
    dataSourceRequestTokens.set(input.name, requestToken)
  
    isFetchingSource.value[input.name] = true
    dataSourceErrors.value[input.name] = ''
  
    try {
      const fn = evaluatePluginScript(source.script)
      const ctx = createPluginTesterCtx(testFile.value)
      const result = await fn({ ...configFields.value }, ctx)
  
      if (dataSourceRequestTokens.get(input.name) !== requestToken) {
        return
      }
  
      applyDataSourceResult(input.name, result)
      if (showSuccessMessage) {
        message.success(t('submit.fetchSuccess'))
      }
    } catch (err) {
      if (dataSourceRequestTokens.get(input.name) !== requestToken) {
        return
      }
  
      const msg = `Data source execution failed: ${(err as Error).message}`
      dataSourceErrors.value[input.name] = msg
      testError.value = msg
    } finally {
      if (dataSourceRequestTokens.get(input.name) === requestToken) {
        isFetchingSource.value[input.name] = false
      }
    }
  }
  
  const runDataSourceScript = async (inputName: string) => {
    testError.value = ''
    const input = getInputByName(inputName)
    if (!input) {
      return
    }
  
    await executeDataSourceScript(input, true)
  }
  
  watch(() => {
    const inputs = pluginContent.value?.inputs || []
    return inputs
      .filter((input) => getInputDataSource(input))
      .map((input) => ({
        name: input.name,
        signature: getInputDataSourceSignature(input),
        manual: getInputDataSource(input)?.manual === true,
        visible: isInputVisible(input),
        canResolve: canResolveInputSource(input)
      }))
  }, (items) => {
    cleanupInputSourceStates(items.map(item => item.name))
  
    items.forEach((item) => {
      const input = getInputByName(item.name)
      if (!input || !getInputDataSource(input)) {
        return
      }
  
      if (dataSourceSignatures.get(item.name) === item.signature) {
        return
      }
  
      dataSourceSignatures.set(item.name, item.signature)
      resetInputSourceState(item.name)
  
      if (!item.visible || !item.canResolve || item.manual) {
        return
      }
  
      void executeDataSourceScript(input, false)
    })
  }, { immediate: true, deep: true })
  
  const handleUploadChange = (data: { fileList: UploadFileInfo[] }) => {
    const firstFile = data.fileList[0]
    if (firstFile?.file) {
      testFile.value = firstFile.file
    } else {
      testFile.value = null
    }
  }
  
  const runTest = async () => {
    if (!pluginContent.value || !pluginContent.value.script) {
      message.error(t('submit.missingScript'))
      return
    }
  
    const missingRequired = getMissingRequiredInputs()
    if (missingRequired.length > 0) {
      const labels = missingRequired.map((input) => input.label || input.name).join(', ')
      const requiredError = `Required fields missing: ${labels}`
      testError.value = requiredError
      message.error(requiredError)
      return
    }
  
    isTesting.value = true
    testResult.value = ''
    testError.value = ''
  
    try {
      const fn = evaluatePluginScript(pluginContent.value.script)
      const ctx = createPluginTesterCtx(testFile.value)
  
      // Note: In real extension data is a base64 string or Object URL, so we pass an Object URL in web mock
      const mockFileObj = testFile.value ? {
        name: testFile.value.name,
        type: testFile.value.type,
        size: testFile.value.size,
        data: URL.createObjectURL(testFile.value)
      } : null
  
      const result = await fn(configFields.value, mockFileObj, ctx)
      testResult.value = typeof result === 'string' ? result : JSON.stringify(result, null, 2)
      message.success(t('submit.uploadTestSuccess'))
  
      if (mockFileObj && mockFileObj.data) {
        URL.revokeObjectURL(mockFileObj.data)
      }
    } catch (err) {
      testError.value = `Upload failed: ${(err as Error).message}`
    } finally {
      isTesting.value = false
    }
  }

  return {
    t,
    hasErrors,
    unsupportedKindMessage,
    pluginContent,
    isInputVisible,
    isInputDisabled,
    configFields,
    dynamicOptions,
    getInputPlaceholder,
    getInputHelp,
    getInputDataSource,
    dataSourceErrors,
    isFetchingSource,
    canResolveInputSource,
    runDataSourceScript,
    kvPairRows,
    updateKvRowKey,
    updateKvRowValue,
    removeKvRow,
    addKvRow,
    handleUploadChange,
    runTest,
    isTesting,
    testError,
    testResult,
  }
}
