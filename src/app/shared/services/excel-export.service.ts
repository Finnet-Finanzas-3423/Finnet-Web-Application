import { Injectable } from '@angular/core'
import { BonoModel } from '../models/bono.model'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

@Injectable({ providedIn: 'root' })
export class ExcelExportService {
  exportBonoToExcel(bono: BonoModel, calculationResults: any): void {
    if (!bono || !calculationResults?.cupones?.length) throw new Error('Datos insuficientes para exportar a Excel')

    const workbook = XLSX.utils.book_new()
    workbook.Props = {
      Title: `Bono ${bono.nombre}`,
      Subject: 'Detalles de Bono',
      Author: 'FinNet App',
      CreatedDate: new Date(),
      Company: 'FinNet'
    }

    const cupones = calculationResults.cupones
    const valorNominal = +cupones[0].saldoInicial || 0
    const totalCuotas = cupones.reduce((s: number, r: any) => s + r.cuota, 0)
    const totalAmortizacion = cupones.reduce((s: number, r: any) => s + r.amortizacion, 0)
    const totalInteres = totalCuotas - totalAmortizacion
    const numeroPeriodos = Math.max(0, cupones.length - 1)

    const comisionMonto = valorNominal * (bono.comision / 100)
    const gastosAdminMonto = valorNominal * (bono.gastosAdministrativos / 100)
    const estructuracionMonto = valorNominal * (bono.estructuracion / 100)
    const colocacionMonto = valorNominal * (bono.colocacion / 100)
    const flotacionMonto = valorNominal * (bono.flotacion / 100)
    const cavaliMonto = valorNominal * (bono.cavali / 100)
    const totalGastos = comisionMonto + gastosAdminMonto + estructuracionMonto + colocacionMonto + flotacionMonto + cavaliMonto

    const metricas = calculationResults.metricas || {}
    const tir = calculationResults.resultados?.tir || 0
    const tcea = calculationResults.resultados?.tcea || 0

    const resumenSheet = XLSX.utils.aoa_to_sheet(
      this.createResumenSheet(
        bono,
        valorNominal,
        totalCuotas,
        totalInteres,
        totalAmortizacion,
        numeroPeriodos,
        cupones.length,
        tir,
        tcea,
        metricas,
        comisionMonto,
        gastosAdminMonto,
        estructuracionMonto,
        colocacionMonto,
        flotacionMonto,
        cavaliMonto,
        totalGastos
      )
    )
    this.applyDesign(resumenSheet, [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }], [25, 30, 25, 25, 30], 3)

