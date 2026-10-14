<?php
declare(strict_types=1);
/* Écriture de PDF sans bibliothèque : polices Helvetica standard (largeurs dans data/helvetica.json), logo PNG, mise en page des reçus TripVision. */

final class Pdf
{
    public const W = 595.28, H = 841.89;
    public float $y = 0;
    private array $pages = [];
    private int $cur = -1;
    private array $widths;
    private ?array $logo = null;
    private string $title;

    public function __construct(string $title = 'Document TripVision')
    {
        $this->title = $title;
        $w = json_decode((string)file_get_contents(TV_APP . '/data/helvetica.json'), true);
        $this->widths = ['regular' => $w['regular'], 'bold' => $w['bold']];
        $this->addPage();
    }
    public function addPage(): void { $this->pages[] = ''; $this->cur = count($this->pages) - 1; $this->y = 0; }
    public function pageCount(): int { return count($this->pages); }
    public function gotoPage(int $i): void { $this->cur = $i; }

    private static function rgb(string $hex): string
    {
        $hex = ltrim($hex, '#');
        return sprintf('%.3F %.3F %.3F', hexdec(substr($hex, 0, 2)) / 255, hexdec(substr($hex, 2, 2)) / 255, hexdec(substr($hex, 4, 2)) / 255);
    }
    private static function f(float $n): string { return rtrim(rtrim(sprintf('%.2F', $n), '0'), '.') ?: '0'; }
    private function add(string $s): void { $this->pages[$this->cur] .= $s . "\n"; }
    private function py(float $y): float { return self::H - $y; }

