<?php
declare(strict_types=1);
/* Recherche de pays, villes et aéroports (données préparées par php/tools/build-geo.mjs) — mêmes résultats que api/geo.js. */

const GEO_ALIASES = [
    ['Londres', 'London', 'GB'], ['Moscou', 'Moscow', 'RU'], ['Le Caire', 'Cairo', 'EG'], ['Pékin', 'Beijing', 'CN'], ['Venise', 'Venice', 'IT'], ['Gênes', 'Genoa', 'IT'],
    ['Bruxelles', 'Brussels', 'BE'], ['Anvers', 'Antwerp', 'BE'], ['Genève', 'Geneva', 'CH'], ['Vienne', 'Vienna', 'AT'], ['Varsovie', 'Warsaw', 'PL'], ['Cracovie', 'Krakow', 'PL'],
    ['Athènes', 'Athens', 'GR'], ['Copenhague', 'Copenhagen', 'DK'], ['Saint-Pétersbourg', 'Saint Petersburg', 'RU'], ['Kiev', 'Kyiv', 'UA'], ['Bucarest', 'Bucharest', 'RO'],
    ['Le Cap', 'Cape Town', 'ZA'], ['Alger', 'Algiers', 'DZ'], ['Tanger', 'Tangier', 'MA'], ['La Nouvelle-Orléans', 'New Orleans', 'US'], ['Canton', 'Guangzhou', 'CN'],
    ['Bombay', 'Mumbai', 'IN'], ['Katmandou', 'Kathmandu', 'NP'], ['Singapour', 'Singapore', 'SG'], ['Séoul', 'Seoul', 'KR'], ['Jérusalem', 'Jerusalem', 'IL'], ['Damas', 'Damascus', 'SY'],
    ['Bagdad', 'Baghdad', 'IQ'], ['Téhéran', 'Tehran', 'IR'], ['Francfort', 'Frankfurt', 'DE'], ['Hambourg', 'Hamburg', 'DE'], ['Édimbourg', 'Edinburgh', 'GB'],
    ['Lisbonne', 'Lisbon', 'PT'], ['Bâle', 'Basel', 'CH'], ['Berne', 'Bern', 'CH'], ['Saint-Domingue', 'Santo Domingo', 'DO'], ['La Havane', 'Havana', 'CU'],
    ['Nouméa', 'Noumea', 'NC'], ['Majorque', 'Palma', 'ES'], ['Munich', 'Munich', 'DE'], ['Cologne', 'Cologne', 'DE'], ['Rome', 'Rome', 'IT'], ['Milan', 'Milan', 'IT'], ['Naples', 'Naples', 'IT'],
    ['Florence', 'Florence', 'IT'], ['Turin', 'Turin', 'IT'], ['Marseille', 'Marseille', 'FR'], ['Lyon', 'Lyon', 'FR'], ['Nice', 'Nice', 'FR'], ['Paris', 'Paris', 'FR'],
];
const GEO_AFRICA = ['DZ', 'AO', 'BJ', 'BW', 'BF', 'BI', 'CM', 'CV', 'CF', 'TD', 'KM', 'CG', 'CD', 'CI', 'DJ', 'EG', 'GQ', 'ER', 'SZ', 'ET', 'GA', 'GM', 'GH', 'GN', 'GW', 'KE', 'LS', 'LR', 'LY', 'MG', 'MW', 'ML', 'MR', 'MU', 'MA', 'MZ', 'NA', 'NE', 'NG', 'RW', 'ST', 'SN', 'SC', 'SL', 'SO', 'ZA', 'SS', 'SD', 'TZ', 'TG', 'TN', 'UG', 'ZM', 'ZW'];
const GEO_FR_GROUP = ['FR', 'RE', 'GP', 'MQ', 'GF', 'YT', 'PM', 'BL', 'MF', 'NC', 'PF', 'WF', 'TF'];

function geo_data(string $name): array
{
    static $cache = [];
    if (!isset($cache[$name])) $cache[$name] = json_decode((string)file_get_contents(TV_APP . '/data/' . $name . '.json'), true) ?: [];
    return $cache[$name];
}
function geo_country_name(string $code): string
{
    static $map = null;
    if ($map === null) { $map = []; foreach (geo_data('countries') as $c) $map[$c['code']] = $c['name']; }
    return $map[$code] ?? $code;
}
function geo_same_country(string $rowCc, string $wanted): bool { return $wanted === '' || $rowCc === $wanted || ($wanted === 'FR' && in_array($rowCc, GEO_FR_GROUP, true)); }
function geo_shown_cc(string $cc): string { return in_array($cc, GEO_FR_GROUP, true) ? 'FR' : $cc; }
function geo_in_region(string $cc, string $region): bool { return $region === '' || ($region === 'africa' && in_array($cc, GEO_AFRICA, true)); }

