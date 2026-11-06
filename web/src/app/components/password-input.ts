import { Component, Input, forwardRef, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import { evaluarPassword } from '@/app/core/password-policy'

/**
 * Campo de contraseña reutilizable: botón mostrar/ocultar y medidor de fuerza
 * opcional. Implementa ControlValueAccessor, así que funciona con [(ngModel)].
 */
@Component({
  selector: 'app-password-input',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PasswordInput),
      multi: true,
    },
  ],
  template: `
    <div class="input-group">
      <input
        [type]="ver() ? 'text' : 'password'"
        class="form-control"
        [class.form-control-sm]="sizeSm"
        [placeholder]="placeholder"
        [attr.autocomplete]="autocomplete"
        [value]="valor"
        [disabled]="deshabilitado()"
        (input)="input($any($event.target).value)"
        (blur)="onTouched()"
      />
      <button
        type="button"
        class="btn btn-outline-secondary"
        [class.btn-sm]="sizeSm"
        (click)="toggle()"
        tabindex="-1"
        [attr.aria-label]="ver() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
      >
        <i class="bx" [class.bx-show]="!ver()" [class.bx-hide]="ver()"></i>
      </button>
    </div>
    @if (showStrength && valor) {
      <div class="mt-1">
        <div class="progress" style="height: 4px">
          <div class="progress-bar" [class]="barraClase()" [style.width.%]="(fuerza.score + 1) * 20"></div>
        </div>
        <small [class]="textoClase()">
          {{ fuerza.etiqueta }}@if (fuerza.mensaje) { — {{ fuerza.mensaje }} }
        </small>
      </div>
    }
  `,
})
export class PasswordInput implements ControlValueAccessor {
  @Input() placeholder = ''
  @Input() showStrength = false
  @Input() autocomplete = 'new-password'
  @Input() sizeSm = false

  valor = ''
  ver = signal(false)
  deshabilitado = signal(false)

  onChange: (v: string) => void = () => {}
  onTouched: () => void = () => {}

  get fuerza() {
    return evaluarPassword(this.valor)
  }

  barraClase(): string {
    const s = this.fuerza.score
    return s <= 1 ? 'bg-danger' : s === 2 ? 'bg-warning' : s === 3 ? 'bg-info' : 'bg-success'
  }

  textoClase(): string {
    const s = this.fuerza.score
    return s <= 1 ? 'text-danger' : s === 2 ? 'text-warning' : s === 3 ? 'text-info' : 'text-success'
  }

  // ControlValueAccessor
  writeValue(v: string): void {
    this.valor = v ?? ''
  }
  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn
  }
  setDisabledState(d: boolean): void {
    this.deshabilitado.set(d)
  }

  input(v: string): void {
    this.valor = v
    this.onChange(v)
  }

  toggle(): void {
    this.ver.update((x) => !x)
  }
}
