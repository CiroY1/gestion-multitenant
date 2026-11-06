import { PageTitle } from '@/app/components/page-title'
import { PasswordInput } from '@/app/components/password-input'
import { evaluarPassword } from '@/app/core/password-policy'
import { CommonModule } from '@angular/common'
import { Component, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import {
  EmpresasService,
  type Empresa,
  type UsuarioEmpresa,
} from '../empresas.service'

@Component({
  selector: 'app-sistema-empresas',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitle, PasswordInput],
  templateUrl: './empresas.html',
})
export class Empresas implements OnInit {
  private svc = inject(EmpresasService)

  empresas = signal<Empresa[]>([])
  cargando = signal(true)
  error = signal<string | null>(null)
  aviso = signal<string | null>(null)

  mostrarForm = signal(false)
  guardando = signal(false)
  editId = signal<string | null>(null)
  subiendoLogo = signal(false)
  form = {
    id: '',
    nombre: '',
    moduloInventario: true,
    moduloSpa: false,
    logoUrl: '',
    direccion: '',
    telefono: '',
    email: '',
    sitioWeb: '',
    nit: '',
    razonSocial: '',
  }

  get cloudinaryListo(): boolean {
    return this.svc.cloudinaryListo
  }

  // --- Usuarios de la empresa seleccionada ---
  mostrarUsuarios = signal(false)
  empresaSel = signal<Empresa | null>(null)
  usuarios = signal<UsuarioEmpresa[]>([])
  cargandoUsuarios = signal(false)
  avisoUsuarios = signal<string | null>(null)
  guardandoUsuario = signal(false)
  formUsuario = { email: '', password: '', rol: 'operador' }

  // --- Modal de cambio de contraseña ---
  mostrarPassword = signal(false)
  usuarioPwd = signal<UsuarioEmpresa | null>(null)
  guardandoPwd = signal(false)
  avisoPwd = signal<string | null>(null)
  formPwd = { password: '', confirm: '' }

  ngOnInit(): void {
    this.cargar()
  }

  cargar(): void {
    this.cargando.set(true)
    this.error.set(null)
    this.svc.getEmpresas().subscribe({
      next: (d) => {
        this.empresas.set(d)
        this.cargando.set(false)
      },
      error: (e) => {
        this.error.set(
          e?.status === 403
            ? 'Solo un super-admin de plataforma puede gestionar empresas.'
            : 'No se pudo conectar con la API (puerto 5045).'
        )
        this.cargando.set(false)
      },
    })
  }

  abrirCrear(): void {
    this.editId.set(null)
    this.form = {
      id: '',
      nombre: '',
      moduloInventario: true,
      moduloSpa: false,
      logoUrl: '',
      direccion: '',
      telefono: '',
      email: '',
      sitioWeb: '',
      nit: '',
      razonSocial: '',
    }
    this.aviso.set(null)
    this.mostrarForm.set(true)
  }

  abrirEditar(e: Empresa): void {
    this.editId.set(e.id)
    this.form = {
      id: e.id,
      nombre: e.nombre,
      moduloInventario: e.moduloInventario,
      moduloSpa: e.moduloSpa,
      logoUrl: e.logoUrl ?? '',
      direccion: e.direccion ?? '',
      telefono: e.telefono ?? '',
      email: e.email ?? '',
      sitioWeb: e.sitioWeb ?? '',
      nit: e.nit ?? '',
      razonSocial: e.razonSocial ?? '',
    }
    this.aviso.set(null)
    this.mostrarForm.set(true)
  }

