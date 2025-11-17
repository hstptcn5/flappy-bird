import { NextResponse } from 'next/server'

const ROOT_URL = process.env.NEXT_PUBLIC_URL || 'https://flappy-b.vercel.app'

interface ValidationResult {
  passed: boolean
  message: string
  details?: any
}

async function checkUrlExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
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
          const exists = await checkUrlExists(url)
          return {
            name,
            url,
            exists,
            passed: exists,
            message: exists ? 'Image accessible' : 'Image not found (404 or error)',
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
        results.images.some(img => !img.passed) && 'Upload missing images or fix image URLs',
        !results.signature.passed && 'Verify signature is correctly generated using Base Build Preview Tool',
        'Test your manifest at: https://base.dev/preview',
        'Manifest URL: ' + manifestUrl,
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

