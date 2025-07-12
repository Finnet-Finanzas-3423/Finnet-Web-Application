import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgClass, NgForOf, NgIf } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { Router, ActivatedRoute } from '@angular/router';
import {BonoModelEdit} from '../../shared/models/bono.model';
import { Moneda, Periodicidad, PlazoGracia, TipoTasa, MetodoAmortizacion } from '../../shared/models/bono.model';
import { BonoService } from '../../shared/services/bono.service';
import { ToolbarComponent } from '../../shared/components/toolbar/toolbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-edit-bono',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIf,
    NgForOf,
    NgClass
  ],
  templateUrl: './edit-bono.component.html',
  styleUrl: './edit-bono.component.css',
  animations: [
    trigger('stepAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(50px)' }),
        animate('500ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('500ms ease-in', style({ opacity: 0, transform: 'translateX(-50px)' }))
      ])
    ])
  ]
})
export class EditBonoComponent implements OnInit {
  @Output() volverEvent = new EventEmitter<void>();

  bonoForm!: FormGroup;
  bonoId!: number;
  currentStep = 0;
  submitted = false;
  showMonedaDropdown = false;
  isLoading = true;
  errorMessage = '';
  currentDate: string;
  originalBono: any = null;

  steps = [
    { title: 'Información Principal', icon: 'fa-file-signature', isValid: false },
    { title: 'Valores y Plazos', icon: 'fa-coins', isValid: false },
    { title: 'Tasas e Intereses', icon: 'fa-percentage', isValid: false },
    { title: 'Frecuencias y Método', icon: 'fa-sliders-h', isValid: false },
    { title: 'Costos Adicionales', icon: 'fa-tags', isValid: true },
    { title: 'Resumen', icon: 'fa-clipboard-check', isValid: false }
  ];

  monedas: Moneda[] = [
    'PEN', 'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'INR', 'AUD', 'CAD',
    'CHF', 'NZD', 'RUB', 'ZAR', 'BRL', 'MXN', 'ARS', 'CLP', 'COP',
    'VEF', 'UYU'
  ];

  monedasPrincipales: Moneda[] = ['PEN', 'USD', 'EUR', 'GBP'];

  frecuencias: Periodicidad[] = [
    'ANUAL', 'SEMESTRAL', 'CUATRIMESTRAL', 'TRIMESTRAL', 'BIMESTRAL',
    'MENSUAL', 'QUINCENAL', 'SEMANAL', 'DIARIA'
  ];

  capitalizaciones: Periodicidad[] = [
    'ANUAL', 'SEMESTRAL', 'CUATRIMESTRAL', 'TRIMESTRAL', 'BIMESTRAL',
    'MENSUAL', 'QUINCENAL', 'SEMANAL', 'DIARIA'
  ];

  metodosAmortizacion: MetodoAmortizacion[] = ['FRANCES']; // Solo mostramos el método FRANCES
  metodosAmortizacionDisponibles: MetodoAmortizacion[] = ['FRANCES']; // Solo el método FRANCES está disponible
  plazosGracia: PlazoGracia[] = ['NINGUNO', 'PARCIAL', 'TOTAL'];
  tiposTasa: TipoTasa[] = ['EFECTIVA', 'NOMINAL'];

  // Resumen del bono para mostrar en el último paso
  bonoResumen: any = {};

  constructor(
    private formBuilder: FormBuilder,
    private bonoService: BonoService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Obtener fecha actual en formato YYYY-MM-DD para los date pickers
    const today = new Date();
    this.currentDate = this.formatDateForInput(today);
  }

