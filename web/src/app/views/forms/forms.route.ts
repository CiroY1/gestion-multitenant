import type { Route } from '@angular/router'
import { Basic } from './basic/basic'
import { Checkbox } from './checkbox/checkbox'
import { Select } from './select/select'
import { FlatPicker } from './flat-picker/flat-picker'
import { Validation } from './validation/validation'
import { Wizard } from './wizard/wizard'
import { FileUploads } from './file-uploads/file-uploads'
import { Editors } from './editors/editors'
import { InputMask } from './input-mask/input-mask'
import { Slider } from './slider/slider'
import { Clipboard } from './clipboard/clipboard'

export const FOMRS_ROUTE: Route[] = [
  {
    path: 'basic',
    component: Basic,
    data: { title: 'Form Basic' },
  },
  {
    path: 'checkbox',
    component: Checkbox,
    data: { title: 'Checkbox & Radio' },
  },
  {
    path: 'clipboard',
    component: Clipboard,
    data: { title: 'Clipboard' },
  },
  {
    path: 'select',
    component: Select,
    data: { title: 'Form Select' },
  },
  {
    path: 'flat-picker',
    component: FlatPicker,
    data: { title: 'Flatpicker' },
  },
  {
    path: 'validation',
    component: Validation,
    data: { title: 'Form Validation' },
  },
  {
    path: 'wizard',
    component: Wizard,
    data: { title: 'Wizard' },
  },
  {
    path: 'file-uploads',
    component: FileUploads,
    data: { title: 'File Uploads' },
  },
  {
    path: 'editors',
    component: Editors,
    data: { title: 'Editors' },
  },
  {
    path: 'input-mask',
    component: InputMask,
    data: { title: 'Input Mask' },
  },
  {
    path: 'slider',
    component: Slider,
    data: { title: 'Range Slider' },
  },
]
