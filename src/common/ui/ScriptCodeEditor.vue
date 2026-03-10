<script setup lang="ts">
import { computed, ref } from 'vue'
import Prism from 'prismjs'
import 'prismjs/components/prism-clike'
import 'prismjs/components/prism-javascript'
import 'prismjs/themes/prism.css'

const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
  rows?: number
}>(), {
  placeholder: '',
  rows: 8
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const preRef = ref<HTMLElement | null>(null)

const editorStyle = computed(() => {
  const rows = Number.isFinite(props.rows) ? Math.max(2, props.rows) : 8
  return {
    '--editor-height': `${rows * 1.5 + 1.75}rem`
  }
})

const highlightedCode = computed(() => {
  const code = props.modelValue || ''
  const grammar = Prism.languages.javascript || Prism.languages.clike
  if (!grammar) {
    return code
  }

  return Prism.highlight(code, grammar, 'javascript')
})

const syncScroll = () => {
  if (!textareaRef.value || !preRef.value) {
    return
  }

  preRef.value.scrollTop = textareaRef.value.scrollTop
  preRef.value.scrollLeft = textareaRef.value.scrollLeft
}

const onInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
  syncScroll()
}

const onTab = (event: KeyboardEvent) => {
  if (event.key !== 'Tab' || !textareaRef.value) {
    return
  }

  event.preventDefault()

  const target = textareaRef.value
  const start = target.selectionStart
  const end = target.selectionEnd
  const value = target.value
  const insertion = '  '

  const nextValue = `${value.slice(0, start)}${insertion}${value.slice(end)}`
  emit('update:modelValue', nextValue)

  requestAnimationFrame(() => {
    if (!textareaRef.value) {
      return
    }

    const cursor = start + insertion.length
    textareaRef.value.selectionStart = cursor
    textareaRef.value.selectionEnd = cursor
    syncScroll()
  })
}
</script>

<template>
  <div class="script-editor" :style="editorStyle">
    <pre ref="preRef" class="script-editor__pre language-javascript"
      aria-hidden="true"><code v-html="highlightedCode" /></pre>
    <textarea ref="textareaRef" class="script-editor__textarea" :value="modelValue" :placeholder="placeholder"
      spellcheck="false" @input="onInput" @scroll="syncScroll" @keydown="onTab" />
  </div>
</template>

<style scoped>
.script-editor {
  --editor-bg: #ffffff;
  --editor-border: #e5e7eb;
  --editor-focus: #2563eb;
  position: relative;
  height: var(--editor-height);
  border: 1px solid var(--editor-border);
  border-radius: 10px;
  background: var(--editor-bg);
  overflow: hidden;
}

.script-editor:focus-within {
  border-color: var(--editor-focus);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
}

.script-editor__pre,
.script-editor__textarea {
  margin: 0;
  padding: 12px 14px;
  width: 100%;
  height: 100%;
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', Consolas, Menlo, Monaco, monospace;
  font-size: 13px;
  line-height: 1.5;
  tab-size: 2;
  white-space: pre;
  overflow: auto;
}

.script-editor__pre {
  pointer-events: none;
  color: #111827;
  background: transparent;
}

.script-editor__pre :deep(code) {
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
}

.script-editor__textarea {
  position: absolute;
  inset: 0;
  border: 0;
  outline: none;
  color: transparent;
  caret-color: #111827;
  background: transparent;
}

.script-editor__textarea::placeholder {
  color: #9ca3af;
}
</style>