    /** Texte converti en octets Windows-1252 (caractères inconnus remplacés). */
    public static function ansi(string $s): string
    {
        $s = str_replace(['→', '←', "\u{202F}", "\u{00A0}"], ['–', '–', ' ', ' '], $s);
        $r = @mb_convert_encoding($s, 'Windows-1252', 'UTF-8');
        return $r === false ? $s : $r;
    }
    public function textWidth(string $s, bool $bold, float $size, float $cs = 0): float
    {
        $a = self::ansi($s);
        $w = 0;
        $t = $this->widths[$bold ? 'bold' : 'regular'];
        for ($i = 0, $n = strlen($a); $i < $n; $i++) $w += ($t[ord($a[$i])] ?? 0) * $size / 1000 + $cs;
        return $w;
    }
    /** Découpe en lignes selon la largeur disponible. */
    private function wrap(string $text, ?float $width, bool $bold, float $size, float $cs): array
    {
        $lines = [];
        foreach (preg_split('/\r?\n/', $text) as $para) {
            if ($width === null) { $lines[] = $para; continue; }
            $cur = '';
            foreach (preg_split('/ +/', $para) as $word) {
                $try = $cur === '' ? $word : "$cur $word";
                if ($cur !== '' && $this->textWidth($try, $bold, $size, $cs) > $width) { $lines[] = $cur; $cur = $word; } else $cur = $try;
            }
            $lines[] = $cur;
        }
        return $lines;
    }
    /**
     * Écrit du texte à (x, y) ; renvoie la position y sous le texte (aussi enregistrée dans $this->y).
     * @param array{width?:float, align?:string, bold?:bool, size?:float, color?:string, cs?:float, oneLine?:bool} $o
     */
    public function text(string $text, float $x, float $y, array $o = []): float
    {
        $bold = $o['bold'] ?? false; $size = (float)($o['size'] ?? 10); $cs = (float)($o['cs'] ?? 0);
        $width = $o['width'] ?? null; $align = $o['align'] ?? 'left';
        $lines = ($o['oneLine'] ?? false) ? [$text] : $this->wrap($text, $width, $bold, $size, $cs);
        $lh = 1.156 * $size;
        $font = $bold ? '/F2' : '/F1';
        foreach ($lines as $line) {
            $lw = $this->textWidth($line, $bold, $size, $cs);
            $dx = 0;
            if ($width !== null) $dx = $align === 'right' ? $width - $lw : ($align === 'center' ? ($width - $lw) / 2 : 0);
            $base = $y + 0.718 * $size;
            $esc = str_replace(['\\', '(', ')', "\r"], ['\\\\', '\\(', '\\)', ''], self::ansi($line));
            $this->add(self::rgb($o['color'] ?? '#000000') . " rg BT $font " . self::f($size) . ' Tf ' . self::f($cs) . ' Tc ' . self::f($x + $dx) . ' ' . self::f($this->py($base)) . " Td ($esc) Tj ET");
            $y += $lh;
        }
        return $this->y = $y;
    }
    public function rect(float $x, float $y, float $w, float $h, string $fill): void
    {
        $this->add(self::rgb($fill) . ' rg ' . self::f($x) . ' ' . self::f($this->py($y + $h)) . ' ' . self::f($w) . ' ' . self::f($h) . ' re f');
    }
    private function rrPath(float $x, float $y, float $w, float $h, float $r): string
    {
        $r = min($r, $w / 2, $h / 2); $k = 0.5523 * $r;
        $x2 = $x + $w; $yb = $this->py($y + $h); $yt = $this->py($y);
        $f = fn($n) => self::f($n);
        return $f($x + $r) . ' ' . $f($yb) . ' m ' . $f($x2 - $r) . ' ' . $f($yb) . ' l '
            . $f($x2 - $r + $k) . ' ' . $f($yb) . ' ' . $f($x2) . ' ' . $f($yb + $r - $k) . ' ' . $f($x2) . ' ' . $f($yb + $r) . ' c '
            . $f($x2) . ' ' . $f($yt - $r) . ' l '
            . $f($x2) . ' ' . $f($yt - $r + $k) . ' ' . $f($x2 - $r + $k) . ' ' . $f($yt) . ' ' . $f($x2 - $r) . ' ' . $f($yt) . ' c '
            . $f($x + $r) . ' ' . $f($yt) . ' l '
            . $f($x + $r - $k) . ' ' . $f($yt) . ' ' . $f($x) . ' ' . $f($yt - $r + $k) . ' ' . $f($x) . ' ' . $f($yt - $r) . ' c '
            . $f($x) . ' ' . $f($yb + $r) . ' l '
            . $f($x) . ' ' . $f($yb + $r - $k) . ' ' . $f($x + $r - $k) . ' ' . $f($yb) . ' ' . $f($x + $r) . ' ' . $f($yb) . ' c h';
    }
    public function roundedRect(float $x, float $y, float $w, float $h, float $r, string $fill, ?string $stroke = null, float $lw = 1): void
    {
        $path = $this->rrPath($x, $y, $w, $h, $r);
        if ($stroke) $this->add(self::rgb($fill) . ' rg ' . self::rgb($stroke) . ' RG ' . self::f($lw) . " w $path B");
        else $this->add(self::rgb($fill) . " rg $path f");
    }
    public function line(float $x1, float $y1, float $x2, float $y2, string $color, float $w = 1): void
    {
        $this->add(self::rgb($color) . ' RG ' . self::f($w) . ' w ' . self::f($x1) . ' ' . self::f($this->py($y1)) . ' m ' . self::f($x2) . ' ' . self::f($this->py($y2)) . ' l S');
    }
    /** Logo (PNG avec transparence) chargé une seule fois. */
    public function loadLogo(string $path): bool
    {
        if (!function_exists('imagecreatefrompng') || !is_file($path)) return false;
        $im = @imagecreatefrompng($path);
        if (!$im) return false;
        $w = imagesx($im); $h = imagesy($im);
        $rgb = ''; $alpha = '';
        for ($yy = 0; $yy < $h; $yy++) for ($xx = 0; $xx < $w; $xx++) {
            $c = imagecolorat($im, $xx, $yy);
            $a = ($c >> 24) & 0x7F;
            $rgb .= chr(($c >> 16) & 255) . chr(($c >> 8) & 255) . chr($c & 255);
            $alpha .= chr((int)round((127 - $a) * 255 / 127));
        }
        $this->logo = ['w' => $w, 'h' => $h, 'rgb' => gzcompress($rgb), 'alpha' => gzcompress($alpha)];
        return true;
    }
    public function logo(float $x, float $y, float $width): void
    {
        if (!$this->logo) return;
        $h = $width * $this->logo['h'] / $this->logo['w'];
        $this->pageUsesLogo[$this->cur] = true;
        $this->add('q ' . self::f($width) . ' 0 0 ' . self::f($h) . ' ' . self::f($x) . ' ' . self::f($this->py($y + $h)) . ' cm /Im1 Do Q');
    }
    private array $pageUsesLogo = [];