  ngOnInit(): void {
    window.scrollTo(0, 0);

    this.inicializarFormulario();

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.bonoId = +id;
        this.cargarDatosBono();
      } else {
        this.errorMessage = 'ID del bono no proporcionado';
        this.isLoading = false;
      }
    });

    setTimeout(() => {
      this.validateCurrentStep();
    }, 0);
  }

  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatDateForDisplay(dateString: string): string {
    if (!dateString) return '';

    const date = new Date(`${dateString}T12:00:00Z`);

    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC'
    });
  }

  inicializarFormulario(): void {
    this.bonoForm = this.formBuilder.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      moneda: ['PEN'],
      valorNominal: ['', [Validators.required, Validators.min(0)]],
      valorComercial: ['', Validators.min(0)],
      fechaEmision: ['', Validators.required],
      fechaVencimiento: ['', Validators.required],
      tasaCupon: ['', [Validators.required, Validators.min(0)]],
      tipoTasaCupon: ['EFECTIVA'],
      capitalizacionCupon: ['ANUAL'],
      frecuenciaPago: ['ANUAL'],
      tasaMercado: ['', Validators.min(0)],
      tipoTasaMercado: ['EFECTIVA'],
      capitalizacionMercado: ['ANUAL'],
      metodoAmortizacion: ['FRANCES'], // Solo FRANCES
      primaRedencion: ['', Validators.min(0)],
      estructuracion: ['', Validators.min(0)],
      colocacion: ['', Validators.min(0)],
      flotacion: ['', Validators.min(0)],
      cavali: ['', Validators.min(0)],
      plazoGracia: ['NINGUNO'],
      duracionPlazoGracia: ['', Validators.min(0)],
      comision: ['', Validators.min(0)],
      gastosAdministrativos: ['', Validators.min(0)]
    }, { validators: this.fechaVencimientoValidator });

    this.bonoForm.valueChanges.subscribe(() => {
      this.validateCurrentStep();
    });
  }

  cargarDatosBono(): void {
    this.isLoading = true;

    this.bonoService.getBonoById(this.bonoId).subscribe({
      next: (bono) => {
        // Guardar el bono original para referencia
        this.originalBono = {...bono};

        // Formatear fechas para los inputs de tipo date
        if (bono.fechaEmision) {
          const fechaEmision = typeof bono.fechaEmision === 'string'
            ? new Date(bono.fechaEmision)
            : new Date(bono.fechaEmision);
          bono.fechaEmision = this.formatDateForInput(fechaEmision);
        }

        if (bono.fechaVencimiento) {
          const fechaVencimiento = typeof bono.fechaVencimiento === 'string'
            ? new Date(bono.fechaVencimiento)
            : new Date(bono.fechaVencimiento);
          bono.fechaVencimiento = this.formatDateForInput(fechaVencimiento);
        }

        this.bonoForm.patchValue(bono);
        this.isLoading = false;
        this.prepararResumen(); // Preparar resumen con los datos cargados
        this.validateCurrentStep();
      },
      error: (error) => {
        this.errorMessage = `Error al cargar el bono: ${error.message}`;
        this.isLoading = false;
      }
    });
  }

  fechaVencimientoValidator(formGroup: FormGroup) {
    const fechaEmision = formGroup.get('fechaEmision')?.value;
    const fechaVencimiento = formGroup.get('fechaVencimiento')?.value;

    if (fechaEmision && fechaVencimiento) {
      const emisionDate = new Date(fechaEmision);
      const vencimientoDate = new Date(fechaVencimiento);

      if (vencimientoDate <= emisionDate) {
        return { fechaVencimientoInvalida: true };
      }
    }
    return null;
  }

  get f() { return this.bonoForm.controls; }

  validateCurrentStep(): void {
    switch (this.currentStep) {
      case 0:
        this.steps[0].isValid = !!this.bonoForm.get('nombre')?.valid;
        break;
      case 1:
        this.steps[1].isValid = !!(
          this.bonoForm.get('valorNominal')?.valid &&
          this.bonoForm.get('fechaEmision')?.valid &&
          this.bonoForm.get('fechaVencimiento')?.valid &&
          !this.bonoForm.hasError('fechaVencimientoInvalida')
        );
        break;
      case 2:
        this.steps[2].isValid = !!this.bonoForm.get('tasaCupon')?.valid;
        break;
      case 3:
        this.steps[3].isValid = true;
        break;
      case 4:
        this.steps[4].isValid = true;
        break;
      case 5:
        this.steps[5].isValid = true;
        break;
    }
  }

  nextStep(): void {
    this.validateCurrentStep();

    if (this.steps[this.currentStep].isValid) {
      if (this.currentStep === this.steps.length - 1) {
        this.actualizarBono();
      } else {
        this.currentStep++;

        if (this.currentStep === this.steps.length - 1) {
          this.prepararResumen();
        }
      }
    } else {
      this.markCurrentStepAsTouched();
    }
  }

  prevStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    } else {
      this.volver();
    }
  }

  goToStep(index: number): void {
    if (index > this.currentStep) {
      this.validateCurrentStep();

      let allPreviousValid = true;
      for (let i = 0; i <= this.currentStep; i++) {
        if (!this.steps[i].isValid) {
          allPreviousValid = false;
          break;
        }
      }

      if (allPreviousValid) {
        this.currentStep = index;

        if (index === this.steps.length - 1) {
          this.prepararResumen();
        }
      } else {
        this.markCurrentStepAsTouched();
      }
    } else {
      this.currentStep = index;
    }
  }

  markCurrentStepAsTouched(): void {
    switch (this.currentStep) {
      case 0:
        this.bonoForm.get('nombre')!.markAsTouched();
        break;
      case 1:
        this.bonoForm.get('valorNominal')!.markAsTouched();
        this.bonoForm.get('fechaEmision')!.markAsTouched();
        this.bonoForm.get('fechaVencimiento')!.markAsTouched();
        break;
      case 2:
        this.bonoForm.get('tasaCupon')!.markAsTouched();
        break;
    }
  }

  prepararResumen(): void {
    const formValues = this.bonoForm.value;

    if (!formValues.fechaEmision || !formValues.fechaVencimiento) {
      return;
    }

    const fechaEmision = new Date(formValues.fechaEmision);
    const fechaVencimiento = new Date(formValues.fechaVencimiento);
    const duracionAnios = fechaVencimiento.getFullYear() - fechaEmision.getFullYear() +
      (fechaVencimiento.getMonth() - fechaEmision.getMonth()) / 12 +
      (fechaVencimiento.getDate() - fechaEmision.getDate()) / 365.25;

    this.bonoResumen = {
      informacionPrincipal: {
        nombre: formValues.nombre || 'No especificado',
        descripcion: formValues.descripcion || 'Sin descripción',
        moneda: formValues.moneda
      },
      valoresYPlazos: {
        valorNominal: `${formValues.valorNominal} ${formValues.moneda}`,
        valorComercial: formValues.valorComercial ? `${formValues.valorComercial} ${formValues.moneda}` : 'No especificado',
        fechaEmision: this.formatDateForDisplay(formValues.fechaEmision),
        fechaVencimiento: this.formatDateForDisplay(formValues.fechaVencimiento),
        duracion: `${duracionAnios.toFixed(2)} años`,
        plazoGracia: formValues.plazoGracia,
        duracionPlazoGracia: formValues.duracionPlazoGracia ? `${formValues.duracionPlazoGracia} periodos` : 'No aplicable'
      },
      tasasEIntereses: {
        tasaCupon: `${formValues.tasaCupon}%`,
        tipoTasaCupon: formValues.tipoTasaCupon,
        capitalizacionCupon: formValues.capitalizacionCupon,
        tasaMercado: formValues.tasaMercado ? `${formValues.tasaMercado}%` : 'No especificado',
        tipoTasaMercado: formValues.tipoTasaMercado,
        capitalizacionMercado: formValues.capitalizacionMercado,
        primaRedencion: formValues.primaRedencion ? `${formValues.primaRedencion}%` : 'No especificado'
      },
      frecuenciasYMetodo: {
        frecuenciaPago: formValues.frecuenciaPago,
        metodoAmortizacion: formValues.metodoAmortizacion
      },
      costosAdicionales: {
        comision: formValues.comision ? `${formValues.comision}%` : 'No especificado',
        gastosAdministrativos: formValues.gastosAdministrativos ? `${formValues.gastosAdministrativos}%` : 'No especificado',
        estructuracion: formValues.estructuracion ? `${formValues.estructuracion}%` : 'No especificado',
        colocacion: formValues.colocacion ? `${formValues.colocacion}%` : 'No especificado',
        flotacion: formValues.flotacion ? `${formValues.flotacion}%` : 'No especificado',
        cavali: formValues.cavali ? `${formValues.cavali}%` : 'No especificado'
      }
    };

    // Asegurar que el último paso sea válido
    this.steps[5].isValid = true;
  }

  seleccionarMoneda(moneda: Moneda): void {
    this.bonoForm.get('moneda')?.setValue(moneda);
    this.showMonedaDropdown = false;
  }

  toggleMonedaDropdown(): void {
    this.showMonedaDropdown = !this.showMonedaDropdown;
  }

  seleccionarTipoTasa(tipoTasa: TipoTasa, campo: 'tipoTasaCupon' | 'tipoTasaMercado'): void {
    this.bonoForm.get(campo)?.setValue(tipoTasa);
  }

  seleccionarPlazoGracia(plazo: PlazoGracia): void {
    this.bonoForm.get('plazoGracia')?.setValue(plazo);

    if (plazo === 'NINGUNO') {
      this.bonoForm.get('duracionPlazoGracia')?.setValue(0);
    }
  }

  isMetodoAmortizacionDisponible(metodo: MetodoAmortizacion): boolean {
    return this.metodosAmortizacionDisponibles.includes(metodo);
  }

  volver(): void {
    this.router.navigate(['/dashboard']);
  }

  actualizarBono(): void {
    this.submitted = true;

    if (this.bonoForm.invalid) {
      // Identificar el primer paso con errores y navegar a él
      if (!this.bonoForm.get('nombre')!.valid) {
        this.currentStep = 0;
      } else if (!this.bonoForm.get('valorNominal')!.valid || !this.bonoForm.get('fechaEmision')!.valid || !this.bonoForm.get('fechaVencimiento')!.valid) {
        this.currentStep = 1;
      } else if (!this.bonoForm.get('tasaCupon')!.valid) {
        this.currentStep = 2;
      }

      this.markCurrentStepAsTouched();
      return;
    }

    const formValues = this.bonoForm.value;

    const bonoActualizado: BonoModelEdit = {
      nombre: formValues.nombre || "",
      descripcion: formValues.descripcion || "",
      valorNominal: Number(formValues.valorNominal) || 0,
      valorComercial: Number(formValues.valorComercial) || 0,
      fechaEmision: new Date(formValues.fechaEmision),
      fechaVencimiento: new Date(formValues.fechaVencimiento),
      tasaCupon: Number(formValues.tasaCupon) || 0,
      tipoTasaCupon: (formValues.tipoTasaCupon || "EFECTIVA") as TipoTasa,
      capitalizacionCupon: (formValues.capitalizacionCupon || "ANUAL") as Periodicidad,
      tipoTasaMercado: (formValues.tipoTasaMercado || "EFECTIVA") as TipoTasa,
      tasaMercado: Number(formValues.tasaMercado) || 0,
      capitalizacionMercado: (formValues.capitalizacionMercado || "ANUAL") as Periodicidad,
      frecuenciaPago: (formValues.frecuenciaPago || "ANUAL") as Periodicidad,
      comision: Number(formValues.comision) || 0,
      gastosAdministrativos: Number(formValues.gastosAdministrativos) || 0,
      plazoGracia: (formValues.plazoGracia || "NINGUNO") as PlazoGracia,
      duracionPlazoGracia: Number(formValues.duracionPlazoGracia) || 0,
      moneda: (formValues.moneda || "PEN") as Moneda,
      metodoAmortizacion: 'FRANCES' as MetodoAmortizacion,
      primaRedencion: Number(formValues.primaRedencion) || 0,
      estructuracion: Number(formValues.estructuracion) || 0,
      colocacion: Number(formValues.colocacion) || 0,
      flotacion: Number(formValues.flotacion) || 0,
      cavali: Number(formValues.cavali) || 0
    };

    this.isLoading = true;

    this.bonoService.updateBono(this.bonoId, bonoActualizado).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/bonos', this.bonoId]);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = `Error al actualizar el bono: ${error.message}`;
      }
    });
  }

  isStepClickable(stepIndex: number): boolean {
    // Permitir clic en cualquier paso anterior
    if (stepIndex < this.currentStep) {
      return true;
    }

    // Permitir clic en el paso actual
    if (stepIndex === this.currentStep) {
      return true;
    }

    // Permitir clic en el siguiente paso solo si el actual es válido
    if (stepIndex === this.currentStep + 1 && this.steps[this.currentStep].isValid) {
      return true;
    }

    // Comprobar si todos los pasos anteriores son válidos para permitir saltos
    let allPreviousValid = true;
    for (let i = 0; i < stepIndex; i++) {
      if (!this.steps[i].isValid) {
        allPreviousValid = false;
        break;
      }
    }

    return allPreviousValid;
  }

  getStepStatusClass(stepIndex: number): string {
    if (stepIndex === this.currentStep) return 'active';
    if (this.steps[stepIndex].isValid) return 'completed';
    return 'pending';
  }

  mostrarMonedaDropdown(): boolean {
    const monedaActual = this.bonoForm.get('moneda')?.value;
    return !this.monedasPrincipales.includes(monedaActual) && this.monedas.includes(monedaActual);
  }

  getMonedasSecundarias(): Moneda[] {
    return this.monedas.filter(m => !this.monedasPrincipales.includes(m));
  }

  getTextoBotonMoneda(): string {
    const monedaActual = this.bonoForm.get('moneda')?.value;

    if (this.getMonedasSecundarias().includes(monedaActual)) {
      return monedaActual;
    }

    return "Más";
  }
}
