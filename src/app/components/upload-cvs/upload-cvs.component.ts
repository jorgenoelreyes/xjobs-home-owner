import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
Chart.register(...registerables);

export interface WorkerRow {
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
  categoria_laboral: string;
  fuente: string;
}

@Component({
  selector: 'app-upload-cvs',
  templateUrl: './upload-cvs.component.html',
  styleUrls: ['./upload-cvs.component.scss']
})
export class UploadCvsComponent implements AfterViewInit {
  @ViewChild('barChart', { static: false }) barChartRef!: ElementRef<HTMLCanvasElement>;

  // UI state
  showPaste = false;
  pasteText = '';
  sourceLabel = 'Manual';
  busy = false;
  lastMessage = '';

  // Data
  rows: WorkerRow[] = [];
  unparsedFiles: { name: string; kind: string; reason?: string }[] = [];
  selectedCategoria: string | null = null;

  // Chart
  private chart?: Chart;
  readonly CANON = [
    'plomero','carpintero','pintor','electricista','soldador','albañil',
    'techador','climatizacion','paisajista','mecanico','obrero_general','otro'
  ];

  ngAfterViewInit(): void {
    queueMicrotask(() => {
      this.buildChart();
      this.refreshChart();
    });
  }

  // -------- File handling (client-side parse) --------
  async onFilesSelected(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement | null;
    const files = Array.from(input?.files ?? []);
    if (input) input.value = '';
    if (!files.length) return;

    this.busy = true;
    this.lastMessage = '';
    const added: WorkerRow[] = [];
    const unparsed: { name: string; kind: string; reason?: string }[] = [];

    for (const f of files) {
      const ext = this.extOf(f.name).toLowerCase();
      try {
        if (ext === 'csv' || ext === 'tsv') {
          const text = await f.text();
          const parsed = this.parseDelimitedText(text, this.sourceLabel || 'Archivo');
          added.push(...parsed);
        } else if (ext === 'txt') {
          const text = await f.text();
          const parsed = this.parseTxtLines(text, this.sourceLabel || 'Archivo');
          added.push(...parsed);
        } else if (ext === 'pdf' || ext === 'doc' || ext === 'docx') {
          unparsed.push({ name: f.name, kind: this.extOf(f.name), reason: 'Use copy–paste for PDFs/DOCs' });
        } else {
          unparsed.push({ name: f.name, kind: this.extOf(f.name), reason: 'Unsupported type' });
        }
      } catch (e) {
        console.error('Read/parse failed:', f.name, e);
        unparsed.push({ name: f.name, kind: this.extOf(f.name), reason: 'Read/parse error' });
      }
    }

    if (added.length) {
      this.rows = this.rows.concat(added);
      this.refreshChart();
      this.lastMessage = `Parsed ${added.length} row(s) from ${files.length} file(s).`;
    }
    if (unparsed.length) this.unparsedFiles.push(...unparsed);

    this.busy = false;
  }

  private parseDelimitedText(raw: string, fuente: string): WorkerRow[] {
    const lines = (raw || '').split(/\r?\n/).filter(l => l.trim().length > 0);
    if (!lines.length) return [];
    const sep = lines[0].includes('\t') ? '\t' : ',';
    const headers = lines.shift()!.split(sep).map(h => h.trim().toLowerCase());

    const out: WorkerRow[] = [];
    for (const line of lines) {
      const cols = line.split(sep).map(c => c.trim());
      const obj: any = {};
      headers.forEach((h, i) => obj[h] = cols[i] ?? '');
      out.push(this.normalize(obj, fuente));
    }
    return out;
  }

  private parseTxtLines(raw: string, fuente: string): WorkerRow[] {
    return (raw || '')
      .split(/\r?\n/)
      .map(s => s.trim())
      .filter(Boolean)
      .map(nombre => this.normalize({ nombre }, fuente));
  }

  // -------- Filters & paste modal --------
  get visibleRows(): WorkerRow[] {
    if (!this.selectedCategoria) return this.rows;
    return this.rows.filter(r => (r.categoria_laboral || 'otro') === this.selectedCategoria);
  }

