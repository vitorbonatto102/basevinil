param(
  [Parameter(Mandatory = $false)]
  [int]$AuctionNumber = 63353,

  [Parameter(Mandatory = $false)]
  [double]$CommissionPercent = 5
)

$ErrorActionPreference = "Stop"
$baseUrl = "https://www.bruceangeirasleiloeiro.com.br"
$catalogPath = Join-Path (Split-Path $PSScriptRoot -Parent) "app/data/catalog.json"

function Get-PublicPage([string]$Url) {
  $content = & curl.exe --ssl-no-revoke -L --fail --silent --show-error $Url
  if ($LASTEXITCODE -ne 0) {
    throw "Falha ao consultar $Url"
  }
  return ($content | Out-String)
}

function Normalize-Text([string]$Value) {
  if ([string]::IsNullOrWhiteSpace($Value)) { return "" }

  $decomposed = $Value.Normalize([Text.NormalizationForm]::FormD)
  $builder = [Text.StringBuilder]::new()
  foreach ($character in $decomposed.ToCharArray()) {
    $category = [Globalization.CharUnicodeInfo]::GetUnicodeCategory([char]$character)
    if ($category -ne [Globalization.UnicodeCategory]::NonSpacingMark) {
      [void]$builder.Append($character)
    }
  }

  return (($builder.ToString().ToLowerInvariant() -replace "[^a-z0-9]+", " ").Trim())
}

function Get-ReferencePrice($Record) {
  $values = [Collections.Generic.List[double]]::new()
  if ($null -ne $Record.auctionPrice -and [double]$Record.auctionPrice -gt 0) {
    $values.Add([double]$Record.auctionPrice)
  }
  if ($null -ne $Record.marketMin -and [double]$Record.marketMin -gt 0) {
    $values.Add([double]$Record.marketMin)
  }
  if ($null -ne $Record.adornosPrices) {
    foreach ($price in $Record.adornosPrices) {
      if ([double]$price -gt 0) { $values.Add([double]$price) }
    }
  } elseif ($null -ne $Record.adornosPrice -and [double]$Record.adornosPrice -gt 0) {
    $values.Add([double]$Record.adornosPrice)
  }

  if ($values.Count -eq 0) { return $null }
  return ($values | Measure-Object -Minimum).Minimum
}

$firstPageUrl = "$baseUrl/catalogo.asp?Num=$AuctionNumber&pag=1"
$firstPage = Get-PublicPage $firstPageUrl

$auctionTitleMatch = [regex]::Match(
  $firstPage,
  '<meta property="og:title" content="Bruce Angeiras Leilões - (?<title>[^"]+)"',
  [Text.RegularExpressions.RegexOptions]::IgnoreCase
)
$auctionTitle = [Net.WebUtility]::HtmlDecode($auctionTitleMatch.Groups["title"].Value)

$itemCountMatch = [regex]::Match(
  $firstPage,
  '<span class="find-numb">(?<count>\d+)</span>\s*Itens encontrados',
  [Text.RegularExpressions.RegexOptions]::IgnoreCase
)
$itemCount = if ($itemCountMatch.Success) { [int]$itemCountMatch.Groups["count"].Value } else { 0 }

$lastPageMatches = [regex]::Matches($firstPage, "catalogo\.asp\?Num=$AuctionNumber(?:&amp;|&)pag=(?<page>\d+)")
$lastPage = 1
foreach ($pageMatch in $lastPageMatches) {
  $page = [int]$pageMatch.Groups["page"].Value
  if ($page -gt $lastPage) { $lastPage = $page }
}

$days = [Collections.Generic.List[object]]::new()
$dayMatches = [regex]::Matches(
  $firstPage,
  '(?<day>\d+)º\s*DIA\s*-\s*(?<date>\d{1,2}/\d{1,2}/\d{4})\s*-\s*(?<time>\d{1,2}:\d{2})',
  [Text.RegularExpressions.RegexOptions]::IgnoreCase
)
foreach ($dayMatch in $dayMatches) {
  $dayNumber = [int]$dayMatch.Groups["day"].Value
  if (-not ($days | Where-Object { $_.day -eq $dayNumber })) {
    $days.Add([pscustomobject]@{
      day = $dayNumber
      date = $dayMatch.Groups["date"].Value
      time = $dayMatch.Groups["time"].Value
    })
  }
}

$catalog = (Get-Content -LiteralPath $catalogPath -Raw | ConvertFrom-Json).records
$stopWords = @(
  "the", "and", "com", "dos", "das", "uma", "para", "from", "of",
  "ano", "lp", "duplo", "triplo", "vinil", "album", "disco", "especial", "special"
)
$references = [Collections.Generic.List[object]]::new()

