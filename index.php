<?php
/**
 * Fetch results from Google
 */
function fetch(string $keyword, string $api_key): array {
    $keyword = trim($keyword);

    $app_env = getenv('APP_ENV');

    // Guard
    if (empty($app_env)) { echo json_encode(['error' => 'Failed to obtain app environment! Ensure the correct environment is set in server startup script!']); exit; }

    $isLAN = $app_env === 'lan';

    // Guard
    if (empty($keyword)) return ['error' => 'Keyword cannot be empty.'];

    $url = sprintf(
        'https://serpapi.com/search.json?q=%s&engine=google&api_key=%s',
        urlencode($keyword),
        urlencode($api_key)
    );

    $curl = curl_init();

    curl_setopt_array($curl, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_SSL_VERIFYPEER => !$isLAN,
        CURLOPT_HTTPHEADER => ['Accept: application/json']
    ]);

    $res = curl_exec($curl);
    $code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    
    curl_close($curl);

    // Guard
    if (!$res || $code !== 200) { return ['error' => 'Failed to retrieve results from API.']; }

    $data = json_decode($res, true) ?: [];
    $items = $data['organic_results'] ?? [];
    
    $results = [];

    // Guard
    if (!isset($items) || !is_array($items)) {
        return [
            'status' => 'failed',
            'code' => $code,
            'keyword' => $keyword,
            'results' => $results
        ];
    }

    foreach ($items as $item) {
        $results[] = [
            'title' => $item['title'] ?? '',
            'link' => $item['link'] ?? '',
            'snippet' => $item['snippet'] ?? ''
        ];
    }

    return [
        'status' => 'succeeded',
        'code' => $code,
        'keyword' => $keyword,
        'results' => $results
    ];
}

// Process request, output JSON
if (isset($_GET['action']) && $_GET['action'] === 'search') {
    header('Content-Type: application/json');

    $keyword = $_GET['query'] ?? '';
    $serp_api_key = getenv('SERP_API_KEY');

    // Guard
    if (empty($serp_api_key)) { echo json_encode(['error' => 'Failed to obtain API key! Ensure the correct API key exists in the environment file!']); exit; }

    $results = fetch(keyword: $keyword, api_key: $serp_api_key);

    echo json_encode($results);

    exit;
}
?>

<?php if (php_sapi_name() !== 'cli'):?>
<!DOCTYPE html>

<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">

        <title>Fetch</title>

        <style>
          html {
            box-sizing: border-box;
          }

          body {
            font-family: sans-serif;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100vh;
            width: 100vw;
            margin: 0;
            padding: 0;
          }

          .title {
            margin-bottom: 1.7rem;
          }

          .search {
            display: flex;
            align-items: center;
            gap: .7rem;
            margin-bottom: 1.5rem;
          }

          .actions {
            display: flex;
            gap: .7rem;
            margin-bottom: 1rem;
          }
        </style>
    </head>

    <body>
        <h2 class="title">
            Query Google Search
        </h2>

        <div class="search">
            <label for="query">Keyword :</label>

            <input type="text" id="query">

            <button onclick="query()" id="button-query">Search</button>
        </div>

        <div class="actions" id="actions">
            <button onclick="download()" id="button-download" disabled>
                Download JSON
            </button>

            <button onclick="view()" id="button-view" disabled>
                View results
            </button>
        </div>

        <div id="results"></div>

        <script>
            let results = [];

            async function query () {
                const keyword = document.getElementById('query').value.trim();

                const results_el = document.getElementById('results');
                const button_query = document.getElementById('button-query');
                const button_download = document.getElementById('button-download');
                const button_view = document.getElementById('button-view');

                // Guard
                if (!keyword) { alert('Please enter a keyword.'); return; }

                button_query.disabled = true;
                results_el.innerHTML = 'Fetching...';

                try {
                    const res = await window.fetch(`?action=search&query=${encodeURIComponent(keyword)}`);
                    const data = await res.json();

                    // Guard
                    if (data.error) { results_el.innerHTML = `Fetch failed! : ${data.error}`; return; }

                    results = data.results || [];

                    // Guard: No results
                    if (!results.length) {
                        results_el.innerHTML = 'No search results found.';

                        button_download.disabled = true;
                        button_view.disabled = true;

                        return;
                    }

                    results_el.innerHTML = `Retrieved ${results.length} results.`;

                    button_download.disabled = false;
                    button_view.disabled = false;
                } catch (error) {
                    results_el.innerHTML = `Fetch failed due to an unknown error! : ${error}`
                } finally {
                    button_query.disabled = false;
                }
            }

            function download () {
                // Guard
                if (!results.length) return;

                const content = JSON.stringify(results, null, 2);
                const blob = new Blob([content], { type: 'application/json' });
                const url = URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = url;
                a.download = 'results.json';
                a.click();

                URL.revokeObjectURL(url);
            }

            function view () {
                // Guard
                if (!results.length) return;

                const content = JSON.stringify(results, null, 2);
                const blob = new Blob([content], { type: 'application/json' });
                const url = URL.createObjectURL(blob);

                window.open(url, '_blank');
            }
        </script>
    </body>
</html>
<?php endif;?>