    const flujoSheet = XLSX.utils.aoa_to_sheet(
      this.createFlujoSheet(cupones, valorNominal, totalCuotas, totalInteres, totalAmortizacion)
    )
    this.applyDesign(flujoSheet, [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }], [12, 18, 18, 18, 18, 18], 3)

    const indicadoresSheet = XLSX.utils.aoa_to_sheet(
      this.createIndicatorsSheet(bono, valorNominal, totalInteres, totalAmortizacion, tir, tcea, metricas)
    )
    this.applyDesign(indicadoresSheet, [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }], [28, 20, 28, 20], 3)

    XLSX.utils.book_append_sheet(workbook, resumenSheet, 'Resumen')
    XLSX.utils.book_append_sheet(workbook, flujoSheet, 'Flujo de Caja')
    XLSX.utils.book_append_sheet(workbook, indicadoresSheet, 'Indicadores')

    const fileName = `${bono.nombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    saveAs(new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fileName)
  }

  private applyDesign(sheet: XLSX.WorkSheet, merges: any[], colWidths: number[], freezeRows = 0): void {
    sheet['!merges'] = merges
    sheet['!cols'] = colWidths.map(w => ({ wch: w }))
    if (freezeRows > 0) sheet['!freeze'] = { ySplit: freezeRows }
  }

  private createResumenSheet(
    bono: any,
    valorNominal: number,
    totalCuotas: number,
    totalInteres: number,
    totalAmortizacion: number,
    numeroPeriodos: number,
    totalPeriodos: number,
    tir: number,
    tcea: number,
    metricas: any,
    comisionMonto: number,
    gastosAdminMonto: number,
    estructuracionMonto: number,
    colocacionMonto: number,
    flotacionMonto: number,
    cavaliMonto: number,
    totalGastos: number
  ): any[] {
    return [
      ['RESUMEN DEL BONO', '', '', '', ''],
      ['', '', '', '', ''],
      ['Información General', '', '', '', ''],
      ['Nombre:', bono.nombre, '', 'Fecha emisión:', this.formatDate(bono.fechaEmision)],
      ['Valor nominal:', this.formatCurrency(valorNominal, bono.moneda), '', 'Fecha vencimiento:', this.formatDate(bono.fechaVencimiento)],
      ['Moneda:', bono.moneda, '', 'Método amortización:', bono.metodoAmortizacion],
      ['Descripción:', bono.descripcion || 'No disponible', '', 'Frecuencia de pago:', bono.frecuenciaPago],
      ['', '', '', '', ''],
      ['Tasas y Capitalizaciones', '', '', '', ''],
      ['Tasa cupón:', `${bono.tasaCupon}%`, '', 'Tasa mercado:', `${bono.tasaMercado}%`],
      ['Tipo tasa cupón:', bono.tipoTasaCupon, '', 'Tipo tasa mercado:', bono.tipoTasaMercado],
      ['Capitalización cupón:', bono.capitalizacionCupon, '', 'Capitalización mercado:', bono.capitalizacionMercado],
      ['', '', '', '', ''],
      ['Indicadores Financieros', '', '', '', ''],
      ['TIR:', `${tir.toFixed(2)}%`, '', 'TCEA:', `${tcea.toFixed(2)}%`],
      ['TREA:', `${metricas.trea?.toFixed(2) || 'N/A'}%`, '', 'Prima redención:', `${bono.primaRedencion}%`],
      ['Precio máximo:', this.formatCurrency(metricas.precioMaximo, bono.moneda), '', 'Valor comercial:', this.formatCurrency(bono.valorComercial, bono.moneda)],
      ['Duración:', metricas.duracion !== null ? metricas.duracion.toFixed(4) : 'N/A', '', 'Duración modificada:', metricas.duracionModificada !== null ? metricas.duracionModificada.toFixed(4) : 'N/A'],
      ['Convexidad:', metricas.convexidad !== null ? metricas.convexidad.toFixed(6) : 'N/A', '', '', ''],
      ['', '', '', '', ''],
      ['Costos y Comisiones', '', '', '', ''],
      ['Comisión:', this.formatCurrency(comisionMonto, bono.moneda), `(${bono.comision}%)`, 'Estructuración:', `${this.formatCurrency(estructuracionMonto, bono.moneda)} (${bono.estructuracion}%)`],
      ['Gastos administrativos:', this.formatCurrency(gastosAdminMonto, bono.moneda), `(${bono.gastosAdministrativos}%)`, 'Colocación:', `${this.formatCurrency(colocacionMonto, bono.moneda)} (${bono.colocacion}%)`],
      ['Flotación:', this.formatCurrency(flotacionMonto, bono.moneda), `(${bono.flotacion}%)`, 'Cavali:', `${this.formatCurrency(cavaliMonto, bono.moneda)} (${bono.cavali}%)`],
      ['Total Gastos:', this.formatCurrency(totalGastos, bono.moneda), '', '', ''],
      ['', '', '', '', ''],
      ['Resultados Financieros', '', '', '', ''],
      ['Total cuotas:', this.formatCurrency(totalCuotas, bono.moneda), '', 'Total intereses:', this.formatCurrency(totalInteres, bono.moneda)],
      ['Total amortización:', this.formatCurrency(totalAmortizacion, bono.moneda), '', 'Número períodos:', `${numeroPeriodos}`],
      ['Cuota promedio:', this.formatCurrency(totalPeriodos > 0 ? totalCuotas / totalPeriodos : 0, bono.moneda), '', '', '']
    ]
  }

  private createFlujoSheet(
    cupones: any[],
    valorNominal: number,
    totalCuotas: number,
    totalInteres: number,
    totalAmortizacion: number
  ): any[] {
    const flujoHeader = [
      ['FLUJO DE CAJA DEL BONO', '', '', '', '', ''],
      ['', '', '', '', '', ''],
      ['Periodo', 'Saldo Inicial', 'Cuota', 'Interés', 'Amortización', 'Saldo Final']
    ]
    const flujoCaja = cupones.map((row, index) => [
      index,
      +row.saldoInicial,
      row.cuota,
      row.interes,
      row.amortizacion,
      row.saldoFinal
    ])
    const totalRow = ['Total', valorNominal, totalCuotas, totalInteres, totalAmortizacion, 0]
    return [...flujoHeader, ...flujoCaja, totalRow]
  }

  private createIndicatorsSheet(
    bono: any,
    valorNominal: number,
    totalInteres: number,
    totalAmortizacion: number,
    tir: number,
    tcea: number,
    metricas: any
  ): any[] {
    return [
      ['INDICADORES FINANCIEROS', '', '', ''],
      ['', '', '', ''],
      ['Indicador', 'Valor', 'Indicador', 'Valor'],
      ['TIR', `${tir.toFixed(2)}%`, 'TCEA', `${tcea.toFixed(2)}%`],
      ['TREA', `${metricas.trea?.toFixed(2) || 'N/A'}%`, 'Valor Nominal', this.formatCurrency(valorNominal, bono.moneda)],
      ['Precio Máximo', this.formatCurrency(metricas.precioMaximo, bono.moneda), 'Duración', metricas.duracion !== null ? metricas.duracion.toFixed(4) : 'N/A'],
      ['Duración Modificada', metricas.duracionModificada !== null ? metricas.duracionModificada.toFixed(4) : 'N/A', 'Convexidad', metricas.convexidad !== null ? metricas.convexidad.toFixed(6) : 'N/A'],
      ['', '', '', ''],
      ['DISTRIBUCIÓN DE PAGOS', '', '', ''],
      ['', '', '', ''],
      ['Concepto', 'Monto', 'Porcentaje', ''],
      ['Intereses', this.formatCurrency(totalInteres, bono.moneda), `${this.calcularPorcentaje(totalInteres, totalInteres + totalAmortizacion)}%`, ''],
      [
        'Amortización',
        this.formatCurrency(totalAmortizacion, bono.moneda),
        `${this.calcularPorcentaje(totalAmortizacion, totalInteres + totalAmortizacion)}%`,
        ''
      ],
      ['Total', this.formatCurrency(totalInteres + totalAmortizacion, bono.moneda), '100%', '']
    ]
  }

  private formatCurrency(value: number | null | undefined, currency: string): string {
    if (value === null || value === undefined) return 'N/A'
    return new Intl.NumberFormat(currency === 'PEN' ? 'es-PE' : 'en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  private formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A'
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  private calcularPorcentaje(valor: number, total: number): number {
    if (total === 0) return 0
    return Math.round((valor / total) * 100 * 100) / 100
  }
}
