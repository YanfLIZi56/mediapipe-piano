$MP_VERSION = "0.4.1675469240"
$TARGET_DIR = "public/mediapipe"

Write-Host "Downloading MediaPipe files to $TARGET_DIR..."

New-Item -ItemType Directory -Force -Path $TARGET_DIR | Out-Null

$files = @(
    @{Url="https://cdn.jsdelivr.net/npm/@mediapipe/hands@$MP_VERSION/hands.js"; Name="hands.js"},
    @{Url="https://cdn.jsdelivr.net/npm/@mediapipe/hands@$MP_VERSION/hands.binarypb"; Name="hands.binarypb"},
    @{Url="https://cdn.jsdelivr.net/npm/@mediapipe/hands@$MP_VERSION/hands_solution_packed_assets.data"; Name="hands_solution_packed_assets.data"},
    @{Url="https://cdn.jsdelivr.net/npm/@mediapipe/hands@$MP_VERSION/hands_solution_wasm_bin.wasm"; Name="hands_solution_wasm_bin.wasm"},
    @{Url="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@$MP_VERSION/camera_utils.js"; Name="camera_utils.js"},
    @{Url="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@$MP_VERSION/drawing_utils.js"; Name="drawing_utils.js"}
)

foreach ($file in $files) {
    $dest = "$TARGET_DIR/$($file.Name)"
    Write-Host "  Downloading $($file.Name)..."
    Invoke-WebRequest -Uri $file.Url -OutFile $dest
}

Write-Host "Done! MediaPipe files are ready in $TARGET_DIR/"