foreach ($record in $catalog) {
  $referencePrice = Get-ReferencePrice $record
  if ($null -eq $referencePrice) { continue }

  $artistNormalized = Normalize-Text ([string]$record.artist)
  $titleBase = ([string]$record.title -replace "\([^)]*\)", "")
  $artistTokens = @($artistNormalized.Split(" ") | Where-Object { $_.Length -ge 2 })
  $tokens = @(
    (Normalize-Text $titleBase).Split(" ") |
      Where-Object {
        $_.Length -ge 3 -and
        $_ -match "[a-z]" -and
        $_ -notin $stopWords -and
        $_ -notin $artistTokens
      } |
      Select-Object -Unique
  )

  if ($artistNormalized.Length -lt 2 -or $tokens.Count -eq 0) { continue }
  $references.Add([pscustomobject]@{
    id = $record.id
    artist = $record.artist
    album = $record.title
    artistNormalized = $artistNormalized
    titleTokens = $tokens
    reference = [double]$referencePrice
  })
}

$lotPattern = '(?s)<div class="LoteProd">.*?<a href="peca\.asp\?ID=(?<id>\d+)[^"]*"><span>Lote:(?<lot>[^<]+)</span></a>.*?<div class="prod-title">\s*<h3><a[^>]*>(?<title>.*?)</a></h3>.*?<div class="product-price-bid search-login product-price-bid-new">(?<priceblock>.*?)</div>'
$lots = [Collections.Generic.List[object]]::new()

for ($pageNumber = 1; $pageNumber -le $lastPage; $pageNumber++) {
  $html = if ($pageNumber -eq 1) {
    $firstPage
  } else {
    Get-PublicPage "$baseUrl/catalogo.asp?Num=$AuctionNumber&pag=$pageNumber"
  }

  foreach ($lotMatch in [regex]::Matches($html, $lotPattern)) {
    $priceBlock = $lotMatch.Groups["priceblock"].Value
    $priceMatch = [regex]::Match($priceBlock, 'price-bid">R\$\s*(?<price>[\d.,]+)')
    if (-not $priceMatch.Success) { continue }

    $rawDescription = [Net.WebUtility]::HtmlDecode(
      (($lotMatch.Groups["title"].Value -replace "<[^>]+>", "").Trim())
    )
    $priceText = $priceMatch.Groups["price"].Value.Replace(".", "").Replace(",", ".")
    $price = [double]::Parse($priceText, [Globalization.CultureInfo]::InvariantCulture)
    $bidMatch = [regex]::Match($priceBlock, '<b>(?<bids>\d+)\s+Lance', [Text.RegularExpressions.RegexOptions]::IgnoreCase)

    $lots.Add([pscustomobject]@{
      lot = [int]$lotMatch.Groups["lot"].Value
      id = $lotMatch.Groups["id"].Value
      description = $rawDescription
      normalized = Normalize-Text $rawDescription
      price = $price
      bids = if ($bidMatch.Success) { [int]$bidMatch.Groups["bids"].Value } else { 0 }
      priceType = if ($priceBlock -match "Valor atual") { "atual" } else { "inicial" }
    })
  }
}

$rawMatches = [Collections.Generic.List[object]]::new()
foreach ($lot in $lots) {
  $boundedDescription = " $($lot.normalized) "
  foreach ($reference in $references) {
    if (-not $boundedDescription.Contains(" $($reference.artistNormalized) ")) { continue }

    $tokenHits = 0
    foreach ($token in $reference.titleTokens) {
      if ($boundedDescription.Contains(" $token ")) { $tokenHits++ }
    }
    $matchScore = $tokenHits / [double]$reference.titleTokens.Count
    if ($matchScore -lt 0.72) { continue }

    $costWithCommission = [math]::Round($lot.price * (1 + $CommissionPercent / 100), 2)
    $rawMatches.Add([pscustomobject]@{
      lot = $lot.lot
      id = $lot.id
      description = $lot.description
      currentPrice = $lot.price
      bids = $lot.bids
      priceType = $lot.priceType
      catalogArtist = $reference.artist
      catalogAlbum = $reference.album
      catalogReference = $reference.reference
      costWithCommission = $costWithCommission
      ratio = [math]::Round($costWithCommission / $reference.reference, 3)
      matchScore = [math]::Round($matchScore, 2)
      url = "$baseUrl/peca.asp?ID=$($lot.id)"
    })
  }
}

$bestMatches = @(
  $rawMatches |
    Group-Object lot |
    ForEach-Object {
      $_.Group |
        Sort-Object @{ Expression = "matchScore"; Descending = $true }, @{ Expression = "ratio"; Descending = $false } |
        Select-Object -First 1
    } |
    Sort-Object ratio, lot
)

[pscustomobject]@{
  auctionNumber = $AuctionNumber
  title = $auctionTitle
  sourceUrl = "$baseUrl/catalogo.asp?Num=$AuctionNumber"
  itemCountReported = $itemCount
  itemsExtracted = $lots.Count
  pages = $lastPage
  commissionPercent = $CommissionPercent
  shipping = "Não informado antes da arrematação"
  days = @($days | Sort-Object day)
  catalogReferencesCompared = $references.Count
  candidateMatches = $bestMatches.Count
  candidates = $bestMatches
} | ConvertTo-Json -Depth 8
