import { NextResponse } from 'next/server'

const ROOT_URL = process.env.NEXT_PUBLIC_URL || 'https://flappy-b.vercel.app'

interface ValidationResult {
  passed: boolean
  message: string
  details?: any
}

async function checkUrlExists(url: string): Promise<{ exists: boolean; status?: number; statusText?: string }> {
  try {
    // Use GET with timeout and proper headers for Vercel serverless
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
    
    const response = await fetch(url, { 
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'User-Agent': 'Mozilla/5.0 (compatible; Farcaster-Manifest-Validator/1.0)',
      },
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    
    return {
      exists: response.ok,
      status: response.status,
      statusText: response.statusText,
    }
  } catch (error) {
    // Network errors can happen when server-side fetches to itself on Vercel
    // This might be a false negative - images may still exist
    return {
      exists: false,
      status: 0,
      statusText: error instanceof Error 
        ? (error.name === 'AbortError' ? 'Timeout' : error.message) 
        : 'Network error',
    }
  }
}

export async function GET() {
  const manifestUrl = `${ROOT_URL}/.well-known/farcaster.json`
  
  const results: {
    manifest: ValidationResult
    json: ValidationResult
    images: ValidationResult[]
    requiredFields: ValidationResult
    signature: ValidationResult
  } = {
    manifest: { passed: false, message: '' },
    json: { passed: false, message: '' },
    images: [],
    requiredFields: { passed: false, message: '' },
    signature: { passed: false, message: '' },
  }

  try {
    // 1. Fetch manifest
    const manifestResponse = await fetch(manifestUrl)
    
    if (!manifestResponse.ok) {
      results.manifest = {
        passed: false,
        message: `Failed to fetch manifest: ${manifestResponse.status} ${manifestResponse.statusText}`,
      }
      return NextResponse.json({ error: 'Manifest not accessible', results }, { status: 400 })
    }

    results.manifest = {
      passed: true,
      message: `Manifest accessible at ${manifestUrl}`,
    }

    // 2. Validate JSON
    let manifest
    try {
      manifest = await manifestResponse.json()
      results.json = {
        passed: true,
        message: 'Valid JSON format',
      }
    } catch (error) {
      results.json = {
        passed: false,
        message: `Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
      return NextResponse.json({ error: 'Invalid JSON', results }, { status: 400 })
    }

    // 3. Check required fields
    const requiredFields = {
      accountAssociation: !!manifest.accountAssociation,
      'accountAssociation.header': !!manifest.accountAssociation?.header,
      'accountAssociation.payload': !!manifest.accountAssociation?.payload,
      'accountAssociation.signature': !!manifest.accountAssociation?.signature,
      baseBuilder: !!manifest.baseBuilder,
      'baseBuilder.ownerAddress': !!manifest.baseBuilder?.ownerAddress,
      miniapp: !!manifest.miniapp,
      'miniapp.version': !!manifest.miniapp?.version,
      'miniapp.name': !!manifest.miniapp?.name,
      'miniapp.homeUrl': !!manifest.miniapp?.homeUrl,
      'miniapp.iconUrl': !!manifest.miniapp?.iconUrl,
      'miniapp.primaryCategory': !!manifest.miniapp?.primaryCategory,
    }

    const missingFields = Object.entries(requiredFields)
      .filter(([_, exists]) => !exists)
      .map(([field]) => field)

    results.requiredFields = {
      passed: missingFields.length === 0,
      message: missingFields.length === 0 
        ? 'All required fields present' 
        : `Missing fields: ${missingFields.join(', ')}`,
      details: requiredFields,
    }

    // 4. Check signature format
    const signature = manifest.accountAssociation?.signature
    if (signature) {
      const isValidFormat = /^[A-Za-z0-9+/=]+$/.test(signature)
      results.signature = {
        passed: isValidFormat,
        message: isValidFormat 
          ? 'Signature format looks valid' 
          : 'Signature may have invalid characters (should be base64)',
        details: {
          length: signature.length,
          startsWithBase64: /^[A-Za-z0-9+/]/.test(signature),
        },
      }
    } else {
      results.signature = {
        passed: false,
        message: 'Signature is missing',
      }
    }

    // 5. Check image URLs
    if (manifest.miniapp) {
      const imageUrls = [
        { name: 'iconUrl', url: manifest.miniapp.iconUrl },
        { name: 'splashImageUrl', url: manifest.miniapp.splashImageUrl },
        { name: 'heroImageUrl', url: manifest.miniapp.heroImageUrl },
        { name: 'ogImageUrl', url: manifest.miniapp.ogImageUrl },
      ].filter(item => item.url)

      if (manifest.miniapp.screenshotUrls) {
        manifest.miniapp.screenshotUrls.forEach((url: string, index: number) => {
          imageUrls.push({ name: `screenshot-${index + 1}`, url })
        })
      }

      const imageChecks = await Promise.all(
        imageUrls.map(async ({ name, url }) => {
          const checkResult = await checkUrlExists(url)
          return {
            name,
            url,
            exists: checkResult.exists,
            passed: checkResult.exists,
            message: checkResult.exists 
              ? 'Image accessible' 
              : `Image not found (${checkResult.status || 'error'}: ${checkResult.statusText || 'unknown error'})`,
            details: checkResult.status ? {
              status: checkResult.status,
              statusText: checkResult.statusText,
            } : undefined,
          }
        })
      )

      results.images = imageChecks
    }

    // Summary
    const allPassed = 
      results.manifest.passed &&
      results.json.passed &&
      results.requiredFields.passed &&
      results.images.every(img => img.passed)

    return NextResponse.json({
      success: allPassed,
      summary: {
        manifest: results.manifest.passed ? '✅' : '❌',
        json: results.json.passed ? '✅' : '❌',
        requiredFields: results.requiredFields.passed ? '✅' : '❌',
        images: results.images.filter(img => img.passed).length + '/' + results.images.length,
        signature: results.signature.passed ? '✅' : '⚠️',
      },
      results,
      manifestUrl,
      recommendations: [
        !results.manifest.passed && 'Ensure your app is deployed and accessible via HTTPS',
        !results.json.passed && 'Fix JSON syntax errors in your manifest route',
        !results.requiredFields.passed && 'Add missing required fields to your manifest',
        results.images.some(img => !img.passed) && '⚠️ Note: Server-side image checks may give false negatives on Vercel. Please verify images manually by opening the URLs in a browser.',
        !results.signature.passed && 'Verify signature is correctly generated using Base Build Preview Tool',
        'Test your manifest at: https://base.dev/preview',
        'Manifest URL: ' + manifestUrl,
        '💡 Tip: If images exist when you open them in browser, they are likely fine. The debug endpoint may have issues with server-side self-fetching.',
      ].filter(Boolean),
    })

  } catch (error) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        results,
      },
      { status: 500 }
    )
  }
}