  /** Sube el archivo elegido a Cloudinary y rellena la URL del logo. */
  onLogoFile(event: Event): void {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      this.aviso.set('El archivo debe ser una imagen.')
      return
    }
    this.subiendoLogo.set(true)
    this.aviso.set(null)
    this.svc
      .subirLogo(file)
      .then((url) => {
        this.form.logoUrl = url
        this.subiendoLogo.set(false)
      })
      .catch((e) => {
        this.subiendoLogo.set(false)
        this.aviso.set(e?.message ?? 'No se pudo subir la imagen.')
      })
      .finally(() => (input.value = ''))
  }

  guardar(): void {
    const id = this.editId()
    if (!id) {
      if (!this.form.id.trim() || !this.form.nombre.trim()) {
        this.aviso.set('El identificador y el nombre son obligatorios.')
        return
      }
      this.guardando.set(true)
      this.svc
        .crear({
          id: this.form.id,
          nombre: this.form.nombre,
          moduloInventario: this.form.moduloInventario,
          moduloSpa: this.form.moduloSpa,
          ...this.perfil(),
        })
        .subscribe({ next: () => this.finOk(), error: (e) => this.finError(e) })
      return
    }
    this.guardando.set(true)
    this.svc
      .actualizar(id, {
        nombre: this.form.nombre,
        moduloInventario: this.form.moduloInventario,
        moduloSpa: this.form.moduloSpa,
        ...this.perfil(),
      })
      .subscribe({ next: () => this.finOk(), error: (e) => this.finError(e) })
  }

  /** Campos de identidad/personalización a enviar al backend. */
  private perfil() {
    return {
      logoUrl: this.form.logoUrl.trim() || null,
      direccion: this.form.direccion.trim() || null,
      telefono: this.form.telefono.trim() || null,
      email: this.form.email.trim() || null,
      sitioWeb: this.form.sitioWeb.trim() || null,
      nit: this.form.nit.trim() || null,
      razonSocial: this.form.razonSocial.trim() || null,
    }
  }

  private finOk(): void {
    this.guardando.set(false)
    this.mostrarForm.set(false)
    this.cargar()
  }

  private finError(e: unknown): void {
    this.guardando.set(false)
    const err = e as { error?: unknown }
    this.aviso.set(typeof err?.error === 'string' ? err.error : 'No se pudo guardar la empresa.')
  }

  // ---- Usuarios de la empresa ----

  abrirUsuarios(e: Empresa): void {
    this.empresaSel.set(e)
    this.formUsuario = { email: '', password: '', rol: 'operador' }
    this.avisoUsuarios.set(null)
    this.mostrarUsuarios.set(true)
    this.cargarUsuarios()
  }

  cargarUsuarios(): void {
    const e = this.empresaSel()
    if (!e) return
    this.cargandoUsuarios.set(true)
    this.svc.getUsuarios(e.id).subscribe({
      next: (d) => {
        this.usuarios.set(d)
        this.cargandoUsuarios.set(false)
      },
      error: () => {
        this.avisoUsuarios.set('No se pudieron cargar los usuarios.')
        this.cargandoUsuarios.set(false)
      },
    })
  }

  crearUsuario(): void {
    const e = this.empresaSel()
    if (!e) return
    if (!this.formUsuario.email.trim()) {
      this.avisoUsuarios.set('El email es obligatorio.')
      return
    }
    if (!evaluarPassword(this.formUsuario.password).valida) {
      this.avisoUsuarios.set('La contraseña debe tener mínimo 8 caracteres e incluir letras y números.')
      return
    }
    this.guardandoUsuario.set(true)
    this.avisoUsuarios.set(null)
    this.svc.crearUsuario(e.id, { ...this.formUsuario }).subscribe({
      next: () => {
        this.guardandoUsuario.set(false)
        this.formUsuario = { email: '', password: '', rol: 'operador' }
        this.cargarUsuarios()
        this.cargar() // refresca el contador de usuarios en la tabla
      },
      error: (err) => {
        this.guardandoUsuario.set(false)
        const x = err as { error?: unknown }
        this.avisoUsuarios.set(
          typeof x?.error === 'string' ? x.error : 'No se pudo crear el usuario.'
        )
      },
    })
  }

  toggleActivo(u: UsuarioEmpresa): void {
    const e = this.empresaSel()
    if (!e) return
    this.svc
      .actualizarUsuario(e.id, u.id, { rol: u.rol, activo: !u.activo })
      .subscribe({
        next: () => this.cargarUsuarios(),
        error: (err) => this.errorUsuario(err, 'No se pudo actualizar el usuario.'),
      })
  }

  cambiarRol(u: UsuarioEmpresa, rol: string): void {
    const e = this.empresaSel()
    if (!e) return
    this.svc.actualizarUsuario(e.id, u.id, { rol, activo: u.activo }).subscribe({
      next: () => this.cargarUsuarios(),
      error: (err) => this.errorUsuario(err, 'No se pudo cambiar el rol.'),
    })
  }

  abrirPassword(u: UsuarioEmpresa): void {
    this.usuarioPwd.set(u)
    this.formPwd = { password: '', confirm: '' }
    this.avisoPwd.set(null)
    this.mostrarPassword.set(true)
  }

  guardarPassword(): void {
    const e = this.empresaSel()
    const u = this.usuarioPwd()
    if (!e || !u) return
    if (!evaluarPassword(this.formPwd.password).valida) {
      this.avisoPwd.set('La contraseña debe tener mínimo 8 caracteres e incluir letras y números.')
      return
    }
    if (this.formPwd.password !== this.formPwd.confirm) {
      this.avisoPwd.set('Las contraseñas no coinciden.')
      return
    }
    this.guardandoPwd.set(true)
    this.svc.resetPassword(e.id, u.id, this.formPwd.password).subscribe({
      next: () => {
        this.guardandoPwd.set(false)
        this.mostrarPassword.set(false)
        this.avisoUsuarios.set(`Contraseña de ${u.email} actualizada.`)
      },
      error: (err) => {
        this.guardandoPwd.set(false)
        const x = err as { error?: unknown }
        this.avisoPwd.set(typeof x?.error === 'string' ? x.error : 'No se pudo cambiar la contraseña.')
      },
    })
  }

  eliminarUsuario(u: UsuarioEmpresa): void {
    const e = this.empresaSel()
    if (!e) return
    if (!window.confirm(`¿Eliminar el usuario ${u.email}?`)) return
    this.svc.eliminarUsuario(e.id, u.id).subscribe({
      next: () => {
        this.cargarUsuarios()
        this.cargar()
      },
      error: (err) => this.errorUsuario(err, 'No se pudo eliminar el usuario.'),
    })
  }

  private errorUsuario(err: unknown, fallback: string): void {
    const x = err as { error?: unknown }
    this.avisoUsuarios.set(typeof x?.error === 'string' ? x.error : fallback)
  }
}
