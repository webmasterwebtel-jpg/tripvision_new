<?php
declare(strict_types=1);
/* Écriture d'un classeur Excel (.xlsx) sans bibliothèque : un zip de fichiers XML. Nécessite l'extension zip (ZipArchive). */

function xlsx_col(int $i): string { $s = ''; for ($i++; $i > 0; $i = intdiv($i - 1, 26)) $s = chr(65 + ($i - 1) % 26) . $s; return $s; }
function xlsx_esc(mixed $v): string
{
    $s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', '', (string)($v ?? ''));
    return htmlspecialchars($s, ENT_XML1 | ENT_QUOTES, 'UTF-8');
}
/** @param array<int, array{0:string, 1:array, 2:array, 3?:array}> $sheets [titre, entêtes, lignes, largeurs?] */
function xlsx_build(array $sheets): string
{
    $zip = new ZipArchive();
    $tmp = tempnam(sys_get_temp_dir(), 'tvx');
    $zip->open($tmp, ZipArchive::CREATE | ZipArchive::OVERWRITE);
    $ct = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>';
    $wbSheets = ''; $rels = '';
    foreach ($sheets as $i => $sh) {
        $n = $i + 1;
        $ct .= "<Override PartName=\"/xl/worksheets/sheet$n.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>";
        $title = mb_substr((string)preg_replace('/[\\\\\/\?\*\[\]:]/u', ' ', $sh[0]), 0, 31);
        $wbSheets .= "<sheet name=\"" . xlsx_esc($title) . "\" sheetId=\"$n\" r:id=\"rId$n\"/>";
        $rels .= "<Relationship Id=\"rId$n\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet$n.xml\"/>";
        [$head, $rows] = [$sh[1], $sh[2]];
        $widths = $sh[3] ?? null;
        if ($widths === null) {
            $widths = [];
            foreach ($head as $c => $h) {
                $m = mb_strlen((string)$h) + 2;
                foreach ($rows as $r) $m = max($m, mb_strlen((string)($r[$c] ?? '')) + 2);
                $widths[] = min(48, max(12, $m));
            }
        }
        $x = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>';
        foreach ($widths as $c => $w) $x .= '<col min="' . ($c + 1) . '" max="' . ($c + 1) . '" width="' . $w . '" customWidth="1"/>';
        $x .= '</cols><sheetData>';
        $all = array_merge([$head], $rows);
        foreach ($all as $r => $row) {
            $x .= '<row r="' . ($r + 1) . '">';
            foreach (array_values($row) as $c => $v) {
                $ref = xlsx_col($c) . ($r + 1);
                $style = $r === 0 ? ' s="1"' : '';
                if ($v === null || $v === '') $x .= "<c r=\"$ref\"$style/>";
                elseif ((is_int($v) || is_float($v)) && $r > 0) $x .= "<c r=\"$ref\"><v>$v</v></c>";
                else $x .= "<c r=\"$ref\"$style t=\"inlineStr\"><is><t xml:space=\"preserve\">" . xlsx_esc($v) . '</t></is></c>';
            }
            $x .= '</row>';
        }
        $x .= '</sheetData></worksheet>';
        $zip->addFromString("xl/worksheets/sheet$n.xml", $x);
    }
    $zip->addFromString('[Content_Types].xml', $ct . '</Types>');
    $zip->addFromString('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
    $zip->addFromString('xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' . $wbSheets . '</sheets></workbook>');
    $zip->addFromString('xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' . $rels . '<Relationship Id="rIdS" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>');
    $zip->addFromString('xl/styles.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FF0F3B2E"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE3F1EA"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs></styleSheet>');
    $zip->close();
    $data = (string)file_get_contents($tmp);
    @unlink($tmp);
    return $data;
}