function geo_countries(string $region = ''): array
{
    return array_values(array_filter(geo_data('countries'), fn($c) => geo_in_region($c['code'], $region)));
}
function geo_country_code_by_name(string $name): ?string
{
    $n = norm_text($name);
    foreach (geo_data('countries') as $c) if (norm_text($c['name']) === $n) return $c['code'];
    return null;
}
function geo_city_row(string $name, string $cc, string $display): array
{
    $sc = geo_shown_cc($cc);
    $cn = geo_country_name($sc);
    return ['name' => $display, 'country' => $sc, 'countryName' => $cn, 'label' => "$display, $cn"];
}
function geo_search_cities(string $q, string $countryCode = '', int $limit = 10, string $region = ''): array
{
    $list = geo_data('cities'); // [name, normalisé, pays, population] triés par population
    $needle = norm_text($q);
    $cc = strtoupper($countryCode);
    if (mb_strlen($needle) < 2) {
        if ($needle !== '') return [];
        $out = [];
        foreach ($list as $e) {
            if (count($out) >= $limit) break;
            if (geo_same_country($e[2], $cc) && geo_in_region($e[2], $region)) $out[] = geo_city_row($e[0], $e[2], $e[0]);
        }
        return $out;
    }
    $out = []; $seen = [];
    $push = function (string $name, array $e, ?string $display = null) use (&$out, &$seen) {
        $display ??= $name;
        $key = norm_text($display) . '|' . $e[2];
        if (isset($seen[$key])) return;
        $seen[$key] = true;
        $out[] = geo_city_row($name, $e[2], $display);
    };
    $byName = null;
    foreach (GEO_ALIASES as [$fr, $en, $aliasCc]) {
        if (count($out) >= $limit) break;
        if (str_starts_with(norm_text($fr), $needle)) {
            if ($byName === null) { $byName = []; foreach ($list as $e) { $k = $e[1] . '|' . $e[2]; if (!isset($byName[$k])) $byName[$k] = $e; } }
            $e = $byName[norm_text($en) . '|' . $aliasCc] ?? null;
            if ($e && geo_same_country($e[2], $cc) && geo_in_region($e[2], $region)) { $push($en, $e, $fr); $seen[norm_text($en) . '|' . $e[2]] = true; }
        }
    }
    foreach ($list as $e) {
        if (count($out) >= $limit) break;
        if (!geo_same_country($e[2], $cc) || !geo_in_region($e[2], $region)) continue;
        if (str_starts_with($e[1], $needle)) $push($e[0], $e);
    }
    if (count($out) < $limit && mb_strlen($needle) >= 3) {
        foreach ($list as $e) {
            if (count($out) >= $limit) break;
            if (!geo_same_country($e[2], $cc) || !geo_in_region($e[2], $region)) continue;
            if (!str_starts_with($e[1], $needle) && str_contains($e[1], $needle)) $push($e[0], $e);
        }
    }
    return $out;
}
function geo_airport_out(array $a): array
{
    $sc = geo_shown_cc($a[3]);
    return ['iata' => $a[0], 'name' => $a[1], 'city' => $a[2], 'country' => $sc, 'countryName' => geo_country_name($sc)];
}
/** @param array{countryCode?: string, city?: string, limit?: int, region?: string} $o */
function geo_search_airports(string $q, array $o = []): array
{
    $airports = geo_data('airports'); // [iata, nom, ville, pays, ville normalisée, recherche]
    $needle = norm_text($q);
    $cc = strtoupper($o['countryCode'] ?? ''); $cityN = norm_text($o['city'] ?? ''); $limit = $o['limit'] ?? 10; $region = $o['region'] ?? '';
    $out = [];
    $add = function (array $a) use (&$out, $limit) { if (count($out) < $limit && !in_array($a, $out, true)) $out[] = $a; };
    $ok = fn($a) => geo_same_country($a[3], $cc) && geo_in_region($a[3], $region);
    if ($needle === '') {
        if ($cityN !== '') foreach ($airports as $a) if ($a[4] === $cityN && $ok($a)) $add($a);
        foreach ($airports as $a) if ($ok($a)) $add($a);
        return array_map('geo_airport_out', $out);
    }
    $upper = strtoupper(trim($q));
    if (strlen($upper) === 3) foreach ($airports as $a) if ($a[0] === $upper && $ok($a)) $add($a);
    foreach ($airports as $a) { if (!$ok($a)) continue; if (str_starts_with(strtolower($a[0]), $needle) || str_starts_with($a[4], $needle)) $add($a); }
    foreach ($airports as $a) { if (!$ok($a)) continue; if (str_contains($a[5], $needle)) $add($a); }
    return array_map('geo_airport_out', $out);
}
function geo_search_places(string $q, int $limit = 12, string $countryCode = ''): array
{
    $needle = norm_text($q);
    $cc = strtoupper($countryCode);
    if ($needle === '') {
        if ($cc !== '') return ['airports' => geo_search_airports('', ['countryCode' => $cc, 'limit' => 600]), 'cities' => geo_search_cities('', $cc, 300)];
        return ['airports' => [], 'cities' => geo_search_cities('', '', $limit)];
    }
    $airports = geo_search_airports($q, ['countryCode' => $cc, 'limit' => 5]);
    $cities = geo_search_cities($q, $cc, $limit - count($airports));
    return ['airports' => $airports, 'cities' => $cities];
}
