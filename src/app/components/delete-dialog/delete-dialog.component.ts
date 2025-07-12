import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BonoModel } from '../../shared/models/bono.model';

@Component({
  selector: 'app-delete-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delete-dialog.component.html',
  styleUrls: ['./delete-dialog.component.css']
})
export class DeleteDialogComponent {
  @Input() bono: BonoModel | null = null;
  @Input() isDeleting = false;
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

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

  parseFloat(value: string | number | null | undefined): number {
    if (value === null || value === undefined) return 0;

    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }

    return value;
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onConfirm(): void {
    this.confirm.emit();
  }
}