  toggleFilter(cat: string): void {
    this.selectedCategoria = this.selectedCategoria === cat ? null : cat;
    this.refreshChart();
  }

  clearFilter(): void {
    this.selectedCategoria = null;
    this.refreshChart();
  }

  closePaste() { this.showPaste = false; }

  parsePasted(): void {
    const raw = this.pasteText || '';
    if (!raw.trim()) { this.closePaste(); return; }
    let parsed: WorkerRow[] = [];
    try {
      parsed = this.parseDelimitedText(raw, this.sourceLabel || 'Manual');
      if (!parsed.length) throw new Error('fallback');
    } catch {
      parsed = this.parseTxtLines(raw, this.sourceLabel || 'Manual');
    }
    if (parsed.length) {
      this.rows = this.rows.concat(parsed);
      this.refreshChart();
      this.lastMessage = `Parsed ${parsed.length} row(s) from paste.`;
    }
    this.pasteText = '';
    this.sourceLabel = 'Manual';
    this.closePaste();
  }

  // -------- Normalization --------
  private normalize(r: any, fuente = 'Manual'): WorkerRow {
    const slug = (s: string) =>
      (s || '').toLowerCase().replace(/\s+/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const toCanon = (val: string) => {
      const s = slug(val);
      if (!s) return 'otro';
      if (s.includes('plom')) return 'plomero';
      if (s.includes('carp')) return 'carpintero';
      if (s.includes('pint')) return 'pintor';
      if (s.includes('elect')) return 'electricista';
      if (s.includes('sold')) return 'soldador';
      if (s.includes('alban') || s.includes('albañ')) return 'albañil';
      if (s.includes('tech') || s.includes('roof')) return 'techador';
      if (s.includes('clima') || s.includes('hvac')) return 'climatizacion';
      if (s.includes('paisaj') || s.includes('land')) return 'paisajista';
      if (s.includes('mecan')) return 'mecanico';
      if (s.includes('obrer') || s.includes('general')) return 'obrero_general';
      return this.CANON.includes(s) ? s : 'otro';
    };

    const nombre =
      r?.['nombre'] ?? r?.['name'] ?? r?.['full name'] ?? r?.['full_name'] ?? r?.['nombres y apellidos'] ?? '';
    const telefono = r?.['telefono'] ?? r?.['phone'] ?? r?.['celular'] ?? r?.['mobile'] ?? '';
    const email = r?.['email'] ?? r?.['correo'] ?? r?.['mail'] ?? '';
    const direccion = r?.['direccion'] ?? r?.['address'] ?? '';
    const catRaw =
      r?.['categoria_laboral'] ?? r?.['categoria'] ?? r?.['category'] ?? r?.['ocupacion'] ?? r?.['job'] ?? '';

    return {
      nombre: (nombre || '').toString(),
      telefono: (telefono || '').toString(),
      email: (email || '').toString(),
      direccion: (direccion || '').toString(),
      categoria_laboral: toCanon(catRaw),
      fuente
    };
  }

  private extOf(name: string): string {
    const m = (name || '').match(/\.([^.]+)$/);
    return (m?.[1] || '').toUpperCase();
  }

  // -------- Chart --------
  private buildChart(): void {
    if (!this.barChartRef?.nativeElement) return;
    const ctx = this.barChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const cfg: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: this.CANON,
        datasets: [{
          label: 'Recursos',
          data: new Array(this.CANON.length).fill(0)
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } }
      }
    };

    if (this.chart) this.chart.destroy();
    this.chart = new Chart(ctx, cfg);
  }

  private refreshChart(): void {
    if (!this.chart) return;
    const counts = this.CANON.reduce((acc, c) => { acc[c] = 0; return acc; }, {} as Record<string, number>);
    const src = this.selectedCategoria ? this.visibleRows : this.rows;
    for (const r of src) {
      const key = (r.categoria_laboral || 'otro');
      counts[key] = (counts[key] || 0) + 1;
    }
    (this.chart.data.datasets[0].data as number[]) = this.CANON.map(c => counts[c] || 0);
    this.chart.update();
  }
}
