'use client'

import { useRef, useCallback } from 'react'
import Editor, { OnMount, BeforeMount } from '@monaco-editor/react'
import { useBuilderStore } from '@/store/builder-store'
import { validatePineScript } from '@/engines/validation-engine'
import type { editor } from 'monaco-editor'

// Pine Script language definition for Monaco
const PINE_LANGUAGE_ID = 'pinescript'

const registerPineLanguage = (monaco: any) => {
  // Register language
  monaco.languages.register({ id: PINE_LANGUAGE_ID })

  // Tokenizer
  monaco.languages.setMonarchTokensProvider(PINE_LANGUAGE_ID, {
    keywords: [
      'if', 'else', 'for', 'while', 'switch', 'var', 'varip',
      'import', 'export', 'type', 'method', 'true', 'false', 'na',
    ],
    builtins: [
      'strategy', 'indicator', 'plot', 'plotshape', 'plotchar', 'plotarrow',
      'plotbar', 'plotcandle', 'hline', 'fill', 'bgcolor', 'barcolor',
      'alertcondition', 'alert',
      'strategy.entry', 'strategy.close', 'strategy.exit', 'strategy.order',
      'strategy.position_size', 'strategy.position_avg_price',
      'ta.rsi', 'ta.sma', 'ta.ema', 'ta.macd', 'ta.bb', 'ta.stoch',
      'ta.crossover', 'ta.crossunder', 'ta.change', 'ta.valuewhen',
      'math.abs', 'math.max', 'math.min', 'math.round', 'math.floor', 'math.ceil',
      'input.int', 'input.float', 'input.bool', 'input.string', 'input.color',
      'str.tostring', 'str.tonumber', 'str.length',
      'array.new_float', 'array.new_int', 'array.new_string',
      'label.new', 'label.delete', 'line.new', 'line.delete',
      'table.new', 'table.cell', 'ticker.new', 'request.security',
    ],
    operators: [
      '>=', '<=', '!=', '==', '>', '<', '=', 'and', 'or', 'not',
      '+', '-', '*', '/', '%', '?', ':',
    ],
    symbols: /[=><!~?:&|+\-*\/\^%]+/,
    tokenizer: {
      root: [
        [/\/\/.*$/, 'comment'],
        [/#.*$/, 'comment'],
        [/\d+(\.\d+)?/, 'number'],
        [/"([^"\\]|\\.)*"/, 'string'],
        [/'([^'\\]|\\.)*'/, 'string'],
        [/@symbols/, {
          cases: {
            '@operators': 'operator',
            '@default': '',
          },
        }],
        [/[a-zA-Z_]\w*/, {
          cases: {
            '@keywords': 'keyword',
            '@builtins': 'type.identifier',
            '@default': 'identifier',
          },
        }],
      ],
    },
  } as any)

  // Theme
  monaco.editor.defineTheme('pine-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955' },
      { token: 'keyword', foreground: '569CD6' },
      { token: 'type.identifier', foreground: 'DCDCAA' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'operator', foreground: 'D4D4D4' },
    ],
    colors: {
      'editor.background': '#1a1a2e',
      'editor.foreground': '#d4d4d4',
      'editor.lineHighlightBackground': '#16213e',
      'editor.selectionBackground': '#0f3460',
    },
  })
}

export function CodeEditor() {
  const { pineScript, setPineScript, isGenerating } = useBuilderStore()
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  const handleBeforeMount: BeforeMount = (monaco) => {
    registerPineLanguage(monaco)
  }

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor

    // Add validation on change
    editor.onDidChangeModelContent(() => {
      const code = editor.getValue()
      const validation = validatePineScript(code)

      const markers = [
        ...validation.errors.map((err) => ({
          severity: monaco.MarkerSeverity.Error,
          message: err.message,
          startLineNumber: err.line || 1,
          startColumn: 1,
          endLineNumber: err.line || 1,
          endColumn: 100,
        })),
        ...validation.warnings.map((warn) => ({
          severity: monaco.MarkerSeverity.Warning,
          message: warn.message,
          startLineNumber: warn.line || 1,
          startColumn: 1,
          endLineNumber: warn.line || 1,
          endColumn: 100,
        })),
      ]

      monaco.editor.setModelMarkers(editor.getModel()!, 'pine', markers)
    })
  }

  const handleCopy = useCallback(() => {
    if (pineScript) {
      navigator.clipboard.writeText(pineScript)
    }
  }, [pineScript])

  const handleFormat = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run()
    }
  }, [])

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-300">Pine Script v6</span>
          {isGenerating && (
            <span className="text-xs text-blue-400 animate-pulse">Generating...</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleFormat}
            className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Format code"
          >
            Format
          </button>
          <button
            onClick={handleCopy}
            className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Copy code"
          >
            Copy
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage={PINE_LANGUAGE_ID}
          theme="pine-dark"
          value={pineScript}
          onChange={(value) => setPineScript(value || '')}
          beforeMount={handleBeforeMount}
          onMount={handleMount}
          options={{
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 4,
            renderWhitespace: 'selection',
            bracketPairColorization: { enabled: true },
            suggest: {
              showKeywords: true,
              showSnippets: true,
            },
          }}
          loading={
            <div className="flex items-center justify-center h-full bg-[#1a1a2e]">
              <div className="animate-spin h-6 w-6 border-2 border-blue-400 border-t-transparent rounded-full" />
            </div>
          }
        />
      </div>
    </div>
  )
}
