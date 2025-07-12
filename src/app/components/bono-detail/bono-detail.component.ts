import {Component, OnInit, AfterViewInit, OnDestroy} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BonoService } from '../../shared/services/bono.service';
import { CommonModule } from '@angular/common';
import { BonoModel } from '../../shared/models/bono.model';
import { HttpClientModule } from '@angular/common/http';
import * as XLSX from 'xlsx';
import Chart from 'chart.js/auto';
import { saveAs } from 'file-saver';

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
  metricas: {
    precioMaximo: number;
    duracion: number | null;
    duracionModificada: number | null;
    convexidad: number | null;
    trea: number;
  };
}

@Component({
  selector: 'app-bono-detail',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './bono-detail.component.html',
  styleUrl: './bono-detail.component.css'
})
export class BonoDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  bonoId: number | null = null;
  bono: BonoModel | null = null;
  calculationResults: AmortizacionRow[] = [];
  tir: number | null = null;
  tcea: number | null = null;

  precioMaximo: number | null = null;
  duracion: number | null = null;
  duracionModificada: number | null = null;
  convexidad: number | null = null;
  trea: number | null = null;

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
  ) {
  }

  ngOnDestroy(): void {
    if (this.saldoChart) this.saldoChart.destroy();
    if (this.pagosChart) this.pagosChart.destroy();
    if (this.flujoChart) this.flujoChart.destroy();
    if (this.resumenDistribucionChart) this.resumenDistribucionChart.destroy();
  }

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

  exportToExcel(): void {
    if (!this.bono || this.calculationResults.length === 0) return;

    try {
      const workbook = XLSX.utils.book_new();
      workbook.Props = {
        Title: `Bono ${this.bono.nombre}`,
        Subject: "Detalles de Bono",
        Author: "FinNet App",
        CreatedDate: new Date(),
        Company: "FinNet"
      };

      // ===== PÁGINA 1: RESUMEN DEL BONO =====
      // Crear una matriz para construir la hoja con formato
      const resumenData = [
        ["RESUMEN DEL BONO", "", "", "", ""],
        ["", "", "", "", ""],
        ["Información General", "", "", "", ""],
        ["Nombre:", this.bono.nombre, "", "Fecha emisión:", this.formatDate(this.bono.fechaEmision)],
        ["Valor nominal:", this.formatCurrency(this.valorNominal), "", "Fecha vencimiento:", this.formatDate(this.bono.fechaVencimiento)],
        ["Moneda:", this.bono.moneda, "", "Método amortización:", this.bono.metodoAmortizacion],
        ["Descripción:", this.bono.descripcion || "No disponible", "", "Frecuencia de pago:", this.bono.frecuenciaPago],
        ["", "", "", "", ""],
        ["Tasas y Capitalizaciones", "", "", "", ""],
        ["Tasa cupón:", `${this.bono.tasaCupon}%`, "", "Tasa mercado:", `${this.bono.tasaMercado}%`],
        ["Tipo tasa cupón:", this.bono.tipoTasaCupon, "", "Tipo tasa mercado:", this.bono.tipoTasaMercado],
        ["Capitalización cupón:", this.bono.capitalizacionCupon, "", "Capitalización mercado:", this.bono.capitalizacionMercado],
        ["", "", "", "", ""],
        ["Indicadores Financieros", "", "", "", ""],
        ["TIR:", `${this.tir?.toFixed(2)}%`, "", "TCEA:", `${this.tcea?.toFixed(2)}%`],
        ["TREA:", `${this.trea?.toFixed(2) || 'N/A'}%`, "", "Prima redención:", `${this.bono.primaRedencion}%`],
        ["Precio máximo:", this.formatCurrency(this.precioMaximo), "", "Valor comercial:", this.formatCurrency(this.bono.valorComercial)],
        ["Duración:", this.duracion !== null ? `${this.duracion.toFixed(4)}` : "N/A", "", "Duración modificada:", this.duracionModificada !== null ? `${this.duracionModificada.toFixed(4)}` : "N/A"],
        ["Convexidad:", this.convexidad !== null ? `${this.convexidad.toFixed(6)}` : "N/A", "", "", ""],
        ["", "", "", "", ""],
        ["Costos y Comisiones", "", "", "", ""],
        ["Comisión:", this.formatCurrency(this.bono.comision), "", "Estructuración:", this.formatCurrency(this.bono.estructuracion)],
        ["Gastos administrativos:", this.formatCurrency(this.bono.gastosAdministrativos), "", "Colocación:", this.formatCurrency(this.bono.colocacion)],
        ["Flotación:", `${this.bono.flotacion}%`, "", "Cavali:", `${this.bono.cavali}%`],
        ["", "", "", "", ""],
        ["Resultados Financieros", "", "", "", ""],
        ["Total cuotas:", this.formatCurrency(this.totalCuotas), "", "Total intereses:", this.formatCurrency(this.totalInteres)],
        ["Total amortización:", this.formatCurrency(this.totalAmortizacion), "", "Número períodos:", `${this.numeroPeriodos}`],
        ["Cuota promedio:", this.formatCurrency(this.calculationResults.length > 0 ? this.totalCuotas / this.calculationResults.length : 0), "", "", ""]
      ];

      const resumenSheet = XLSX.utils.aoa_to_sheet(resumenData);

      // Aplicar estilos a la hoja de resumen
      const resumenRange = {s: {c: 0, r: 0}, e: {c: 4, r: resumenData.length - 1}};

      // Configurar ancho de columnas
      const colWidths = [{wch: 25}, {wch: 25}, {wch: 5}, {wch: 25}, {wch: 25}];
      resumenSheet['!cols'] = colWidths;

      // Títulos en negrita y con fondo
      this.applyStyles(resumenSheet, 0, 0, {
        font: {bold: true, sz: 16},
        fill: {fgColor: {rgb: "4FACFE"}},
        alignment: {horizontal: "center"}
      });
      this.applyMergedStyles(resumenSheet, 0, 0, 0, 4, {
        font: {bold: true, sz: 16},
        fill: {fgColor: {rgb: "E6F3FF"}},
        alignment: {horizontal: "center"}
      });

      // Estilos para subtítulos de secciones
      const sectionRows = [2, 8, 13, 20, 25]; // Filas con subtítulos de sección
      for (const row of sectionRows) {
        this.applyMergedStyles(resumenSheet, row, 0, row, 1, {
          font: {bold: true, sz: 12},
          fill: {fgColor: {rgb: "E6F3FF"}}
        });
      }

      // Estilos para etiquetas
      for (let r = 3; r < resumenData.length; r++) {
        if (resumenData[r][0] !== "") {
          this.applyStyles(resumenSheet, r, 0, {font: {bold: true}});
          this.applyStyles(resumenSheet, r, 3, {font: {bold: true}});
        }
      }

      const flujoHeader = [
        ["FLUJO DE CAJA DEL BONO", "", "", "", "", ""],
        ["", "", "", "", "", ""],
        ["Periodo", "Saldo Inicial", "Cuota", "Interés", "Amortización", "Saldo Final"]
      ];

      const flujoCaja = this.calculationResults.map((row, index) => [
        index,
        typeof row.saldoInicial === 'string' ? parseFloat(row.saldoInicial) : row.saldoInicial,
        row.cuota,
        row.interes,
        row.amortizacion,
        row.saldoFinal
      ]);

      const totalRow = [
        "Total",
        this.valorNominal,
        this.totalCuotas,
        this.totalInteres,
        this.totalAmortizacion,
        0
      ];

      const flujoCompleto = [...flujoHeader, ...flujoCaja, totalRow];
      const flujoSheet = XLSX.utils.aoa_to_sheet(flujoCompleto);

      // Aplicar estilos al flujo de caja
      const flujoRange = {s: {c: 0, r: 0}, e: {c: 5, r: flujoCompleto.length - 1}};
      flujoSheet['!ref'] = XLSX.utils.encode_range(flujoRange);

      // Configurar ancho de columnas
      flujoSheet['!cols'] = [
        {wch: 10}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}
      ];

      // Título principal
      this.applyMergedStyles(flujoSheet, 0, 0, 0, 5, {
        font: {bold: true, sz: 16},
        fill: {fgColor: {rgb: "E6F3FF"}},
        alignment: {horizontal: "center"}
      });

      // Encabezados de tabla
      for (let c = 0; c < 6; c++) {
        this.applyStyles(flujoSheet, 2, c, {
          font: {bold: true},
          fill: {fgColor: {rgb: "E6F3FF"}},
          alignment: {horizontal: "center"}
        });
      }

      // Formato de números para todas las celdas de datos
      for (let r = 3; r < flujoCompleto.length - 1; r++) {
        for (let c = 1; c < 6; c++) {
          this.applyStyles(flujoSheet, r, c, {numFmt: this.bono.moneda === 'PEN' ? '"S/ "#,##0.00' : '"$ "#,##0.00'});
        }
      }

      // Fila de totales
      const lastRow = flujoCompleto.length - 1;
      this.applyStyles(flujoSheet, lastRow, 0, {font: {bold: true}});
      for (let c = 1; c < 6; c++) {
        this.applyStyles(flujoSheet, lastRow, c, {
          font: {bold: true},
          numFmt: this.bono.moneda === 'PEN' ? '"S/ "#,##0.00' : '"$ "#,##0.00'
        });
      }

      // ===== PÁGINA 3: INDICADORES Y GRÁFICOS =====
      // Crear una matriz para los indicadores clave
      const indicadoresData = [
        ["INDICADORES FINANCIEROS", "", "", ""],
        ["", "", "", ""],
        ["Indicador", "Valor", "Indicador", "Valor"],
        ["TIR", `${this.tir?.toFixed(2)}%`, "TCEA", `${this.tcea?.toFixed(2)}%`],
        ["TREA", `${this.trea?.toFixed(2) || 'N/A'}%`, "Valor Nominal", this.formatCurrency(this.valorNominal)],
        ["Precio Máximo", this.formatCurrency(this.precioMaximo), "Duración", this.duracion !== null ? `${this.duracion.toFixed(4)}` : "N/A"],
        ["Duración Modificada", this.duracionModificada !== null ? `${this.duracionModificada.toFixed(4)}` : "N/A", "Convexidad", this.convexidad !== null ? `${this.convexidad.toFixed(6)}` : "N/A"],
        ["", "", "", ""],
        ["DISTRIBUCIÓN DE PAGOS", "", "", ""],
        ["", "", "", ""],
        ["Concepto", "Monto", "Porcentaje", ""],
        ["Intereses", this.formatCurrency(this.totalInteres), `${this.calcularPorcentaje(this.totalInteres, this.totalInteres + this.totalAmortizacion)}%`, ""],
        ["Amortización", this.formatCurrency(this.totalAmortizacion), `${this.calcularPorcentaje(this.totalAmortizacion, this.totalInteres + this.totalAmortizacion)}%`, ""],
        ["Total", this.formatCurrency(this.totalInteres + this.totalAmortizacion), "100%", ""]
      ];

      const indicadoresSheet = XLSX.utils.aoa_to_sheet(indicadoresData);

      // Aplicar estilos a indicadores
      indicadoresSheet['!cols'] = [{wch: 25}, {wch: 15}, {wch: 25}, {wch: 15}];

      // Títulos principales
      this.applyMergedStyles(indicadoresSheet, 0, 0, 0, 3, {
        font: {bold: true, sz: 16},
        fill: {fgColor: {rgb: "E6F3FF"}},
        alignment: {horizontal: "center"}
      });
      this.applyMergedStyles(indicadoresSheet, 8, 0, 8, 3, {
        font: {bold: true, sz: 16},
        fill: {fgColor: {rgb: "E6F3FF"}},
        alignment: {horizontal: "center"}
      });

      // Encabezados de tablas
      for (let c = 0; c < 4; c++) {
        this.applyStyles(indicadoresSheet, 2, c, {font: {bold: true}, fill: {fgColor: {rgb: "E6F3FF"}}});
        if (c < 3) this.applyStyles(indicadoresSheet, 10, c, {font: {bold: true}, fill: {fgColor: {rgb: "E6F3FF"}}});
      }

      this.applyStyles(indicadoresSheet, 13, 0, {font: {bold: true}});
      this.applyStyles(indicadoresSheet, 13, 1, {
        font: {bold: true},
        numFmt: this.bono.moneda === 'PEN' ? '"S/ "#,##0.00' : '"$ "#,##0.00'
      });
      this.applyStyles(indicadoresSheet, 13, 2, {font: {bold: true}});

      XLSX.utils.book_append_sheet(workbook, resumenSheet, "Resumen");
      XLSX.utils.book_append_sheet(workbook, flujoSheet, "Flujo de Caja");
      XLSX.utils.book_append_sheet(workbook, indicadoresSheet, "Indicadores");

      const fileName = `${this.bono.nombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;

      const excelBuffer = XLSX.write(workbook, {bookType: 'xlsx', type: 'array'});
      const data = new Blob([excelBuffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
      saveAs(data, fileName);

    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      alert('Ocurrió un error al exportar los datos a Excel. Por favor, inténtelo nuevamente.');
    }
  }

  private applyStyles(worksheet: XLSX.WorkSheet, row: number, col: number, style: any): void {
    const cellRef = XLSX.utils.encode_cell({r: row, c: col});
    if (!worksheet['!styles']) worksheet['!styles'] = {};
    worksheet['!styles'][cellRef] = style;
  }

  private applyMergedStyles(worksheet: XLSX.WorkSheet, startRow: number, startCol: number, endRow: number, endCol: number, style: any): void {
    this.applyStyles(worksheet, startRow, startCol, style);

    if (!worksheet['!merges']) worksheet['!merges'] = [];
    worksheet['!merges'].push({s: {r: startRow, c: startCol}, e: {r: endRow, c: endCol}});
  }

  private formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined) return 'N/A';

    const formatter = new Intl.NumberFormat(this.bono?.moneda === 'PEN' ? 'es-PE' : 'en-US', {
      style: 'currency',
      currency: this.bono?.moneda || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    return formatter.format(value);
  }

  private formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';

    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  private calcularPorcentaje(valor: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((valor / total) * 100 * 100) / 100; // Redondear a 2 decimales
  }

  ngAfterViewInit(): void {
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
        this.calculationResults = response.cupones;
        this.tir = response.resultados.tir;
        this.tcea = response.resultados.tcea;

        if (response.metricas) {
          this.precioMaximo = response.metricas.precioMaximo;
          this.duracion = response.metricas.duracion;
          this.duracionModificada = response.metricas.duracionModificada;
          this.convexidad = response.metricas.convexidad;
          this.trea = response.metricas.trea;
        }

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
              label: function (context) {
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
              callback: function (value) {
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
    const calculatedInterest = this.totalCuotas - this.totalAmortizacion;

    const summedInterest = this.calculationResults.reduce((sum, row) => sum + row.interes, 0);

    if (Math.abs(calculatedInterest - summedInterest) > 0.01) {
      console.warn(`Discrepancia en el cálculo de intereses:
      - Por fórmula (cuotas - amortización): ${calculatedInterest.toFixed(2)}
      - Por suma directa de intereses: ${summedInterest.toFixed(2)}
      - Diferencia: ${(calculatedInterest - summedInterest).toFixed(2)}`);
    }

    return calculatedInterest;
  }

  get totalAmortizacion(): number {
    return this.calculationResults.reduce((sum, row) => sum + row.amortizacion, 0);
  }

  get totalCuotas(): number {
    return this.calculationResults.reduce((sum, row) => sum + row.cuota, 0);
  }

  get numeroPeriodos(): number {
    return Math.max(0, this.calculationResults.length - 1);
  }

  formatPercent(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return '0%';

    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '0%';

    return `${numValue}%`;
  }
}
