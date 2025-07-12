import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BonoService } from '../../shared/services/bono.service';
import { CommonModule } from '@angular/common';
import { BonoModel } from '../../shared/models/bono.model';
import { HttpClientModule } from '@angular/common/http';
import Chart from 'chart.js/auto';

interface AmortizacionRow {
  saldoInicial: number | string;
  amortizacion: number;
  interes: number;
  cuota: number;
  saldoFinal: number;
  periodo?: number;
}

interface CalculationResultsResponse {
  cupones: AmortizacionRow[];
  resultados: {
    tir: number;
    tcea: number;
  };
}

@Component({
  selector: 'app-bono-detail',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './bono-detail.component.html',
  styleUrl: './bono-detail.component.css'
})
export class BonoDetailComponent implements OnInit, AfterViewInit {
  bonoId: number | null = null;
  bono: BonoModel | null = null;
  calculationResults: AmortizacionRow[] = [];
  tir: number | null = null;
  tcea: number | null = null;
  isLoading = true;
  error: string | null = null;
  activeTab = 'resumen';

  // Chart objects
  saldoChart: Chart | null = null;
  pagosChart: Chart | null = null;
  flujoChart: Chart | null = null;
  resumenDistribucionChart: Chart | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bonoService: BonoService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.bonoId = +id;
        this.loadBonoDetails();
      } else {
        this.error = "ID de bono no proporcionado";
        this.isLoading = false;
      }
    });
  }

  ngAfterViewInit(): void {
    // Charts will be initialized when activeTab is set to 'graficas'
  }

  loadBonoDetails(): void {
    if (!this.bonoId) return;

    this.bonoService.getBonoById(this.bonoId).subscribe({
      next: (data) => {
        this.bono = data;
        this.calculateBonoDetails();
      },
      error: (err) => {
        this.error = `Error al cargar datos del bono: ${err.message}`;
        this.isLoading = false;
      }
    });
  }

  calculateBonoDetails(): void {
    if (!this.bonoId) return;

    this.bonoService.calculateBono(this.bonoId).subscribe({
      next: (response: CalculationResultsResponse) => {
        // Extraer cupones y resultados de la respuesta
        this.calculationResults = response.cupones;
        this.tir = response.resultados.tir;
        this.tcea = response.resultados.tcea;

        this.isLoading = false;

        // Inicializar gráficos si corresponde
        if (this.activeTab === 'graficas') {
          setTimeout(() => {
            this.initCharts();
          }, 100);
        } else if (this.activeTab === 'resumen') {
          setTimeout(() => {
            this.initResumenChart();
          }, 100);
        }
      },
      error: (err) => {
        this.error = `Error al calcular detalles del bono: ${err.message}`;
        this.isLoading = false;
      }
    });
  }

  setActiveTab(tabName: string): void {
    this.activeTab = tabName;

    // Initialize charts if switching to the charts tab
    if (tabName === 'graficas' && this.calculationResults.length > 0) {
      setTimeout(() => {
        this.initCharts();
      }, 100);
    } else if (tabName === 'resumen' && this.calculationResults.length > 0) {
      setTimeout(() => {
        this.initResumenChart();
      }, 100);
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  initResumenChart(): void {
    // Implementación del gráfico de resumen
    if (this.resumenDistribucionChart) {
      this.resumenDistribucionChart.destroy();
    }

    const ctx = document.getElementById('resumenDistribucionChart') as HTMLCanvasElement;
    if (!ctx) return;

    // Preparar datos para el gráfico
    const labels = ['Interés', 'Amortización'];
    const data = [this.totalInteres, this.totalAmortizacion];

    this.resumenDistribucionChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Distribución de Pagos',
          data: data,
          backgroundColor: [
            'rgba(79, 172, 254, 0.7)',
            'rgba(0, 242, 254, 0.7)'
          ],
          borderColor: [
            'rgb(79, 172, 254)',
            'rgb(0, 242, 254)'
          ],
          borderWidth: 1,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.parsed.y;
                const total = data[0] + data[1];
                const percentage = Math.round((value / total) * 100);
                return `${labels[context.dataIndex]}: ${value.toLocaleString('es-PE')} (${percentage}%)`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              display: true,
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              callback: function(value) {
                if (typeof value === 'number') {
                  return value.toLocaleString('es-PE');
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
        }
      }
    });
  }

  initCharts(): void {
    // Destroy existing charts to prevent duplicates
    if (this.saldoChart) this.saldoChart.destroy();
    if (this.pagosChart) this.pagosChart.destroy();
    if (this.flujoChart) this.flujoChart.destroy();

    this.createSaldoChart();
    this.createPagosChart();
    this.createFlujoChart();
  }

  createSaldoChart(): void {
    const ctx = document.getElementById('saldoChart') as HTMLCanvasElement;
    if (!ctx) return;

    const periodos = this.calculationResults.map((row, i) => `Periodo ${i}`);
    const saldosIniciales = this.calculationResults.map(row =>
      typeof row.saldoInicial === 'string' ? parseFloat(row.saldoInicial) : row.saldoInicial
    );
    const saldosFinales = this.calculationResults.map(row => row.saldoFinal);

    this.saldoChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: periodos,
        datasets: [{
          label: 'Saldo Inicial',
          data: saldosIniciales,
          borderColor: '#4facfe',
          backgroundColor: 'rgba(79, 172, 254, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.1
        },
          {
            label: 'Saldo Final',
            data: saldosFinales,
            borderColor: '#00f2fe',
            borderWidth: 2,
            fill: false,
            tension: 0.1
          }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Evolución del Saldo'
          },
          legend: {
            position: 'bottom'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Saldo'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Periodo'
            }
          }
        }
      }
    });
  }

  createPagosChart(): void {
    const ctx = document.getElementById('pagosChart') as HTMLCanvasElement;
    if (!ctx) return;

    const totalInteres = this.totalInteres;
    const totalAmortizacion = this.totalAmortizacion;

    this.pagosChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Interés', 'Amortización'],
        datasets: [{
          data: [totalInteres, totalAmortizacion],
          backgroundColor: ['#4facfe', '#00f2fe'],
          borderWidth: 0,
          borderRadius: 5,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Distribución de Pagos'
          },
          legend: {
            position: 'bottom'
          }
        },
        cutout: '60%'
      }
    });
  }

  createFlujoChart(): void {
    const ctx = document.getElementById('flujoChart') as HTMLCanvasElement;
    if (!ctx) return;

    const periodos = this.calculationResults.map((row, i) => `Periodo ${i}`);
    const intereses = this.calculationResults.map(row => row.interes);
    const amortizaciones = this.calculationResults.map(row => row.amortizacion);
    const cuotas = this.calculationResults.map(row => row.cuota);

    this.flujoChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: periodos,
        datasets: [
          {
            label: 'Amortización',
            data: amortizaciones,
            backgroundColor: '#00f2fe',
            borderWidth: 0,
            borderRadius: 6,
            stack: 'Stack 0'
          },
          {
            label: 'Interés',
            data: intereses,
            backgroundColor: '#4facfe',
            borderWidth: 0,
            borderRadius: 6,
            stack: 'Stack 0'
          },
          {
            label: 'Cuota',
            data: cuotas,
            type: 'line',
            borderColor: '#1a1f35',
            borderWidth: 2,
            fill: false,
            pointBackgroundColor: '#1a1f35',
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            grid: {
              display: false
            }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          }
        },
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  get valorNominal(): number {
    if (this.calculationResults.length === 0) return 0;
    const primerSaldo = this.calculationResults[0].saldoInicial;
    return typeof primerSaldo === 'string' ? parseFloat(primerSaldo) : primerSaldo;
  }

  get totalInteres(): number {
    return this.calculationResults.reduce((sum, row) => sum + row.interes, 0);
  }

  get totalAmortizacion(): number {
    return this.calculationResults.reduce((sum, row) => sum + row.amortizacion, 0);
  }

  get totalCuotas(): number {
    return this.calculationResults.reduce((sum, row) => sum + row.cuota, 0);
  }

  // Getter para obtener el número de períodos (restando 1 porque no se cuenta el periodo 0)
  get numeroPeriodos(): number {
    return Math.max(0, this.calculationResults.length - 1);
  }

  // Helper para formatear porcentajes
  formatPercent(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return '0%';

    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '0%';

    return `${numValue}%`;
  }
}
