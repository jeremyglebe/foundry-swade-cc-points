$MODULE_ID = (Get-Content src/module.json | ConvertFrom-Json).id
New-Item -ItemType SymbolicLink -Target "$(Get-Location)\dist" -Path "$env:LOCALAPPDATA\FoundryVTT\Data\modules\$MODULE_ID"