    public function output(): string
    {
        $objs = [];
        $objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
        $objs[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
        $objs[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
        $n = 5; $imgRef = '';
        if ($this->logo) {
            $imgObj = $n++; $maskObj = $n++;
            $objs[$maskObj] = [sprintf('<< /Type /XObject /Subtype /Image /Width %d /Height %d /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode /Length %d >>', $this->logo['w'], $this->logo['h'], strlen($this->logo['alpha'])), $this->logo['alpha']];
            $objs[$imgObj] = [sprintf('<< /Type /XObject /Subtype /Image /Width %d /Height %d /ColorSpace /DeviceRGB /BitsPerComponent 8 /SMask %d 0 R /Filter /FlateDecode /Length %d >>', $this->logo['w'], $this->logo['h'], $maskObj, strlen($this->logo['rgb'])), $this->logo['rgb']];
            $imgRef = "/XObject << /Im1 $imgObj 0 R >>";
        }
        $kids = [];
        foreach ($this->pages as $i => $content) {
            $c = $n++; $p = $n++;
            $z = gzcompress($content);
            $objs[$c] = [sprintf('<< /Filter /FlateDecode /Length %d >>', strlen($z)), $z];
            $objs[$p] = sprintf('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 %s %s] /Contents %d 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R >> %s >> >>', self::f(self::W), self::f(self::H), $c, $imgRef);
            $kids[] = "$p 0 R";
        }
        $objs[2] = '<< /Type /Pages /Kids [' . implode(' ', $kids) . '] /Count ' . count($kids) . ' >>';
        $info = $n++;
        $objs[$info] = '<< /Title <FEFF' . strtoupper(bin2hex(mb_convert_encoding($this->title, 'UTF-16BE', 'UTF-8'))) . '> /Author (TripVision) /Producer (TripVision) /CreationDate (D:' . gmdate('YmdHis') . 'Z) >>';
        $out = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
        $off = [];
        ksort($objs);
        foreach ($objs as $id => $o) {
            $off[$id] = strlen($out);
            $out .= "$id 0 obj\n" . (is_array($o) ? $o[0] . "\nstream\n" . $o[1] . "\nendstream" : $o) . "\nendobj\n";
        }
        $xref = strlen($out);
        $max = max(array_keys($objs));
        $out .= "xref\n0 " . ($max + 1) . "\n0000000000 65535 f \n";
        for ($i = 1; $i <= $max; $i++) $out .= isset($off[$i]) ? sprintf("%010d 00000 n \n", $off[$i]) : "0000000000 65535 f \n";
        $out .= "trailer\n<< /Size " . ($max + 1) . " /Root 1 0 R /Info $info 0 R >>\nstartxref\n$xref\n%%EOF";
        return $out;
    }
}

/* ---------- Mise en page des documents TripVision (même rendu que api/pdf.js) ---------- */
const PDF_GREEN = '#0f3b2e', PDF_GOLD = '#c8a24a', PDF_INK = '#14231d', PDF_MUTED = '#6b7a72', PDF_LINE = '#e3ddcf', PDF_SAND = '#f6f2ea';

function pdf_eur(mixed $n): string { return ($n === null || $n === '' || !is_numeric($n)) ? '' : number_format((float)$n, 2, ',', '') . ' €'; }
function pdf_day(?string $d): string { return $d ? fr_date($d, 'l j F Y') : ''; }

function pdf_start(string $title): Pdf
{
    $pdf = new Pdf($title);
    foreach ([dirname(TV_APP) . '/assets', dirname(TV_APP, 2) . '/assets', TV_APP . '/data'] as $dir) if ($pdf->loadLogo($dir . '/tripvision-logo-email.png')) break;
    return $pdf;
}
function pdf_header(Pdf $d, string $title, string $reference, bool $ok, string $label): void
{
    $d->rect(0, 0, 595, 8, PDF_GREEN);
    $d->logo(48, 24, 168);
    $d->text('Référence', 380, 28, ['width' => 167, 'align' => 'right', 'size' => 9, 'color' => PDF_MUTED]);
    $d->text($reference, 380, 40, ['width' => 167, 'align' => 'right', 'size' => 20, 'bold' => true, 'color' => PDF_GREEN]);
    $d->roundedRect(447, 70, 100, 22, 11, $ok ? '#e3f1ea' : '#fbefd5');
    $d->text(mb_strtoupper($label), 447, 77, ['width' => 100, 'align' => 'center', 'size' => 9, 'bold' => true, 'color' => $ok ? '#1f7a55' : '#8a5a10', 'cs' => 0.6]);
    $d->line(48, 104, 547, 104, PDF_GOLD, 2);
    $d->text(mb_strtoupper($title), 48, 114, ['size' => 12, 'bold' => true, 'color' => PDF_GREEN, 'cs' => 1.4]);
    $d->y = 142;
}
function pdf_section(Pdf $d, string $title): void
{
    if ($d->y > 740) $d->addPage();
    $d->y += 6;
    $y = $d->y;
    $d->text(mb_strtoupper($title), 48, $y, ['size' => 9, 'bold' => true, 'color' => PDF_GOLD, 'cs' => 1.8]);
    $d->line(48, $y + 15, 547, $y + 15, PDF_LINE, 1);
    $d->y = $y + 21;
}
function pdf_rows(Pdf $d, array $list): void
{
    foreach ($list as [$k, $v]) {
        if ($v === null || trim((string)$v) === '') continue;
        if ($d->y > 770) $d->addPage();
        $y = $d->y;
        $d->text((string)$k, 48, $y, ['width' => 150, 'size' => 9.5, 'color' => PDF_MUTED]);
        $end = $d->y;
        $d->text((string)$v, 205, $y, ['width' => 342, 'size' => 10.5, 'bold' => true, 'color' => PDF_INK]);
        $d->y = max($d->y, $end, $y + 14) + 2;
    }
}
function pdf_price_box(Pdf $d, mixed $total, mixed $online = null, mixed $onsite = null): void
{
    if ($d->y > 690) $d->addPage();
    $y = $d->y + 4;
    $h = $onsite !== null ? 96 : 60;
    $d->roundedRect(48, $y, 499, $h, 10, PDF_SAND);
    $d->text('PRIX TOTAL', 66, $y + 14, ['size' => 9, 'color' => PDF_MUTED, 'cs' => 1.2]);
    $d->text(pdf_eur($total) ?: '—', 66, $y + 26, ['size' => 28, 'bold' => true, 'color' => PDF_GREEN]);
    if ($onsite !== null) {
        $d->text('PAYÉ EN LIGNE', 300, $y + 14, ['size' => 9, 'color' => PDF_MUTED, 'cs' => 1.2]);
        $d->text(pdf_eur($online), 300, $y + 28, ['size' => 15, 'bold' => true, 'color' => '#1f7a55']);
        $d->text('À RÉGLER À L’ENSEIGNE AU RETRAIT', 300, $y + 54, ['size' => 9, 'color' => PDF_MUTED, 'cs' => 0.6]);
        $d->text(pdf_eur($onsite), 300, $y + 67, ['size' => 15, 'bold' => true, 'color' => PDF_INK]);
    }
    $d->y = $y + $h + 10;
}
function pdf_footer(Pdf $d): void
{
    $count = $d->pageCount();
    for ($i = 0; $i < $count; $i++) {
        $d->gotoPage($i);
        $d->line(48, 800, 547, 800, PDF_LINE, 1);
        $d->text('TripVision · hello@tripvision.fr · Document généré le ' . gmdate('d/m/Y') . ' · Page ' . ($i + 1) . "/$count", 48, 808, ['width' => 499, 'align' => 'center', 'size' => 8, 'color' => PDF_MUTED, 'oneLine' => true]);
    }
}
/** Reçu d'une demande de vol ou d'un pack (équivalent de requestPdf). */
function request_pdf(array $r): string
{
    $d = pdf_start('Confirmation de réservation TripVision');
    $confirmed = $r['status'] === 'confirmed';
    pdf_header($d, $r['type'] === 'flight' ? 'Réservation de vol' : 'Réservation de pack', $r['reference'], $confirmed, $confirmed ? 'Confirmée' : ($r['status'] === 'cancelled' ? 'Annulée' : 'En attente'));
    pdf_section($d, $r['type'] === 'flight' ? 'Votre vol' : 'Votre pack');
    pdf_rows($d, [['Offre', $r['title']], ['Détail', $r['summary']], ['Type de billet', $r['tripType'] === 'oneway' ? 'Aller simple' : ($r['tripType'] === 'roundtrip' ? 'Aller-retour' : '')], ['Voyageurs', $r['travelers']], ['Demandée le', pdf_day($r['createdAt'])]]);
    pdf_section($d, 'Voyageur');
    pdf_rows($d, [['Nom', $r['customer']], ['E-mail', $r['email']], ['Téléphone', $r['phone']]]);
    pdf_section($d, 'Prix');
    pdf_price_box($d, $r['total']);
    $msg = $confirmed ? ($r['paid'] !== null ? 'Cette réservation est confirmée et réglée en ligne (' . pdf_eur($r['paid']) . ').' : 'Cette réservation est confirmée par TripVision.') : 'Cette demande sera confirmée par TripVision après vérification de la disponibilité ; aucun paiement n’a été demandé à ce stade.';
    $d->text($msg, 48, $d->y, ['width' => 499, 'size' => 8.5, 'color' => PDF_MUTED]);
    pdf_footer($d);
    return $d->output();
}
function send_pdf(string $pdf, string $reference): never
{
    send_raw($pdf, 'application/pdf', 200, ['Content-Disposition' => 'attachment; filename="tripvision-' . strtolower($reference) . '.pdf"', 'Cache-Control' => 'no-store']);
}
