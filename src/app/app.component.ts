import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { NgChartsModule } from "ng2-charts";
import type { ChartConfiguration, ChartType } from "chart.js";
import "chart.js/auto";

type Row = {
  name: string;
  category: string;
  phone?: string; email?: string;
  address?: string; city?: string; state?: string; country?: string;
  lat?: number; lng?: number;
  skills?: string; exp?: number; certs?: string; langs?: string;
  availability?: string; rate?: string; education?: string; license?: string; vehicle?: string;
  eligibility?: string; source?: string;
};

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent {
  rows: Row[] = [
    { name:"Alice", category:"electrician", city:"Miami", country:"US", exp:3, source:"seed" },
    { name:"Bob", category:"painter",     city:"Miami", country:"US", exp:2, source:"seed" },
    { name:"Cathy", category:"other",      city:"Miami", country:"US", exp:1, source:"seed" },
    { name:"Dan",   category:"other",      city:"Miami", country:"US", exp:4, source:"seed" },
    { name:"Eva",   category:"other",      city:"Miami", country:"US", exp:2, source:"seed" }
  ];
  filtered: Row[] = [...this.rows];
  total: number = this.rows.length;

  barChartType: ChartType = "bar";
  barChartLabels: string[] = [];
  barChartData = [{ data: [] as number[], label: "Workers" }];
  barChartOptions: ChartConfiguration["options"] = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { x: { beginAtZero: true }, y: { beginAtZero: true } }
  };

  constructor() { this.refreshChart(); }

  private computeCategoryCounts(rows: Row[]): [string, number][] {
    const map = new Map<string, number>();
    for (const r of rows) {
      const k = (r.category || "unknown").toLowerCase();
      map.set(k, (map.get(k) || 0) + 1);
    }
    return Array.from(map.entries()).sort((a,b)=>a[0].localeCompare(b[0]));
  }

  refreshChart(): void {
    const entries = this.computeCategoryCounts(this.filtered);
    this.barChartLabels = entries.map(e => e[0]);
    this.barChartData = [{ data: entries.map(e => e[1]), label: "Workers" }];
  }

  clearAll(): void {
    this.rows = [];
    this.filtered = [];
    this.total = 0;
    this.refreshChart();
  }

  geocodeMissing(): void {
    for (const r of this.rows) {
      if (r.lat == null || r.lng == null) {
        r.lat = 25.7 + (Math.random()-0.5)*0.5;
        r.lng = -80.3 + (Math.random()-0.5)*0.5;
      }
    }
    this.filtered = [...this.rows];
    this.total = this.rows.length;
    this.refreshChart();
  }

  async onPickFiles(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    if (!files.length) { input.value = ""; return; }

    this.clearAll();

    for (const f of files) {
      if (f.name.toLowerCase().endsWith(".csv")) {
        const text = await f.text();
        const lines = text.split(/\r?\n/).filter(Boolean);
        const headers = (lines.shift() || "").split(",").map(h => h.trim().toLowerCase());
        for (const line of lines) {
          const cols = line.split(",");
          const rec: any = {};
          headers.forEach((h, i) => { rec[h] = (cols[i] ?? "").trim(); });
          const row: Row = {
            name: rec.name || rec.nombre || "Unknown",
            category: (rec.category || rec.trade || rec.categoria_laboral || "unknown").toString(),
            phone: rec.phone || rec.telefono || "",
            email: rec.email || "",
            address: rec.address || rec.direccion || "",
            city: rec.city || "",
            state: rec.state || "",
            country: rec.country || "",
            lat: rec.lat ? Number(rec.lat) : undefined,
            lng: rec.lng ? Number(rec.lng) : undefined,
            source: f.name
          };
          this.rows.push(row);
        }
      } else {
        this.rows.push({ name: f.name.replace(/\.[^.]+$/, ""), category: "unknown", source: f.name });
      }
    }

    this.filtered = [...this.rows];
    this.total = this.rows.length;
    this.refreshChart();
    input.value = "";
  }
}
