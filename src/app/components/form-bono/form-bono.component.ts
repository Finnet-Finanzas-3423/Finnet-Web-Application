import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {NgClass, NgForOf, NgIf} from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

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

  bonoForm!: FormGroup;
  currentStep = 0;
  submitted = false;
  showMonedaDropdown = false;

  // Definición de pasos
  steps = [
    { title: 'Información Principal', icon: 'fa-file-signature', isValid: false },
    { title: 'Valores y Plazos', icon: 'fa-coins', isValid: false },
    { title: 'Tasas e Intereses', icon: 'fa-percentage', isValid: false },
    { title: 'Frecuencias y Método', icon: 'fa-sliders-h', isValid: false },
    { title: 'Costos Adicionales', icon: 'fa-tags', isValid: true }, // Opcional, siempre válido
    { title: 'Resumen', icon: 'fa-clipboard-check', isValid: false }
  ];

  // Campos necesarios para el formulario
  monedas: string[] = ['PEN', 'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'INR', 'AUD', 'CAD', 'CHF', 'NZD', 'RUB', 'ZAR', 'BRL', 'MXN', 'ARS', 'CLP', 'COP', 'VEF', 'UYU'];

  frecuencias: string[] = [
    'ANUAL', 'SEMESTRAL', 'CUATRIMESTRAL', 'TRIMESTRAL', 'BIMESTRAL',
    'MENSUAL', 'QUINCENAL', 'SEMANAL', 'DIARIA'
  ];

  capitalizaciones: string[] = [
    'ANUAL', 'SEMESTRAL', 'CUATRIMESTRAL', 'TRIMESTRAL', 'BIMESTRAL',
    'MENSUAL', 'QUINCENAL', 'SEMANAL', 'DIARIA'
  ];

  metodosAmortizacion: string[] = ['FRANCES', 'ALEMAN', 'AMERICANO'];
  metodosAmortizacionDisponibles: string[] = ['FRANCES'];
  plazosGracia: string[] = ['NINGUNO', 'PARCIAL', 'TOTAL'];

  // Resumen del bono para mostrar en el último paso
  bonoResumen: any = {};

  constructor(private formBuilder: FormBuilder) { }

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
      valorNominal: ['', Validators.required],
      valorComercial: [''],
      tasaCupon: ['', Validators.required],
      tipoTasa: ['EFECTIVA'],
      capitalizacion: ['ANUAL'],
      frecuenciaPago: ['ANUAL'],
      plazoAnios: ['', Validators.required],
      metodoAmortizacion: ['FRANCES'],
      tasaMercado: [''],
      primaRedencion: [''],
      estructuracion: [''],
      colocacion: [''],
      flotacion: [''],
      cavali: [''],
      plazoGracia: ['NINGUNO'],
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
        valorComercial: `${formValues.valorComercial} ${formValues.moneda}`,
        plazoAnios: `${formValues.plazoAnios} años`,
        plazoGracia: formValues.plazoGracia
      },
      tasasEIntereses: {
        tasaCupon: `${formValues.tasaCupon}%`,
        tipoTasa: formValues.tipoTasa,
        tasaMercado: `${formValues.tasaMercado}%`,
        primaRedencion: formValues.primaRedencion ? `${formValues.primaRedencion}%` : 'No especificado'
      },
      frecuenciasYMetodo: {
        frecuenciaPago: formValues.frecuenciaPago,
        capitalizacion: formValues.capitalizacion,
        metodoAmortizacion: formValues.metodoAmortizacion
      },
      costosAdicionales: {
        estructuracion: formValues.estructuracion ? `${formValues.estructuracion}%` : 'No especificado',
        colocacion: formValues.colocacion ? `${formValues.colocacion}%` : 'No especificado',
        flotacion: formValues.flotacion ? `${formValues.flotacion}%` : 'No especificado',
        cavali: formValues.cavali ? `${formValues.cavali}%` : 'No especificado'
      }
    };
  }

  seleccionarMoneda(moneda: string): void {
    this.bonoForm.get('moneda')?.setValue(moneda);
    this.showMonedaDropdown = false;
  }

  toggleMonedaDropdown(): void {
    this.showMonedaDropdown = !this.showMonedaDropdown;
  }

  seleccionarTipoTasa(tipoTasa: string): void {
    this.bonoForm.get('tipoTasa')?.setValue(tipoTasa);
  }

  seleccionarFrecuencia(frecuencia: string): void {
    this.bonoForm.get('frecuenciaPago')?.setValue(frecuencia);
  }

  seleccionarCapitalizacion(capitalizacion: string): void {
    this.bonoForm.get('capitalizacion')?.setValue(capitalizacion);
  }

  seleccionarMetodoAmortizacion(metodo: string): void {
    // Solo permitir seleccionar métodos disponibles
    if (this.metodosAmortizacionDisponibles.includes(metodo)) {
      this.bonoForm.get('metodoAmortizacion')?.setValue(metodo);
    }
  }

  seleccionarPlazoGracia(plazo: string): void {
    this.bonoForm.get('plazoGracia')?.setValue(plazo);
  }

  isMetodoAmortizacionDisponible(metodo: string): boolean {
    return this.metodosAmortizacionDisponibles.includes(metodo);
  }

  // Acciones finales
  limpiarCampos(): void {
    this.submitted = false;
    this.bonoForm.reset();
    this.bonoForm.patchValue({
      moneda: 'PEN',
      tipoTasa: 'EFECTIVA',
      frecuenciaPago: 'ANUAL',
      capitalizacion: 'ANUAL',
      metodoAmortizacion: 'FRANCES',
      plazoGracia: 'NINGUNO',
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
    this.submitted = true;

    if (this.bonoForm.invalid) {
      // Identificar el primer paso con errores y navegar a él
      if (!this.bonoForm.get('nombre')!.valid) {
        this.currentStep = 0;
      } else if (!this.bonoForm.get('valorNominal')!.valid ||
        !this.bonoForm.get('valorComercial')!.valid ||
        !this.bonoForm.get('plazoAnios')!.valid) {
        this.currentStep = 1;
      } else if (!this.bonoForm.get('tasaCupon')!.valid ||
        !this.bonoForm.get('tasaMercado')!.valid) {
        this.currentStep = 2;
      }

      this.markCurrentStepAsTouched();
      return;
    }

    console.log('Datos del formulario:', this.bonoForm.value);
    // Implementar lógica de cálculo o enviar datos al servicio correspondiente
    // this.bonoService.calcularBono(this.bonoForm.value).subscribe(...)

    // Aquí se mostraría un mensaje de éxito o se navegaría a una página de resultados
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
    return this.monedas.slice(7).includes(monedaActual);
  }

  getTextoBotonMoneda(): string {
    const monedaActual = this.bonoForm.get('moneda')?.value;

    if (this.monedas.slice(7).includes(monedaActual)) {
      return monedaActual;
    }

    return "Más";
  }
}
