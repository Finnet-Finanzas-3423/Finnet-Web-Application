export type TipoTasa = 'EFECTIVA' | 'NOMINAL';
export type Periodicidad = 'DIARIA' | 'SEMANAL' | 'QUINCENAL' | 'MENSUAL' | 'BIMESTRAL' |
  'TRIMESTRAL' | 'CUATRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
export type PlazoGracia = 'NINGUNO' | 'PARCIAL' | 'TOTAL';
export type MetodoAmortizacion = 'FRANCES' | 'ALEMAN' | 'AMERICANO';
export type Moneda = 'PEN' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY' | 'INR' | 'AUD' | 'CAD' |
  'CHF' | 'NZD' | 'RUB' | 'ZAR' | 'BRL' | 'MXN' | 'ARS' | 'CLP' | 'COP' |
  'VEF' | 'UYU';

export interface BonoModel {
  id?: number;
  nombre: string;
  descripcion: string;
  userId: number;

  valorNominal: number;
  valorComercial: number;
  moneda: Moneda;

  fechaEmision: Date | string;
  fechaVencimiento: Date | string;

  tasaCupon: number;
  tipoTasaCupon: TipoTasa;
  capitalizacionCupon: Periodicidad;
  tasaMercado: number;
  tipoTasaMercado: TipoTasa;
  capitalizacionMercado: Periodicidad;

  frecuenciaPago: Periodicidad;
  metodoAmortizacion: MetodoAmortizacion;

  plazoGracia: PlazoGracia;
  duracionPlazoGracia: number;

  primaRedencion: number;
  estructuracion: number;
  colocacion: number;
  flotacion: number;
  cavali: number;
  comision: number;
  gastosAdministrativos: number;
}
