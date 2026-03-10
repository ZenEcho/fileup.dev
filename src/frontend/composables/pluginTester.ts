interface PluginFetchResponse {
  ok: boolean
  status: number
  statusText: string
  headers: Headers
  body: unknown
  json: () => Promise<unknown>
  text: () => Promise<string>
}

export function evaluatePluginScript(scriptStr: string) {
  try {
    const fn = new Function(scriptStr)()
    if (typeof fn !== 'function') {
      throw new Error('Script did not return a function')
    }
    return fn as (...args: any[]) => Promise<unknown> | unknown
  } catch (error) {
    throw new Error(`Script evaluation failed: ${(error as Error).message}`)
  }
}

async function fetchWithProxy(urlStr: string | URL | Request, options?: RequestInit): Promise<PluginFetchResponse> {
  let res: Response

  try {
    res = await window.fetch(urlStr, options)
  } catch (error) {
    console.warn('Native fetch failed, likely due to CORS. Attempting via proxy...', error)
    const urlObj = typeof urlStr === 'string' ? urlStr : (urlStr as Request).url || urlStr.toString()
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(urlObj)}`
    res = await window.fetch(proxyUrl, options)
  }

  let bodyData: unknown = null
  try {
    const text = await res.clone().text()
    try {
      bodyData = JSON.parse(text)
    } catch {
      bodyData = text
    }
  } catch (error) {
    console.warn('Failed to parse response body', error)
  }

  return {
    ok: res.ok,
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
    body: bodyData,
    json: async () => (typeof bodyData === 'string' ? JSON.parse(bodyData) : bodyData),
    text: async () => (typeof bodyData === 'string' ? bodyData : JSON.stringify(bodyData)),
  }
}

export function createPluginTesterCtx(testFile: File | null) {
  return {
    fetch: fetchWithProxy,
    fetchJson: async (url: string, options?: RequestInit) => {
      const res = await fetchWithProxy(url, options)
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      return await res.json()
    },
    fileToBlob: () => testFile,
  }
}
