import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgClass, NgForOf, NgIf } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { Router } from '@angular/router';
import { BonoModel } from '../../shared/models/bono.model';
import { Moneda, Periodicidad, PlazoGracia, TipoTasa, MetodoAmortizacion } from '../../shared/models/bono.model';
import { BonoService } from '../../shared/services/bono.service';

@Component({
  selector: 'app-form-bono',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIf,
    NgForOf,
    NgClass
  ],
  templateUrl: './form-bono.component.html',
  styleUrl: './form-bono.component.css',
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
export class FormBonoComponent implements OnInit {
  @Output() volverEvent = new EventEmitter<void>();
  @Output() bonoCreado = new EventEmitter<number>();

  bonoForm!: FormGroup;
  currentStep = 0;
  submitted = false;
  showMonedaDropdown = false;
  isLoading = false;

  // Definición de pasos
  steps = [
    { title: 'Información Principal', icon: 'fa-file-signature', isValid: false },
    { title: 'Valores y Plazos', icon: 'fa-coins', isValid: false },
    { title: 'Tasas e Intereses', icon: 'fa-percentage', isValid: false },
    { title: 'Frecuencias y Método', icon: 'fa-sliders-h', isValid: false },
    { title: 'Costos Adicionales', icon: 'fa-tags', isValid: true }, // Opcional, siempre válido
    { title: 'Resumen', icon: 'fa-clipboard-check', isValid: false }
  ];

  monedas: Moneda[] = ['PEN', 'USD', 'EUR', 'GBP'];

  frecuencias: Periodicidad[] = [
    'ANUAL', 'SEMESTRAL', 'CUATRIMESTRAL', 'TRIMESTRAL', 'BIMESTRAL',
    'MENSUAL', 'QUINCENAL', 'SEMANAL', 'DIARIA'
  ];

  capitalizaciones: Periodicidad[] = [
    'ANUAL', 'SEMESTRAL', 'CUATRIMESTRAL', 'TRIMESTRAL', 'BIMESTRAL',
    'MENSUAL', 'QUINCENAL', 'SEMANAL', 'DIARIA'
  ];

  metodosAmortizacion: MetodoAmortizacion[] = ['FRANCES', 'ALEMAN', 'AMERICANO'];
  metodosAmortizacionDisponibles: MetodoAmortizacion[] = ['FRANCES', 'ALEMAN', 'AMERICANO'];
  plazosGracia: PlazoGracia[] = ['NINGUNO', 'PARCIAL', 'TOTAL'];
  tiposTasa: TipoTasa[] = ['EFECTIVA', 'NOMINAL'];

  // Resumen del bono para mostrar en el último paso
  bonoResumen: any = {};

  constructor(
    private formBuilder: FormBuilder,
    private bonoService: BonoService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.inicializarFormulario();
    // Marcar primer paso como válido después de inicializar
    setTimeout(() => {
      this.validateCurrentStep();
    }, 0);
  }

  inicializarFormulario(): void {
    this.bonoForm = this.formBuilder.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      moneda: ['PEN'],
      valorNominal: ['', [Validators.required, Validators.min(0)]],
      valorComercial: ['', Validators.min(0)],
      tasaCupon: ['', [Validators.required, Validators.min(0)]],
      tipoTasaCupon: ['EFECTIVA'],
      capitalizacionCupon: ['ANUAL'],
      frecuenciaPago: ['ANUAL'],
      tasaMercado: ['', Validators.min(0)],
      tipoTasaMercado: ['EFECTIVA'],
      capitalizacionMercado: ['ANUAL'],
      plazoAnios: ['', [Validators.required, Validators.min(1)]],
      metodoAmortizacion: ['FRANCES'],
      primaRedencion: ['0', Validators.min(0)],
      estructuracion: ['0', Validators.min(0)],
      colocacion: ['0', Validators.min(0)],
      flotacion: ['0', Validators.min(0)],
      cavali: ['0', Validators.min(0)],
      plazoGracia: ['NINGUNO'],
      duracionPlazoGracia: ['0', Validators.min(0)],
      comision: ['0', Validators.min(0)],
      gastosAdministrativos: ['0', Validators.min(0)],
      userId: [1] // Este valor se asignaría dinámicamente desde el servicio de autenticación
    });

    this.bonoForm.valueChanges.subscribe(() => {
      this.validateCurrentStep();
    });
  }

  get f() { return this.bonoForm.controls; }

  validateCurrentStep(): void {
    switch (this.currentStep) {
      case 0:
        this.steps[0].isValid = !!this.bonoForm.get('nombre')?.valid
        break
      case 1:
        this.steps[1].isValid = !!(this.bonoForm.get('valorNominal')?.valid && this.bonoForm.get('plazoAnios')?.valid)
        break
      case 2:
        this.steps[2].isValid = !!this.bonoForm.get('tasaCupon')?.valid
        break
      case 3:
        this.steps[3].isValid = true
        break
      case 4:
        this.steps[4].isValid = true
        break
      case 5:
        this.steps[5].isValid = true // El último paso siempre es válido para permitir calcular
        break
    }
  }

  nextStep(): void {
    this.validateCurrentStep();

    if (this.steps[this.currentStep].isValid) {
      if (this.currentStep === this.steps.length - 1) {
        this.calcularBono();
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
        this.bonoForm.get('nombre')!.markAsTouched()
        break
      case 1:
        this.bonoForm.get('valorNominal')!.markAsTouched()
        this.bonoForm.get('plazoAnios')!.markAsTouched()
        break
      case 2:
        this.bonoForm.get('tasaCupon')!.markAsTouched()
        break
    }
  }

  prepararResumen(): void {
    const formValues = this.bonoForm.value;

    this.bonoResumen = {
      informacionPrincipal: {
        nombre: formValues.nombre || 'No especificado',
        descripcion: formValues.descripcion || 'Sin descripción',
        moneda: formValues.moneda
      },
      valoresYPlazos: {
        valorNominal: `${formValues.valorNominal} ${formValues.moneda}`,
        valorComercial: formValues.valorComercial ? `${formValues.valorComercial} ${formValues.moneda}` : 'No especificado',
        plazoAnios: `${formValues.plazoAnios} años`,
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

    // Si se selecciona NINGUNO, resetear la duración del plazo de gracia
    if (plazo === 'NINGUNO') {
      this.bonoForm.get('duracionPlazoGracia')?.setValue(0);
    }
  }

  isMetodoAmortizacionDisponible(metodo: MetodoAmortizacion): boolean {
    return this.metodosAmortizacionDisponibles.includes(metodo);
  }

  // Acciones finales
  limpiarCampos(): void {
    this.submitted = false;
    this.bonoForm.reset();
    this.bonoForm.patchValue({
      moneda: 'PEN',
      tipoTasaCupon: 'EFECTIVA',
      tipoTasaMercado: 'EFECTIVA',
      frecuenciaPago: 'ANUAL',
      capitalizacionCupon: 'ANUAL',
      capitalizacionMercado: 'ANUAL',
      metodoAmortizacion: 'FRANCES',
      plazoGracia: 'NINGUNO',
      duracionPlazoGracia: 0,
      primaRedencion: 0,
      estructuracion: 0,
      colocacion: 0,
      flotacion: 0,
      cavali: 0,
      comision: 0,
      gastosAdministrativos: 0,
      userId: 1
    });

    this.currentStep = 0;
    this.steps.forEach((step, index) => {
      if (index !== 4) {
        step.isValid = false;
      } else {
        step.isValid = true;
      }
    });

    setTimeout(() => {
      this.validateCurrentStep();
    }, 0);
  }

  volver(): void {
    this.volverEvent.emit();
  }

  calcularBono(): void {
    console.log('Función calcularBono ejecutada');
    this.submitted = true;

    if (this.bonoForm.invalid) {
      console.error('Formulario inválido:', this.bonoForm.errors);

      // Identificar el primer paso con errores y navegar a él
      if (!this.bonoForm.get('nombre')!.valid) {
        this.currentStep = 0;
      } else if (!this.bonoForm.get('valorNominal')!.valid || !this.bonoForm.get('plazoAnios')!.valid) {
        this.currentStep = 1;
      } else if (!this.bonoForm.get('tasaCupon')!.valid) {
        this.currentStep = 2;
      }

      this.markCurrentStepAsTouched();
      return;
    }

    // Crear objeto de bono basado en el formulario
    const formValues = this.bonoForm.value;

    // Calcular fechas basadas en plazo en años
    const fechaEmision = new Date();
    const fechaVencimiento = new Date();
    fechaVencimiento.setFullYear(fechaEmision.getFullYear() + Number(formValues.plazoAnios));

    const bono: BonoModel = {
      nombre: formValues.nombre,
      descripcion: formValues.descripcion || '',
      userId: formValues.userId,
      valorNominal: Number(formValues.valorNominal),
      valorComercial: Number(formValues.valorComercial) || Number(formValues.valorNominal),
      fechaEmision: fechaEmision,
      fechaVencimiento: fechaVencimiento,
      tasaCupon: Number(formValues.tasaCupon),
      tipoTasaCupon: formValues.tipoTasaCupon as TipoTasa,
      capitalizacionCupon: formValues.capitalizacionCupon as Periodicidad,
      tipoTasaMercado: formValues.tipoTasaMercado as TipoTasa,
      tasaMercado: Number(formValues.tasaMercado) || Number(formValues.tasaCupon),
      capitalizacionMercado: formValues.capitalizacionMercado as Periodicidad,
      frecuenciaPago: formValues.frecuenciaPago as Periodicidad,
      comision: Number(formValues.comision) || 0,
      gastosAdministrativos: Number(formValues.gastosAdministrativos) || 0,
      plazoGracia: formValues.plazoGracia as PlazoGracia,
      duracionPlazoGracia: Number(formValues.duracionPlazoGracia) || 0,
      moneda: formValues.moneda as Moneda,
      metodoAmortizacion: formValues.metodoAmortizacion as MetodoAmortizacion,
      primaRedencion: Number(formValues.primaRedencion) || 0,
      estructuracion: Number(formValues.estructuracion) || 0,
      colocacion: Number(formValues.colocacion) || 0,
      flotacion: Number(formValues.flotacion) || 0,
      cavali: Number(formValues.cavali) || 0
    };

    console.log('Enviando datos del bono:', JSON.stringify(bono));
    this.isLoading = true;

    // Intentar crear el bono
    this.bonoService.createBono(bono).subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('Bono creado exitosamente:', response);

        // Navegación después de crear el bono
        if (response) {
          const bonoId = response.id;
          if (bonoId) {
            console.log('Navegando a detalles del bono con ID:', bonoId);
            this.bonoCreado.emit(bonoId);
            this.router.navigate(['/bonos', bonoId]);
          } else {
            console.log('Navegando a lista de bonos (sin ID específico)');
            this.bonoCreado.emit();
            this.router.navigate(['/bonos']);
          }
        } else {
          console.log('Navegando a lista de bonos (respuesta vacía)');
          this.router.navigate(['/bonos']);
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al crear el bono:', error);
      }
    });
  }

  // Helpers para mostrar la UI
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
    return this.monedas.slice(2).includes(monedaActual);
  }

  getTextoBotonMoneda(): string {
    const monedaActual = this.bonoForm.get('moneda')?.value;

    if (this.monedas.slice(2).includes(monedaActual)) {
      return monedaActual;
    }

    return "Más";
  }
}
