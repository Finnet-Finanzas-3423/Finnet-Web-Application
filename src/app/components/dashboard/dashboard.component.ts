import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BonoService } from '../../shared/services/bono.service';
import { BonoModel } from '../../shared/models/bono.model';
import Chart from 'chart.js/auto';
import {ToolbarComponent} from '../../shared/components/toolbar/toolbar.component';
import {FooterComponent} from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ToolbarComponent, FooterComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  bonos: BonoModel[] = [];
  isLoading = true;
  error: string | null = null;

  // Filter and sorting options
  filterOption = 'all';
  sortOption = 'fechaVencimiento';
  viewMode = 'grid';

  // Charts
  tasaInteresChart: Chart | null = null;
  vencimientoChart: Chart | null = null;

  // Summary metrics
  get totalBonos(): number {
    return this.bonos.length;
  }

  get valorTotal(): number {
    return this.bonos.reduce((sum, bono) => {
      const valorStr = bono.valorNominal;
      const valor = typeof valorStr === 'string' ? parseFloat(valorStr) : (valorStr || 0);
      return isNaN(valor) ? sum : sum + valor;
    }, 0);
  }

  get tasaPromedio(): number {
    if (this.bonos.length === 0) return 0;

    const total = this.bonos.reduce((sum, bono) => {
      const tasaStr = bono.tasaCupon;
      const tasa = typeof tasaStr === 'string' ? parseFloat(tasaStr) : (tasaStr || 0);
      return isNaN(tasa) ? sum : sum + tasa;
    }, 0);

    return total / this.bonos.length;
  }

  get proximosAVencer(): number {
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    return this.bonos.filter(bono => {
      if (!bono.fechaVencimiento) return false;
      const vencimiento = new Date(bono.fechaVencimiento);
      return vencimiento <= threeMonthsFromNow;
    }).length;
  }

  constructor(private bonoService: BonoService, private router: Router) {}

  ngOnInit(): void {
    this.loadBonosByUser();
  }

  loadBonosByUser(): void {
    const userId = this.getUserId();
    if (!userId) {
      this.error = 'Usuario no identificado. Por favor, inicie sesión nuevamente.';
      this.isLoading = false;
      return;
    }

    this.bonoService.getBonosByUser(userId).subscribe({
      next: (data) => {
        this.bonos = data;
        this.isLoading = false;
        setTimeout(() => {
          this.initCharts();
        }, 100);
      },
      error: (err) => {
        this.error = `Error al cargar los bonos: ${err.message}`;
        this.isLoading = false;
      }
    });
  }

  getUserId(): number | null {
    const id = localStorage.getItem('id');
    return id ? parseInt(id, 10) : null;
  }

  initCharts(): void {
    this.createTasaInteresChart();
    this.createVencimientoChart();
  }

  createTasaInteresChart(): void {
    // Group bonds by interest rate range
    const tasaRanges = new Map<string, number>();

    this.bonos.forEach(bono => {
      const tasaStr = bono.tasaCupon;
      const tasa = typeof tasaStr === 'string' ? parseFloat(tasaStr) : (tasaStr || 0);

      if (isNaN(tasa)) return;

      let rangeKey;
      if (tasa <= 5) rangeKey = '0-5%';
      else if (tasa <= 10) rangeKey = '5-10%';
      else if (tasa <= 20) rangeKey = '10-20%';
      else rangeKey = '>20%';

      tasaRanges.set(rangeKey, (tasaRanges.get(rangeKey) || 0) + 1);
    });

    const ctx = document.getElementById('tasaInteresChart') as HTMLCanvasElement;
    if (!ctx) return;

    this.tasaInteresChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Array.from(tasaRanges.keys()),
        datasets: [{
          data: Array.from(tasaRanges.values()),
          backgroundColor: [
            '#4285F4',
            '#34A853',
            '#FBBC05',
            '#EA4335'
          ],
          borderWidth: 1,
          borderRadius: 5,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12
            }
          }
        },
        cutout: '65%'
      }
    });
  }

  createVencimientoChart(): void {
    // Group bonds by year and quarter
    const vencimientoData = new Map<string, number>();

    this.bonos.forEach(bono => {
      if (!bono.fechaVencimiento) return;

      const vencimientoDate = new Date(bono.fechaVencimiento);
      const year = vencimientoDate.getFullYear();
      const quarter = Math.floor(vencimientoDate.getMonth() / 3) + 1;
      const label = `${year} Q${quarter}`;

      const valorStr = bono.valorNominal;
      const valor = typeof valorStr === 'string' ? parseFloat(valorStr) : (valorStr || 0);

      if (!isNaN(valor)) {
        vencimientoData.set(label, (vencimientoData.get(label) || 0) + valor);
      }
    });

    // Sort keys by date
    const sortedKeys = Array.from(vencimientoData.keys()).sort((a, b) => {
      const [yearA, quarterA] = a.split(' ');
      const [yearB, quarterB] = b.split(' ');

      if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
      return quarterA.localeCompare(quarterB);
    });

    const ctx = document.getElementById('vencimientoChart') as HTMLCanvasElement;
    if (!ctx) return;

    this.vencimientoChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sortedKeys,
        datasets: [{
          label: 'Valor Nominal',
          data: sortedKeys.map(key => vencimientoData.get(key) || 0),
          backgroundColor: '#4285F4',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                if (typeof value === 'number') {
                  return value.toLocaleString('es-PE', {
                    style: 'currency',
                    currency: 'PEN',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  });
                }
                return value;
              }
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }

  getFilteredBonos(): BonoModel[] {
    let filtered = [...this.bonos];

    // Apply filters
    if (this.filterOption === 'upcoming') {
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

      filtered = filtered.filter(bono => {
        if (!bono.fechaVencimiento) return false;
        const vencimiento = new Date(bono.fechaVencimiento);
        return vencimiento <= threeMonthsFromNow;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (this.sortOption) {
        case 'fechaVencimiento':
          const dateA = a.fechaVencimiento ? new Date(a.fechaVencimiento).getTime() : 0;
          const dateB = b.fechaVencimiento ? new Date(b.fechaVencimiento).getTime() : 0;
          return dateA - dateB;
        case 'valorNominal':
          const valorA = this.parseFloat(a.valorNominal || '0');
          const valorB = this.parseFloat(b.valorNominal || '0');
          return valorB - valorA;
        case 'tasaCupon':
          const tasaA = this.parseFloat(a.tasaCupon || '0');
          const tasaB = this.parseFloat(b.tasaCupon || '0');
          return tasaB - tasaA;
        case 'nombre':
          return (a.nombre || '').localeCompare(b.nombre || '');
        default:
          return 0;
      }
    });

    return filtered;
  }

  calculateMonthsToExpiry(fechaVencimiento: string | null | undefined): number {
    if (!fechaVencimiento) return 0;

    const vencimiento = new Date(fechaVencimiento);
    const today = new Date();

    const monthDiff = (vencimiento.getFullYear() - today.getFullYear()) * 12 +
      (vencimiento.getMonth() - today.getMonth());

    return Math.max(0, monthDiff);
  }

  getMonthsLabel(months: number): string {
    if (months === 1) return '1 mes';
    return `${months} meses`;
  }

  setFilterOption(option: string): void {
    this.filterOption = option;
  }

  setSortOption(option: string): void {
    this.sortOption = option;
  }

  setViewMode(mode: string): void {
    this.viewMode = mode;
  }

  navigateToBono(id: number): void {
    this.router.navigate(['/bonos', id]);
  }

  createNewBono(): void {
    this.router.navigate(['/bonos/nuevo']);
  }

  getCurrencySymbol(moneda: string | undefined): string {
    if (!moneda) return 'S/';

    switch (moneda) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'CAD': return 'C$';
      default: return 'S/';
    }
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'No disponible';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return 'Fecha inválida';
    }
  }

  // Helper method to safely parse float values
  parseFloat(value: string | number | null | undefined): number {
    if (value === null || value === undefined) return 0;

    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }

    return value;
  }

  editBono(id: number, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/bonos', id, 'editar']);
  }

  hasProperty(obj: any, prop: string): boolean {
    return obj && Object.prototype.hasOwnProperty.call(obj, prop);
  }
}
