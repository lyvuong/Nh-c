Add-Type -AssemblyName System.Drawing

$sourcePath = "$PSScriptRoot\..\public\logo.jpg"
$publicDir = "$PSScriptRoot\..\public"

$img = [System.Drawing.Image]::FromFile($sourcePath)

$targets = @(
    @{ Name = "icon-512.png"; Size = 512 },
    @{ Name = "icon-192.png"; Size = 192 },
    @{ Name = "apple-touch-icon.png"; Size = 180 },
    @{ Name = "favicon.png"; Size = 64 }
)

foreach ($target in $targets) {
    $size = $target.Size
    $dest = Join-Path $publicDir $target.Name
    
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $g.DrawImage($img, $rect)
    
    $bmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    
    Write-Host "[resize] Generated $dest ($size x $size)"
}

$img.Dispose()
Write-Host "All icons resized directly from logo.jpg successfully!"
