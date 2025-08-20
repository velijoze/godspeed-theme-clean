# Bulk translate Product Types from German to English and set Product Categories to match
$storeUrl = "t0uds3-a2.myshopify.com"
$accessToken = "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"

# German to English translation mapping
$translations = @{
    "Teile" = "Parts"
    "Räder" = "Wheels"
    "Getriebe und Übersetzung" = "Drivetrain"
    "Bremsen" = "Brakes"
    "Lenker" = "Handlebars"
    "Griffe" = "Grips"
    "Sattelstütze" = "Seatposts"
    "Sattel" = "Saddles"
    "Pedale" = "Pedals"
    "Zubehör" = "Accessories"
    "Lichte" = "Lights"
    "Schutzbleche" = "Fenders"
    "Trinkflaschen" = "Bottles"
    "Velotaschen" = "Bags"
    "Werkstatt / Werkzeuge" = "Tools"
    "Schlösser" = "Locks"
    "Helme" = "Helmets"
    "Kindersitz" = "Child Seats"
    "Gepäckträger" = "Racks"
    "Regenschutz" = "Rain Protection"
    "Klingeln" = "Bells"
    "Anhänger" = "Trailers"
    "Ständer" = "Stands"
    "Bike computer" = "Bike Computers"
    "E-Bikes" = "E-Bikes"
    "Velos" = "Bikes"
    "Gravel" = "Gravel"
    "E-MTB Fully" = "E-MTB Full Suspension"
    "120-130" = "120-130mm Travel"
    "Bosch" = "Bosch"
    "General" = "General"
}

Write-Host "Starting bulk translation of Product Types and Categories..."
Write-Host "Store: $storeUrl"

# Read the CSV export
$csv = Import-Csv "products_export_1.csv"
$totalProducts = $csv.Count
$updatedCount = 0
$errorCount = 0

Write-Host "Total products to process: $totalProducts"
Write-Host "`nProcessing products..."

foreach ($product in $csv) {
    $productId = $product.'Handle'
    $originalType = $product.'Type'
    
    if ([string]::IsNullOrWhiteSpace($originalType)) {
        Write-Host "SKIP: $productId - No Type defined"
        continue
    }
    
    # Translate the type to English
    $translatedType = $originalType
    foreach ($translation in $translations.GetEnumerator()) {
        $translatedType = $translatedType -replace $translation.Key, $translation.Value
    }
    
    # Skip if no translation needed
    if ($translatedType -eq $originalType) {
        Write-Host "SKIP: $productId - Already in English: $originalType"
        continue
    }
    
    try {
        # First, update the Product Type
        $updateTypeData = @{
            product = @{
                id = $productId
                product_type = $translatedType
            }
        }
        
        $headers = @{
            "X-Shopify-Access-Token" = $accessToken
            "Content-Type" = "application/json"
        }
        
        $body = $updateTypeData | ConvertTo-Json -Depth 10
        
        $response = Invoke-WebRequest -Uri "https://$storeUrl/admin/api/2024-01/products/$productId.json" `
            -Method PUT -Headers $headers -Body $body
        
        if ($response.StatusCode -eq 200) {
            # Now try to update the Product Category using metafields
            try {
                $metafieldData = @{
                    metafield = @{
                        namespace = "custom"
                        key = "product_category"
                        value = $translatedType
                        type = "single_line_text_field"
                    }
                }
                
                $metafieldBody = $metafieldData | ConvertTo-Json -Depth 10
                
                $metafieldResponse = Invoke-WebRequest -Uri "https://$storeUrl/admin/api/2024-01/products/$productId/metafields.json" `
                    -Method POST -Headers $headers -Body $metafieldBody
                
                if ($metafieldResponse.StatusCode -eq 201) {
                    Write-Host "✓ UPDATED BOTH: $productId - $originalType -> $translatedType (Type + Category)"
                } else {
                    Write-Host "✓ UPDATED TYPE: $productId - $originalType -> $translatedType (Category failed)"
                }
            } catch {
                Write-Host "✓ UPDATED TYPE: $productId - $originalType -> $translatedType (Category failed: $($_.Exception.Message))"
            }
            
            $updatedCount++
        } else {
            $errorCount++
            Write-Host "✗ ERROR: $productId - Status: $($response.StatusCode)"
        }
        
        # Small delay to be respectful to the API
        Start-Sleep -Milliseconds 100
        
    } catch {
        $errorCount++
        Write-Host "✗ EXCEPTION: $productId - $($_.Exception.Message)"
    }
    
    # Progress indicator
    if (($csv.IndexOf($product) + 1) % 100 -eq 0) {
        $progress = [math]::Round((($csv.IndexOf($product) + 1) / $totalProducts) * 100, 2)
        Write-Host "Progress: $progress% ($($csv.IndexOf($product) + 1)/$totalProducts)"
    }
}

Write-Host "`n=== BULK TRANSLATION COMPLETED ==="
Write-Host "Total products processed: $totalProducts"
Write-Host "Successfully updated: $updatedCount"
Write-Host "Errors: $errorCount"
Write-Host "`nNote: Product Types have been translated to English"
Write-Host "Product Categories have been updated via metafields where possible"
Write-Host "`nNext step: Create collections that match your new English Product Types"
Write-Host "Collections can now use either Product Type or the custom metafield for filtering"
