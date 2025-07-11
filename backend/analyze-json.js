import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Este script analisa a estrutura do arquivo JSON sem carregá-lo completamente na memória.
 * Ele lê os primeiros N elementos e exibe informações sobre sua estrutura.
 */

const SAMPLE_SIZE = 5 // Número de elementos a serem analisados

// Caminho para o arquivo JSON
const jsonFilePath = path.join(__dirname, 'default-cards-20250417213929.json')

try {
  console.log(`Analisando o arquivo: ${jsonFilePath}`)
  console.log(`Tamanho do arquivo: ${(fs.statSync(jsonFilePath).size / (1024 * 1024)).toFixed(2)} MB`)

  // Lendo os primeiros bytes para determinar se é um array ou objeto
  const buffer = Buffer.alloc(2)
  const fileDescriptor = fs.openSync(jsonFilePath, 'r')
  fs.readSync(fileDescriptor, buffer, 0, 2, 0)
  fs.closeSync(fileDescriptor)

  // Verificando se começa com '['
  const isArray = buffer.toString() === '[{' || buffer.toString().trim() === '['

  if (isArray) {
    console.log('O arquivo contém um array JSON.')

    // Lendo o arquivo em pedaços para extrair os primeiros N elementos
    const readStream = fs.createReadStream(jsonFilePath, {
      encoding: 'utf8',
      highWaterMark: 1024 * 1024 // 1MB por chunk
    })

    let data = ''
    let braceCount = 0
    let elements = []
    let readingElement = false
    let currentElement = ''

    readStream.on('data', chunk => {
      data += chunk

      // Processando o chunk para extrair elementos completos
      for (let i = 0; i < chunk.length; i++) {
        const char = chunk[i]

        if (char === '{' && !readingElement) {
          readingElement = true
          braceCount = 1
          currentElement = '{'
        } else if (readingElement) {
          currentElement += char

          if (char === '{') braceCount++
          if (char === '}') braceCount--

          if (braceCount === 0) {
            readingElement = false
            try {
              const element = JSON.parse(currentElement)
              elements.push(element)

              if (elements.length >= SAMPLE_SIZE) {
                readStream.destroy() // Paramos o stream quando temos elementos suficientes
                return
              }
            } catch (e) {
              console.error('Erro ao analisar elemento:', e)
            }
          }
        }
      }
    })

    readStream.on('end', () => {
      if (elements.length === 0) {
        console.log('Não foi possível extrair elementos válidos do array.')
        return
      }

      console.log(`Analisados ${elements.length} elementos do array.`)

      // Analisando a estrutura dos elementos
      const firstElement = elements[0]
      console.log('\nEstrutura do primeiro elemento:')
      console.log(JSON.stringify(firstElement, null, 2))

      // Coletando todas as chaves possíveis dos elementos
      const allKeys = new Set()
      elements.forEach(element => {
        Object.keys(element).forEach(key => allKeys.add(key))
      })

      console.log('\nChaves encontradas nos elementos:')
      console.log(Array.from(allKeys).join(', '))

      // Verificando tipos de dados para cada chave
      console.log('\nTipos de dados para cada chave:')
      const keyTypes = {}

      allKeys.forEach(key => {
        keyTypes[key] = new Set()
        elements.forEach(element => {
          if (element[key] !== undefined) {
            let type = typeof element[key]
            if (Array.isArray(element[key])) {
              type = 'array'
              // Verificando o tipo do primeiro elemento do array, se existir
              if (element[key].length > 0) {
                keyTypes[key].add(`array<${typeof element[key][0]}>`)
              } else {
                keyTypes[key].add('array<empty>')
              }
            } else {
              keyTypes[key].add(type)
            }
          } else {
            keyTypes[key].add('undefined')
          }
        })
      })

      Object.entries(keyTypes).forEach(([key, types]) => {
        console.log(`${key}: ${Array.from(types).join(', ')}`)
      })
    })

    readStream.on('error', err => {
      console.error('Erro ao ler o arquivo:', err)
    })
  } else {
    console.log('O arquivo não começa com um array JSON. É possivelmente um objeto JSON ou tem outro formato.')

    // Lendo uma pequena amostra para verificar a estrutura
    const sample = fs.readFileSync(jsonFilePath, { encoding: 'utf8', flag: 'r' }).slice(0, 1000)
    console.log('Amostra dos primeiros 1000 bytes:')
    console.log(sample)
  }
} catch (error) {
  console.error('Erro ao analisar o arquivo JSON:', error)
} 